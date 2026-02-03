import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { LatLng } from "react-native-maps";

interface UseUserLocationReturn {
  location: LatLng | null;
  error: string | null;
  loading: boolean;
  hasPermission: boolean;
}

export const useUserLocation = (): UseUserLocationReturn => {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        // Request foreground location permission
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          // Permission denied
          setError("Location permission denied");
          setHasPermission(false);
          setLoading(false);
          return;
        }

        // Permission granted
        setHasPermission(true);

        // Get user's current location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        setError(null);
      } catch (err) {
        setError("Failed to retrieve location");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    requestLocationPermission();
  }, []);

  return { location, error, loading, hasPermission };
};
