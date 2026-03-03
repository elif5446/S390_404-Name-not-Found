import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import ScheduleView from "../../components/ScheduleView";
import { useGoogleCalendar } from "@/src/hooks/useGoogleCalendar";
import { useDirections } from "@/src/context/DirectionsContext";
import { useDestinationData } from "@/src/hooks/useDestinationData";

// Mock SafeAreaView to return a standard View for testing
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  return {
    SafeAreaView: (props: any) =>
      React.createElement("View", props, props.children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Mock internal hooks and assets
jest.mock("@/src/hooks/useGoogleCalendar");
jest.mock("@/src/context/DirectionsContext");
jest.mock("@/src/hooks/useDestinationData");
jest.mock("@/src/hooks/useUserLocation", () => ({
  useUserLocation: () => ({
    location: { latitude: 45.497, longitude: -73.578 },
  }),
}));
jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-symbols", () => ({ SymbolView: () => null }));

describe("ScheduleView", () => {
  const mockSetDestination = jest.fn();
  const mockSetShowDirections = jest.fn();
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
      setStartPoint: jest.fn(),
      setDestination: mockSetDestination,
      setShowDirections: mockSetShowDirections,
    });

    // Provide the duration label that the component actually looks for
    (useDestinationData as jest.Mock).mockReturnValue({
      getModeDurationLabel: () => "10 min",
      routes: [],
      selectedRouteIndex: 0,
    });
  });

  it("renders class details from the calendar correctly", () => {
    render(<ScheduleView />);
    expect(screen.getByText("Software Engineering")).toBeTruthy();
    expect(screen.getByText("H-820")).toBeTruthy();
  });

  it("initiates navigation logic when the duration button is tapped", () => {
    render(<ScheduleView onNavigateToClass={mockNavigate} />);

    // Finds the button by the duration text provided by useDestinationData
    const navBtn = screen.getByText("10 min");
    fireEvent.press(navBtn);

    expect(mockSetDestination).toHaveBeenCalled();
    expect(mockSetShowDirections).toHaveBeenCalledWith(true);
    expect(mockNavigate).toHaveBeenCalled();
  });
});
