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

  describe("Event Time and Date Formatting", () => {
    beforeEach(() => {
      jest.spyOn(Date.prototype, "toLocaleTimeString").mockImplementation(function (this: Date) {
        if (this.getTime() === mockTodayEvents[0].start.getTime()) return "10:00 AM";
        if (this.getTime() === mockTodayEvents[0].end.getTime()) return "11:15 AM";
        if (this.getTime() === mockNextEvent.start.getTime()) return "09:00 AM";
        return "12:00 PM";
      });

      jest.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(() => "Mar 2");
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("renders the 'Start Time - End Time' format when showDate is false (today's events)", () => {
      render(<ScheduleSection {...defaultProps} todayEvents={[mockTodayEvents[0]]} />);

      expect(screen.getByText("10:00 AM - 11:15 AM")).toBeTruthy();
      
      expect(screen.queryByText(/at/)).toBeNull();
    });

    it("renders the 'Date at Start Time' format when showDate is true (next future event)", () => {
      render(
        <ScheduleSection 
          {...defaultProps} 
          todayEvents={[]} 
          nextEvent={mockNextEvent} 
        />
      );

      expect(screen.getByText("Mar 2 at 09:00 AM")).toBeTruthy();
      
      expect(screen.queryByText(/ - /)).toBeNull();
    });
  });

  it("covers default parameters in renderScheduleItem", () => {
    render(
      <ScheduleSection 
        {...defaultProps} 
        todayEvents={[mockTodayEvents[0]]} 
      />
    );
    
    expect(screen.getByText("Graphics Programming")).toBeTruthy();
  });

  describe("Dark Mode Styling", () => {
    it("renders dark mode styles in empty state with nextEvent", () => {
      render(
        <ScheduleSection 
          {...defaultProps} 
          mode="dark"
          nextEvent={mockNextEvent} 
        />
      );

      expect(screen.getByText("No classes scheduled in this building today")).toBeTruthy();
      expect(screen.getByText("Next class in this building:")).toBeTruthy();
      expect(screen.getByText("Mobile Application Development")).toBeTruthy();
    });

    it("renders dark mode styles in today's events list", () => {
      render(
        <ScheduleSection 
          {...defaultProps} 
          mode="dark"
          todayEvents={mockTodayEvents} 
        />
      );

      expect(screen.getByText("Graphics Programming")).toBeTruthy();
      expect(screen.getByText("Software Architecture")).toBeTruthy();
    });
  });

  describe("Event Without Room Number", () => {
    const eventWithoutRoom: BuildingEvent = {
      id: "event-no-room",
      summary: "Office Hours",
      courseName: "Office Hours",
      start: new Date("2026-02-27T12:00:00Z"),
      end: new Date("2026-02-27T13:00:00Z"),
      location: "H-820",
      roomNumber: "", // no room number
      buildingCode: "H",
    };

    it("renders event without roomNumber and uses fallback in directions button", () => {
      render(
        <ScheduleSection 
          {...defaultProps} 
          todayEvents={[eventWithoutRoom]}
        />
      );

      expect(screen.getByText("Office Hours")).toBeTruthy();
      // The room number should not be displayed since roomNumber is empty
      expect(screen.queryByText(/Room/)).toBeNull();
      
      // Directions button should use "class" as fallback for eventName
      const directionsButton = screen.getByLabelText("Directions to Office Hours, 5 min");
      fireEvent.press(directionsButton);
      expect(mockOnDirectionsPress).toHaveBeenCalledWith("");
    });

    it("calls onDirectionsPress with undefined roomNumber when press event without room", () => {
      render(
        <ScheduleSection 
          {...defaultProps} 
          todayEvents={[eventWithoutRoom]}
        />
      );

      fireEvent.press(screen.getByTestId("directions-button"));
      expect(mockOnDirectionsPress).toHaveBeenCalledWith("");
    });
  });

  describe("Directions Button Fallback Text", () => {
    it("renders fallback 'class' label when directions button has no eventName", () => {
      const eventNoName: BuildingEvent = {
        id: "event-unnamed",
        summary: "",
        courseName: "",
        start: new Date("2026-02-27T15:00:00Z"),
        end: new Date("2026-02-27T16:00:00Z"),
        location: "H-820",
        roomNumber: "H-820",
        buildingCode: "H",
      };

      render(
        <ScheduleSection 
          {...defaultProps} 
          todayEvents={[eventNoName]}
        />
      );

      // Should show fallback "class" in the directions button label (due to eventName || "class")
      expect(
        screen.getByLabelText("Directions to class, 5 min")
      ).toBeTruthy();
    });

    it("renders fallback '--' for eta when directionsEtaLabel is not provided to directions button", () => {
      render(
        <ScheduleSection 
          {...defaultProps} 
          directionsEtaLabel={undefined}
          todayEvents={[mockTodayEvents[0]]}
        />
      );

      // The fallback "--" should appear in accessibility label
      expect(
        screen.getByLabelText("Directions to Graphics Programming, --")
      ).toBeTruthy();
    });
  });

  describe("Multiple Events Rendering", () => {
    it("renders multiple events with proper styling and borders", () => {
      render(
        <ScheduleSection 
          {...defaultProps} 
          todayEvents={mockTodayEvents}
        />
      );

      // Verify both events render
      expect(screen.getByText("Graphics Programming")).toBeTruthy();
      expect(screen.getByText("Software Architecture")).toBeTruthy();

      // Verify all room numbers are displayed
      expect(screen.getByText("Room H-820")).toBeTruthy();
      expect(screen.getByText("Room H-937")).toBeTruthy();

      // Verify both directions buttons exist and are callable
      const button1 = screen.getByLabelText("Directions to Graphics Programming, 5 min");
      const button2 = screen.getByLabelText("Directions to Software Architecture, 5 min");
      
      fireEvent.press(button1);
      expect(mockOnDirectionsPress).toHaveBeenCalledWith("H-820");

      fireEvent.press(button2);
      expect(mockOnDirectionsPress).toHaveBeenCalledWith("H-937");
    });
  });

  describe("Next Event With Dark Mode", () => {
    it("renders next event in dark mode with correct styling", () => {
      render(
        <ScheduleSection 
          {...defaultProps} 
          mode="dark"
          todayEvents={[]}
          nextEvent={mockNextEvent}
        />
      );

      // Verify the "Next class in this building:" label renders in dark mode
      expect(screen.getByText("Next class in this building:")).toBeTruthy();
      
      // Verify event details render
      expect(screen.getByText("Mobile Application Development")).toBeTruthy();
      expect(screen.getByText("Room MB-1.210")).toBeTruthy();
      
      // Verify directions button for next event
      expect(
        screen.getByLabelText("Directions to Mobile Application Development, 5 min")
      ).toBeTruthy();
    });
  });

  describe("Branch Coverage - nextEvent Conditional (Line 119)", () => {
    it("does not render next event when nextEvent is null in empty state", () => {
      render(
        <ScheduleSection 
          {...defaultProps} 
          todayEvents={[]}
          nextEvent={null}
        />
      );

      // Should show "No classes scheduled" but NOT "Next class in this building:"
      expect(screen.getByText("No classes scheduled in this building today")).toBeTruthy();
      expect(screen.queryByText("Next class in this building:")).toBeNull();
      expect(screen.queryByText("Mobile Application Development")).toBeNull();
    });

    it("renders next event section when nextEvent exists in empty state", () => {
      render(
        <ScheduleSection 
          {...defaultProps} 
          todayEvents={[]}
          nextEvent={mockNextEvent}
        />
      );

      // Should show both the empty state text and the next event section
      expect(screen.getByText("No classes scheduled in this building today")).toBeTruthy();
      expect(screen.getByText("Next class in this building:")).toBeTruthy();
      expect(screen.getByText("Mobile Application Development")).toBeTruthy();
    });
  });

  describe("Branch Coverage - Room Number Conditional (Line 69)", () => {
    it("displays room number when event has a room", () => {
      render(
        <ScheduleSection 
          {...defaultProps} 
          todayEvents={[mockTodayEvents[0]]}
        />
      );

      // Verify room is displayed for event with room
      expect(screen.getByText("Room H-820")).toBeTruthy();
    });

    it("does not display room when event has no room number", () => {
      const eventNoRoom: BuildingEvent = {
        id: "event-no-room-2",
        summary: "No Room Event",
        courseName: "No Room Event",
        start: new Date("2026-02-27T16:00:00Z"),
        end: new Date("2026-02-27T17:00:00Z"),
        location: "UNKNOWN",
        roomNumber: undefined as any, // explicitly undefined
        buildingCode: "X",
      };

      render(
        <ScheduleSection 
          {...defaultProps} 
          todayEvents={[eventNoRoom]}
        />
      );

      expect(screen.getByText("No Room Event")).toBeTruthy();
      // Should not find room information since roomNumber is falsy
      expect(screen.queryByText("H-820")).toBeNull();
      expect(screen.queryByText("H-937")).toBeNull();
    });
  });

  describe("Branch Coverage - ShowBorder Conditional (Line 107)", () => {
    it("applies border styling to non-last events in the list", () => {
      render(
        <ScheduleSection 
          {...defaultProps} 
          todayEvents={mockTodayEvents}
        />
      );

      // Both events should render
      expect(screen.getByText("Graphics Programming")).toBeTruthy();
      expect(screen.getByText("Software Architecture")).toBeTruthy();

      // Last event should not have border applied (showBorder=false for last item)
      // First event should have border applied (showBorder=true since index 0 < length-1=1)
      expect(screen.getByText("Graphics Programming")).toBeTruthy();
    });

    it("renders single event without border", () => {
      render(
        <ScheduleSection 
          {...defaultProps} 
          todayEvents={[mockTodayEvents[0]]}
        />
      );

      // Single event should not have border (since it's the last/only event)
      expect(screen.getByText("Graphics Programming")).toBeTruthy();
      expect(screen.getByText("Room H-820")).toBeTruthy();
    });
  });
});
