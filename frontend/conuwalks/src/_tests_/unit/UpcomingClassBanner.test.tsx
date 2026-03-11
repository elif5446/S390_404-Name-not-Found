import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { act } from "react";
import { PanResponder } from "react-native";
import UpcomingClassBanner from "../../components/UpcomingClassBanner";
import { useGoogleCalendar } from "@/src/hooks/useGoogleCalendar";
import { useDirections } from "@/src/context/DirectionsContext";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import {
  getClassReminderLeadTime,
  getDismissedClassEventIds,
  saveDismissedClassEventIds,
} from "@/src/utils/tokenStorage";

jest.mock("@/src/hooks/useGoogleCalendar");
jest.mock("@/src/context/DirectionsContext", () => ({
  useDirections: jest.fn(),
}));
jest.mock("@/src/hooks/useUserLocation", () => ({
  useUserLocation: jest.fn(),
}));
jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("@/src/utils/tokenStorage", () => ({
  getClassReminderLeadTime: jest.fn(),
  getDismissedClassEventIds: jest.fn(),
  saveDismissedClassEventIds: jest.fn(),
  DEFAULT_CLASS_REMINDER_LEAD_TIME_MINUTES: 10,
}));

// Capture PanResponder config so tests can call handlers directly
let capturedPanConfig: any = null;
jest.spyOn(PanResponder, "create").mockImplementation((config) => {
  capturedPanConfig = config;
  return { panHandlers: {} };
});

const mockUseGoogleCalendar = useGoogleCalendar as jest.Mock;
const mockUseDirections = useDirections as jest.Mock;
const mockUseUserLocation = useUserLocation as jest.Mock;
const mockGetClassReminderLeadTime = getClassReminderLeadTime as jest.Mock;
const mockGetDismissedClassEventIds = getDismissedClassEventIds as jest.Mock;
const mockSaveDismissedClassEventIds = saveDismissedClassEventIds as jest.Mock;

const mockSetStartPoint = jest.fn();
const mockSetDestination = jest.fn();
const mockSetShowDirections = jest.fn();

const getFromNow = (minutes: number) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
};

const createClassEvent = (
  id: string,
  summary: string,
  startsInMinutes: number,
  durationMinutes = 60,
  location = "H-820",
) => ({
  id,
  summary,
  start: { dateTime: getFromNow(startsInMinutes) },
  end: { dateTime: getFromNow(startsInMinutes + durationMinutes) },
  location,
});

const mockFetchUpcomingEvents = jest.fn();

const buildBaseMock = (events: any[]) =>
  mockUseGoogleCalendar.mockReturnValue({
    events,
    loading: false,
    error: null,
    fetchUpcomingEvents: mockFetchUpcomingEvents,
  });

