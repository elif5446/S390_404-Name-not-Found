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

type TravelMode = "walking" | "driving" | "transit" | "bicycling";

export interface RouteData {
  id: string;
  polylinePoints: LatLng[];
  distance: string;
  duration: string;
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
  setDestination: (buildingId: string, coords: LatLng, label: string) => void;
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
  setTravelMode: (
    mode: TravelMode,
  ) => void;

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
  const [startBuildingId, _setStartBuildingId] = useState<string | null>(null);
  const [startCoords, _setStartCoords] = useState<LatLng | null>(null);
  const [startLabel, _setStartLabel] = useState<string | null>(null);
  const [startRoom, _setStartRoom] = useState<string | null>(null);
  const [destinationBuildingId, _setDestinationBuildingId] = useState<
    string | null
  >(null);
  const [destinationCoords, _setDestinationCoords] = useState<LatLng | null>(
    null,
  );
  const [destinationLabel, _setDestinationLabel] = useState<string | null>(null);
  const [destinationRoom, _setDestinationRoom] = useState<string | null>(
    null,
  );
  const [routes, _setRoutes] = useState<RouteData[]>([]);
  const [selectedRouteIndex, _setSelectedRouteIndex] = useState(0);
  const [routeData, _setRouteData] = useState<RouteData | null>(null);
  const [travelModeState, _setTravelMode] = useState<
    TravelMode
  >("walking");
  const [showDirections, _setShowDirections] = useState(false);
  const [isNavigationActive, _setIsNavigationActive] = useState(false);
  const [loading, _setLoading] = useState(false);
  const [error, _setError] = useState<string | null>(null);

  const [timeMode, _setTimeModeState] = useState<"leave" | "arrive">("leave");
  const [targetTime, _setTargetTimeState] = useState<Date | null>(null);

  const setTimeMode = useCallback(
    (mode: "leave" | "arrive") => _setTimeMode(mode),
    [],
  );
  const setTargetTime = useCallback(
    (time: Date | null) => _setTargetTime(time),
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
      _setStartBuildingId(buildingId);
      _setStartCoords(coords);
      _setStartLabel(label);
      _setStartRoom(room);
    },
    [],
  );

  const setDestination = useCallback(
    (buildingId: string, coords: LatLng, label: string) => {
      _setDestinationBuildingId(buildingId);
      _setDestinationCoords(coords);
      _setDestinationLabel(label);
    },
    [],
  );

  const setStartRoom = useCallback((room: string | null) => {
    _setStartRoom(room);
  }, []);

  const setDestinationRoom = useCallback((room: string | null) => {
    _setDestinationRoom(room);
  }, []);

  const clearDestination = useCallback(() => {
   _setDestinationBuildingId(null);
    _setDestinationCoords(null);
    _setDestinationLabel(null);
    _setDestinationRoom(null);
    _setRoutes([]);
    _setSelectedRouteIndex(0);
    _setRouteData(null);
    _setShowDirections(false);
    _setIsNavigationActive(false);
    _setError(null);
  }, []);

  const setRoutes = useCallback((nextRoutes: RouteData[]) => {
    _setRoutes(nextRoutes);
    _setSelectedRouteIndex((previousIndex) => {
      if (nextRoutes.length === 0) {
        return 0;
      }
      return Math.min(previousIndex, nextRoutes.length - 1);
    });
  }, []);

  const setSelectedRouteIndex = useCallback((index: number) => {
    _setSelectedRouteIndex(index);
  }, []);

  useEffect(() => {
    _setRouteData(routes[selectedRouteIndex] || null);
  }, [routes, selectedRouteIndex]);

  const setRouteData = useCallback((data: RouteData) => {
    _setRouteData(data);
  }, []);

  const clearRouteData = useCallback(() => {
    _setRoutes([]);
    _setSelectedRouteIndex(0);
    _setRouteData(null);
  }, []);

  const setTravelMode = useCallback(
    (mode: TravelMode) => {
      _setTravelMode(mode);
    },
    [],
  );

  const setShowDirections = useCallback((show: boolean) => {
    _setShowDirections(show);
  }, []);

  const setIsNavigationActive = useCallback((active: boolean) => {
    _setIsNavigationActive(active);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    _setLoading(loading);
  }, []);

  const setError = useCallback((error: string | null) => {
    _setErrorState(error);
  }, []);

  const resetDirections = useCallback(() => {
    _setStartBuildingId(null);
    _setStartCoords(null);
    _setStartLabel(null);
    _setStartRoom(null);
    _setDestinationBuildingId(null);
    _setDestinationCoords(null);
    _setDestinationLabel(null);
    _setDestinationRoom(null);
    _setRoutes([]);
    _setSelectedRouteIndex(0);
    _setRouteData(null);
    _setTravelMode("walking");
    _setShowDirections(false);
    _setIsNavigationActive(false);
    _setLoading(false);
    _setError(null);
  }, []);

  // Memoize the context value to prevent layout thrashing across the app
  const value: DirectionsContextType = React.useMemo(() => ({
    startBuildingId,
    startCoords,
    startLabel,
    startRoom,
    setStartPoint,
    destinationBuildingId,
    destinationCoords,
    destinationLabel,
    destinationRoom,
    setDestination,
    setStartRoom,
    setDestinationRoom,
    clearDestination,
    routes,
    setRoutes,
    selectedRouteIndex,
    setSelectedRouteIndex,
    routeData,
    setRouteData,
    clearRouteData,
    travelMode: travelModeState,
    setTravelMode,
    showDirections,
    setShowDirections,
    isNavigationActive,
    setIsNavigationActive,
    loading,
    setLoading,
    error,
    setError,
    resetDirections,
    timeMode,
    setTimeMode,
    targetTime,
    setTargetTime,
  }), [
    startBuildingId, startCoords, startLabel, startRoom,
    destinationBuildingId, destinationCoords, destinationLabel, destinationRoom,
    routes, selectedRouteIndex, routeData, travelModeState,
    showDirections, isNavigationActive, loading, error, 
    timeMode, targetTime,
    // setters are stable (wrapped in useCallback)
    setStartPoint, setDestination, setStartRoom, setDestinationRoom, clearDestination,
    setRoutes, setSelectedRouteIndex, setRouteData, clearRouteData, setTravelMode,
    setShowDirections, setIsNavigationActive, setLoading, setError, resetDirections,
    setTimeMode, setTargetTime
  ]);

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
