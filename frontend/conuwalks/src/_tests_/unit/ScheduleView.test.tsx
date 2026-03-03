import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import ScheduleView from "../../components/ScheduleView";
import { useGoogleCalendar } from "@/src/hooks/useGoogleCalendar";
import { useDirections } from "@/src/context/DirectionsContext";

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: (props: any) => React.createElement('View', props, props.children),
    SafeAreaProvider: (props: any) => React.createElement('View', props, props.children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Mock hooks
jest.mock("@/src/hooks/useGoogleCalendar");
jest.mock("@/src/context/DirectionsContext");
jest.mock("@/src/hooks/useUserLocation", () => ({
  useUserLocation: () => ({
    location: { latitude: 45.497, longitude: -73.578 }
  }),
}));

// Mock icons
jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");

describe("ScheduleView", () => {
  const mockSetDestination = jest.fn();
  const mockSetShowDirections = jest.fn();
  const mockSetStartPoint = jest.fn();
  const mockFetch = jest.fn();

  const mockEvents = [
    {
      id: "1",
      summary: "Software Engineering",
      location: "H-820",
      start: { dateTime: new Date().toISOString() },
      formattedTime: "10:00 AM",
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: mockEvents,
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetch,
    });
    (useDirections as jest.Mock).mockReturnValue({
      setStartPoint: mockSetStartPoint,
      setDestination: mockSetDestination,
      setShowDirections: mockSetShowDirections,
    });
  });

  it("renders events from the calendar", () => {
    render(<ScheduleView />);
    expect(screen.getByText("Software Engineering")).toBeTruthy();
  });

  it("triggers navigation when directions icon is pressed", () => {
    render(<ScheduleView />);

    // Target the button via visible text
    const navBtn = screen.getByText("GO");

    fireEvent.press(navBtn);

    expect(mockSetDestination).toHaveBeenCalled();
    expect(mockSetShowDirections).toHaveBeenCalledWith(true);
  });
});