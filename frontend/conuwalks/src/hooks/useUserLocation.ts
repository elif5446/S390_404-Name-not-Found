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

    const processLocation = (coords: Location.LocationObject["coords"]) => {
      if (__DEV__ && isEmulatorLocation(coords)) {
        setLocation(DEFAULT_LOCATION);
      } else {
        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
      }
      setLoading(false);
      setError(null);
    };

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
          processLocation(lastKnown.coords);
        }

        // start watching
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // update every 5 seconds max
            distanceInterval: 5, // update every 10 meters
          },
          (newLocation) => {
            if (isMounted) processLocation(newLocation.coords);
          },
        );

        // Prevent memory leak if unmounted while the promise was pending
        if (!isMounted) {
          subscription.remove();
        } else {
          locationSubscription.current = subscription;
        }
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
