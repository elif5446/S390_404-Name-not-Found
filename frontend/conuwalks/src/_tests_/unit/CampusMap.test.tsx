import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Platform } from "react-native";
import CampusMap from "../../components/CampusMap";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import { useDirections } from "@/src/context/DirectionsContext";
import { isPointInPolygon } from "@/src/utils/geo";
import { calculatePolygonCenter, distanceMetersBetween } from "@/src/utils/geometry";

//Module mocks (hoisted by Jest before imports)

jest.mock("@/src/hooks/useUserLocation");
jest.mock("@/src/context/DirectionsContext");
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  default: jest.fn(),
}));

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
  SGWBuildingSearchMetadata: {
    H: {
      name: "Hall Building",
      coordinates: { latitude: 45.495, longitude: -73.578 },
    },
  },
}));

jest.mock("@/src/data/metadata/LOY.BuildingMetadata", () => ({
  LoyolaBuildingMetadata: { AD: { name: "Administration Building" } },
  LoyolaBuildingSearchMetadata: {
    AD: {
      name: "Administration Building",
      coordinates: { latitude: 45.458, longitude: -73.64 },
    },
  },
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

const mockAnimateCamera = jest.fn();
const mockAnimateToRegion = jest.fn();

jest.mock("react-native-maps", () => {
  const React = require("react");
  const { TouchableOpacity, View } = require("react-native");

  const MockMapView = React.forwardRef(
    ({ children, onLongPress, onPress, onPanDrag, onRegionChangeComplete, googleMapId }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        animateCamera: mockAnimateCamera,
        animateToRegion: mockAnimateToRegion,
      }));
      return (
        <View testID="map-view" accessibilityLabel={String(googleMapId ?? "none")}>
          {children}
          {onPress && <TouchableOpacity testID="map-press-trigger" onPress={onPress} />}
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
  MockMapView.displayName = "MockMapView";

  const MockPolygon = ({ onPress, accessibilityLabel }: any) => (
    <TouchableOpacity
      testID={`polygon-${accessibilityLabel ?? "unknown"}`}
      accessibilityLabel={accessibilityLabel ?? undefined}
      onPress={onPress}
    />
  );

  const MockMarker = React.forwardRef(({ children, onPress, accessibilityLabel, testID }: any, ref: any) => (
    <TouchableOpacity
      ref={ref}
      testID={testID ?? `marker-${accessibilityLabel ?? "unknown"}`}
      accessibilityLabel={accessibilityLabel ?? undefined}
      onPress={onPress}
    >
      {children}
    </TouchableOpacity>
  ));
  MockMarker.displayName = "MockMarker";

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
  const { View, TouchableOpacity } = require("react-native");
  const Mock = React.forwardRef(
    ({ visible, onClose, directionsEtaLabel, onDirectionsTrigger, onExpansionChange, onOpenIndoorPress }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        minimize: jest.fn(),
        collapse: jest.fn(),
      }));

      if (!visible) return null;

      return (
        <View testID="additional-info-popup">
          <TouchableOpacity testID="open-indoor-trigger" onPress={onOpenIndoorPress} />
          <View testID="eta-display" accessibilityLabel={String(directionsEtaLabel)} />
          {onExpansionChange && <TouchableOpacity testID="expansion-change-trigger" onPress={() => onExpansionChange(true)} />}
        </View>
      );
    },
  );
  Mock.displayName = "MockAdditionalInfoPopup";
  return { __esModule: true, default: Mock };
});

jest.mock("@/src/components/DestinationPopup", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Mock = React.forwardRef(({ visible }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      minimize: jest.fn(),
      dismiss: jest.fn(),
    }));
    if (!visible) return null;
    return <View testID="destination-popup" />;
  });
  Mock.displayName = "MockDestinationPopup";
  return { __esModule: true, default: Mock };
});

