import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface UseLocationReturn {
  location: LocationData | null;
  errorMsg: string | null;
  permissionStatus: Location.PermissionStatus | null;
  requestPermission: () => Promise<void>;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  const requestPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === Location.PermissionStatus.DENIED) {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      
      if (status !== Location.PermissionStatus.GRANTED) {
        setErrorMsg('Unable to get location permission');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setErrorMsg(null);
    } catch (error) {
      setErrorMsg(`Error getting location: ${error}`);
    }
  };

  useEffect(() => {
    // Check current permission status on mount
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      // If permission is already granted, fetch location automatically
      if (status === Location.PermissionStatus.GRANTED) {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
        } catch (error) {
          setErrorMsg(`Error getting location: ${error}`);
        }
      }
    })();
  }, []);

  return {
    location,
    errorMsg,
    permissionStatus,
    requestPermission,
  };
}
