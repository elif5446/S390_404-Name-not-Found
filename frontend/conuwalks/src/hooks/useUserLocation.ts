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

// helper to clean coordinates
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
          setLocation(processCoords(lastKnown.coords));
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
            if (isMounted) {
              setLocation(processCoords(newLocation.coords));
              setLoading(false);
              setError(null);
            }
          },
        );
      } catch (err) {
        if (isMounted) {
          console.warn("Location service error:", err);
          // fallback to default if we actually hit an error
          setError("Could not fetch location");
          setLoading(false);
        }
      }
    };

    startLocationTracking();

    // cleanup: Unsubscribe when component unmounts
    return () => {
      isMounted = false;
      locationSubscription.current?.remove();
    };
  }, []);

  return { location, error, loading, hasPermission };
};
