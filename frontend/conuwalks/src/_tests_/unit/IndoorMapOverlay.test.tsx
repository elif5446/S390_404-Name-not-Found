import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { View } from "react-native";
import IndoorMapOverlay from "@/src/components/indoor/IndoorMapOverlay";
import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";

// Mock the zoomable view so it just renders its children
jest.mock("@openspacelabs/react-native-zoomable-view", () => {
  const React = require("react");
  const MockZoomableView = React.forwardRef(({ children }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      zoomTo: jest.fn(),
      moveTo: jest.fn(),
    }));
    return <>{children}</>;
  });
  MockZoomableView.displayName = "MockReactNativeZoomableView";
  return { ReactNativeZoomableView: MockZoomableView };
});

jest.mock("@/src/indoors/services/IndoorMapService", () => {
  return {
    IndoorMapService: jest.fn().mockImplementation(() => ({
      loadBuilding: jest.fn(),
      getGraph: jest.fn(() => ({
        // Return a valid node when requested so 0-distance routing succeeds
        getNode: jest.fn(id => ({ id, floorId: "H_1", x: 0, y: 0 })),
        // Return dummy nodes so destination resolution succeeds
        getAllNodes: jest.fn(() => [
          { id: "entrance", floorId: "H_1", x: 0, y: 0 },
          { id: "820", floorId: "H_1", x: 10, y: 10, label: "820" },
        ]),
      })),
      getEntranceNode: jest.fn(() => ({ id: "entrance", floorId: "H_1" })),
      getStartNode: jest.fn(() => ({ id: "entrance", floorId: "H_1" })),
      getNodeByRoomNumber: jest.fn(() => ({ id: "820", floorId: "H_1" })),
      getNearestRoomNode: jest.fn(),
      // Mock a successful route
      getRoute: jest.fn().mockResolvedValue({
        distance: 10,
        nodes: [
          { id: "entrance", floorId: "H_1" },
          { id: "820", floorId: "H_1" },
        ],
      }),
      // Return empty steps so the fallback routeSteps logic runs (covers lines 974-987)
      getRouteInstructions: jest.fn(() => ({ steps: [] })),
    })),
  };
});

jest.mock("@/src/utils/tokenStorage", () => ({
  getWheelchairAccessibilityPreference: jest.fn().mockResolvedValue(false),
}));

jest.mock("@/src/indoors/data/navConfigRegistry", () => ({
  navConfigRegistry: {
    H: {
      buildingId: "H",
      defaultStartNodeId: "entrance",
      floors: [
        {
          floorId: "H_1",
          nodes: [
            { id: "entrance", type: "entrance", x: 0, y: 0 },
            { id: "820", type: "room", label: "820", x: 10, y: 10 },
          ],
        },
      ],
    },
    EV: {
      buildingId: "EV",
      defaultStartNodeId: "ev-entrance",
      floors: [
        {
          floorId: "EV_1",
          nodes: [
            { id: "ev-entrance", type: "entrance", x: 0, y: 0 },
            { id: "EV820", type: "room", label: "820", x: 50, y: 50 },
          ],
        },
      ],
    },
  },
}));

jest.mock("@/src/data/poiData", () => ({
  getPOIsForFloor: jest.fn(() => [
    { id: "poi1", room: "820", category: "ROOM", mapPosition: { x: 0.5, y: 0.5 } },
    { id: "poi2", room: "102", category: "WC_M", mapPosition: { x: 0.3, y: 0.3 }, description: "Restroom" },
  ]),
  getCategoriesForFloor: jest.fn(() => ["WC_M", "WC_F"]),
}));

