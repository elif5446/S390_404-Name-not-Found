import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import { LatLng } from "react-native-maps";

interface UseUserLocationReturn {
  location: LatLng | null;
  error: string | null;
  loading: boolean;
  hasPermission: boolean;
}

const DEFAULT_LOCATION: LatLng = { latitude: 45.49559, longitude: -73.57871 };

const createTimeoutPromise = (ms: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Location request timed out")), ms);
  });
};

const isEmulatorLocation = (coords: Location.LocationObject["coords"]) => {
  return (
    (Math.abs(coords.latitude - 37.42) < 0.1 &&
      Math.abs(coords.longitude - -122.08) < 0.1) ||
    (Math.abs(coords.latitude - 37.33) < 0.1 &&
      Math.abs(coords.longitude - -122.03) < 0.1)
  );
};

const normalizeCoords = (coords: Location.LocationObject["coords"]): LatLng => {
  if (__DEV__ && isEmulatorLocation(coords)) {
    return DEFAULT_LOCATION;
  }

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
};

export const useUserLocation = (): UseUserLocationReturn => {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    const requestLocationPermission = async () => {
      let canUseLocation = false;
      try {
        // Request foreground location permission
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          if (isMounted) {
            setError("Location permission denied");
            setHasPermission(false);
            setLoading(false);
          }
          return;
        }
        if (isMounted) {
          setHasPermission(true);
          canUseLocation = true; // Mark as safe to fallback later
        }

        let lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown && __DEV__ && isEmulatorLocation(lastKnown.coords)) {
          lastKnown = null;
        }
        if (lastKnown && isMounted) {
          setLocation(normalizeCoords(lastKnown.coords));
        }

        try {
          const freshLocation = await Promise.race([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }),
            createTimeoutPromise(5000),
          ]);

          if (freshLocation && isMounted) {
            setLocation(normalizeCoords(freshLocation.coords));
            setError(null);
          }
        } catch (e) {
          console.error(
            "Fresh location fetch failed, relying on last known or default.",
            e,
          );
          if (isMounted) {
            setError("Failed to retrieve location");
          }
        }

        if (isMounted) {
          locationSubscription.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 3000,
              distanceInterval: 8,
            },
            (updatedPosition) => {
              if (!isMounted) {
                return;
              }

              setLocation(normalizeCoords(updatedPosition.coords));
            }
          );
        }
      } catch (err) {
        console.error("Location error:", err);
        setError("Failed to retrieve location");
        console.error(err);
      } finally {
        if (isMounted) {
          setLoading(false);
          if (canUseLocation) {
            setLocation((prev) => {
              if (!prev && __DEV__) {
                return DEFAULT_LOCATION;
              }
              return prev;
            });
          }
        }
      }
    };

    requestLocationPermission();

    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, []);

  return { location, error, loading, hasPermission };
};
