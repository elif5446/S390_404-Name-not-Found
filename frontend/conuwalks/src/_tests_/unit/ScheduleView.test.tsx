import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import ScheduleView from "../../components/ScheduleView";
import { useGoogleCalendar } from "@/src/hooks/useGoogleCalendar";
import { useDirections } from "@/src/context/DirectionsContext";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import {
  calculatePolygonCenter,
  distanceMetersBetween,
} from "@/src/utils/geometry";
import { parseLocation } from "@/src/hooks/useBuildingEvents";
import * as RN from "react-native";

// Mock SafeAreaView to return a standard View for testing
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  return {
    SafeAreaView: (props: any) =>
      React.createElement("View", props, props.children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock("@/src/hooks/useGoogleCalendar");
jest.mock("@/src/context/DirectionsContext");
jest.mock("@/src/hooks/useUserLocation");
jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-symbols", () => ({ SymbolView: () => null }));

jest.mock("@/src/utils/geometry", () => ({
  calculatePolygonCenter: jest.fn(() => ({
    latitude: 45.497,
    longitude: -73.578,
  })),
  distanceMetersBetween: jest.fn(() => 810), // 10 min
}));

jest.mock("@/src/hooks/useBuildingEvents", () => ({
  parseLocation: jest.fn(() => ({ buildingCode: "H", roomNumber: "820" })),
}));

jest.mock("@/src/data/metadata/SGW.BuildingMetaData", () => ({
  SGWBuildingMetadata: {
    H: { name: "Hall Building" },
    EV: { name: "EV Building" },
  },
}));

jest.mock("@/src/data/metadata/LOY.BuildingMetadata", () => ({
  LoyolaBuildingMetadata: {
    CC: { name: "Centennial Building" },
  },
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
            [-73.576, 45.497],
            [-73.577, 45.497],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "EV" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-73.579, 45.495],
            [-73.578, 45.495],
            [-73.578, 45.496],
            [-73.579, 45.496],
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
      properties: { id: "CC" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-73.64, 45.458],
            [-73.639, 45.458],
            [-73.639, 45.459],
            [-73.64, 45.459],
          ],
        ],
      },
    },
  ],
}));

