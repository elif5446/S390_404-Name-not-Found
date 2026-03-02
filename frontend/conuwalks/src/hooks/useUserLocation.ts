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

const isEmulatorLocation = (coords: Location.LocationObjectCoords) => {
  return (
    (Math.abs(coords.latitude - 37.42) < 0.1 &&
      Math.abs(coords.longitude - -122.08) < 0.1) ||
    (Math.abs(coords.latitude - 37.33) < 0.1 &&
      Math.abs(coords.longitude - -122.03) < 0.1)
  );
};

const processCoords = (coords: Location.LocationObjectCoords): LatLng => {
  if (__DEV__ && isEmulatorLocation(coords)) {
    return DEFAULT_LOCATION;
  }
  return { latitude: coords.latitude, longitude: coords.longitude };
};

export const useUserLocation = (): UseUserLocationReturn => {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    const requestLocationPermission = async () => {
      let canUseLocation = false;

      try {
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

        const lastKnown = await Location.getLastKnownPositionAsync();
        if (isMounted && lastKnown) {
          setLocation(processCoords(lastKnown.coords));
          setLoading(false);
          setError(null);
        }

        // start watching
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // update every 5 seconds max
            distanceInterval: 5, // update every 5 meters
          },
          (newLocation) => {
            if (isMounted) {
              setLocation(processCoords(newLocation.coords));
              setLoading(false);
              setError(null);
            }
          },
        );

        // Prevent memory leak if unmounted while the promise was pending
        if (!isMounted) {
          subscription.remove();
        } else {
          locationSubscription.current = subscription;
        }
      } catch (err) {
        console.error("Location error:", err);
        if (isMounted) {
          setError("Failed to retrieve location");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          // fallback for development if we somehow have permission but no location yet
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
      locationSubscription.current?.remove();
    };
  }, []);

  return { location, error, loading, hasPermission };
};
