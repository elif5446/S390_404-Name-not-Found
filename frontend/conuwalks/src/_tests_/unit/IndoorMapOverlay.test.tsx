import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
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
      // Mock successful route steps
      getRouteInstructions: jest.fn(() => ({
        steps: [{ id: "step1", text: "Go straight", node: { floorId: "H_1", x: 10, y: 10 } }],
      })),
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
  },
}));

jest.mock("@/src/data/poiData", () => ({
  getPOIsForFloor: jest.fn(() => [{ id: "poi1", room: "820", category: "ROOM", mapPosition: { x: 0.5, y: 0.5 } }]),
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
    function MockIndoorTopPanel() {
      return <></>;
    },
);
jest.mock(
  "@/src/components/indoor/IndoorRoomLabels",
  () =>
    function MockIndoorRoomLabels() {
      return <></>;
    },
);
jest.mock(
  "@/src/components/indoor/POIBadge",
  () =>
    function MockPOIBadge() {
      return <></>;
    },
);
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
  const { Text } = require("react-native");

  const MockDirectionsPopup = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      minimize: jest.fn(),
      dismiss: jest.fn(),
    }));
    return props.visible ? <Text testID="directions-popup">Directions Active</Text> : null;
  });

  MockDirectionsPopup.displayName = "MockIndoorDirectionsPopup";
  return MockDirectionsPopup;
});

jest.mock("@/src/components/indoor/POIFilterPanel", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const MockPOIPanel = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      minimize: jest.fn(),
    }));
    return props.visible ? <Text testID="poi-panel">POI Panel Active</Text> : null;
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