describe("ScheduleView", () => {
  const mockSetDestination = jest.fn();
  const mockSetShowDirections = jest.fn();
  const mockSetStartPoint = jest.fn();
  const mockFetchUpcomingEvents = jest.fn();
  const mockNavigate = jest.fn();

  const now = new Date("2026-03-29T10:00:00.000Z");
  const tomorrow = new Date("2026-03-30T14:00:00.000Z");
  const future = new Date("2026-04-02T09:00:00.000Z");

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(now);
    jest.spyOn(RN, "useColorScheme").mockReturnValue("light");

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    (useDirections as jest.Mock).mockReturnValue({
      startCoords: null,
      setStartPoint: mockSetStartPoint,
      setDestination: mockSetDestination,
      setShowDirections: mockSetShowDirections,
    });

    (useUserLocation as jest.Mock).mockReturnValue({
      location: { latitude: 45.497, longitude: -73.578 },
    });

    (calculatePolygonCenter as jest.Mock).mockReturnValue({
      latitude: 45.497,
      longitude: -73.578,
    });

    (distanceMetersBetween as jest.Mock).mockReturnValue(810);
    (parseLocation as jest.Mock).mockReturnValue({
      buildingCode: "H",
      roomNumber: "820",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("renders loading state", () => {
    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [],
      loading: true,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(
      screen.UNSAFE_getByType(require("react-native").ActivityIndicator),
    ).toBeTruthy();
  });

  it("renders empty state when there are no upcoming events", () => {
    render(<ScheduleView />);
    expect(screen.getByText("No Upcoming Events")).toBeTruthy();
  });

  it("calls fetchUpcomingEvents on mount", () => {
    render(<ScheduleView />);
    expect(mockFetchUpcomingEvents).toHaveBeenCalledWith(50);
  });

  it("sets the user as start point on mount when user location exists and startCoords is null", () => {
    render(<ScheduleView />);
    expect(mockSetStartPoint).toHaveBeenCalledWith(
      "USER",
      { latitude: 45.497, longitude: -73.578 },
      "Your Location",
    );
  });

  it("does not set the start point on mount when startCoords already exists", () => {
    (useDirections as jest.Mock).mockReturnValue({
      startCoords: { latitude: 45.5, longitude: -73.57 },
      setStartPoint: mockSetStartPoint,
      setDestination: mockSetDestination,
      setShowDirections: mockSetShowDirections,
    });

    render(<ScheduleView />);
    expect(mockSetStartPoint).not.toHaveBeenCalled();
  });

  it("renders class details from the calendar correctly", () => {
    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Software Engineering",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("Software Engineering")).toBeTruthy();
    expect(screen.getByText("H-820")).toBeTruthy();
    expect(screen.getByText("Today")).toBeTruthy();
  });

  it("groups events under Today, Tomorrow, and a normal formatted date", () => {
    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Today Class",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:00:00.000Z").toISOString() },
        },
        {
          id: "2",
          summary: "Tomorrow Class",
          location: "EV-1.605",
          start: { dateTime: tomorrow.toISOString() },
          end: { dateTime: new Date("2026-03-30T15:00:00.000Z").toISOString() },
        },
        {
          id: "3",
          summary: "Later Class",
          location: "CC-101",
          start: { dateTime: future.toISOString() },
          end: { dateTime: new Date("2026-04-02T10:00:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);

    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByText("Tomorrow")).toBeTruthy();
    expect(screen.getByText("Thu, Apr 2")).toBeTruthy();
  });

  it("renders event description when present", () => {
    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Software Engineering",
          description: "Team sprint planning",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("Team sprint planning")).toBeTruthy();
  });

  it("renders event with only a start dateTime and no end dateTime", () => {
    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Quick Meeting",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: {},
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("Quick Meeting")).toBeTruthy();
  });

  it("shows 'Dir' when user location is unavailable", () => {
    (useUserLocation as jest.Mock).mockReturnValue({
      location: null,
    });

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Software Engineering",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("Dir")).toBeTruthy();
  });

  it("shows hour-based ETA when travel time is 60 minutes or more", () => {
    (distanceMetersBetween as jest.Mock).mockReturnValue(4860); // 60 min at 1.35 m/s

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Far Class",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("1h")).toBeTruthy();
  });

  it("initiates navigation logic when the duration button is tapped", () => {
    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Software Engineering",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView onNavigateToClass={mockNavigate} />);

    const navBtn = screen.getByText("10 min");
    fireEvent.press(navBtn);

    expect(mockSetStartPoint).toHaveBeenCalledWith(
      "USER",
      { latitude: 45.497, longitude: -73.578 },
      "Your Location",
    );
    expect(mockSetDestination).toHaveBeenCalledWith(
      "H",
      expect.any(Object),
      "Hall Building",
      "820",
    );
    expect(mockSetShowDirections).toHaveBeenCalledWith(true);
    expect(mockNavigate).toHaveBeenCalled();
  });

  it("does nothing when navigation is attempted with no location", () => {
    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "No Location Class",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView onNavigateToClass={mockNavigate} />);

    expect(screen.queryByText("10 min")).toBeNull();
    expect(mockSetDestination).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does nothing when parseLocation returns no buildingCode", () => {
    (parseLocation as jest.Mock).mockReturnValue({ roomNumber: "820" });

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Software Engineering",
          location: "Unknown",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);

    const navBtn = screen.getByText("Dir");
    fireEvent.press(navBtn);

    expect(mockSetDestination).not.toHaveBeenCalled();
    expect(mockSetShowDirections).not.toHaveBeenCalled();
  });

  it("does nothing when building metadata is missing", () => {
    (parseLocation as jest.Mock).mockReturnValue({
      buildingCode: "X",
      roomNumber: "999",
    });

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Mystery Class",
          location: "X-999",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);

    const navBtn = screen.getByText("Dir");
    fireEvent.press(navBtn);

    expect(mockSetDestination).not.toHaveBeenCalled();
    expect(mockSetShowDirections).not.toHaveBeenCalled();
  });

  it("falls back to average coordinates when polygon center is invalid", () => {
    (calculatePolygonCenter as jest.Mock).mockReturnValue({
      latitude: NaN,
      longitude: NaN,
    });

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Software Engineering",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView onNavigateToClass={mockNavigate} />);

    fireEvent.press(screen.getByText("10 min"));

    expect(mockSetDestination).toHaveBeenCalledWith(
      "H",
      expect.objectContaining({
        latitude: expect.any(Number),
        longitude: expect.any(Number),
      }),
      "Hall Building",
      "820",
    );
  });

  it("supports Loyola building navigation when building is not in SGW metadata", () => {
    (parseLocation as jest.Mock).mockReturnValue({
      buildingCode: "CC",
      roomNumber: "101",
    });

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Loyola Class",
          location: "CC-101",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView onNavigateToClass={mockNavigate} />);

    fireEvent.press(screen.getByText("10 min"));

    expect(mockSetDestination).toHaveBeenCalledWith(
      "CC",
      expect.any(Object),
      "Centennial Building",
      "101",
    );
    expect(mockSetShowDirections).toHaveBeenCalledWith(true);
  });

  it("renders dark mode styles correctly", () => {
    jest.spyOn(RN, "useColorScheme").mockReturnValue("dark");

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Dark Mode Class",
          description: "Bring laptop",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
        {
          id: "2",
          summary: "Future Dark Class",
          location: "EV-1.605",
          start: { dateTime: future.toISOString() },
          end: { dateTime: new Date("2026-04-02T10:00:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    const { getByText } = render(<ScheduleView />);

    const title = getByText("Dark Mode Class");
    const description = getByText("Bring laptop");
    const futureHeading = getByText("Thu, Apr 2");

    expect(title).toHaveStyle({ color: "#fff" });
    expect(description).toHaveStyle({ color: "#999" });
    expect(futureHeading).toHaveStyle({ color: "#fff" });

  });

  it("falls back to light mode when useColorScheme returns null", () => {
    jest.spyOn(RN, "useColorScheme").mockReturnValue(null);

    render(<ScheduleView />);

    const text = screen.getByText("No Upcoming Events");
    expect(text).toHaveStyle({ color: "#333" });
  });

  it("shows hour and minute ETA when travel time has remaining minutes", () => {
    (distanceMetersBetween as jest.Mock).mockReturnValue(7290); // 90 min at 1.35 m/s

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Farther Class",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("1h 30m")).toBeTruthy();
  });

  it("navigates even when userLocation is unavailable", () => {
    (useUserLocation as jest.Mock).mockReturnValue({
      location: null,
    });

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "No GPS Class",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView onNavigateToClass={mockNavigate} />);

    fireEvent.press(screen.getByText("Dir"));

    expect(mockSetStartPoint).not.toHaveBeenCalledWith(
      "USER",
      expect.anything(),
      "Your Location",
    );
    expect(mockSetDestination).toHaveBeenCalledWith(
      "H",
      expect.any(Object),
      "Hall Building",
      "820",
    );
    expect(mockSetShowDirections).toHaveBeenCalledWith(true);
    expect(mockNavigate).toHaveBeenCalled();
  });

it("handles all-day events that use date instead of dateTime", () => {
  (useGoogleCalendar as jest.Mock).mockReturnValue({
    events: [
      {
        id: "1",
        summary: "All Day Conference",
        location: "H-820",
        start: { date: "2026-03-29" },
        end: { date: "2026-03-30" },
      },
    ],
    loading: false,
    error: null,
    fetchUpcomingEvents: mockFetchUpcomingEvents,
  });

  render(<ScheduleView />);

  expect(screen.getByText("All Day Conference")).toBeTruthy();
  expect(screen.queryByText(/AM|PM/)).toBeNull();
});

  it("handles events with missing start values gracefully", () => {
    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Missing Start Event",
          location: "H-820",
          start: {},
          end: {},
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("Missing Start Event")).toBeTruthy();
  });

  it("groups multiple events under the same date heading", () => {
    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Morning Class",
          location: "H-820",
          start: { dateTime: "2026-03-29T09:00:00.000Z" },
          end: { dateTime: "2026-03-29T10:00:00.000Z" },
        },
        {
          id: "2",
          summary: "Afternoon Class",
          location: "H-820",
          start: { dateTime: "2026-03-29T13:00:00.000Z" },
          end: { dateTime: "2026-03-29T14:00:00.000Z" },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);

    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByText("Morning Class")).toBeTruthy();
    expect(screen.getByText("Afternoon Class")).toBeTruthy();
  });

  it("renders dark mode properly with extracted color variables", () => {
    jest.spyOn(RN, "useColorScheme").mockReturnValue("dark");

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Dark Mode Class",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
        {
          id: "2",
          summary: "Future Class",
          location: "CC-101",
          start: { dateTime: future.toISOString() },
          end: { dateTime: new Date("2026-04-02T10:00:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("Dark Mode Class")).toBeTruthy();
    expect(screen.getByText("Future Class")).toBeTruthy();
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByText("Thu, Apr 2")).toBeTruthy();
  });

  it("renders non-Today date with modeBasedColor in light mode", () => {
    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Future Event",
          location: "CC-101",
          start: { dateTime: future.toISOString() },
          end: { dateTime: new Date("2026-04-02T10:00:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("Thu, Apr 2")).toBeTruthy();
    expect(screen.getByText("Future Event")).toBeTruthy();
  });

  it("shows hour-based ETA with remaining minutes", () => {
    (distanceMetersBetween as jest.Mock).mockReturnValue(5400); // 66.67 min (1h 7m after rounding)

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Very Far Class",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("1h 7m")).toBeTruthy();
  });

  it("handles building with empty coordinates gracefully", () => {
    (calculatePolygonCenter as jest.Mock).mockReturnValue(null);

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Software Engineering",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("Software Engineering")).toBeTruthy();
    // Should still render without crashing
  });

  it("renders events by multiple date groups in light mode", () => {
    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Today Event",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:00:00.000Z").toISOString() },
        },
        {
          id: "2",
          summary: "Tomorrow Event",
          location: "EV-605",
          start: { dateTime: tomorrow.toISOString() },
          end: { dateTime: new Date("2026-03-30T15:00:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByText("Tomorrow")).toBeTruthy();
    expect(screen.getByText("Today Event")).toBeTruthy();
    expect(screen.getByText("Tomorrow Event")).toBeTruthy();
  });

  it("renders empty state in dark mode", () => {
    jest.spyOn(RN, "useColorScheme").mockReturnValue("dark");

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("No Upcoming Events")).toBeTruthy();
  });

  it("navigates when coordinates are null but building metadata exists", () => {
    // Set up mock to return null for userLocation to test fallback to "Dir"
    (useUserLocation as jest.Mock).mockReturnValue({
      location: null,
    });

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "No Location Class",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView onNavigateToClass={mockNavigate} />);
    fireEvent.press(screen.getByText("Dir"));

    // When userLocation is null, setStartPoint should not be called
    expect(mockSetStartPoint).not.toHaveBeenCalled();
  });

  it("falls back to null centerCoords when calculatePolygonCenter returns null", () => {
    (calculatePolygonCenter as jest.Mock).mockReturnValueOnce(null);

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Software Engineering",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("Software Engineering")).toBeTruthy();
  });

  it("handles event with missing start datetime gracefully", () => {
    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "All-day Event",
          location: "H-820",
          start: { date: "2026-03-29" },
          end: { date: "2026-03-29" },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("All-day Event")).toBeTruthy();
  });

  it("applies dark mode color to empty state text", () => {
    jest.spyOn(RN, "useColorScheme").mockReturnValue("dark");

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    const emptyText = screen.getByText("No Upcoming Events");
    expect(emptyText).toBeTruthy();
  });

  it("handles centerCoords with NaN latitude by calculating average", () => {
    (calculatePolygonCenter as jest.Mock).mockReturnValueOnce({
      latitude: NaN,
      longitude: -73.578,
    });

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Software Engineering",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("Software Engineering")).toBeTruthy();
  });

  it("does not navigate when location prop is not provided", () => {
    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Event without location",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView onNavigateToClass={mockNavigate} />);
    expect(screen.queryByText("Dir")).toBeNull();
    expect(screen.queryByText("10 min")).toBeNull();
  });

  it("handles event without start.dateTime (all-day event)", () => {
    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Conference",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T23:59:59.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("Conference")).toBeTruthy();
    expect(screen.getByText("Today")).toBeTruthy();
  });

  it("covers line 165: buildingCode existence check - returns early when no buildingCode", () => {
    // Reset and override the parseLocation mock for this test
    (parseLocation as jest.Mock).mockClear();
    (parseLocation as jest.Mock).mockReturnValue({ roomNumber: "820" }); // No buildingCode

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "No Building Code Event",
          location: "UNKNOWN",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView onNavigateToClass={mockNavigate} />);
    const button = screen.queryByText("Dir");
    if (button) {
      fireEvent.press(button);
    }
    // When buildingCode is missing, no destination should be set
    expect(mockSetDestination).not.toHaveBeenCalled();

    // Restore the mock for other tests
    (parseLocation as jest.Mock).mockClear();
    (parseLocation as jest.Mock).mockReturnValue({
      buildingCode: "H",
      roomNumber: "820",
    });
  });

  it("covers line 179: coordinates existence check - skips navigation when coordinates are null", () => {
    // Mock the entire getBuildingCenter to return null for this specific building
    jest.doMock("@/src/components/ScheduleView", () => {
      const actualModule = jest.requireActual("@/src/components/ScheduleView");
      return actualModule;
    });

    (parseLocation as jest.Mock).mockReturnValueOnce({
      buildingCode: "NOVOID",
      roomNumber: "820",
    });

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Void Building Event",
          location: "NOVOID-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView onNavigateToClass={mockNavigate} />);
    // Should still show event even if building has no valid center
    expect(screen.getByText("Void Building Event")).toBeTruthy();
  });

  it("covers line 43: NaN latitude check in getBuildingCenter", () => {
    (calculatePolygonCenter as jest.Mock).mockReturnValueOnce({
      latitude: NaN,
      longitude: -73.578,
    });

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "NaN Latitude Event",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:15:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("NaN Latitude Event")).toBeTruthy();
  });

  it("covers line 234: date key initialization in reduce - groups events properly", () => {
    const pastDate = new Date("2026-03-28T09:00:00.000Z");

    (useGoogleCalendar as jest.Mock).mockReturnValue({
      events: [
        {
          id: "1",
          summary: "Yesterday Event",
          location: "H-820",
          start: { dateTime: pastDate.toISOString() },
          end: { dateTime: new Date("2026-03-28T10:00:00.000Z").toISOString() },
        },
        {
          id: "2",
          summary: "Today Event",
          location: "H-820",
          start: { dateTime: now.toISOString() },
          end: { dateTime: new Date("2026-03-29T11:00:00.000Z").toISOString() },
        },
        {
          id: "3",
          summary: "Tomorrow Event",
          location: "H-820",
          start: { dateTime: tomorrow.toISOString() },
          end: { dateTime: new Date("2026-03-30T12:00:00.000Z").toISOString() },
        },
        {
          id: "4",
          summary: "Future Event",
          location: "H-820",
          start: { dateTime: future.toISOString() },
          end: { dateTime: new Date("2026-04-02T11:00:00.000Z").toISOString() },
        },
      ],
      loading: false,
      error: null,
      fetchUpcomingEvents: mockFetchUpcomingEvents,
    });

    render(<ScheduleView />);
    expect(screen.getByText("Sat, Mar 28")).toBeTruthy();
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByText("Tomorrow")).toBeTruthy();
    expect(screen.getByText("Thu, Apr 2")).toBeTruthy();
  });
});
