import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import ScheduleView from "../../components/ScheduleView";
import { useGoogleCalendar } from "@/src/hooks/useGoogleCalendar";
import { useDirections } from "@/src/context/DirectionsContext";

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
      location: "H", // Using just the building code to ensure metadata match
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

    // Target the button via accessibility label
    const navBtn = screen.getByLabelText("Go to class location");

    fireEvent.press(navBtn);

    expect(mockSetDestination).toHaveBeenCalled();
    expect(mockSetShowDirections).toHaveBeenCalledWith(true);
  });
});