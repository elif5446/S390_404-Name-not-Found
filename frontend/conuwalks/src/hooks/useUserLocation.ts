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

// helper to detect if the location is the default simulated location
const isEmulatorLocation = (coords: Location.LocationObject["coords"]) => {
  return (
    // Googleplex
    (Math.abs(coords.latitude - 37.42) < 0.1 &&
      Math.abs(coords.longitude - -122.08) < 0.1) ||
    // Apple HQ
    (Math.abs(coords.latitude - 37.33) < 0.1 &&
      Math.abs(coords.longitude - -122.03) < 0.1)
  );
};

export const useUserLocation = (): UseUserLocationReturn => {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  // ref to store the subscription for cleanup
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    const startLocationTracking = async () => {
      try {
        // request permissions
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (!isMounted) return;

        if (status !== "granted") {
          setError("Location permission denied");
          setHasPermission(false);
          setLoading(false);
          return;
        }

        setHasPermission(true);

        // get cached location immediately
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (isMounted && lastKnown) {
          if (__DEV__ && isEmulatorLocation(lastKnown.coords)) {
            setLocation(DEFAULT_LOCATION);
          } else {
            setLocation(lastKnown.coords);
          }
          // we have data, so stop loading spinner immediately
          setLoading(false);
        }

        // start watching
        // 'Balanced' is sufficient for buildings and prevents timeout errors indoors
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000, // update every 5 seconds max
            distanceInterval: 10, // update every 10 meters
          },
          (newLocation) => {
            if (!isMounted) return;

            // check if we are on a simulator broadcasting fake GPS
            if (__DEV__ && isEmulatorLocation(newLocation.coords)) {
              setLocation(DEFAULT_LOCATION);
            } else {
              setLocation(newLocation.coords);
            }

            setLoading(false);
            setError(null);
          },
        );
      } catch (err) {
        if (isMounted) {
          console.warn("Location service error:", err);
          // fallback to default if we actually hit an error
          if (__DEV__) {
            setLocation(DEFAULT_LOCATION);
            setLoading(false);
          } else {
            setError("Could not fetch location");
            setLoading(false);
          }
        }
      }
    };

    startLocationTracking();

    // cleanup: Unsubscribe when component unmounts
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