describe("UpcomingClassBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedPanConfig = null;
    mockFetchUpcomingEvents.mockResolvedValue(undefined);
    mockGetClassReminderLeadTime.mockResolvedValue(30);
    mockGetDismissedClassEventIds.mockResolvedValue([]);
    mockSaveDismissedClassEventIds.mockResolvedValue(true);
    mockUseDirections.mockReturnValue({
      setStartPoint: mockSetStartPoint,
      setDestination: mockSetDestination,
      setShowDirections: mockSetShowDirections,
    });
    mockUseUserLocation.mockReturnValue({
      location: { latitude: 45.497, longitude: -73.579 },
    });
  });

  it("renders nothing when there are no events", () => {
    buildBaseMock([]);
    render(<UpcomingClassBanner />);
    expect(screen.queryByTestId("upcoming-class-banner")).toBeNull();
  });

  it("calls fetchUpcomingEvents on mount", () => {
    buildBaseMock([]);
    render(<UpcomingClassBanner />);
    expect(mockFetchUpcomingEvents).toHaveBeenCalledWith(50);
  });

  it("renders nothing when all events are in the past", () => {
    buildBaseMock([
      {
        id: "1",
        summary: "Past Class",
        start: { dateTime: getFromNow(-60) },
        end: { dateTime: getFromNow(-30) },
        location: "H-820",
      },
    ]);
    render(<UpcomingClassBanner />);
    expect(screen.queryByTestId("upcoming-class-banner")).toBeNull();
  });

  it("displays the next upcoming event summary", async () => {
    buildBaseMock([
      {
        id: "1",
        summary: "SOEN 390 - Software Engineering",
        start: { dateTime: getFromNow(30) },
        end: { dateTime: getFromNow(90) },
        location: "H-820",
      },
    ]);
    render(<UpcomingClassBanner />);
    await waitFor(() => {
      expect(
        screen.getByText(/Next Class: SOEN 390 - Software Engineering/i),
      ).toBeTruthy();
    });
  });

  it("shows the bell icon", async () => {
    buildBaseMock([
      {
        id: "1",
        summary: "COMP 346",
        start: { dateTime: getFromNow(10) },
        end: { dateTime: getFromNow(70) },
        location: "H-820",
      },
    ]);
    render(<UpcomingClassBanner />);
    await waitFor(() => {
      expect(screen.getByTestId("banner-bell-icon")).toBeTruthy();
    });
  });

  it("routes to in-app live navigation when Navigate is pressed", async () => {
    buildBaseMock([
      {
        id: "nav-event",
        summary: "COMP 346",
        start: { dateTime: getFromNow(10) },
        end: { dateTime: getFromNow(70) },
        location: "H-820",
      },
    ]);

    render(<UpcomingClassBanner />);

    const navigateButton = await waitFor(() =>
      screen.getByTestId("banner-navigate-button"),
    );
    fireEvent.press(navigateButton);

    await waitFor(() => {
      expect(mockSetStartPoint).toHaveBeenCalled();
      expect(mockSetDestination).toHaveBeenCalled();
      expect(mockSetShowDirections).toHaveBeenCalledWith(true);
      expect(screen.queryByTestId("upcoming-class-banner")).toBeNull();
    });
  });

  it("calls onNavigateToClass callback after setting directions", async () => {
    const onNavigateToClass = jest.fn();
    buildBaseMock([
      {
        id: "nav-event-callback",
        summary: "COMP 346",
        start: { dateTime: getFromNow(10) },
        end: { dateTime: getFromNow(70) },
        location: "H-820",
      },
    ]);

    render(<UpcomingClassBanner onNavigateToClass={onNavigateToClass} />);

    const navigateButton = await waitFor(() =>
      screen.getByTestId("banner-navigate-button"),
    );
    fireEvent.press(navigateButton);

    await waitFor(() => {
      expect(onNavigateToClass).toHaveBeenCalled();
    });
  });

  it("resolves building name and room from location", async () => {
    buildBaseMock([
      {
        id: "1",
        summary: "COMP 346",
        start: { dateTime: getFromNow(15) },
        end: { dateTime: getFromNow(75) },
        location: "H-820",
      },
    ]);
    render(<UpcomingClassBanner />);
    await waitFor(() => {
      expect(screen.getByText(/Henry F. Hall Building/i)).toBeTruthy();
      expect(screen.getByText(/820/i)).toBeTruthy();
    });
  });

  it("shows the start time label", async () => {
    buildBaseMock([
      {
        id: "1",
        summary: "ENGR 202",
        start: { dateTime: getFromNow(20) },
        end: { dateTime: getFromNow(80) },
        location: "H-820",
      },
    ]);
    render(<UpcomingClassBanner />);
    await waitFor(() => {
      expect(screen.getByText(/Starts at/i)).toBeTruthy();
    });
  });

  it("picks the soonest event when multiple future events exist", async () => {
    buildBaseMock([
      {
        id: "far",
        summary: "FAR CLASS",
        start: { dateTime: getFromNow(120) },
        end: { dateTime: getFromNow(180) },
        location: "H-820",
      },
      {
        id: "near",
        summary: "NEAR CLASS",
        start: { dateTime: getFromNow(20) },
        end: { dateTime: getFromNow(80) },
        location: "H-820",
      },
    ]);
    render(<UpcomingClassBanner />);
    await waitFor(() => {
      expect(screen.getByText(/Next Class: NEAR CLASS/i)).toBeTruthy();
      expect(screen.queryByText(/Next Class: FAR CLASS/i)).toBeNull();
    });
  });

  it("falls back to raw location when building is not found in metadata", async () => {
    buildBaseMock([
      {
        id: "1",
        summary: "UNKNOWN 101",
        start: { dateTime: getFromNow(10) },
        end: { dateTime: getFromNow(70) },
        location: "ZZZ-999",
      },
    ]);
    render(<UpcomingClassBanner />);
    await waitFor(() => {
      expect(screen.getByText(/ZZZ-999/i)).toBeTruthy();
    });
  });

  it("does not show when next class is outside reminder lead time", async () => {
    mockGetClassReminderLeadTime.mockResolvedValue(5);
    buildBaseMock([createClassEvent("far-event", "FAR 101", 10)]);

    render(<UpcomingClassBanner />);

    await waitFor(() => {
      expect(screen.queryByTestId("upcoming-class-banner")).toBeNull();
    });
  });

  it("shows when next class is in 3 minutes and preference is 5 minutes", async () => {
    mockGetClassReminderLeadTime.mockResolvedValue(5);
    buildBaseMock([createClassEvent("near-event", "NEAR 101", 3)]);

    render(<UpcomingClassBanner />);

    await waitFor(() => {
      expect(screen.getByTestId("upcoming-class-banner")).toBeTruthy();
      expect(screen.getByText(/Next Class: NEAR 101/i)).toBeTruthy();
    });
  });

  it("shows the next eligible class each time current notification is dismissed", async () => {
    mockGetClassReminderLeadTime.mockResolvedValue(30);
    buildBaseMock([
      createClassEvent("first", "CLASS 3:09", 9),
      createClassEvent("second", "CLASS 3:12", 12),
      createClassEvent("third", "CLASS 3:30", 30),
    ]);

    render(<UpcomingClassBanner />);

    await waitFor(() => {
      expect(screen.getByText(/Next Class: CLASS 3:09/i)).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("banner-close-button"));

    await waitFor(() => {
      expect(screen.getByText(/Next Class: CLASS 3:12/i)).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("banner-close-button"));

    await waitFor(() => {
      expect(screen.getByText(/Next Class: CLASS 3:30/i)).toBeTruthy();
    });
  });

  it("keeps a dismissed class hidden after remount", async () => {
    mockGetClassReminderLeadTime.mockResolvedValue(30);
    const firstEvent = createClassEvent("first", "CLASS 3:09", 9);
    const secondEvent = createClassEvent("second", "CLASS 3:12", 12);
    const firstDismissKey = `${firstEvent.id}::${firstEvent.start.dateTime}`;

    mockGetDismissedClassEventIds
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([firstDismissKey]);
    buildBaseMock([firstEvent, secondEvent]);

    const firstRender = render(<UpcomingClassBanner />);

    await waitFor(() => {
      expect(screen.getByText(/Next Class: CLASS 3:09/i)).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("banner-close-button"));

    await waitFor(() => {
      expect(mockSaveDismissedClassEventIds).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining("first")]),
      );
      expect(screen.getByText(/Next Class: CLASS 3:12/i)).toBeTruthy();
    });

    firstRender.unmount();
    render(<UpcomingClassBanner />);

    await waitFor(() => {
      expect(screen.queryByText(/Next Class: CLASS 3:09/i)).toBeNull();
      expect(screen.getByText(/Next Class: CLASS 3:12/i)).toBeTruthy();
    });
  });

  it("dismisses only a single occurrence when event id repeats at another time", async () => {
    mockGetClassReminderLeadTime.mockResolvedValue(60);
    mockGetDismissedClassEventIds.mockResolvedValue([]);

    const repeatedId = "repeat-1";
    buildBaseMock([
      createClassEvent(repeatedId, "CLASS 6:20", 20),
      createClassEvent(repeatedId, "CLASS 6:38", 38),
    ]);

    render(<UpcomingClassBanner />);

    await waitFor(() => {
      expect(screen.getByText(/Next Class: CLASS 6:20/i)).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("banner-close-button"));

    await waitFor(() => {
      expect(screen.getByText(/Next Class: CLASS 6:38/i)).toBeTruthy();
    });
  });

  it("hides the banner after swiping up past the threshold", async () => {
    buildBaseMock([
      {
        id: "swipe-event",
        summary: "COMP 999 - Swipe Test",
        start: { dateTime: getFromNow(15) },
        end: { dateTime: getFromNow(75) },
        location: "H-820",
      },
    ]);

    render(<UpcomingClassBanner />);
    await waitFor(() => {
      expect(screen.getByTestId("upcoming-class-banner")).toBeTruthy();
    });

    // Trigger swipe past the -30px threshold via captured PanResponder config
    act(() => {
      capturedPanConfig?.onPanResponderRelease?.({}, { dy: -40, vy: -1 });
    });

    expect(screen.queryByTestId("upcoming-class-banner")).toBeNull();
  });

  it("hides the banner when pressing the close button", async () => {
    buildBaseMock([
      {
        id: "close-event",
        summary: "COMP 321 - Close Test",
        start: { dateTime: getFromNow(15) },
        end: { dateTime: getFromNow(75) },
        location: "H-820",
      },
    ]);

    render(<UpcomingClassBanner />);
    await waitFor(() => {
      expect(screen.getByTestId("upcoming-class-banner")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("banner-close-button"));

    expect(screen.queryByTestId("upcoming-class-banner")).toBeNull();
  });

  it("snaps back when swipe is below the dismiss threshold", async () => {
    buildBaseMock([
      {
        id: "snap-event",
        summary: "COMP 888 - Snap Test",
        start: { dateTime: getFromNow(15) },
        end: { dateTime: getFromNow(75) },
        location: "H-820",
      },
    ]);

    render(<UpcomingClassBanner />);
    await waitFor(() => {
      expect(screen.getByTestId("upcoming-class-banner")).toBeTruthy();
    });

    // Swipe only a little — not past threshold
    act(() => {
      capturedPanConfig?.onPanResponderRelease?.({}, { dy: -10, vy: 0 });
    });

    expect(screen.getByTestId("upcoming-class-banner")).toBeTruthy();
  });
});
