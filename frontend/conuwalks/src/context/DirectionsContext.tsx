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
  travelMode?: string;
  transitLineName?: string;
  transitLineShortName?: string;
  transitVehicleType?: string;
  transitHeadsign?: string;
  transitDepartureStop?: string;
  transitArrivalStop?: string;
  polylinePoints?: LatLng[];
}

export interface RouteData {
  id: string;
  polylinePoints: LatLng[];
  distance: string;
  duration: string;
  eta: string;
  steps: DirectionStep[];
  overviewPolyline: string;
  isShuttle?: boolean;
  requestMode: "walking" | "driving" | "transit" | "bicycling";
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
  travelMode: "walking" | "driving" | "transit" | "bicycling";
  setTravelMode: (
    mode: "walking" | "driving" | "transit" | "bicycling",
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
  const [startBuildingId, setStartBuildingId] = useState<string | null>(null);
  const [startCoords, setStartCoords] = useState<LatLng | null>(null);
  const [startLabel, setStartLabel] = useState<string | null>(null);
  const [startRoom, setStartRoomState] = useState<string | null>(null);
  const [destinationBuildingId, setDestinationBuildingId] = useState<
    string | null
  >(null);
  const [destinationCoords, setDestinationCoords] = useState<LatLng | null>(
    null,
  );
  const [destinationLabel, setDestinationLabel] = useState<string | null>(null);
  const [destinationRoom, setDestinationRoomState] = useState<string | null>(
    null,
  );
  const [routes, setRoutesState] = useState<RouteData[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndexState] = useState(0);
  const [routeData, setRouteDataState] = useState<RouteData | null>(null);
  const [travelModeState, setTravelModeState] = useState<
    "walking" | "driving" | "transit" | "bicycling"
  >("walking");
  const [showDirections, setShowDirectionsState] = useState(false);
  const [isNavigationActive, setIsNavigationActiveState] = useState(false);
  const [loading, setLoadingState] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  const [timeMode, setTimeModeState] = useState<"leave" | "arrive">("leave");
  const [targetTime, setTargetTimeState] = useState<Date | null>(null);

  const setTimeMode = useCallback(
    (mode: "leave" | "arrive") => setTimeModeState(mode),
    [],
  );
  const setTargetTime = useCallback(
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
      setStartRoomState(room);
    },
    [],
  );

  const setDestination = useCallback(
    (buildingId: string, coords: LatLng, label: string) => {
      setDestinationBuildingId(buildingId);
      setDestinationCoords(coords);
      setDestinationLabel(label);
    },
    [],
  );

  const setStartRoom = useCallback((room: string | null) => {
    setStartRoomState(room);
  }, []);

  const setDestinationRoom = useCallback((room: string | null) => {
    setDestinationRoomState(room);
  }, []);

  const clearDestination = useCallback(() => {
    setDestinationBuildingId(null);
    setDestinationCoords(null);
    setDestinationLabel(null);
    setDestinationRoomState(null);
    setRoutesState([]);
    setSelectedRouteIndexState(0);
    setRouteDataState(null);
    setShowDirectionsState(false);
    setIsNavigationActiveState(false);
    setErrorState(null);
  }, []);

  const setRoutes = useCallback((nextRoutes: RouteData[]) => {
    setRoutesState(nextRoutes);
    setSelectedRouteIndexState((previousIndex) => {
      if (nextRoutes.length === 0) {
        return 0;
      }
      return Math.min(previousIndex, nextRoutes.length - 1);
    });
  }, []);

  const setSelectedRouteIndex = useCallback((index: number) => {
    setSelectedRouteIndexState(index);
  }, []);

  useEffect(() => {
    setRouteDataState(routes[selectedRouteIndex] || null);
  }, [routes, selectedRouteIndex]);

  const setRouteData = useCallback((data: RouteData) => {
    setRouteDataState(data);
  }, []);

  const clearRouteData = useCallback(() => {
    setRoutesState([]);
    setSelectedRouteIndexState(0);
    setRouteDataState(null);
  }, []);

  const setTravelMode = useCallback(
    (mode: "walking" | "driving" | "transit" | "bicycling") => {
      setTravelModeState(mode);
    },
    [],
  );

  const setShowDirections = useCallback((show: boolean) => {
    setShowDirectionsState(show);
  }, []);

  const setIsNavigationActive = useCallback((active: boolean) => {
    setIsNavigationActiveState(active);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setLoadingState(loading);
  }, []);

  const setError = useCallback((error: string | null) => {
    setErrorState(error);
  }, []);

  const resetDirections = useCallback(() => {
    setStartBuildingId(null);
    setStartCoords(null);
    setStartLabel(null);
    setStartRoomState(null);
    setDestinationBuildingId(null);
    setDestinationCoords(null);
    setDestinationLabel(null);
    setDestinationRoomState(null);
    setRoutesState([]);
    setSelectedRouteIndexState(0);
    setRouteDataState(null);
    setTravelModeState("walking");
    setShowDirectionsState(false);
    setIsNavigationActiveState(false);
    setLoadingState(false);
    setErrorState(null);
  }, []);

  const value: DirectionsContextType = {
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
  };

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