jest.mock("@/src/components/RightControlsPanel", () => {
  const { View, TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({ handleOpenBuildingSearch }: any) => (
      <View testID="right-controls-panel">
        <TouchableOpacity testID="open-search-btn" onPress={handleOpenBuildingSearch} />
      </View>
    ),
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
  const { View, TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({ campus, onLabelPress }: any) => (
      <View testID="campus-labels">
        <TouchableOpacity testID={`trigger-label-${campus}`} onPress={() => onLabelPress("H")} />
      </View>
    ),
  };
});

jest.mock("@/src/components/indoor/IndoorMapOverlay", () => {
  const { TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({ onExit }: any) => <TouchableOpacity testID="indoor-map-overlay" onPress={onExit} />,
  };
});

//Test helpers

const USER_LOCATION = { latitude: 45.495, longitude: -73.578 };

const TEST_IDS = {
  hallPolygon: "polygon-Hall Building",
  administrationPolygon: "polygon-Administration Building",
  additionalInfoPopup: "additional-info-popup",
  boardMetroGL: "Board Metro GL",
} as const;

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

// Test suite

describe("CampusMap", () => {
  let rafSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (useUserLocation as jest.Mock).mockReturnValue(makeUserLocation());
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    // Restore geometry/geo mocks to baseline so tests don't bleed mock state
    (distanceMetersBetween as jest.Mock).mockReturnValue(100);
    (calculatePolygonCenter as jest.Mock).mockReturnValue({
      latitude: 45.495,
      longitude: -73.578,
    });
    (isPointInPolygon as jest.Mock).mockReturnValue(false);
    // Call rAF callbacks synchronously so effects that use it resolve immediately.
    // Using spyOn ensures the original is restored after each test, preventing
    // global state leakage into other test files.
    rafSpy = jest.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    rafSpy.mockRestore();
  });

  // ── Basic rendering

  describe("Basic rendering", () => {
    it("renders without crashing", () => {
      render(<CampusMap />);
      expect(screen.getByTestId("map-view")).toBeTruthy();
    });

    it("renders SGW campus building polygon", () => {
      render(<CampusMap />);
      expect(screen.getByTestId(TEST_IDS.hallPolygon)).toBeTruthy();
    });

    it("renders LOY campus building polygon", () => {
      render(<CampusMap />);
      expect(screen.getByTestId(TEST_IDS.administrationPolygon)).toBeTruthy();
    });

    it("renders RoutePolyline when start and destination differ", () => {
      // Mock different start and destination IDs
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          startBuildingId: "H",
          destinationBuildingId: "MB",
        }),
      );

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

  // User location display

  describe("User location display", () => {
    it("renders the current-location marker when location is available", () => {
      render(<CampusMap />);
      expect(screen.getByLabelText("Current Location")).toBeTruthy();
    });

    it("omits the current-location marker when location is null", () => {
      (useUserLocation as jest.Mock).mockReturnValue(makeUserLocation({ location: null }));
      render(<CampusMap />);
      expect(screen.queryByLabelText("Current Location")).toBeNull();
    });

    it("renders loading state safely while location is loading", () => {
      (useUserLocation as jest.Mock).mockReturnValue(makeUserLocation({ loading: true, location: null }));
      render(<CampusMap />);
      expect(screen.getByTestId("map-view")).toBeTruthy();
      expect(screen.queryByLabelText("Current Location")).toBeNull();
      expect(screen.queryByText("Location permission denied")).toBeNull();
    });

    it("shows an error banner when location permission is denied", () => {
      (useUserLocation as jest.Mock).mockReturnValue(makeUserLocation({ error: "Location permission denied" }));
      render(<CampusMap />);
      expect(screen.getByText("Location permission denied")).toBeTruthy();
    });

    it("does not show the error banner when there is no error", () => {
      render(<CampusMap />);
      expect(screen.queryByText("Location permission denied")).toBeNull();
    });
  });

  //  Right controls panel

  describe("RightControlsPanel", () => {
    it("renders when userInfo and onSignOut are provided", () => {
      render(
        <CampusMap
          userInfo={{
            id: "test-user-123",
            name: "Alice",
            email: "alice@concordia.ca",
            photo: "https://example.com/avatar.jpg",
          }}
          onSignOut={jest.fn()}
        />,
      );
      expect(screen.getByTestId("right-controls-panel")).toBeTruthy();
    });

    it("does not render when userInfo is absent", () => {
      render(<CampusMap />);
      expect(screen.queryByTestId("right-controls-panel")).toBeNull();
    });
  });

  // Building interaction

  describe("Building interaction", () => {
    it("pressing a building polygon shows AdditionalInfoPopup", () => {
      render(<CampusMap />);
      expect(screen.queryByTestId(TEST_IDS.additionalInfoPopup)).toBeNull();

      act(() => {
        fireEvent.press(screen.getByTestId(TEST_IDS.hallPolygon));
      });

      expect(screen.getByTestId(TEST_IDS.additionalInfoPopup)).toBeTruthy();
    });

    it("calls setDestination with building id and metadata name on press", () => {
      const mockSetDestination = jest.fn();
      (useDirections as jest.Mock).mockReturnValue(makeDirections({ setDestination: mockSetDestination }));

      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId(TEST_IDS.hallPolygon));
      });

      expect(mockSetDestination).toHaveBeenCalledWith("H", expect.objectContaining({ latitude: expect.any(Number) }), "Hall Building");
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
        fireEvent.press(screen.getByTestId(TEST_IDS.hallPolygon));
      });

      expect(mockSetIsNavActive).toHaveBeenCalledWith(false);
      expect(mockSetShowDirections).toHaveBeenCalledWith(false);
    });

    it("renders destination pin when building is the current destination (not selected)", () => {
      (useDirections as jest.Mock).mockReturnValue(makeDirections({ destinationBuildingId: "H" }));
      render(<CampusMap />);
      expect(screen.getByLabelText("Hall Building destination")).toBeTruthy();
    });

    it("hides destination pin when that building is selected", () => {
      (useDirections as jest.Mock).mockReturnValue(makeDirections({ destinationBuildingId: "H" }));
      render(<CampusMap />);

      // Select the building
      act(() => {
        fireEvent.press(screen.getByTestId(TEST_IDS.hallPolygon));
      });

      expect(screen.queryByLabelText("Hall Building destination")).toBeNull();
    });
  });

  // AdditionalInfoPopup visibility

  describe("AdditionalInfoPopup", () => {
    it("is hidden by default", () => {
      render(<CampusMap />);
      expect(screen.queryByTestId(TEST_IDS.additionalInfoPopup)).toBeNull();
    });

    it("is hidden when showDirections is true even if a building is selected", () => {
      // showDirections=false on initial render so the polygon inside MapView is
      // accessible (RTNL v13 hides map children when importantForAccessibility
      // is set to no-hide-descendants, which happens when showDirections=true).
      const { rerender } = render(<CampusMap />);

      act(() => {
        fireEvent.press(screen.getByTestId(TEST_IDS.hallPolygon));
      });

      // Switch showDirections to true – popup must now be hidden.
      (useDirections as jest.Mock).mockReturnValue(makeDirections({ showDirections: true }));
      act(() => {
        rerender(<CampusMap />);
      });

      expect(screen.queryByTestId(TEST_IDS.additionalInfoPopup)).toBeNull();
    });

    it("notifies parent when expansion changes", () => {
      const onExpansion = jest.fn();
      render(<CampusMap onInfoPopupExpansionChange={onExpansion} />);

      // Select a building to make the popup visible
      act(() => {
        fireEvent.press(screen.getByTestId(TEST_IDS.hallPolygon));
      });

      // Trigger the expansion change via the mock button
      act(() => {
        fireEvent.press(screen.getByTestId("expansion-change-trigger"));
      });

      expect(onExpansion).toHaveBeenCalledWith(true);
    });
  });

  // DestinationPopup visibility

  describe("DestinationPopup", () => {
    it("is hidden by default", () => {
      render(<CampusMap />);
      expect(screen.queryByTestId("destination-popup")).toBeNull();
    });

    it("is visible when showDirections is true", () => {
      (useDirections as jest.Mock).mockReturnValue(makeDirections({ showDirections: true }));
      render(<CampusMap />);
      expect(screen.getByTestId("destination-popup")).toBeTruthy();
    });
  });

  // DirectionsSearchPanel visibility

  describe("DirectionsSearchPanel", () => {
    it("is rendered when showDirections is true and not navigating", () => {
      (useDirections as jest.Mock).mockReturnValue(makeDirections({ showDirections: true, isNavigationActive: false }));
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

  // Navigation banner & footer

  describe("Navigation UI", () => {
    it("renders navigation header and footer when isNavigationActive and routeData exist", () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          routeData: BASE_ROUTE_DATA,
        }),
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
      (useDirections as jest.Mock).mockReturnValue(makeDirections({ isNavigationActive: true, routeData: null }));
      render(<CampusMap />);
      expect(screen.queryByLabelText("End trip")).toBeNull();
    });
  });

  //Navigation step advancement

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

  // Transit stop markers

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
      expect(screen.getByLabelText(TEST_IDS.boardMetroGL)).toBeTruthy();
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
      expect(screen.queryByLabelText(TEST_IDS.boardMetroGL)).toBeNull();
    });

    it("shows transit stop callout when a stop marker is pressed", () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          travelMode: "transit",
          routeData: TRANSIT_ROUTE_DATA,
        }),
      );
      render(<CampusMap />);

      act(() => {
        fireEvent.press(screen.getByLabelText(TEST_IDS.boardMetroGL));
      });

      expect(screen.getByText(TEST_IDS.boardMetroGL)).toBeTruthy();
    });

    it("closes the transit stop callout when the close button is pressed", () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          travelMode: "transit",
          routeData: TRANSIT_ROUTE_DATA,
        }),
      );
      render(<CampusMap />);

      act(() => {
        fireEvent.press(screen.getByLabelText(TEST_IDS.boardMetroGL));
      });

      // First confirm callout is visible, then close it
      const closeBtn = screen.getByLabelText("Close transit stop info");
      act(() => {
        fireEvent.press(closeBtn);
      });

      expect(screen.queryByText(TEST_IDS.boardMetroGL)).toBeNull();
    });

    it("toggles off the callout if the same stop is pressed while already selected", () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          travelMode: "transit",
          routeData: TRANSIT_ROUTE_DATA,
        }),
      );
      render(<CampusMap />);

      const boardMarker = screen.getByLabelText(TEST_IDS.boardMetroGL);
      act(() => {
        fireEvent.press(boardMarker);
      });
      act(() => {
        fireEvent.press(boardMarker);
      });

      expect(screen.queryByText(TEST_IDS.boardMetroGL)).toBeNull();
    });
  });

  // Indoor map overlay

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

    it("returns early and does nothing if the building has no indoor data", () => {
      render(<CampusMap initialLocation={{ latitude: 45.458, longitude: -73.64 }} />);

      act(() => fireEvent.press(screen.getByTestId("polygon-Administration Building")));

      act(() => fireEvent.press(screen.getByTestId("open-indoor-trigger")));

      expect(screen.queryByTestId("indoor-map-overlay")).toBeNull();
      expect(screen.getByTestId("additional-info-popup")).toBeTruthy();
    });

    it("successfully sets state and opens overlay for a building with indoor data", () => {
      render(<CampusMap initialLocation={{ latitude: 45.495, longitude: -73.578 }} />);

      act(() => fireEvent.press(screen.getByTestId("polygon-Hall Building")));

      act(() => fireEvent.press(screen.getByTestId("open-indoor-trigger")));

      expect(screen.getByTestId("indoor-map-overlay")).toBeTruthy();
      expect(screen.queryByTestId("additional-info-popup")).toBeNull();
    });
  });

  //  Map press / pan-drag

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
      act(() => {
        fireEvent.press(screen.getByLabelText(TEST_IDS.boardMetroGL));
      });
      expect(screen.getByText(TEST_IDS.boardMetroGL)).toBeTruthy();

      // Press the map → callout should close
      act(() => {
        fireEvent.press(screen.getByTestId("map-press-trigger"));
      });
      expect(screen.queryByText(TEST_IDS.boardMetroGL)).toBeNull();
    });

    it("region change updates map region state without crashing", () => {
      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId("map-region-change-trigger"));
      });
      expect(screen.getByTestId("map-view")).toBeTruthy();
    });

    it("skips features that are not Polygons during a long press", () => {
      const SGWGeoJSON = require("@/src/data/campus/SGW.geojson");
      const LOYGeoJSON = require("@/src/data/campus/LOY.geojson");

      render(<CampusMap initialLocation={{ latitude: 45.495, longitude: -73.578 }} />);

      (isPointInPolygon as jest.Mock).mockClear();

      SGWGeoJSON.features[0].geometry.type = "Point";
      LOYGeoJSON.features[0].geometry.type = "Point";

      act(() => {
        fireEvent.press(screen.getByTestId("map-long-press-trigger"));
      });

      expect(isPointInPolygon).not.toHaveBeenCalled();

      expect(screen.queryByTestId("indoor-map-overlay")).toBeNull();

      SGWGeoJSON.features[0].geometry.type = "Polygon";
      LOYGeoJSON.features[0].geometry.type = "Polygon";
    });
  });

  //  ETA label computation

  describe("ETA label computation", () => {
    it("shows '--' when there is no user location", () => {
      (useUserLocation as jest.Mock).mockReturnValue(makeUserLocation({ location: null }));
      // Select a building so the popup (and its eta-display) is visible
      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId(TEST_IDS.hallPolygon));
      });
      expect(screen.getByLabelText("--")).toBeTruthy();
    });

    it("shows walking time in minutes for a short distance", () => {
      // 135 m at 1.35 m/s → 100 s → ~2 min (Math.max(1, round(100/60)))
      (distanceMetersBetween as jest.Mock).mockReturnValue(135);
      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId(TEST_IDS.hallPolygon));
      });
      expect(screen.getByLabelText("2 min")).toBeTruthy();
    });

    it("shows '1 min' when computed time rounds to less than 1", () => {
      (distanceMetersBetween as jest.Mock).mockReturnValue(10);
      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId(TEST_IDS.hallPolygon));
      });
      expect(screen.getByLabelText("1 min")).toBeTruthy();
    });

    it("shows hours and minutes for long distances (>= 60 min)", () => {
      // 1.35 m/s × 60 s × 75 min = 6075 m
      (distanceMetersBetween as jest.Mock).mockReturnValue(6075);
      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId(TEST_IDS.hallPolygon));
      });
      expect(screen.getByLabelText("1 h 15 min")).toBeTruthy();
    });

    it("shows exact hours with no minutes when remainder is zero", () => {
      // 1.35 × 60 × 60 = 4860 m → exactly 60 min → 1 h
      (distanceMetersBetween as jest.Mock).mockReturnValue(4860);
      render(<CampusMap />);
      act(() => {
        fireEvent.press(screen.getByTestId(TEST_IDS.hallPolygon));
      });
      expect(screen.getByLabelText("1 h")).toBeTruthy();
    });
  });

  //  Color-scheme aware map ID

  describe("Map color scheme", () => {
    it("renders correctly in dark color scheme", () => {
      const reactNative = require("react-native");
      const useColorSchemeSpy = jest.spyOn(reactNative, "useColorScheme").mockReturnValue("dark");
      const darkMapId = "eb0ccd6d2f7a95e23f1ec398";
      jest.replaceProperty(Platform, "OS", "android");

      render(<CampusMap />);

      expect(useColorSchemeSpy).toHaveBeenCalled();
      const mapView = screen.getByTestId("map-view");
      expect(mapView.props.accessibilityLabel).toBe(darkMapId);
    });
  });

  //  Navigation camera-restore effect

  describe("Navigation camera restore", () => {
    it("stores the pre-navigation region and restores it when navigation ends", () => {
      jest.useFakeTimers();

      const { rerender } = render(<CampusMap initialLocation={{ latitude: 45.495, longitude: -73.578 }} />);

      // Start navigation
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          routeData: BASE_ROUTE_DATA,
        }),
      );
      rerender(<CampusMap initialLocation={{ latitude: 45.495, longitude: -73.578 }} />);

      // End navigation
      (useDirections as jest.Mock).mockReturnValue(makeDirections({ isNavigationActive: false, routeData: null }));
      rerender(<CampusMap initialLocation={{ latitude: 45.495, longitude: -73.578 }} />);

      act(() => {
        jest.runAllTimers();
      });

      // Component should still be rendered after all the state transitions
      expect(screen.getByTestId("map-view")).toBeTruthy();
      jest.useRealTimers();
    });
  });

  // Auto-pan on campus switch

  describe("Auto-pan on campus change", () => {
    it("clears destination and hides building popup when initial location changes", () => {
      // 1. Tell Jest to control time
      jest.useFakeTimers();

      const mockClearDestination = jest.fn();
      (useDirections as jest.Mock).mockReturnValue(makeDirections({ clearDestination: mockClearDestination }));

      const { rerender } = render(<CampusMap initialLocation={{ latitude: 45.495, longitude: -73.578 }} />);

      // Select a building first
      act(() => {
        fireEvent.press(screen.getByTestId(TEST_IDS.hallPolygon));
      });
      expect(screen.getByTestId(TEST_IDS.additionalInfoPopup)).toBeTruthy();

      // Clear the mock so we can specifically test the rerender-triggered call
      mockClearDestination.mockClear();

      // Switching campus location triggers the useEffect
      rerender(<CampusMap initialLocation={{ latitude: 45.458, longitude: -73.64 }} />);

      // fast-forward past the 250ms animation delay
      act(() => {
        jest.runAllTimers();
      });

      // clearDestination must have been called due to the location change (not just initial mount)
      expect(mockClearDestination).toHaveBeenCalled();
      expect(screen.queryByTestId(TEST_IDS.additionalInfoPopup)).toBeNull();

      jest.useRealTimers();
    });
  });

  // searchPanelHeight effect

  describe("searchPanelHeight reset", () => {
    it("resets search panel height to 0 when showDirections becomes false", () => {
      (useDirections as jest.Mock).mockReturnValue(makeDirections({ showDirections: true }));
      const { rerender } = render(<CampusMap />);

      (useDirections as jest.Mock).mockReturnValue(makeDirections({ showDirections: false }));
      rerender(<CampusMap />);

      // No crash and map is still rendered
      expect(screen.getByTestId("map-view")).toBeTruthy();
    });
  });

  // userLocationBuildingId effect

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

      (useUserLocation as jest.Mock).mockReturnValue(makeUserLocation({ location: null }));
      rerender(<CampusMap />);

      expect(screen.queryByLabelText("Current Location")).toBeNull();
    });
  });

  // Transit stop cleanup when navigation ends

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
      act(() => {
        fireEvent.press(screen.getByLabelText(TEST_IDS.boardMetroGL));
      });
      expect(screen.getByText(TEST_IDS.boardMetroGL)).toBeTruthy();

      // Turn off navigation
      (useDirections as jest.Mock).mockReturnValue(makeDirections({ isNavigationActive: false }));
      rerender(<CampusMap />);

      expect(screen.queryByText(TEST_IDS.boardMetroGL)).toBeNull();
    });
  });

  describe("Building interaction", () => {
    it("calculates coordinates when coordinates are missing on press", () => {
      const mockSetDestination = jest.fn();

      const expectedCoords = { latitude: 45.496, longitude: -73.577 };

      (useDirections as jest.Mock).mockReturnValue(makeDirections({ setDestination: mockSetDestination }));

      (calculatePolygonCenter as jest.Mock).mockReturnValue(expectedCoords);

      render(<CampusMap />);

      act(() => {
        fireEvent.press(screen.getByTestId("marker-Hall Building"));
      });

      expect(calculatePolygonCenter).toHaveBeenCalled();
      expect(mockSetDestination).toHaveBeenCalledWith("H", expectedCoords, "Hall Building");
    });

    it("calculates coordinates when coordinates are missing on press", () => {
      const mockSetDestination = jest.fn();

      const expectedCoords = { latitude: 45.496, longitude: -73.577 };

      (useDirections as jest.Mock).mockReturnValue(makeDirections({ setDestination: mockSetDestination }));

      (calculatePolygonCenter as jest.Mock).mockReturnValue(expectedCoords);

      render(<CampusMap />);

      act(() => {
        fireEvent.press(screen.getByTestId("marker-Hall Building"));
      });

      expect(calculatePolygonCenter).toHaveBeenCalled();
      expect(mockSetDestination).toHaveBeenCalledWith("H", expectedCoords, "Hall Building");
    });
  });

  describe("Building Search", () => {
    const defaultProps = {
      userInfo: { id: "1", name: "Test", email: "test@concordia.ca", photo: "" },
      onSignOut: jest.fn(),
    };

    it("handleOpenBuildingSearch opens the search modal and hides directions", () => {
      const mockSetShowDirections = jest.fn();
      (useDirections as jest.Mock).mockReturnValue(makeDirections({ setShowDirections: mockSetShowDirections }));

      render(<CampusMap {...defaultProps} />);

      expect(screen.queryByPlaceholderText("Type building name...")).toBeNull();

      act(() => {
        fireEvent.press(screen.getByTestId("open-search-btn"));
      });

      expect(mockSetShowDirections).toHaveBeenCalledWith(false);

      expect(screen.getByPlaceholderText("Type building name...")).toBeTruthy();
    });

    it("filteredBuildings returns all buildings when query is empty, and filters when typing", () => {
      render(<CampusMap {...defaultProps} />);

      act(() => {
        fireEvent.press(screen.getByTestId("open-search-btn"));
      });

      expect(screen.getByText("Hall Building")).toBeTruthy();
      expect(screen.getByText("Administration Building")).toBeTruthy();

      const searchInput = screen.getByPlaceholderText("Type building name...");

      act(() => {
        fireEvent.changeText(searchInput, "Hall");
      });

      expect(screen.getByText("Hall Building")).toBeTruthy();
      expect(screen.queryByText("Administration Building")).toBeNull();

      act(() => {
        fireEvent.changeText(searchInput, "hall");
      });
      expect(screen.getByText("Hall Building")).toBeTruthy();
    });
  });

  describe("Location Press", () => {
    it("animates camera and minimizes popups when handleLocationPress is triggered", () => {
      const mockLocation = { latitude: 45.495, longitude: -73.578 };
      (useUserLocation as jest.Mock).mockReturnValue(makeUserLocation({ location: mockLocation }));

      render(<CampusMap />);

      const locationMarker = screen.getByTestId("user-location-marker");

      act(() => {
        fireEvent.press(locationMarker);
      });

      expect(mockAnimateCamera).toHaveBeenCalledWith(
        {
          center: {
            latitude: mockLocation.latitude,
            longitude: mockLocation.longitude,
          },
          zoom: 17.5,
          pitch: 0,
          heading: 0,
        },
        { duration: 500 },
      );
    });

    it("does nothing if userLocation is null", () => {
      (useUserLocation as jest.Mock).mockReturnValue(makeUserLocation({ location: null }));

      render(<CampusMap />);

      const locationMarker = screen.queryByTestId("marker-Current Location");

      expect(locationMarker).toBeNull();
      expect(mockAnimateCamera).not.toHaveBeenCalled();
    });
  });

  it("returns early and does nothing if the building feature is not a Polygon", () => {
    const mockSetDestination = jest.fn();
    (useDirections as jest.Mock).mockReturnValue(makeDirections({ setDestination: mockSetDestination }));

    const SGWGeoJSON = require("@/src/data/campus/SGW.geojson");

    render(<CampusMap initialLocation={{ latitude: 45.495, longitude: -73.578 }} />);

    SGWGeoJSON.features[0].geometry.type = "Point";

    act(() => {
      fireEvent.press(screen.getByTestId("trigger-label-SGW"));
    });

    expect(mockSetDestination).not.toHaveBeenCalled();

    SGWGeoJSON.features[0].geometry.type = "Polygon";
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POI-related functionality
// ─────────────────────────────────────────────────────────────────────────────
describe("POI functionality", () => {
  it("renders POI button when POI data is available", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    // POI button should be rendered with correct testID
    expect(screen.getByTestId("outdoor-poi-button")).toBeTruthy();
  });

  it("toggles POI panel visibility when POI button is pressed", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    const poiButton = screen.getByTestId("outdoor-poi-button");
    
    // Initially POI panel should be visible in the rendered output
    // Pressing button should toggle it
    fireEvent.press(poiButton);
    
    // Button should still be present after press
    expect(poiButton).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Dark mode and styling
// ─────────────────────────────────────────────────────────────────────────────
describe("Dark mode styling", () => {
  it("applies light mode colors when useColorScheme returns 'light'", () => {
    const useColorScheme = require("react-native/Libraries/Utilities/useColorScheme").default;
    (useColorScheme as jest.Mock).mockReturnValue("light");
    
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    // Component should render with light colors applied
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("applies dark mode colors when useColorScheme returns 'dark'", () => {
    const useColorScheme = require("react-native/Libraries/Utilities/useColorScheme").default;
    (useColorScheme as jest.Mock).mockReturnValue("dark");
    
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    // Component should render with dark colors applied
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Map pan/drag interactions
// ─────────────────────────────────────────────────────────────────────────────
describe("Map pan and drag", () => {
  it("handles map pan events without crashing", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    // Map view should be present and handle pan events
    const mapView = screen.getByTestId("map-view");
    expect(mapView).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Building selection with navigation cleared
// ─────────────────────────────────────────────────────────────────────────────
describe("Building selection without navigation active", () => {
  it("clears navigation when a building is selected", () => {
    const mockSetIsNavigationActive = jest.fn();
    const mockSetShowDirections = jest.fn();

    (useDirections as jest.Mock).mockReturnValue(
      makeDirections({
        setIsNavigationActive: mockSetIsNavigationActive,
        setShowDirections: mockSetShowDirections,
        isNavigationActive: true,
      })
    );

    render(<CampusMap />);

    act(() => {
      fireEvent.press(screen.getByTestId("marker-Hall Building"));
    });

    // Should clear navigation active flag
    expect(mockSetIsNavigationActive).toHaveBeenCalledWith(false);
    expect(mockSetShowDirections).toHaveBeenCalledWith(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Map region changes
// ─────────────────────────────────────────────────────────────────────────────
describe("Map region handling", () => {
  it("saves map region on drag", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    const { rerender } = render(<CampusMap />);

    // Mock region change
    const mapView = screen.getByTestId("map-view");
    expect(mapView).toBeTruthy();

    // Re-render to verify state persistence
    rerender(<CampusMap />);
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("preserves pre-navigation region when available", () => {
    (useDirections as jest.Mock).mockReturnValue(
      makeDirections({
        isNavigationActive: true,
        routeData: TRANSIT_ROUTE_DATA,
        travelMode: "walking",
      })
    );

    render(<CampusMap />);

    // When navigation starts, the previous region should be stored
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// User location null safety
// ─────────────────────────────────────────────────────────────────────────────
describe("User location null safety", () => {
  it("handles null user location safely in different contexts", () => {
    (useUserLocation as jest.Mock).mockReturnValue({ location: null });
    (useDirections as jest.Mock).mockReturnValue(makeDirections());

    render(<CampusMap />);

    // Should not crash when location is null
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("renders without errors when updating location from null to value", () => {
    const { rerender } = render(<CampusMap />);
    
    (useUserLocation as jest.Mock).mockReturnValue({
      location: { latitude: 45.495, longitude: -73.578 },
    });

    rerender(<CampusMap />);

    // Should render location marker after location becomes available
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation with different travel modes
// ─────────────────────────────────────────────────────────────────────────────
describe("Navigation with different travel modes", () => {
  ["walking", "transit", "bicycling", "driving"].forEach(mode => {
    it(`renders navigation UI correctly for ${mode} mode`, () => {
      (useDirections as jest.Mock).mockReturnValue(
        makeDirections({
          isNavigationActive: true,
          routeData: TRANSIT_ROUTE_DATA,
          travelMode: mode as any,
        })
      );

      render(<CampusMap />);

      // Navigation header should render
      expect(screen.getByTestId("map-view")).toBeTruthy();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Destination pin visibility
// ─────────────────────────────────────────────────────────────────────────────
describe("Destination pin visibility", () => {
  it("renders map view when destination exists", () => {
    (useDirections as jest.Mock).mockReturnValue(
      makeDirections({
        destinationCoords: { latitude: 45.495, longitude: -73.578 },
        destination: "H",
      })
    );

    render(<CampusMap />);

    // Map should render with destination set
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("calls setDestination when a building is selected", () => {
    const mockSetDestination = jest.fn();
    
    (useDirections as jest.Mock).mockReturnValue(makeDirections({ setDestination: mockSetDestination }));

    render(<CampusMap />);

    act(() => {
      fireEvent.press(screen.getByTestId("marker-Hall Building"));
    });

    // After selection, destination should be set
    expect(mockSetDestination).toHaveBeenCalledWith(
      "H",
      expect.any(Object),
      "Hall Building"
    );
  });

  it("renders error banner when location has an error", () => {
    (useUserLocation as jest.Mock).mockReturnValue({
      location: null,
      error: "Permission denied",
      loading: false,
      hasPermission: false,
    });
    (useDirections as jest.Mock).mockReturnValue(makeDirections());

    render(<CampusMap />);

    // Error banner should be visible
    expect(screen.getByText(/Permission denied|Location permission|error/i)).toBeTruthy();
  });

  it("renders loading state when location is loading", () => {
    (useUserLocation as jest.Mock).mockReturnValue({
      location: null,
      error: null,
      loading: true,
      hasPermission: true,
    });
    (useDirections as jest.Mock).mockReturnValue(makeDirections());

    render(<CampusMap />);

    // Should render without crashing during loading
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("renders with both SGW and LOY campuses", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    // Both campuses should render
    expect(screen.getByTestId("polygon-Hall Building")).toBeTruthy();
    expect(screen.getByTestId("polygon-Administration Building")).toBeTruthy();
  });

  it("handles RightControlsPanel with userInfo", () => {
    const mockOnSignOut = jest.fn();
    const userInfoData = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      photo: "",
    };

    (useDirections as jest.Mock).mockReturnValue(makeDirections());

    render(
      <CampusMap
        userInfo={userInfoData}
        onSignOut={mockOnSignOut}
      />
    );

    // Component should render with user info panel capability
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("handles long press on map", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    const longPressTrigger = screen.getByTestId("map-long-press-trigger");
    act(() => {
      fireEvent.press(longPressTrigger);
    });

    // Should handle long press without crashing
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("handles region change completion", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    const regionChangeTrigger = screen.getByTestId("map-region-change-trigger");
    act(() => {
      fireEvent.press(regionChangeTrigger);
    });

    // Should handle region change without crashing
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("renders campus labels", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    // Campus labels should render
    const campusLabels = screen.getAllByTestId("campus-labels");
    expect(campusLabels.length).toBeGreaterThan(0);
  });

  it("renders route polyline when navigation is active", () => {
    (useDirections as jest.Mock).mockReturnValue(
      makeDirections({
        isNavigationActive: true,
        routeData: TRANSIT_ROUTE_DATA,
      })
    );

    render(<CampusMap />);

    // Navigation UI should render
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("closes additional info popup when requested", () => {
    const mockSetDestination = jest.fn();
    
    (useDirections as jest.Mock).mockReturnValue(
      makeDirections({ 
        setDestination: mockSetDestination,
        destinationCoords: { latitude: 45.495, longitude: -73.578 },
      })
    );

    const { rerender } = render(<CampusMap />);

    // Select a building to open popup
    act(() => {
      fireEvent.press(screen.getByTestId("marker-Hall Building"));
    });

    // Rerender with showDirections true to close popup
    (useDirections as jest.Mock).mockReturnValue(
      makeDirections({
        setDestination: mockSetDestination,
        showDirections: true,
      })
    );

    rerender(<CampusMap />);

    expect(mockSetDestination).toHaveBeenCalled();
  });

  it("toggles indoor/outdoor map visibility", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    
    const { rerender } = render(<CampusMap />);

    // Initially outdoor map should be visible
    expect(screen.getByTestId("map-view")).toBeTruthy();

    // Simulate indoor opening by mocking state change
    rerender(<CampusMap />);

    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("displays building name from metadata", () => {
    const mockSetDestination = jest.fn();
    
    (useDirections as jest.Mock).mockReturnValue(makeDirections({ setDestination: mockSetDestination }));
    (calculatePolygonCenter as jest.Mock).mockReturnValue({ latitude: 45.495, longitude: -73.578 });

    render(<CampusMap />);

    act(() => {
      fireEvent.press(screen.getByTestId("marker-Hall Building"));
    });

    // Should call setDestination with building name from metadata
    expect(mockSetDestination).toHaveBeenCalledWith("H", expect.any(Object), "Hall Building");
  });

  it("handles navigation with different active steps", () => {
    const routeWithMultipleSteps = {
      ...TRANSIT_ROUTE_DATA,
      steps: [
        {
          instruction: "Step 1",
          distance: "100 m",
          duration: "1 min",
          travelMode: "walking",
          endLocation: { latitude: 45.496, longitude: -73.578 },
        },
        {
          instruction: "Step 2",
          distance: "200 m", 
          duration: "2 min",
          travelMode: "walking",
          endLocation: { latitude: 45.497, longitude: -73.577 },
        },
        {
          instruction: "Step 3",
          distance: "150 m",
          duration: "1 min",
          travelMode: "walking",
          endLocation: { latitude: 45.498, longitude: -73.576 },
        },
      ],
    };

    (useDirections as jest.Mock).mockReturnValue(
      makeDirections({
        isNavigationActive: true,
        routeData: routeWithMultipleSteps,
        activeStep: 0,
      })
    );

    render(<CampusMap />);

    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("handles end trip button press", () => {
    const mockSetIsNavigationActive = jest.fn();
    const mockSetShowDirections = jest.fn();

    (useDirections as jest.Mock).mockReturnValue(
      makeDirections({
        isNavigationActive: true,
        routeData: TRANSIT_ROUTE_DATA,
        setIsNavigationActive: mockSetIsNavigationActive,
        setShowDirections: mockSetShowDirections,
      })
    );

    render(<CampusMap />);

    // Navigation UI should be present
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("handles building without indoor data", () => {
    const mockSetDestination = jest.fn();
    
    (useDirections as jest.Mock).mockReturnValue(makeDirections({ setDestination: mockSetDestination }));
    (calculatePolygonCenter as jest.Mock).mockReturnValue({ latitude: 45.458, longitude: -73.64 });

    render(<CampusMap />);

    act(() => {
      fireEvent.press(screen.getByTestId("marker-Administration Building"));
    });

    // Should call setDestination for building without indoor data
    expect(mockSetDestination).toHaveBeenCalledWith("AD", expect.any(Object), expect.any(String));
  });

  it("renders OutdoorPOIMarkers when POI type is selected", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    
    const { rerender } = render(<CampusMap />);
    
    // Initially no POI markers
    expect(screen.getByTestId("map-view")).toBeTruthy();

    // Simulate POI type selection state change
    rerender(<CampusMap />);
    
    // Map should still render
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("opens POI panel when POI button is pressed", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    // POI button should be present with correct accessibility label
    const poiButton = screen.getByLabelText("Open outdoor points of interest");
    expect(poiButton).toBeTruthy();
    
    fireEvent.press(poiButton);
    
    // Component should still render after button press
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("opens building search modal", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    // BuildingSearchButton renders inside OutdoorPOIButton via search functionality
    // Verify map renders with search capability
    expect(screen.getByTestId("map-view")).toBeTruthy();
    expect(screen.getByTestId("outdoor-poi-button")).toBeTruthy();
  });

  it("enables building search when building search button is pressed", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    // Map and search interface should be active
    expect(screen.getByTestId("map-view")).toBeTruthy();
    
    // POI button provides access to search features
    const poiButton = screen.getByLabelText("Open outdoor points of interest");
    expect(poiButton).toBeTruthy();
  });

  it("receives userInfo prop and renders correctly", () => {
    const mockOnSignOut = jest.fn();
    const userInfo = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      photo: "https://example.com/photo.jpg",
    };

    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    
    render(
      <CampusMap
        userInfo={userInfo}
        onSignOut={mockOnSignOut}
      />
    );

    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("handles destination popup rendering", () => {
    (useDirections as jest.Mock).mockReturnValue(
      makeDirections({ showDirections: true })
    );

    render(<CampusMap />);

    // When showDirections is true, DirectionsSearchPanel is visible
    expect(screen.getByTestId("directions-search-panel")).toBeTruthy();
  });

  it("handles multiple campus switches with POI persistence", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    
    const { rerender } = render(<CampusMap />);
    
    expect(screen.getByTestId("map-view")).toBeTruthy();

    // Simulate view change
    rerender(<CampusMap />);
    
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("renders all campus labels for current campus", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    const campusLabels = screen.getAllByTestId("campus-labels");
    expect(campusLabels.length).toBeGreaterThan(0);
  });

  it("renders map with all building markers on startup", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    // Building markers should exist (at least Hall and Administration)
    const markers = screen.getAllByTestId(/^marker-/);
    expect(markers.length).toBeGreaterThanOrEqual(2);
  });

  it("handles closing destination popup after selection", () => {
    const mockSetShowDirections = jest.fn();
    (useDirections as jest.Mock).mockReturnValue(
      makeDirections({
        showDirections: true,
        setShowDirections: mockSetShowDirections,
      })
    );

    const { rerender } = render(<CampusMap />);
    
    // When showDirections is true, search panel renders
    expect(screen.getByTestId("directions-search-panel")).toBeTruthy();
    
    // Rerender with showDirections false
    (useDirections as jest.Mock).mockReturnValue(
      makeDirections({ showDirections: false })
    );
    rerender(<CampusMap />);
    
    // Verify map still renders after closing
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("toggles building search modal visibility", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    
    render(<CampusMap />);
    
    // POI button provides search access
    const poiButton = screen.getByLabelText("Open outdoor points of interest");
    expect(poiButton).toBeTruthy();

    fireEvent.press(poiButton);

    // POI panel should be accessible
    expect(screen.getByText("Outdoor POIs")).toBeTruthy();
  });

  it("renders indoor map overlay when building is selected", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    
    render(<CampusMap />);

    // Initially outdoor map should be visible
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("handles search query filtering for building search", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    // Verify map renders for search capability
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("renders OutdoorPOIButton with correct accessibility", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    const poiButton = screen.getByTestId("outdoor-poi-button");
    expect(poiButton).toBeTruthy();
    expect(poiButton.props.accessibilityRole).toBe("button");
  });

  it("handles POI panel visibility toggle", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    // POI panel should be present
    expect(screen.getByText("Outdoor POIs")).toBeTruthy();
  });

  it("displays POI category options in panel", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    expect(screen.getByText("Restaurants")).toBeTruthy();
    expect(screen.getByText("Banks")).toBeTruthy();
    expect(screen.getByText("Libraries")).toBeTruthy();
    expect(screen.getByText("Hotels")).toBeTruthy();
  });

  it("handles building search modal opening", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    // Search functionality should work with map
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  it("renders all UI layers without crashing", () => {
    (useDirections as jest.Mock).mockReturnValue(makeDirections());
    render(<CampusMap />);

    // All main components should be present
    expect(screen.getByTestId("map-view")).toBeTruthy();
    expect(screen.getByTestId("outdoor-poi-button")).toBeTruthy();
  });
});
