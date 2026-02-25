/**
 * Unit Tests for useUserLocation Hook
 *
 * These tests verify the hook's logic in isolation by mocking expo-location
 */

/*
 *   !!! THIS OVERRIDES jest.setup.js. OTHERWISE TESTS USE WRONG MOCK.
 */
jest.unmock("@/src/hooks/useUserLocation");

import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import * as Location from "expo-location";

// IMPORTANT: Mock expo-location BEFORE any imports
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  Accuracy: {
    Balanced: 3,
    High: 4,
    Highest: 5,
  },
}));

// Types for Mocks
type WatchPositionCallback = (location: { coords: any }) => void;

// Helper Functions
const mockPermission = (status: string) => {
  (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
    status,
  });
};

const mockLastKnownPosition = (
  coords: { latitude: number; longitude: number } | null,
) => {
  (Location.getLastKnownPositionAsync as jest.Mock).mockResolvedValue(
    coords ? { coords } : null,
  );
};

// Returns the remove mock so we can check if it was called
const mockWatchPosition = () => {
  const removeFn = jest.fn();
  (Location.watchPositionAsync as jest.Mock).mockResolvedValue({
    remove: removeFn,
  });
  return removeFn;
};

const mockWatchError = (error: Error) => {
  (Location.watchPositionAsync as jest.Mock).mockRejectedValue(error);
};