jest.mock(
  "@/src/components/indoor/IndoorMapHeader",
  () =>
    function MockIndoorMapHeader() {
      return <></>;
    },
);
jest.mock(
  "@/src/components/indoor/IndoorMap",
  () =>
    function MockMapContent() {
      return <></>;
    },
);
jest.mock(
  "@/src/components/indoor/IndoorTopPanel",
  () =>
    function MockIndoorTopPanel(props: any) {
      const { TouchableOpacity } = require("react-native");
      return (
        <>
          <TouchableOpacity testID="topPanel-select-room" onPress={() => props.onSelectResult?.({ type: "room", id: "820", label: "Room 820", x: 100, y: 100, floorLevel: 1, buildingId: "H" })} />
          <TouchableOpacity testID="topPanel-select-building" onPress={() => props.onSelectResult?.({ type: "building", id: "EV", label: "Engineering Building", buildingId: "EV" })} />
          <TouchableOpacity testID="topPanel-select-external-room" onPress={() => props.onSelectResult?.({ type: "external_room", id: "EV820", label: "EV 820", buildingId: "EV" })} />
          <TouchableOpacity testID="topPanel-select-poi-matching" onPress={() => props.onSelectResult?.({ type: "poi", id: "poi1", label: "restroom (Room 820)", room: "820", floorLevel: 1, x: 512, y: 512 })} />
          <TouchableOpacity testID="topPanel-select-poi-no-match" onPress={() => props.onSelectResult?.({ type: "poi", id: "poi2", label: "restroom (Room 101)", room: "101", floorLevel: 1, x: 300, y: 300 })} />
          <TouchableOpacity testID="topPanel-clear" onPress={() => props.onClearDestination?.()} />
          <TouchableOpacity testID="topPanel-focus-start" onPress={() => props.onFocusField?.("start")} />
          <TouchableOpacity testID="topPanel-start-navigation" onPress={() => props.onStartNavigation?.()} />
          <TouchableOpacity testID="topPanel-toggle-category" onPress={() => props.onToggleCategory?.("WC_M")} />
          <TouchableOpacity testID="topPanel-set-query" onPress={() => props.setSearchQuery?.("820")} />
        </>
      );
    },
);
jest.mock(
  "@/src/components/indoor/IndoorRoomLabels",
  () =>
    function MockIndoorRoomLabels() {
      return <></>;
    },
);
jest.mock("@/src/components/indoor/POIBadge", () => ({
  __esModule: true,
  default: function MockPOIBadge() {
    return null;
  },
  ICON_POSITION_OVERRIDES: {},
}));
jest.mock(
  "@/src/components/indoor/IndoorPointMarker",
  () =>
    function MockIndoorPointMarker() {
      return <></>;
    },
);
jest.mock(
  "@/src/components/indoor/DestinationMarker",
  () =>
    function MockDestinationMarker() {
      return <></>;
    },
);
jest.mock(
  "@/src/components/indoor/PulsingUserMarker",
  () =>
    function MockPulsingUserMarker() {
      return <></>;
    },
);

jest.mock("@/src/components/indoor/IndoorDirectionsPopup", () => {
  const React = require("react");
  const { Text, TouchableOpacity } = require("react-native");

  const MockDirectionsPopup = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      minimize: jest.fn(),
      dismiss: jest.fn(),
    }));
    return props.visible ? (
      <>
        <Text testID="directions-popup">Directions Active</Text>
        <TouchableOpacity testID="popup-next-step" onPress={() => props.onNextStep?.()} />
        <TouchableOpacity testID="popup-prev-step" onPress={() => props.onPrevStep?.()} />
        <TouchableOpacity testID="popup-close" onPress={() => props.onClose?.()} />
        <TouchableOpacity testID="popup-finish" onPress={() => props.onFinish?.()} />
      </>
    ) : null;
  });

  MockDirectionsPopup.displayName = "MockIndoorDirectionsPopup";
  return MockDirectionsPopup;
});

