import React, {
  createContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { LatLng } from "react-native-maps";

export interface DirectionStep {
  instruction: string;
  distance: string;
  duration: string;
  startLocation?: LatLng;
  endLocation?: LatLng;
  travelMode?: TravelMode;
  transitLineName?: string;
  transitLineShortName?: string;
  transitVehicleType?: string;
  transitHeadsign?: string;
  transitDepartureStop?: string;
  transitArrivalStop?: string;
  polylinePoints?: LatLng[];
}

type TravelMode = "walking" | "driving" | "transit" | "bicycling" | "shuttle";

export interface RouteData {
  id: string;
  polylinePoints: LatLng[];
  distance: string;
  duration: string;
  baseDurationSeconds: number;
  eta: string;
  steps: DirectionStep[];
  overviewPolyline: string;
  isShuttle?: boolean;
  requestMode: TravelMode;
}

export interface DirectionsContextType {
  startBuildingId: string | null;
  startCoords: LatLng | null;
  startLabel: string | null;
  startRoom: string | null;
  setStartPoint: (
    buildingId: string,
    coords: LatLng,
    label: string,
    room?: string | null,
  ) => void;
  timeMode: "leave" | "arrive";
  setTimeMode: (mode: "leave" | "arrive") => void;
  targetTime: Date | null;
  setTargetTime: (time: Date | null) => void;

  // Destination state
  destinationBuildingId: string | null;
  destinationCoords: LatLng | null;
  destinationLabel: string | null;
  destinationRoom: string | null;
  setDestination: (
    buildingId: string,
    coords: LatLng,
    label: string,
    room?: string | null,
  ) => void;
  setStartRoom: (room: string | null) => void;
  setDestinationRoom: (room: string | null) => void;
  clearDestination: () => void;

  // Route state
  routes: RouteData[];
  setRoutes: (routes: RouteData[]) => void;
  selectedRouteIndex: number;
  setSelectedRouteIndex: (index: number) => void;
  routeData: RouteData | null;
  setRouteData: (data: RouteData) => void;
  clearRouteData: () => void;

  // Travel mode
  travelMode: TravelMode;
  setTravelMode: (mode: TravelMode) => void;

  // UI state
  showDirections: boolean;
  setShowDirections: (show: boolean) => void;
  isNavigationActive: boolean;
  setIsNavigationActive: (active: boolean) => void;

  // Loading and error
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Reset all
  resetDirections: () => void;
}

export const DirectionsContext = createContext<
  DirectionsContextType | undefined
>(undefined);

interface DirectionsProviderProps {
  children: ReactNode;
}

export const DirectionsProvider: React.FC<DirectionsProviderProps> = ({
  children,
}) => {
  const [startBuildingId, setStartBuildingId] = useState<string | null>(null);
  const [startCoords, setStartCoords] = useState<LatLng | null>(null);
  const [startLabel, setStartLabel] = useState<string | null>(null);
  const [startRoom, setStartRoom] = useState<string | null>(null);
  const [destinationBuildingId, setDestinationBuildingId] = useState<
    string | null
  >(null);
  const [destinationCoords, setDestinationCoords] = useState<LatLng | null>(
    null,
  );
  const [destinationLabel, setDestinationLabel] = useState<string | null>(
    null,
  );
  const [destinationRoom, setDestinationRoom] = useState<string | null>(null);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [travelModeState, setTravelModeState] = useState<TravelMode>("walking");
  const [showDirections, setShowDirections] = useState(false);
  const [isNavigationActive, setIsNavigationActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [timeMode, setTimeModeState] = useState<"leave" | "arrive">("leave");
  const [targetTime, setTargetTimeState] = useState<Date | null>(null);

  const setTimeModeCallback = useCallback(
    (mode: "leave" | "arrive") => setTimeModeState(mode),
    [],
  );
  const setTargetTimeCallback = useCallback(
    (time: Date | null) => setTargetTimeState(time),
    [],
  );

  // Memoized setters to prevent unnecessary context updates
  const setStartPoint = useCallback(
    (
      buildingId: string,
      coords: LatLng,
      label: string,
      room: string | null = null,
    ) => {
      setStartBuildingId(buildingId);
      setStartCoords(coords);
      setStartLabel(label);
      setStartRoom(room);

      // if active, cancel it and show the preview popup
      setIsNavigationActive((prev) => {
        if (prev) setShowDirections(true);
        return false;
      });
    },
    [],
  );

  const setDestination = useCallback(
    (
      buildingId: string,
      coords: LatLng,
      label: string,
      room: string | null = null,
    ) => {
      setDestinationBuildingId(buildingId);
      setDestinationCoords(coords);
      setDestinationLabel(label);
      setDestinationRoom(room);

      // if active, cancel it and show the preview popup
      setIsNavigationActive((prev) => {
        if (prev) setShowDirections(true);
        return false;
      });
    },
    [],
  );

  const setStartRoomCallback = useCallback((room: string | null) => {
    setStartRoom(room);

    // if active, cancel it and show the preview popup
    setIsNavigationActive((prev) => {
      if (prev) setShowDirections(true);
      return false;
    });
  }, []);

  const setDestinationRoomCallback = useCallback((room: string | null) => {
    setDestinationRoom(room);
    // if active, cancel it and show the preview popup
    setIsNavigationActive((prev) => {
      if (prev) setShowDirections(true);
      return false;
    });
  }, []);

  const clearDestination = useCallback(() => {
    setDestinationBuildingId(null);
    setDestinationCoords(null);
    setDestinationLabel(null);
    setDestinationRoom(null);
    setRoutes([]);
    setSelectedRouteIndex(0);
    setRouteData(null);
    setShowDirections(false);
    setIsNavigationActive(false);
    setError(null);
  }, []);

  const setRoutesCallback = useCallback((nextRoutes: RouteData[]) => {
    setRoutes(nextRoutes);
    setSelectedRouteIndex((previousIndex) => {
      if (nextRoutes.length === 0) {
        return 0;
      }
      return Math.min(previousIndex, nextRoutes.length - 1);
    });

    // add back indoor route
    if (nextRoutes.length > 0) {
      const activeRoute = nextRoutes[0];
      setRouteData({
        ...activeRoute,
      });
    }
  }, []);

  const setSelectedRouteIndexCallback = useCallback((index: number) => {
    setSelectedRouteIndex(index);
  }, []);

  useEffect(() => {
    setRouteData(routes[selectedRouteIndex] || null);
  }, [routes, selectedRouteIndex]);

  const setRouteDataCallback = useCallback((data: RouteData) => {
    setRouteData(data);
  }, []);

  const clearRouteData = useCallback(() => {
    setRoutes([]);
    setSelectedRouteIndex(0);
    setRouteData(null);
  }, []);

  const setTravelModeCallback = useCallback((mode: TravelMode) => {
    setTravelModeState(mode);
  }, []);

  const setShowDirectionsCallback = useCallback((show: boolean) => {
    setShowDirections(show);
  }, []);

  const setIsNavigationActiveCallback = useCallback((active: boolean) => {
    setIsNavigationActive(active);
  }, []);

  const setLoadingCallback = useCallback((loading: boolean) => {
    setLoading(loading);
  }, []);

  const setErrorCallback = useCallback((error: string | null) => {
    setError(error);
  }, []);

  const resetDirections = useCallback(() => {
    setStartBuildingId(null);
    setStartCoords(null);
    setStartLabel(null);
    setStartRoom(null);
    setDestinationBuildingId(null);
    setDestinationCoords(null);
    setDestinationLabel(null);
    setDestinationRoom(null);
    setRoutes([]);
    setSelectedRouteIndex(0);
    setRouteData(null);
    setTravelModeState("walking");
    setShowDirections(false);
    setIsNavigationActive(false);
    setLoading(false);
    setError(null);
    setTimeModeState("leave");
    setTargetTimeState(null);
  }, []);

  // Memoize the context value to prevent layout thrashing across the app
  const value: DirectionsContextType = React.useMemo(
    () => ({
      startBuildingId,
      startCoords,
      startLabel,
      startRoom,
      destinationBuildingId,
      destinationCoords,
      destinationLabel,
      destinationRoom,
      setStartPoint,
      setDestination,
      setStartRoom: setStartRoomCallback,
      setDestinationRoom: setDestinationRoomCallback,
      clearDestination,
      routes,
      setRoutes: setRoutesCallback,
      selectedRouteIndex,
      setSelectedRouteIndex: setSelectedRouteIndexCallback,
      routeData,
      setRouteData: setRouteDataCallback,
      clearRouteData,
      travelMode: travelModeState,
      setTravelMode: setTravelModeCallback,
      showDirections,
      setShowDirections: setShowDirectionsCallback,
      isNavigationActive,
      setIsNavigationActive: setIsNavigationActiveCallback,
      loading,
      setLoading: setLoadingCallback,
      error,
      setError: setErrorCallback,
      resetDirections,
      timeMode,
      setTimeMode: setTimeModeCallback,
      targetTime,
      setTargetTime: setTargetTimeCallback,
    }),
    [
      startBuildingId,
      startCoords,
      startLabel,
      startRoom,
      destinationBuildingId,
      destinationCoords,
      destinationLabel,
      destinationRoom,
      routes,
      selectedRouteIndex,
      routeData,
      travelModeState,
      showDirections,
      isNavigationActive,
      loading,
      error,
      timeMode,
      targetTime,
      // setters are stable (wrapped in useCallback)
      setStartPoint,
      setDestination,
      setStartRoomCallback,
      setDestinationRoomCallback,
      clearDestination,
      setRoutesCallback,
      setSelectedRouteIndexCallback,
      setRouteDataCallback,
      clearRouteData,
      setTravelModeCallback,
      setShowDirectionsCallback,
      setIsNavigationActiveCallback,
      setLoadingCallback,
      setErrorCallback,
      resetDirections,
      setTimeModeCallback,
      setTargetTimeCallback,
    ],
  );

  return (
    <DirectionsContext.Provider value={value}>
      {children}
    </DirectionsContext.Provider>
  );
};

export const useDirections = (): DirectionsContextType => {
  const context = React.useContext(DirectionsContext);
  if (context === undefined) {
    throw new Error("useDirections must be used within DirectionsProvider");
  }
  return context;
};
