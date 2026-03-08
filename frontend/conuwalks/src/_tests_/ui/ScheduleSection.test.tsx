import React from "react";
import { ActivityIndicator } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import ScheduleSection from "../../components/ScheduleSection";
import { BuildingEvent } from "../../hooks/useBuildingEvents";

// mock the vector icons
jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");

// mock styles to prevent undefined object errors during render
jest.mock("../../styles/scheduleSection", () => ({
  __esModule: true,
  default: {
    section: {},
    scheduleHeader: {},
    sectionTitle: {},
    noEventsContainer: {},
    noEventsText: {},
    nextEventLabel: {},
    eventsList: {},
    eventContent: {},
    eventTitle: {},
    eventDetailsRow: {},
    eventTime: {},
    eventRoom: {},
    eventItemWithButton: {},
    eventItemBorder: {},
  },
}));

describe("ScheduleSection Component", () => {
  const mockOnDirectionsPress = jest.fn();

  const mockTodayEvents: BuildingEvent[] = [
    {
      id: "event-1",
      summary: "Graphics Programming",
      courseName: "Graphics Programming",
      start: new Date("2026-02-27T10:00:00Z"),
      end: new Date("2026-02-27T11:15:00Z"),
      location: "H-820", // required by interface
      roomNumber: "H-820", // required by component UI
      buildingCode: "H",
    },
    {
      id: "event-2",
      summary: "Software Architecture",
      courseName: "Software Architecture",
      start: new Date("2026-02-27T14:00:00Z"),
      end: new Date("2026-02-27T16:00:00Z"),
      location: "H-937",
      roomNumber: "H-937",
      buildingCode: "H",
    },
  ];

  const mockNextEvent: BuildingEvent = {
    id: "event-3",
    summary: "Mobile Application Development",
    courseName: "Mobile Application Development",
    start: new Date("2026-03-02T09:00:00Z"),
    end: new Date("2026-03-02T10:15:00Z"),
    location: "MB-1.210",
    roomNumber: "MB-1.210",
    buildingCode: "MB",
  };

  const defaultProps = {
    eventsLoading: false,
    todayEvents: [],
    nextEvent: null,
    campusPink: "#B03060",
    directionsEtaLabel: "5 min",
    onDirectionsPress: mockOnDirectionsPress,
    mode: "light" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Conditional Rendering States", () => {
    it("renders the loading state correctly with an ActivityIndicator", () => {
      render(<ScheduleSection {...defaultProps} eventsLoading={true} />);

      expect(screen.getByText("Schedule")).toBeTruthy();

      // look for the activityindicator by type
      const loadingIndicator = screen.UNSAFE_queryByType(ActivityIndicator);
      expect(loadingIndicator).toBeTruthy();

      // ensure "no classes" text is not shown while loading
      expect(
        screen.queryByText("No classes scheduled in this building today"),
      ).toBeNull();
    });

    it("renders the empty state when there are no events today and no next event", () => {
      render(<ScheduleSection {...defaultProps} />);

      expect(screen.getByText("Schedule")).toBeTruthy();
      expect(
        screen.getByText("No classes scheduled in this building today"),
      ).toBeTruthy();
      expect(screen.queryByText("Next class in this building:")).toBeNull();
    });

    it("renders the next event state when today is empty but a future event exists", () => {
      render(<ScheduleSection {...defaultProps} nextEvent={mockNextEvent} />);

      expect(
        screen.getByText("No classes scheduled in this building today"),
      ).toBeTruthy();
      expect(screen.getByText("Next class in this building:")).toBeTruthy();

      // verify the next event details render
      expect(screen.getByText("Mobile Application Development")).toBeTruthy();
      expect(screen.getByText("Room MB-1.210")).toBeTruthy();

      // verify directions button has the correct accessible label
      expect(
        screen.getByLabelText(
          "Directions to Mobile Application Development, 5 min",
        ),
      ).toBeTruthy();
    });

    it("renders today's events list correctly", () => {
      render(
        <ScheduleSection {...defaultProps} todayEvents={mockTodayEvents} />,
      );

      // verify both events render
      expect(screen.getByText("Graphics Programming")).toBeTruthy();
      expect(screen.getByText("Software Architecture")).toBeTruthy();

      // verify room numbers
      expect(screen.getByText("Room H-820")).toBeTruthy();
      expect(screen.getByText("Room H-937")).toBeTruthy();

      // ensure the empty states are not visible
      expect(
        screen.queryByText("No classes scheduled in this building today"),
      ).toBeNull();

      // verify both directions buttons rendered with correct labels
      expect(
        screen.getByLabelText("Directions to Graphics Programming, 5 min"),
      ).toBeTruthy();
      expect(
        screen.getByLabelText("Directions to Software Architecture, 5 min"),
      ).toBeTruthy();
    });
  });

  describe("Interactions", () => {
    it("fires onDirectionsPress when a schedule item directions button is tapped", () => {
      render(
        <ScheduleSection
          {...defaultProps}
          todayEvents={[mockTodayEvents[0]]}
        />,
      );

      const directionsButton = screen.getByLabelText(
        "Directions to Graphics Programming, 5 min",
      );
      fireEvent.press(directionsButton);

      expect(mockOnDirectionsPress).toHaveBeenCalledTimes(1);
    });

    it("handles missing directionsEtaLabel gracefully", () => {
      render(
        <ScheduleSection
          {...defaultProps}
          directionsEtaLabel={undefined}
          todayEvents={[mockTodayEvents[0]]}
        />,
      );

      // should default to "--" string
      expect(screen.getByText("--")).toBeTruthy();

      const directionsButton = screen.getByLabelText(
        "Directions to Graphics Programming, --",
      );
      expect(directionsButton).toBeTruthy();
    });
  });
});