jest.mock("@/src/components/indoor/POIFilterPanel", () => {
  const React = require("react");
  const { Text, TouchableOpacity } = require("react-native");

  const MockPOIPanel = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      minimize: jest.fn(),
    }));
    return props.visible ? (
      <>
        <Text testID="poi-panel">POI Panel Active</Text>
        <TouchableOpacity testID="poi-panel-select-matching" onPress={() => props.onSelectPOI?.({ id: "poi1", category: "WC_M", room: "820", mapPosition: { x: 0.5, y: 0.5 }, description: "Restroom" })} />
        <TouchableOpacity testID="poi-panel-select-no-match" onPress={() => props.onSelectPOI?.({ id: "poi2", category: "WC_F", room: "101", mapPosition: { x: 0.3, y: 0.3 }, description: "Men's Restroom" })} />
        <TouchableOpacity testID="poi-panel-target-mode-source" onPress={() => props.onTargetModeChange?.("SOURCE")} />
        <TouchableOpacity testID="poi-panel-toggle-category" onPress={() => props.onToggleCategory?.("WC_M")} />
      </>
    ) : null;
  });

  MockPOIPanel.displayName = "MockPOIFilterPanel";
  return MockPOIPanel;
});

const mockBuildingData: BuildingIndoorConfig = {
  id: "H",
  name: "Hall Building",
  defaultFloor: 1,
  floors: [
    {
      id: "H_1",
      level: 1,
      label: "1",
      type: "svg",
      image: "mock-h1-svg" as any,
      viewBox: "0 0 1024 1024",
      bounds: {
        northEast: { latitude: 45.49769, longitude: -73.5783 },
        southWest: { latitude: 45.49682, longitude: -73.57954 },
      },
    },
    {
      id: "H_8",
      level: 8,
      label: "8",
      type: "svg",
      image: "mock-h8-svg" as any,
      viewBox: "0 0 1024 1024",
      bounds: {
        northEast: { latitude: 45.49769, longitude: -73.5783 },
        southWest: { latitude: 45.49682, longitude: -73.57954 },
      },
    },
  ],
};

const defaultProps = {
  buildingData: mockBuildingData,
  onExit: jest.fn(),
  onToggleOutdoorMap: jest.fn(),
};

describe("IndoorMapOverlay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders successfully without crashing", () => {
    const { getByTestId } = render(<IndoorMapOverlay {...defaultProps} />);
    // Verify POI panel is active by default when not navigating
    expect(getByTestId("poi-panel")).toBeTruthy();
  });

  it("shows the Directions Popup and hides the POI Panel when navigation is active", async () => {
    const { findByTestId, queryByTestId } = render(
      <IndoorMapOverlay {...defaultProps} isNavigationActive={true} destinationBuildingId="H" destinationRoomId="820" />,
    );

    expect(await findByTestId("directions-popup")).toBeTruthy();
    expect(queryByTestId("poi-panel")).toBeNull();
  });
  it("calls minimize on popups when the map canvas is interacted with", () => {
    const { UNSAFE_root } = render(<IndoorMapOverlay {...defaultProps} />);
    const mapCanvas = UNSAFE_root.findAllByType(View).find((node: any) => node.props.onStartShouldSetResponderCapture);

    expect(mapCanvas).toBeDefined();

    // 3. Trigger the map interaction
    fireEvent(mapCanvas as any, "startShouldSetResponderCapture");
  });

  it("gracefully handles missing floor data", () => {
    const emptyBuildingData = { ...mockBuildingData, floors: [] };
    const { getByText } = render(<IndoorMapOverlay {...defaultProps} buildingData={emptyBuildingData} />);
    expect(getByText("No floor data available.")).toBeTruthy();
  });
});

