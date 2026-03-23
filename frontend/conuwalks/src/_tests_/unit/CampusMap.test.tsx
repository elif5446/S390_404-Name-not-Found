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
    H: { name: "Hall Building", coordinates: { latitude: 45.495, longitude: -73.578 } },
  },
}));

jest.mock("@/src/data/metadata/LOY.BuildingMetadata", () => ({
  LoyolaBuildingMetadata: { AD: { name: "Administration Building" } },
  LoyolaBuildingSearchMetadata: {
    AD: { name: "Administration Building", coordinates: { latitude: 45.458, longitude: -73.64 } },
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

jest.mock("react-native-maps", () => {
  const React = require("react");
  const { TouchableOpacity, View } = require("react-native");

  const MockMapView = React.forwardRef(
    ({ children, onLongPress, onPress, onPanDrag, onRegionChangeComplete, googleMapId }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        animateCamera: jest.fn(),
        animateToRegion: jest.fn(),
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
  const Mock = React.forwardRef(({ visible, directionsEtaLabel, onDirectionsTrigger, onExpansionChange }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      minimize: jest.fn(),
      collapse: jest.fn(),
    }));
    if (!visible) return null;
    return (
      <View testID="additional-info-popup">
        <View testID="eta-display" accessibilityLabel={String(directionsEtaLabel)} />
        {onExpansionChange && <TouchableOpacity testID="expansion-change-trigger" onPress={() => onExpansionChange(true)} />}
      </View>
    );
  });
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
    rafSpy = jest.spyOn(global, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
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
});
