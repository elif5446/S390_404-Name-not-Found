/**
 * Unit Tests for useUserLocation Hook
 * Location: src/unitTests/useUserLocation.test.ts
 * 
 * These tests verify the hook's logic in isolation by mocking expo-location
 */

// IMPORTANT: Mock expo-location BEFORE any imports
jest.mock('expo-location');
import { renderHook, waitFor } from '@testing-library/react-native';
import { useUserLocation } from '../hooks/useUserLocation';
import * as Location from 'expo-location';

describe('useUserLocation Hook - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  describe('Permission Granted Flow', () => {
    it('should set hasPermission to true when permission granted', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 45.49599,
          longitude: -73.57854,
        },
      });

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.hasPermission).toBe(true);
      });
    });

    it('should fetch and set location when permission granted', async () => {
      const mockCoords = {
        latitude: 45.49599,
        longitude: -73.57854,
      };

      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: mockCoords,
      });

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.location).toEqual(mockCoords);
      });
    });

    it('should set loading to false after successful fetch', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 45.49599,
          longitude: -73.57854,
        },
      });

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should clear error when successful', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 45.49599,
          longitude: -73.57854,
        },
      });

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.error).toBe(null);
      });
    });

    it('should call getCurrentPositionAsync with Balanced accuracy', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 45.49599,
          longitude: -73.57854,
        },
      });

      renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
          accuracy: Location.Accuracy.Balanced,
        });
      });
    });
  });

  describe('Permission Denied Flow', () => {
    it('should set error message when permission denied', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.error).toBe('Location permission denied');
      });
    });

    it('should keep hasPermission false when denied', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.hasPermission).toBe(false);
      });
    });

    it('should set loading to false when permission denied', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should not call getCurrentPositionAsync when permission denied', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
      });
    });

    it('should keep location as null when permission denied', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.location).toBe(null);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle getCurrentPositionAsync errors', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
        new Error('GPS timeout')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to retrieve location');
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should set loading to false after error', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
        new Error('GPS timeout')
      );

      jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should keep hasPermission true even if GPS fails', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
        new Error('GPS timeout')
      );

      jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.hasPermission).toBe(true);
      });
    });

    it('should handle permission request errors', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error('Permission dialog crashed')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to retrieve location');
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Hook Lifecycle', () => {
    it('should only request permission once on mount', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 45.49599,
          longitude: -73.57854,
        },
      });

      renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
      });
    });

    it('should only fetch location once (no continuous tracking)', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 45.49599,
          longitude: -73.57854,
        },
      });

      renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
      });

      // Wait a bit more to ensure it doesn't call again
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('Different Permission Statuses', () => {
    const statuses = ['denied', 'undetermined', 'restricted'];

    statuses.forEach(status => {
      it(`should handle "${status}" status correctly`, async () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
          status,
        });

        const { result } = renderHook(() => useUserLocation());

        await waitFor(() => {
          expect(result.current.error).toBe('Location permission denied');
          expect(result.current.hasPermission).toBe(false);
          expect(result.current.loading).toBe(false);
        });
      });
    });
  });

  describe('Location Data Format', () => {
    it('should handle coordinates with many decimal places', async () => {
      const mockCoords = {
        latitude: 45.495990123456789,
        longitude: -73.578540987654321,
      };

      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: mockCoords,
      });

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

      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: mockCoords,
      });

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

      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: mockCoords,
      });

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.location).toEqual(mockCoords);
      });
    });
  });
});