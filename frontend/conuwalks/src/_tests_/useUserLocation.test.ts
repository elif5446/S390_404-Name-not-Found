/**
 * Unit Tests for useUserLocation Hook
 * 
 * These tests verify the hook's logic in isolation by mocking expo-location
 */

// IMPORTANT: Mock expo-location BEFORE any imports
jest.mock('expo-location');

import { renderHook, waitFor } from '@testing-library/react-native';
import { useUserLocation } from '../hooks/useUserLocation';
import * as Location from 'expo-location';

// Helper functions to reduce mock boilerplate
const mockPermission = (status: string) => {
  (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status });
};

const mockLocation = (coords: { latitude: number; longitude: number }) => {
  (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({ coords });
};

const mockLocationError = (error: Error) => {
  (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(error);
};

const mockPermissionError = (error: Error) => {
  (Location.requestForegroundPermissionsAsync as jest.Mock).mockRejectedValue(error);
};

describe('useUserLocation Hook - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Tests: Initial State
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves, keeps in loading state
      );

      const { result } = renderHook(() => useUserLocation());

      expect(result.current.location).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(true);
      expect(result.current.hasPermission).toBe(false);
    });
  });

  // Tests: Permission Granted Scenarios
  describe('Permission Granted Flow', () => {
    it('should set hasPermission to true when permission granted', async () => {
      mockPermission('granted');
      mockLocation({ latitude: 45.49599, longitude: -73.57854 });

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.hasPermission).toBe(true);
      });
    });

    it('should fetch and set location when permission granted', async () => {
      const mockCoords = { latitude: 45.49599, longitude: -73.57854 };

      mockPermission('granted');
      mockLocation(mockCoords);

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.location).toEqual(mockCoords);
      });
    });

    it('should set loading to false after successful fetch', async () => {
      mockPermission('granted');
      mockLocation({ latitude: 45.49599, longitude: -73.57854 });

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should clear error when successful', async () => {
      mockPermission('granted');
      mockLocation({ latitude: 45.49599, longitude: -73.57854 });

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.error).toBe(null);
      });
    });

    it('should call getCurrentPositionAsync with Balanced accuracy', async () => {
      mockPermission('granted');
      mockLocation({ latitude: 45.49599, longitude: -73.57854 });

      renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
          accuracy: Location.Accuracy.Balanced,
        });
      });
    });
  });

  // Tests: Permission Denied Scenarios
  describe('Permission Denied Flow', () => {
    it('should set error message when permission denied', async () => {
      mockPermission('denied');

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.error).toBe('Location permission denied');
      });
    });

    it('should keep hasPermission false when denied', async () => {
      mockPermission('denied');

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.hasPermission).toBe(false);
      });
    });

    it('should set loading to false when permission denied', async () => {
      mockPermission('denied');

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should not call getCurrentPositionAsync when permission denied', async () => {
      mockPermission('denied');

      renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
      });
    });

    it('should keep location as null when permission denied', async () => {
      mockPermission('denied');

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.location).toBe(null);
      });
    });
  });

  // Tests: Error Handling
  describe('Error Handling', () => {
    it('should handle getCurrentPositionAsync errors', async () => {
      mockPermission('granted');
      mockLocationError(new Error('GPS timeout'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to retrieve location');
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should set loading to false after error', async () => {
      mockPermission('granted');
      mockLocationError(new Error('GPS timeout'));

      jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should keep hasPermission true even if GPS fails', async () => {
      mockPermission('granted');
      mockLocationError(new Error('GPS timeout'));

      jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.hasPermission).toBe(true);
      });
    });

    it('should handle permission request errors', async () => {
      mockPermissionError(new Error('Permission dialog crashed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to retrieve location');
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  // Tests: Hook Lifecycle
  describe('Hook Lifecycle', () => {
    it('should only request permission once on mount', async () => {
      mockPermission('granted');
      mockLocation({ latitude: 45.49599, longitude: -73.57854 });

      renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
      });
    });

    it('should only fetch location once (no continuous tracking)', async () => {
      mockPermission('granted');
      mockLocation({ latitude: 45.49599, longitude: -73.57854 });

      renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
      });

      // Verify it only called once (no continuous tracking)
      expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
    });
  });

  // Tests: Different Permission Statuses
  describe('Different Permission Statuses', () => {
    const statuses = ['denied', 'undetermined', 'restricted'];

    statuses.forEach(status => {
      it(`should handle "${status}" status correctly`, async () => {
        mockPermission(status);

        const { result } = renderHook(() => useUserLocation());

        await waitFor(() => {
          expect(result.current.error).toBe('Location permission denied');
          expect(result.current.hasPermission).toBe(false);
          expect(result.current.loading).toBe(false);
        });
      });
    });
  });

  // Tests: Location Data Formats
  describe('Location Data Format', () => {
    it('should handle coordinates with many decimal places', async () => {
      const mockCoords = {
        latitude: 45.495990123456789,
        longitude: -73.578540987654321,
      };

      mockPermission('granted');
      mockLocation(mockCoords);

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.location).toEqual(mockCoords);
      });
    });

    it('should handle extreme coordinates', async () => {
      const mockCoords = {
        latitude: 89.9999,
        longitude: 179.9999,
      };

      mockPermission('granted');
      mockLocation(mockCoords);

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.location).toEqual(mockCoords);
      });
    });

    it('should handle negative coordinates', async () => {
      const mockCoords = {
        latitude: -45.49599,
        longitude: -73.57854,
      };

      mockPermission('granted');
      mockLocation(mockCoords);

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.location).toEqual(mockCoords);
      });
    });
  });
});