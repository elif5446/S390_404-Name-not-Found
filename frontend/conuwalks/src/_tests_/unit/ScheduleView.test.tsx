import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import ScheduleView from "../../components/ScheduleView";
import { useGoogleCalendar } from "@/src/hooks/useGoogleCalendar";
import { useDirections } from "@/src/context/DirectionsContext";

// Mock SafeAreaView to return a standard View for testing
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  return {
    SafeAreaView: (props: any) => React.createElement("View", props, props.children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Mock internal hooks and assets
jest.mock("@/src/hooks/useGoogleCalendar");
jest.mock("@/src/context/DirectionsContext");
jest.mock("@/src/hooks/useUserLocation", () => ({
  useUserLocation: () => ({
    location: { latitude: 45.497, longitude: -73.578 },
  }),
}));
jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-symbols", () => ({ SymbolView: () => null }));

jest.mock("@/src/utils/geometry", () => ({
  calculatePolygonCenter: jest.fn(() => ({
    latitude: 45.497,
    longitude: -73.578,
  })),
  // 810 meters / 1.35 m/s / 60 seconds = exactly 10 minutes!
  distanceMetersBetween: jest.fn(() => 810),
}));

jest.mock("@/src/hooks/useBuildingEvents", () => ({
  parseLocation: jest.fn(() => ({ buildingCode: "H", room: "820" })),
}));

jest.mock("@/src/data/metadata/SGW.BuildingMetaData", () => ({
  SGWBuildingMetadata: { H: { name: "Hall Building" } },
}));

jest.mock("@/src/data/metadata/LOY.BuildingMetadata", () => ({
  LoyolaBuildingMetadata: {},
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
            [-73.576, 45.496],
          ],
        ],
      },
    },
  ],
}));

jest.mock("@/src/data/campus/LOY.geojson", () => ({
  features: [],
}));

jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-symbols", () => ({ SymbolView: () => null }));

describe("ScheduleView", () => {
  const mockSetDestination = jest.fn();
  const mockSetShowDirections = jest.fn();
  const mockSetStartPoint = jest.fn();
  const mockNavigate = jest.fn();

  const mockEvents = [
    {
      id: "1",
      summary: "Software Engineering",
      location: "H-820",
      start: { dateTime: new Date().toISOString() },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: mockEvents,
      loading: false,
      error: null,
      fetchUpcomingEvents: jest.fn(),
    });

    (useDirections as jest.Mock).mockReturnValue({
      startCoords: null, // Needed so the user location useEffect fires properly
      setStartPoint: mockSetStartPoint,
      setDestination: mockSetDestination,
      setShowDirections: mockSetShowDirections,
    });
  });

  it("renders class details from the calendar correctly", () => {
    render(<ScheduleView />);
    expect(screen.getByText("Software Engineering")).toBeTruthy();
    expect(screen.getByText("H-820")).toBeTruthy();
  });

  it("initiates navigation logic when the duration button is tapped", () => {
    render(<ScheduleView onNavigateToClass={mockNavigate} />);

    // Finds the button by the duration text calculated by the mocked distanceMetersBetween
    const navBtn = screen.getByText("10 min");
    fireEvent.press(navBtn);

    // Verify it was correctly parsed and mapped to the Hall Building mock
    expect(mockSetDestination).toHaveBeenCalledWith("H", expect.any(Object), "Hall Building", undefined);
    expect(mockSetShowDirections).toHaveBeenCalledWith(true);
    expect(mockNavigate).toHaveBeenCalled();
  });
});