describe("useUserLocation Hook - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Tests: Initial State
  describe("Initial State", () => {
    it("should have correct initial state", () => {
      // mock permission to never resolve to simulate "loading" state
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockImplementation(() => new Promise(() => {}));

      const { result, unmount } = renderHook(() => useUserLocation());

      expect(result.current.location).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(true);
      expect(result.current.hasPermission).toBe(false);

      // KILL the hook before moving to Test #2 to stop the pending promise leak
      unmount();
    });
  });

  // Tests: Permission Granted Flow
  describe("Permission Granted Flow", () => {
    it("should set hasPermission to true when granted", async () => {
      mockPermission("granted");
      mockLastKnownPosition(null);
      mockWatchPosition();

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.hasPermission).toBe(true);
      });
    });

    it("should use cached location (getLastKnownPosition) immediately if available", async () => {
      const mockCoords = { latitude: 45.49599, longitude: -73.57854 };

      mockPermission("granted");
      mockLastKnownPosition(mockCoords); // Simulate cache hit
      mockWatchPosition();

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.location).toEqual(mockCoords);
        expect(result.current.loading).toBe(false);
      });

      // verify getLastKnownPositionAsync was actually called
      expect(Location.getLastKnownPositionAsync).toHaveBeenCalled();
    });

    it("should start watching position with High accuracy", async () => {
      mockPermission("granted");
      mockLastKnownPosition(null);
      mockWatchPosition();

      renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(Location.watchPositionAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 5,
          }),
          expect.any(Function), // The callback
        );
      });
    });

    it("should update location when watchPositionAsync callback fires", async () => {
      const initialCoords = { latitude: 45.0, longitude: -73.0 };
      const newCoords = { latitude: 46.0, longitude: -74.0 };

      mockPermission("granted");
      mockLastKnownPosition(initialCoords);
      mockWatchPosition();

      const { result } = renderHook(() => useUserLocation());

      // Wait for initial load
      await waitFor(() =>
        expect(result.current.location).toEqual(initialCoords),
      );

      // Retrieve the callback passed to watchPositionAsync
      const watchCall = (Location.watchPositionAsync as jest.Mock).mock
        .calls[0];
      const callback = watchCall[1] as WatchPositionCallback;

      // Simulate a location update
      act(() => {
        callback({ coords: newCoords });
      });

      await waitFor(() => {
        expect(result.current.location).toEqual(newCoords);
      });
    });
  });

  // Tests: Permission Denied Flow
  describe("Permission Denied Flow", () => {
    it("should set error message when permission denied", async () => {
      mockPermission("denied");

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.error).toBe("Location permission denied");
        expect(result.current.hasPermission).toBe(false);
        expect(result.current.loading).toBe(false);
      });
    });

    it("should NOT start watching position when denied", async () => {
      mockPermission("denied");

      renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(Location.watchPositionAsync).not.toHaveBeenCalled();
        expect(Location.getLastKnownPositionAsync).not.toHaveBeenCalled();
      });
    });
  });

  // Tests: Error Handling
  describe("Error Handling", () => {
    it("should handle watchPositionAsync errors gracefully", async () => {
      mockPermission("granted");
      mockLastKnownPosition(null);
      mockWatchError(new Error("Location services disabled"));

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const { result } = renderHook(() => useUserLocation());

      // In __DEV__ (which tests usually run in), the hook defaults to DEFAULT_LOCATION on error
      // or sets an error message depending on your exact catch block implementation.
      // Based on provided code: if __DEV__ fallback logic triggers inside catch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe("Failed to retrieve location");
      });

      // Restore console mocks
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  // Tests: Cleanup
  describe("Cleanup", () => {
    it("should remove location subscription on unmount", async () => {
      mockPermission("granted");
      mockLastKnownPosition(null);
      const removeMock = mockWatchPosition();

      const { unmount } = renderHook(() => useUserLocation());

      // Wait for the effect to run and subscription to be set
      await waitFor(() => {
        expect(Location.watchPositionAsync).toHaveBeenCalled();
      });

      unmount();

      expect(removeMock).toHaveBeenCalledTimes(1);
    });
  });

  // Tests: Emulator Handling
  describe("Emulator Handling", () => {
    // Note: __DEV__ is usually true in Jest environments
    it("should use DEFAULT_LOCATION if coordinates match Googleplex (Emulator)", async () => {
      const googleplex = { latitude: 37.422, longitude: -122.084 }; // Googleplex
      const defaultLoc = { latitude: 45.49559, longitude: -73.57871 }; // SGW

      mockPermission("granted");
      mockLastKnownPosition(null);
      mockWatchPosition();

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() =>
        expect(Location.watchPositionAsync).toHaveBeenCalled(),
      );

      // Get callback
      const callback = (Location.watchPositionAsync as jest.Mock).mock
        .calls[0][1];

      // Simulate Emulator Location update
      act(() => {
        callback({ coords: googleplex });
      });

      // Expect it to swap to DEFAULT_LOCATION (SGW)
      await waitFor(() => {
        expect(result.current.location?.latitude).toBeCloseTo(
          defaultLoc.latitude,
        );
        expect(result.current.location?.longitude).toBeCloseTo(
          defaultLoc.longitude,
        );
      });
    });
  });

  // Tests: Unexpected GPS Coordinates
  describe("Unexpected GPS Coordinates", () => {
    it("should handle Null Island (0, 0) correctly", async () => {
      const nullIsland = { latitude: 0, longitude: 0 };

      // Mock setup
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValue({ status: "granted" });
      (Location.getLastKnownPositionAsync as jest.Mock).mockResolvedValue({
        coords: nullIsland,
      });
      (Location.watchPositionAsync as jest.Mock).mockResolvedValue({
        remove: jest.fn(),
      });

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.location).toEqual(nullIsland);
        expect(result.current.loading).toBe(false);
      });
    });

    it("should handle high precision floating point coordinates without truncation", async () => {
      const preciseCoords = {
        latitude: 45.12345678901234,
        longitude: -73.98765432109876,
      };

      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValue({ status: "granted" });
      (Location.getLastKnownPositionAsync as jest.Mock).mockResolvedValue(null);

      // Mock watch to return precise coords via callback
      (Location.watchPositionAsync as jest.Mock).mockImplementation(
        async (_, callback) => {
          callback({ coords: preciseCoords });
          return { remove: jest.fn() };
        },
      );

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.location).toEqual(preciseCoords);
      });
    });

    it("should handle extreme boundary coordinates (Poles/Date Line)", async () => {
      const boundaryCoords = { latitude: 90, longitude: 180 };

      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValue({ status: "granted" });
      (Location.getLastKnownPositionAsync as jest.Mock).mockResolvedValue({
        coords: boundaryCoords,
      });
      (Location.watchPositionAsync as jest.Mock).mockResolvedValue({
        remove: jest.fn(),
      });

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.location).toEqual(boundaryCoords);
      });
    });

    it("should handle NaN coordinates without crashing", async () => {
      const nanCoords = { latitude: NaN, longitude: NaN };

      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValue({ status: "granted" });
      (Location.getLastKnownPositionAsync as jest.Mock).mockResolvedValue({
        coords: nanCoords,
      });
      (Location.watchPositionAsync as jest.Mock).mockResolvedValue({
        remove: jest.fn(),
      });

      const { result } = renderHook(() => useUserLocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        // Expect strict equality to NaN
        expect(result.current.location?.latitude).toBeNaN();
        expect(result.current.location?.longitude).toBeNaN();
      });
    });
  });
});
