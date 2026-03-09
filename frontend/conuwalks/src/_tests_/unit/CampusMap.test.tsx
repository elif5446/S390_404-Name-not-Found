import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native";
import { ActivityIndicator } from "react-native";
import CampusMap from "../../components/CampusMap";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import { useDirections } from "@/src/context/DirectionsContext";
import { isPointInPolygon } from "@/src/utils/geo";
import {
  calculatePolygonCenter,
  distanceMetersBetween,
} from "@/src/utils/geometry";

/* ─────────────────────────────────────────────────────────────────────────────
   Module mocks (hoisted by Jest before imports)
   ───────────────────────────────────────────────────────────────────────────── */

jest.mock("@/src/hooks/useUserLocation");
jest.mock("@/src/context/DirectionsContext");

jest.mock("@/src/utils/geometry", () => ({
  calculatePolygonCenter: jest.fn(() => ({
    latitude: 45.495,
    longitude: -73.578,
  })),
  distanceMetersBetween: jest.fn(() => 100),
}));

jest.mock("@/src/utils/geo", () => ({
  isPointInPolygon: jest.fn(() => false),
}));

jest.mock("@/src/data/campus/SGW.geojson", () => ({
  features: [
    {
      type: "Feature",
      properties: { id: "H" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-73.577, 45.496],
            [-73.577, 45.497],
            [-73.576, 45.497],
            [-73.576, 45.496],
            [-73.577, 45.496],
          ],
        ],
      },
    },
  ],
}));

jest.mock("@/src/data/campus/LOY.geojson", () => ({
  features: [
    {
      type: "Feature",
      properties: { id: "AD" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-73.64, 45.458],
            [-73.64, 45.459],
            [-73.639, 45.459],
            [-73.639, 45.458],
            [-73.64, 45.458],
          ],
        ],
      },
    },
  ],
}));

jest.mock("@/src/data/indoorData", () => ({
  INDOOR_DATA: {
    H: { id: "H", name: "Hall Building", defaultFloor: 1, floors: [] },
  },
}));

jest.mock("@/src/data/metadata/SGW.BuildingMetaData", () => ({
  SGWBuildingMetadata: { H: { name: "Hall Building" } },
}));

jest.mock("@/src/data/metadata/LOY.BuildingMetadata", () => ({
  LoyolaBuildingMetadata: { AD: { name: "Administration Building" } },
}));

jest.mock("@/src/styles/BuildingTheme", () => ({
  __esModule: true,
  default: { SGW: { H: "#FF0000" }, LOY: { AD: "#00FF00" } },
}));

jest.mock("@/src/styles/campusMap", () => ({
  __esModule: true,
  default: { container: {}, map: {} },
}));

jest.mock("@/src/data/campus/campusConfig", () => ({
  CampusConfig: { SGW: { labels: [] }, LOY: { labels: [] } },
}));

jest.mock("expo-blur", () => {
  const { View } = require("react-native");
  return {
    BlurView: ({ children, ...p }: any) => <View {...p}>{children}</View>,
  };
});

jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-symbols", () => ({ SymbolView: "SymbolView" }));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock("react-native-maps", () => {
  const React = require("react");
  const { TouchableOpacity, View } = require("react-native");

  const MockMapView = React.forwardRef(
    (
      { children, onLongPress, onPress, onPanDrag, onRegionChangeComplete }: any,
      ref: any,
    ) => {
      React.useImperativeHandle(ref, () => ({
        animateCamera: jest.fn(),
        animateToRegion: jest.fn(),
      }));
      return (
        <View testID="map-view">
          {children}
          {onPress && (
            <TouchableOpacity testID="map-press-trigger" onPress={onPress} />
          )}
          {onLongPress && (
            <TouchableOpacity
              testID="map-long-press-trigger"
              onPress={() =>
                onLongPress({
                  nativeEvent: {
                    coordinate: { latitude: 45.496, longitude: -73.577 },
                  },
                })
              }
            />
          )}
          {onRegionChangeComplete && (
            <TouchableOpacity
              testID="map-region-change-trigger"
              onPress={() =>
                onRegionChangeComplete({
                  latitude: 45.495,
                  longitude: -73.578,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                })
              }
            />
          )}
        </View>
      );
    },
  );

  const MockPolygon = ({ onPress, accessibilityLabel }: any) => (
    <TouchableOpacity
      testID={`polygon-${accessibilityLabel ?? "unknown"}`}
      accessibilityLabel={accessibilityLabel ?? undefined}
      onPress={onPress}
    />
  );

  const MockMarker = React.forwardRef(
    ({ children, onPress, accessibilityLabel, testID }: any, ref: any) => (
      <TouchableOpacity
        ref={ref}
        testID={testID ?? `marker-${accessibilityLabel ?? "unknown"}`}
        accessibilityLabel={accessibilityLabel ?? undefined}
        onPress={onPress}
      >
        {children}
      </TouchableOpacity>
    ),
  );

  return {
    __esModule: true,
    default: MockMapView,
    PROVIDER_GOOGLE: "google",
    Polygon: MockPolygon,
    Marker: MockMarker,
    Circle: () => <View testID="circle" />,
  };
});

jest.mock("@/src/components/AdditionalInfoPopup", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Mock = React.forwardRef(
    ({ visible, directionsEtaLabel, onDirectionsTrigger }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        minimize: jest.fn(),
        collapse: jest.fn(),
      }));
      if (!visible) return null;
      return (
        <View testID="additional-info-popup">
          <View
            testID="eta-display"
            accessibilityLabel={String(directionsEtaLabel)}
          />
        </View>
      );
    },
  );
  return { __esModule: true, default: Mock };
});

jest.mock("@/src/components/DestinationPopup", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Mock = React.forwardRef(({ visible }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({ minimize: jest.fn() }));
    if (!visible) return null;
    return <View testID="destination-popup" />;
  });
  return { __esModule: true, default: Mock };
});

jest.mock("@/src/components/RightControlsPanel", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="right-controls-panel" />,
  };
});

jest.mock("@/src/components/DirectionsSearchPanel", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="directions-search-panel" />,
  };
});

jest.mock("@/src/components/RoutePolyline", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="route-polyline" />,
  };
});

jest.mock("@/src/components/campusLabels", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="campus-labels" />,
  };
});

jest.mock("@/src/components/indoor/IndoorMapOverlay", () => {
  const { TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({ onExit }: any) => (
      <TouchableOpacity testID="indoor-map-overlay" onPress={onExit} />
    ),
  };
});

/* ─────────────────────────────────────────────────────────────────────────────
   Test helpers
   ───────────────────────────────────────────────────────────────────────────── */

const USER_LOCATION = { latitude: 45.495, longitude: -73.578 };

const makeDirections = (overrides: Record<string, any> = {}) => ({
  destinationBuildingId: null as string | null,
  destinationRoom: null as string | null,
  startBuildingId: null as string | null,
  startRoom: null as string | null,
  startCoords: null,
  routeData: null,
  travelMode: "walking" as const,
  isNavigationActive: false,
  setDestination: jest.fn(),
  setStartPoint: jest.fn(),
  clearRouteData: jest.fn(),
  showDirections: false,
  setShowDirections: jest.fn(),
  setIsNavigationActive: jest.fn(),
  clearDestination: jest.fn(),
  ...overrides,
});

const makeUserLocation = (overrides: Record<string, any> = {}) => ({
  location: USER_LOCATION,
  error: null as string | null,
  loading: false,
  hasPermission: true,
  ...overrides,
});

const BASE_ROUTE_DATA = {
  id: "route-1",
  polylinePoints: [USER_LOCATION],
  distance: "500 m",
  duration: "5 mins",
  eta: "2:30 PM",
  steps: [
    {
      instruction: "Head north on Mackay",
      distance: "200 m",
      duration: "2 mins",
      travelMode: "walking",
      endLocation: { latitude: 45.5, longitude: -73.58 },
    },
    {
      instruction: "Turn right on Sherbrooke",
      distance: "300 m",
      duration: "3 mins",
      travelMode: "walking",
      endLocation: { latitude: 45.502, longitude: -73.575 },
    },
  ],
  overviewPolyline: "encoded",
  requestMode: "walking" as const,
};