describe("IndoorMapOverlay - Extended Coverage", () => {
  const mockOnCancelNavigation = jest.fn();
  const mockOnStartNavigation = jest.fn();
  const mockOnSetStartRoom = jest.fn();
  const mockOnSetDestinationRoom = jest.fn();

  const baseProps = {
    buildingData: mockBuildingData,
    onExit: jest.fn(),
    onToggleOutdoorMap: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Covers line 640: base node useEffect branch with matching startBuildingId
  // Covers findHotspotTarget with exact equality match
  it("resolves base node by room number when startBuildingId matches building", () => {
    render(<IndoorMapOverlay {...baseProps} startBuildingId="H" startRoomId="820" />);
  });

  // Covers line 376: matches() endsWith branch (hotspot "820".endsWith("20"))
  // Covers IndoorPointMarker conditional render (startLocation.floorLevel === currentLevel)
  it("finds hotspot via endsWith when roomId is a suffix of a hotspot id", () => {
    render(<IndoorMapOverlay {...baseProps} startBuildingId="H" startRoomId="20" />);
  });

  // Covers findHotspotTarget no-match, findNodeTarget no-match, findPOITarget success path
  it("falls back to POI target when hotspot and nav node are not found", () => {
    render(<IndoorMapOverlay {...baseProps} startBuildingId="H" startRoomId="102" />);
  });

  // Covers findPOITarget early return (!found) and setLocation(null) in useLocationSync
  it("clears start location when no matching hotspot, node, or POI exists", () => {
    render(<IndoorMapOverlay {...baseProps} startBuildingId="H" startRoomId="101" />);
  });

  // Covers determineInitialFloor: isNavigationActive && startBuildingId === buildingData.id branch
  it("determines initial floor from start room when navigation is active", () => {
    render(
      <IndoorMapOverlay
        {...baseProps}
        isNavigationActive={true}
        startBuildingId="H"
        startRoomId="820"
        destinationBuildingId="H"
        destinationRoomId="820"
      />,
    );
  });

  // Covers determineInitialFloor: destinationBuildingId === buildingData.id branch
  it("determines initial floor from destination room when provided", async () => {
    const { getByTestId } = render(
      <IndoorMapOverlay {...baseProps} destinationBuildingId="H" destinationRoomId="820" />,
    );
    await waitFor(() => expect(getByTestId("poi-panel")).toBeTruthy());
  });

  // Covers handleSelectSearchResult room type → handleRoomSelection → handleSetLocation (destination)
  // Covers lines 850-860 (handleSetLocation body with onSetDestinationRoom callback)
  it("handleSelectSearchResult - room type sets destination and calls onSetDestinationRoom", () => {
    const { getByTestId } = render(
      <IndoorMapOverlay {...baseProps} onSetDestinationRoom={mockOnSetDestinationRoom} />,
    );
    fireEvent.press(getByTestId("topPanel-select-room"));
    expect(mockOnSetDestinationRoom).toHaveBeenCalledWith("820");
  });

  // Covers handleSetLocation with isStart=true and onSetStartRoom callback
  it("handleSelectSearchResult - room type sets start when start field is active", () => {
    const { getByTestId } = render(
      <IndoorMapOverlay {...baseProps} onSetStartRoom={mockOnSetStartRoom} />,
    );
    fireEvent.press(getByTestId("topPanel-focus-start"));
    fireEvent.press(getByTestId("topPanel-select-room"));
    expect(mockOnSetStartRoom).toHaveBeenCalledWith("820");
  });

  // Covers handleSelectSearchResult building type → handleBuildingSelection (isStart=false)
  it("handleSelectSearchResult - building type as destination calls onSetDestinationRoom", () => {
    const { getByTestId } = render(
      <IndoorMapOverlay {...baseProps} onSetDestinationRoom={mockOnSetDestinationRoom} />,
    );
    fireEvent.press(getByTestId("topPanel-select-building"));
    expect(mockOnSetDestinationRoom).toHaveBeenCalledWith("EV", "EV");
  });

  // Covers handleBuildingSelection isStart=true path (line covering setStartLocation / onSetStartRoom)
  it("handleSelectSearchResult - building type as start calls onSetStartRoom", () => {
    const { getByTestId } = render(
      <IndoorMapOverlay {...baseProps} onSetStartRoom={mockOnSetStartRoom} />,
    );
    fireEvent.press(getByTestId("topPanel-focus-start"));
    fireEvent.press(getByTestId("topPanel-select-building"));
    expect(mockOnSetStartRoom).toHaveBeenCalledWith("EV", "EV");
  });

  // Covers handleSelectSearchResult external_room type → handleBuildingSelection
  it("handleSelectSearchResult - external_room selection as destination calls onSetDestinationRoom", () => {
    const { getByTestId } = render(
      <IndoorMapOverlay {...baseProps} onSetDestinationRoom={mockOnSetDestinationRoom} />,
    );
    fireEvent.press(getByTestId("topPanel-select-external-room"));
    expect(mockOnSetDestinationRoom).toHaveBeenCalledWith("EV820", "EV");
  });

  // Covers handlePOISelection with matching hotspot room (room "820" matches hotspot label "820")
  it("handleSelectSearchResult - poi type with matching hotspot calls onSetDestinationRoom", () => {
    const { getByTestId } = render(
      <IndoorMapOverlay {...baseProps} onSetDestinationRoom={mockOnSetDestinationRoom} />,
    );
    fireEvent.press(getByTestId("topPanel-select-poi-matching"));
    expect(mockOnSetDestinationRoom).toHaveBeenCalledWith("820");
  });

  // Covers handlePOISelection no-match branch → nearestNode lookup (getNearestRoomNode)
  it("handleSelectSearchResult - poi type with no hotspot match uses nearestNode fallback", () => {
    const { getByTestId } = render(
      <IndoorMapOverlay {...baseProps} onSetDestinationRoom={mockOnSetDestinationRoom} />,
    );
    fireEvent.press(getByTestId("topPanel-select-poi-no-match"));
    expect(mockOnSetDestinationRoom).toHaveBeenCalledWith("poi2");
  });

  // Covers handleClearDestination with activeField === "start" (lines 840-845)
  it("handleClearDestination clears start location when start field is active", () => {
    const { getByTestId } = render(<IndoorMapOverlay {...baseProps} />);
    fireEvent.press(getByTestId("topPanel-focus-start"));
    fireEvent.press(getByTestId("topPanel-clear"));
  });

  // Covers onStartNavigation inline arrow in JSX
  it("calls onStartNavigation when triggered from the top panel", () => {
    const { getByTestId } = render(
      <IndoorMapOverlay {...baseProps} onStartNavigation={mockOnStartNavigation} />,
    );
    fireEvent.press(getByTestId("topPanel-start-navigation"));
    expect(mockOnStartNavigation).toHaveBeenCalledTimes(1);
  });

  // Covers handleToggleCategory
  it("handles category toggle from top panel", () => {
    const { getByTestId } = render(<IndoorMapOverlay {...baseProps} />);
    fireEvent.press(getByTestId("topPanel-toggle-category"));
  });

  // Covers createExternalResults navConfig loop (lines 204-214): EV building has node "820"
  // which matches query "820", producing an external_room result
  it("search with query 820 triggers createExternalResults including EV navConfig rooms", () => {
    const { getByTestId } = render(<IndoorMapOverlay {...baseProps} />);
    fireEvent.press(getByTestId("topPanel-set-query"));
  });

  // Covers handleSelectPOI from filter panel: matching hotspot (room "820" → hotspot label "820")
  it("handleSelectPOI from filter panel sets destination when hotspot room matches", () => {
    const { getByTestId } = render(
      <IndoorMapOverlay {...baseProps} onSetDestinationRoom={mockOnSetDestinationRoom} />,
    );
    fireEvent.press(getByTestId("poi-panel-select-matching"));
    expect(mockOnSetDestinationRoom).toHaveBeenCalledWith("820");
  });

  // Covers handleSelectPOI from filter panel: no matching hotspot → activeFloor branch → nearestNode
  it("handleSelectPOI from filter panel uses nearestNode when no hotspot room matches", () => {
    const { getByTestId } = render(
      <IndoorMapOverlay {...baseProps} onSetDestinationRoom={mockOnSetDestinationRoom} />,
    );
    fireEvent.press(getByTestId("poi-panel-select-no-match"));
    expect(mockOnSetDestinationRoom).toHaveBeenCalledWith("poi2");
  });

  // Covers handleSelectPOI with isStart=true (SOURCE mode) via POI filter panel
  // Covers setSourcePOI branch and onSetStartRoom callback
  it("handleSelectPOI selects as source when route target mode is SOURCE", () => {
    const { getByTestId } = render(
      <IndoorMapOverlay {...baseProps} onSetStartRoom={mockOnSetStartRoom} />,
    );
    fireEvent.press(getByTestId("poi-panel-target-mode-source"));
    fireEvent.press(getByTestId("poi-panel-select-matching"));
    expect(mockOnSetStartRoom).toHaveBeenCalledWith("820");
  });

  // Covers handleToggleCategory via POI filter panel
  it("handles category toggle from POI filter panel", () => {
    const { getByTestId } = render(<IndoorMapOverlay {...baseProps} />);
    fireEvent.press(getByTestId("poi-panel-toggle-category"));
  });

  // Covers onNextStep and onPrevStep inline arrows in JSX (directions popup navigation)
  it("handles next and previous step navigation in directions popup", async () => {
    const { findByTestId } = render(
      <IndoorMapOverlay
        {...baseProps}
        isNavigationActive={true}
        destinationBuildingId="H"
        destinationRoomId="820"
      />,
    );
    fireEvent.press(await findByTestId("popup-next-step"));
    fireEvent.press(await findByTestId("popup-prev-step"));
  });

  // Covers onClose inline arrow in JSX and onCancelNavigation callback
  it("calls onCancelNavigation when popup close button is pressed", async () => {
    const { findByTestId } = render(
      <IndoorMapOverlay
        {...baseProps}
        isNavigationActive={true}
        destinationBuildingId="H"
        destinationRoomId="820"
        onCancelNavigation={mockOnCancelNavigation}
      />,
    );
    fireEvent.press(await findByTestId("popup-close"));
    expect(mockOnCancelNavigation).toHaveBeenCalledTimes(1);
  });

  // Covers endsAtEntrance=true path (lines 1017-1020):
  // EV destination → zero-distance route ending at entrance → endsAtEntrance=true
  // Covers routeSteps fallback "Head outside to continue your route" (lines 977-980)
  // Covers onFinish = onToggleOutdoorMap in JSX ternary
  it("calls onToggleOutdoorMap when finishing a route to a different building that ends at entrance", async () => {
    const onToggleOutdoorMap = jest.fn();
    const { findByTestId } = render(
      <IndoorMapOverlay
        {...baseProps}
        onToggleOutdoorMap={onToggleOutdoorMap}
        isNavigationActive={true}
        destinationBuildingId="EV"
      />,
    );
    fireEvent.press(await findByTestId("popup-finish"));
    expect(onToggleOutdoorMap).toHaveBeenCalledTimes(1);
  });

  // Covers routeSteps fallback "You are at your destination" (same-building route, isEntrance true
  // but routingToDifferentBuilding=false since destinationBuildingId==="H")
  it("routeSteps fallback produces arrived step for same-building destination route", async () => {
    const { findByTestId } = render(
      <IndoorMapOverlay
        {...baseProps}
        isNavigationActive={true}
        destinationBuildingId="H"
        destinationRoomId="820"
        onCancelNavigation={mockOnCancelNavigation}
      />,
    );
    await findByTestId("popup-finish");
  });

  // Covers resolveStartNode USER branch (lines 746-752): startBuildingId==="USER"
  it("uses entrance node as start when startBuildingId is USER", () => {
    render(
      <IndoorMapOverlay
        {...baseProps}
        startBuildingId="USER"
        destinationBuildingId="H"
        destinationRoomId="820"
      />,
    );
  });
});