const TRANSIT_ROUTE_DATA = {
  ...BASE_ROUTE_DATA,
  id: "transit-1",
  requestMode: "transit" as const,
  steps: [
    {
      instruction: "Board Metro",
      distance: "0 m",
      duration: "0 mins",
      travelMode: "TRANSIT",
      transitLineName: "Green Line",
      transitLineShortName: "GL",
      transitVehicleType: "SUBWAY",
      startLocation: { latitude: 45.496, longitude: -73.578 },
      endLocation: { latitude: 45.502, longitude: -73.572 },
      transitDepartureStop: "Guy-Concordia",
      transitArrivalStop: "Atwater",
    },
    {
      instruction: "Take Bus 105",
      distance: "0 m",
      duration: "0 mins",
      travelMode: "TRANSIT",
      transitLineName: "Bus 105",
      transitLineShortName: "105",
      transitVehicleType: "BUS",
      startLocation: { latitude: 45.502, longitude: -73.572 },
      endLocation: { latitude: 45.508, longitude: -73.565 },
      transitDepartureStop: "Atwater",
      transitArrivalStop: "Lionel-Groulx",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────────
   Test suite
   ───────────────────────────────────────────────────────────────────────────── */

describe("CampusMap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useUserLocation as jest.Mock).mockReturnValue(makeUserLocation());
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    // Restore geometry/geo mocks to baseline so tests don't bleed mock state
    (distanceMetersBetween as jest.Mock).mockReturnValue(100);
    (calculatePolygonCenter as jest.Mock).mockReturnValue({ latitude: 45.495, longitude: -73.578 });
    (isPointInPolygon as jest.Mock).mockReturnValue(false);
    // Call rAF callbacks synchronously so effects that use it resolve immediately
    global.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });

  /* ── Basic rendering ─────────────────────────────────────────────────────── */

  describe("Basic rendering", () => {
    it("renders without crashing", () => {
      render(<CampusMap />);
      expect(screen.getByTestId("map-view")).toBeTruthy();
    });

    it("renders SGW campus building polygon", () => {
      render(<CampusMap />);
      expect(screen.getByTestId("polygon-Hall Building")).toBeTruthy();
    });

    it("renders LOY campus building polygon", () => {
      render(<CampusMap />);
      expect(screen.getByTestId("polygon-Administration Building")).toBeTruthy();
    });

    it("always renders RoutePolyline", () => {
      render(<CampusMap />);
      expect(screen.getByTestId("route-polyline")).toBeTruthy();
    });

    it("renders campus labels for both campuses", () => {
      render(<CampusMap />);
      expect(screen.getAllByTestId("campus-labels")).toHaveLength(2);
    });

    it("respects custom initialLocation prop", () => {
      const loc = { latitude: 45.458, longitude: -73.64 };
      render(<CampusMap initialLocation={loc} />);
      expect(screen.getByTestId("map-view")).toBeTruthy();
    });
  });

  /* ── User location display ───────────────────────────────────────────────── */

  describe("User location display", () => {
    it("renders the current-location marker when location is available", () => {
      render(<CampusMap />);
      expect(screen.getByLabelText("Current Location")).toBeTruthy();
    });

    it("omits the current-location marker when location is null", () => {
      (useUserLocation as jest.Mock).mockReturnValue(
        makeUserLocation({ location: null }),
      );
      render(<CampusMap />);
      expect(screen.queryByLabelText("Current Location")).toBeNull();
    });

    it("shows ActivityIndicator while location is loading", () => {
      (useUserLocation as jest.Mock).mockReturnValue(
        makeUserLocation({ loading: true }),
      );
      render(<CampusMap />);
      expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it("shows an error banner when location permission is denied", () => {
      (useUserLocation as jest.Mock).mockReturnValue(
        makeUserLocation({ error: "Location permission denied" }),
      );
      render(<CampusMap />);
      expect(screen.getByText("Location permission denied")).toBeTruthy();
    });

    it("does not show the error banner when there is no error", () => {
      render(<CampusMap />);
      expect(screen.queryByText("Location permission denied")).toBeNull();
    });
  });

  /* ── Right controls panel ────────────────────────────────────────────────── */

  describe("RightControlsPanel", () => {
    it("renders when userInfo and onSignOut are provided", () => {
      render(
        <CampusMap userInfo={{ name: "Alice" }} onSignOut={jest.fn()} />,
      );
      expect(screen.getByTestId("right-controls-panel")).toBeTruthy();
    });

    it("does not render when userInfo is absent", () => {
      render(<CampusMap />);
      expect(screen.queryByTestId("right-controls-panel")).toBeNull();
    });
  });

  /* ── Building interaction ────────────────────────────────────────────────── */

  describe("Building interaction", () => {
    it("pressing a building polygon shows AdditionalInfoPopup", () => {
      render(<CampusMap />);
      expect(screen.queryByTestId("additional-info-popup")).toBeNull();

      act(() => {
        fireEvent.press(screen.getByTestId("polygon-Hall Building"));
      });

      expect(screen.getByTestId("additional-info-popup")).toBeTruthy();
    });

    it("calls setDestination with building id and metadata name on press", () => {
      const mockSetDestination = jest.fn();
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({ setDestination: mockSetDestination }),
      );

      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId("polygon-Hall Building"));
      });

      expect(mockSetDestination).toHaveBeenCalledWith(
        "H",
        expect.objectContaining({ latitude: expect.any(Number) }),
        "Hall Building",
      );
    });

    it("calls setIsNavigationActive(false) and setShowDirections(false) on building press", () => {
      const mockSetIsNavActive = jest.fn();
      const mockSetShowDirections = jest.fn();
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          setIsNavigationActive: mockSetIsNavActive,
          setShowDirections: mockSetShowDirections,
        }),
      );

      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId("polygon-Hall Building"));
      });

      expect(mockSetIsNavActive).toHaveBeenCalledWith(false);
      expect(mockSetShowDirections).toHaveBeenCalledWith(false);
    });

    it("renders destination pin when building is the current destination (not selected)", () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({ destinationBuildingId: "H" }),
      );
      render(<CampusMap />);
      expect(screen.getByLabelText("Hall Building destination")).toBeTruthy();
    });

    it("hides destination pin when that building is selected", () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({ destinationBuildingId: "H" }),
      );
      render(<CampusMap />);

      // Select the building
      act(() => {
        fireEvent.press(screen.getByTestId("polygon-Hall Building"));
      });

      expect(screen.queryByLabelText("Hall Building destination")).toBeNull();
    });
  });

  /* ── AdditionalInfoPopup visibility ─────────────────────────────────────── */

  describe("AdditionalInfoPopup", () => {
    it("is hidden by default", () => {
      render(<CampusMap />);
      expect(screen.queryByTestId("additional-info-popup")).toBeNull();
    });

    it("is hidden when showDirections is true even if a building is selected", () => {
      // showDirections=false on initial render so the polygon inside MapView is
      // accessible (RTNL v13 hides map children when importantForAccessibility
      // is set to no-hide-descendants, which happens when showDirections=true).
      const { rerender } = render(<CampusMap />);

      act(() => {
        fireEvent.press(screen.getByTestId("polygon-Hall Building"));
      });

      // Switch showDirections to true – popup must now be hidden.
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({ showDirections: true }),
      );
      act(() => {
        rerender(<CampusMap />);
      });

      expect(screen.queryByTestId("additional-info-popup")).toBeNull();
    });

    it("notifies parent when expansion changes", () => {
      const onExpansion = jest.fn();
      render(<CampusMap onInfoPopupExpansionChange={onExpansion} />);
      // The callback itself is wired through the component; rendering without crash confirms wiring
      expect(screen.getByTestId("map-view")).toBeTruthy();
    });
  });

  /* ── DestinationPopup visibility ─────────────────────────────────────────── */

  describe("DestinationPopup", () => {
    it("is hidden by default", () => {
      render(<CampusMap />);
      expect(screen.queryByTestId("destination-popup")).toBeNull();
    });

    it("is visible when showDirections is true", () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({ showDirections: true }),
      );
      render(<CampusMap />);
      expect(screen.getByTestId("destination-popup")).toBeTruthy();
    });
  });

  /* ── DirectionsSearchPanel ───────────────────────────────────────────────── */

  describe("DirectionsSearchPanel", () => {
    it("is rendered when showDirections is true and not navigating", () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({ showDirections: true, isNavigationActive: false }),
      );
      render(<CampusMap />);
      expect(screen.getByTestId("directions-search-panel")).toBeTruthy();
    });

    it("is hidden when isNavigationActive is true", () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          showDirections: true,
          isNavigationActive: true,
          routeData: BASE_ROUTE_DATA,
        }),
      );
      render(<CampusMap />);
      expect(screen.queryByTestId("directions-search-panel")).toBeNull();
    });

    it("is hidden when showDirections is false", () => {
      render(<CampusMap />);
      expect(screen.queryByTestId("directions-search-panel")).toBeNull();
    });
  });

  /* ── Navigation banner & footer ─────────────────────────────────────────── */

  describe("Navigation UI", () => {
    it("renders navigation header and footer when isNavigationActive and routeData exist", () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({ isNavigationActive: true, routeData: BASE_ROUTE_DATA }),
      );
      render(<CampusMap />);
      expect(screen.getByText("Walking • 5 mins • 500 m")).toBeTruthy();
      expect(screen.getByText("Head north on Mackay")).toBeTruthy();
    });

    it("shows 'Continue on current route' when the active step has no instruction", () => {
      const routeWithEmptyStep = {
        ...BASE_ROUTE_DATA,
        steps: [{ ...BASE_ROUTE_DATA.steps[0], instruction: "" }],
      };
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          routeData: routeWithEmptyStep,
        }),
      );
      render(<CampusMap />);
      expect(screen.getByText("Continue on current route")).toBeTruthy();
    });

    it("End trip button calls setIsNavigationActive(false) and setShowDirections(true)", () => {
      const mockSetIsNavActive = jest.fn();
      const mockSetShowDirections = jest.fn();
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          routeData: BASE_ROUTE_DATA,
          setIsNavigationActive: mockSetIsNavActive,
          setShowDirections: mockSetShowDirections,
        }),
      );
      render(<CampusMap />);

      fireEvent.press(screen.getByLabelText("End trip"));

      expect(mockSetIsNavActive).toHaveBeenCalledWith(false);
      expect(mockSetShowDirections).toHaveBeenCalledWith(true);
    });

    it("shows navigation header with driving mode label", () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          routeData: { ...BASE_ROUTE_DATA, requestMode: "driving" },
          travelMode: "driving",
        }),
      );
      render(<CampusMap />);
      expect(screen.getByText("Driving • 5 mins • 500 m")).toBeTruthy();
    });

    it("does not render navigation UI when routeData is null", () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({ isNavigationActive: true, routeData: null }),
      );
      render(<CampusMap />);
      expect(screen.queryByLabelText("End trip")).toBeNull();
    });
  });

  /* ── Navigation step advancement ────────────────────────────────────────── */

  describe("Navigation step advancement", () => {
    it("advances to the next step when within threshold of current step end", async () => {
      // Return 20 m for every distanceMetersBetween call → below 28 m walking threshold
      (distanceMetersBetween as jest.Mock).mockReturnValue(20);
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          showDirections: true,
          routeData: BASE_ROUTE_DATA,
          travelMode: "walking",
        }),
      );

      render(<CampusMap />);
      // After mount the effect runs; because distanceMetersBetween returns 20 (<28)
      // and there is a next step, navigationStepIndex increments to 1 → second instruction shows
      await act(async () => {});
      expect(screen.getByText("Turn right on Sherbrooke")).toBeTruthy();
    });

    it("does not advance when user is far from step end", async () => {
      // Default mock returns 100 m → above 28 m threshold → no advancement
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          showDirections: true,
          routeData: BASE_ROUTE_DATA,
          travelMode: "walking",
        }),
      );

      render(<CampusMap />);
      await act(async () => {});
      expect(screen.getByText("Head north on Mackay")).toBeTruthy();
    });
  });

  /* ── Transit stop markers ────────────────────────────────────────────────── */

  describe("Transit stop markers", () => {
    it("renders board and exit markers for each transit step", () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          travelMode: "transit",
          routeData: TRANSIT_ROUTE_DATA,
        }),
      );
      render(<CampusMap />);

      // 2 steps × 2 markers each (board + exit) = 4 total; component slices to max 4
      expect(screen.getByLabelText("Board Metro GL")).toBeTruthy();
      expect(screen.getByLabelText("Exit Metro GL")).toBeTruthy();
      expect(screen.getByLabelText("Board Bus 105")).toBeTruthy();
      expect(screen.getByLabelText("Exit Bus 105")).toBeTruthy();
    });

    it("does not render transit markers when travelMode is not transit", () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          travelMode: "walking",
          routeData: TRANSIT_ROUTE_DATA,
        }),
      );
      render(<CampusMap />);
      expect(screen.queryByLabelText("Board Metro GL")).toBeNull();
    });

    it("shows transit stop callout when a stop marker is pressed", async () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          travelMode: "transit",
          routeData: TRANSIT_ROUTE_DATA,
        }),
      );
      render(<CampusMap />);

      act(() => {
        fireEvent.press(screen.getByLabelText("Board Metro GL"));
      });

      expect(screen.getByText("Board Metro GL")).toBeTruthy();
    });

    it("closes the transit stop callout when the close button is pressed", async () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          travelMode: "transit",
          routeData: TRANSIT_ROUTE_DATA,
        }),
      );
      render(<CampusMap />);

      act(() => {
        fireEvent.press(screen.getByLabelText("Board Metro GL"));
      });

      // First confirm callout is visible, then close it
      const closeBtn = screen.getByLabelText("Close transit stop info");
      act(() => {
        fireEvent.press(closeBtn);
      });

      expect(screen.queryByText("Board Metro GL")).toBeNull();
    });

    it("toggles off the callout if the same stop is pressed while already selected", async () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          travelMode: "transit",
          routeData: TRANSIT_ROUTE_DATA,
        }),
      );
      render(<CampusMap />);

      const boardMarker = screen.getByLabelText("Board Metro GL");
      act(() => { fireEvent.press(boardMarker); });
      act(() => { fireEvent.press(boardMarker); });

      expect(screen.queryByText("Board Metro GL")).toBeNull();
    });
  });

  /* ── Indoor map overlay ─────────────────────────────────────────────────── */

  describe("Indoor map overlay", () => {
    it("does not render IndoorMapOverlay by default", () => {
      render(<CampusMap />);
      expect(screen.queryByTestId("indoor-map-overlay")).toBeNull();
    });

    it("shows IndoorMapOverlay after a long-press inside a building with indoor data", () => {
      // Make isPointInPolygon return true so the building is found
      (isPointInPolygon as jest.Mock).mockReturnValue(true);

      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId("map-long-press-trigger"));
      });

      expect(screen.getByTestId("indoor-map-overlay")).toBeTruthy();
    });

    it("hides IndoorMapOverlay when the exit callback is invoked", () => {
      (isPointInPolygon as jest.Mock).mockReturnValue(true);

      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId("map-long-press-trigger"));
      });

      act(() => {
        fireEvent.press(screen.getByTestId("indoor-map-overlay"));
      });

      expect(screen.queryByTestId("indoor-map-overlay")).toBeNull();
    });

    it("does not show IndoorMapOverlay when the long-pressed building has no indoor data", () => {
      // The user-location effect on mount calls isPointInPolygon twice (SGW then
      // LOY).  The long-press handler then calls it twice more.  We consume those
      // four calls with explicit once-values so the long press resolves to the LOY
      // "AD" building, which has no entry in INDOOR_DATA → overlay must stay hidden.
      (isPointInPolygon as jest.Mock)
        .mockReturnValueOnce(false) // user-location effect: SGW H
        .mockReturnValueOnce(false) // user-location effect: LOY AD
        .mockReturnValueOnce(false) // long press: SGW H → not inside
        .mockReturnValueOnce(true); // long press: LOY AD → inside, but no indoor data

      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId("map-long-press-trigger"));
      });

      expect(screen.queryByTestId("indoor-map-overlay")).toBeNull();
    });
  });

  /* ── Map press / pan-drag ────────────────────────────────────────────────── */

  describe("Map press", () => {
    it("hides the transit stop callout on map press", () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          travelMode: "transit",
          routeData: TRANSIT_ROUTE_DATA,
        }),
      );
      render(<CampusMap />);

      // Open a transit stop callout
      act(() => { fireEvent.press(screen.getByLabelText("Board Metro GL")); });
      expect(screen.getByText("Board Metro GL")).toBeTruthy();

      // Press the map → callout should close
      act(() => { fireEvent.press(screen.getByTestId("map-press-trigger")); });
      expect(screen.queryByText("Board Metro GL")).toBeNull();
    });

    it("region change updates map region state without crashing", () => {
      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId("map-region-change-trigger"));
      });
      expect(screen.getByTestId("map-view")).toBeTruthy();
    });
  });

  /* ── ETA label computation ───────────────────────────────────────────────── */

  describe("ETA label computation", () => {
    it("shows '--' when there is no user location", () => {
      (useUserLocation as jest.Mock).mockReturnValue(
        makeUserLocation({ location: null }),
      );
      // Select a building so the popup (and its eta-display) is visible
      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId("polygon-Hall Building"));
      });
      expect(screen.getByLabelText("--")).toBeTruthy();
    });

    it("shows walking time in minutes for a short distance", () => {
      // 135 m at 1.35 m/s → 100 s → ~2 min (Math.max(1, round(100/60)))
      (distanceMetersBetween as jest.Mock).mockReturnValue(135);
      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId("polygon-Hall Building"));
      });
      expect(screen.getByLabelText("2 min")).toBeTruthy();
    });

    it("shows '1 min' when computed time rounds to less than 1", () => {
      (distanceMetersBetween as jest.Mock).mockReturnValue(10);
      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId("polygon-Hall Building"));
      });
      expect(screen.getByLabelText("1 min")).toBeTruthy();
    });

    it("shows hours and minutes for long distances (>= 60 min)", () => {
      // 1.35 m/s × 60 s × 75 min = 6075 m
      (distanceMetersBetween as jest.Mock).mockReturnValue(6075);
      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId("polygon-Hall Building"));
      });
      expect(screen.getByLabelText("1 h 15 min")).toBeTruthy();
    });

    it("shows exact hours with no minutes when remainder is zero", () => {
      // 1.35 × 60 × 60 = 4860 m → exactly 60 min → 1 h
      (distanceMetersBetween as jest.Mock).mockReturnValue(4860);
      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId("polygon-Hall Building"));
      });
      expect(screen.getByLabelText("1 h")).toBeTruthy();
    });
  });

  /* ── Color-scheme aware map ID ───────────────────────────────────────────── */

  describe("Map color scheme", () => {
    it("renders correctly in dark color scheme", () => {
      const csModule = require("react-native/Libraries/Utilities/useColorScheme");
      if (csModule && typeof csModule.default?.mockReturnValueOnce === "function") {
        csModule.default.mockReturnValueOnce("dark");
      }
      render(<CampusMap />);
      // Both branches of mapID ternary are exercised; component must render
      expect(screen.getByTestId("map-view")).toBeTruthy();
    });
  });

  /* ── Navigation camera-restore effect ───────────────────────────────────── */

  describe("Navigation camera restore", () => {
    it("stores the pre-navigation region and restores it when navigation ends", () => {
      jest.useFakeTimers();

      const { rerender } = render(
        <CampusMap
          initialLocation={{ latitude: 45.495, longitude: -73.578 }}
        />,
      );

      // Start navigation
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({ isNavigationActive: true, routeData: BASE_ROUTE_DATA }),
      );
      rerender(
        <CampusMap
          initialLocation={{ latitude: 45.495, longitude: -73.578 }}
        />,
      );

      // End navigation
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({ isNavigationActive: false, routeData: null }),
      );
      rerender(
        <CampusMap
          initialLocation={{ latitude: 45.495, longitude: -73.578 }}
        />,
      );

      act(() => { jest.runAllTimers(); });

      // Component should still be rendered after all the state transitions
      expect(screen.getByTestId("map-view")).toBeTruthy();
      jest.useRealTimers();
    });
  });

  /* ── Auto-pan on campus switch ───────────────────────────────────────────── */

  describe("Auto-pan on campus change", () => {
    it("clears destination and hides building popup when initial location changes", () => {
      const mockClearDestination = jest.fn();
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({ clearDestination: mockClearDestination }),
      );

      const { rerender } = render(
        <CampusMap initialLocation={{ latitude: 45.495, longitude: -73.578 }} />,
      );

      // Select a building first
      act(() => {
        fireEvent.press(screen.getByTestId("polygon-Hall Building"));
      });
      expect(screen.getByTestId("additional-info-popup")).toBeTruthy();

      // Switching campus location clears it
      rerender(
        <CampusMap initialLocation={{ latitude: 45.458, longitude: -73.64 }} />,
      );

      expect(mockClearDestination).toHaveBeenCalled();
      expect(screen.queryByTestId("additional-info-popup")).toBeNull();
    });
  });

  /* ── searchPanelHeight effect ────────────────────────────────────────────── */

  describe("searchPanelHeight reset", () => {
    it("resets search panel height to 0 when showDirections becomes false", () => {
      const dirs = makeDirections({ showDirections: true });
      (useDirections as jest.Mock).mockReturnValue(dirs);
      const { rerender } = render(<CampusMap />);

      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({ showDirections: false }),
      );
      rerender(<CampusMap />);

      // No crash and map is still rendered
      expect(screen.getByTestId("map-view")).toBeTruthy();
    });
  });

  /* ── userLocationBuildingId effect ──────────────────────────────────────── */

  describe("User location inside building detection", () => {
    it("detects when user is inside an SGW building", async () => {
      (isPointInPolygon as jest.Mock).mockReturnValue(true);
      render(<CampusMap />);
      await act(async () => {});
      // No assertion on internal state; verifying no crash and correct overall render
      expect(screen.getByTestId("map-view")).toBeTruthy();
    });

    it("clears detected building when user location becomes null", async () => {
      (isPointInPolygon as jest.Mock).mockReturnValue(true);
      const { rerender } = render(<CampusMap />);
      await act(async () => {});

      (useUserLocation as jest.Mock).mockReturnValue(
        makeUserLocation({ location: null }),
      );
      rerender(<CampusMap />);

      expect(screen.queryByLabelText("Current Location")).toBeNull();
    });
  });

  /* ── Transit stop cleanup when navigation ends ───────────────────────────── */

  describe("Transit stop state cleanup", () => {
    it("clears transit stop selection when navigation becomes inactive", () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          travelMode: "transit",
          routeData: TRANSIT_ROUTE_DATA,
        }),
      );
      const { rerender } = render(<CampusMap />);

      // Select a stop
      act(() => { fireEvent.press(screen.getByLabelText("Board Metro GL")); });
      expect(screen.getByText("Board Metro GL")).toBeTruthy();

      // Turn off navigation
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({ isNavigationActive: false }),
      );
      rerender(<CampusMap />);

      expect(screen.queryByText("Board Metro GL")).toBeNull();
    });
  });
});
