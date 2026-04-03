import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import React, { act } from "react";
import { PanResponder, Switch } from "react-native";
import UpcomingClassBanner from "../../components/UpcomingClassBanner";
import { useGoogleCalendar } from "@/src/hooks/useGoogleCalendar";
import { useDirections } from "@/src/context/DirectionsContext";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import {
  getClassReminderLeadTime,
  getDismissedClassEventIds,
  saveDismissedClassEventIds,
  saveWheelchairAccessibilityPreference,
  getWheelchairAccessibilityPreference
} from "@/src/utils/tokenStorage";
import UserProfileContent from "@/src/components/UserProfileContent";

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
  saveWheelchairAccessibilityPreference: jest.fn(),
  getWheelchairAccessibilityPreference: jest.fn(),
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
const mockSaveWheelchairAccessibilityPreference = saveWheelchairAccessibilityPreference as jest.Mock;
const mockGetWheelchairAccessibilityPreference = getWheelchairAccessibilityPreference as jest.Mock;

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

    act(() => {
      capturedPanConfig?.onPanResponderRelease?.({}, { dy: -10, vy: 0 });
    });

    expect(screen.getByTestId("upcoming-class-banner")).toBeTruthy();
  });

  it("should initialize the switch with the saved wheelchair preference", async () => {
    mockGetWheelchairAccessibilityPreference.mockResolvedValue(true);

    render(<UserProfileContent userInfo={{ email: "test@concordia.ca" }} mode="light" />);

    await waitFor(() => {
      const switchElement = screen.getByRole("switch", { name: /wheelchair-accessible/i });
      expect(switchElement.props.accessibilityState.checked).toBe(true);
    });
  });

  it("should save and update UI when toggled", async () => {
    mockGetWheelchairAccessibilityPreference.mockResolvedValue(false);
    mockSaveWheelchairAccessibilityPreference.mockResolvedValue(true);

    render(<UserProfileContent userInfo={{ email: "test@concordia.ca" }} mode="light" />);

    await waitFor(() => {
      expect(mockGetWheelchairAccessibilityPreference).toHaveBeenCalled();
    });

    const switchElement = screen.UNSAFE_getByType(Switch);

    await act(async () => {
      fireEvent(switchElement, "onValueChange", true);
    });

    await waitFor(() => {
      expect(mockSaveWheelchairAccessibilityPreference).toHaveBeenCalledWith(true);
    });

    await waitFor(() => {
      const container = screen.getByRole("switch", { name: /wheelchair-accessible/i });
      expect(container.props.accessibilityState.checked).toBe(true);
    });
  });

  it("should revert the switch state if the save operation fails", async () => {
    mockGetWheelchairAccessibilityPreference.mockResolvedValue(false);
    mockSaveWheelchairAccessibilityPreference.mockResolvedValue(false);

    render(<UserProfileContent userInfo={{ email: "test@concordia.ca" }} mode="light" />);

    await waitFor(() => {
      expect(mockGetWheelchairAccessibilityPreference).toHaveBeenCalled();
    });

    const switchElement = screen.UNSAFE_getByType(Switch);
    
    await act(async () => {
      fireEvent(switchElement, "onValueChange", true);
    });

    await waitFor(() => {
      const container = screen.getByRole("switch", { name: /wheelchair-accessible/i });
      expect(container.props.accessibilityState.checked).toBe(false);
    });
  });

  describe("Timer Logic", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("updates nowTs every 30 seconds and shows the banner when the class enters lead time", async () => {
      const baseTime = new Date("2026-05-01T12:00:00Z").getTime();
      jest.setSystemTime(baseTime);

      mockGetClassReminderLeadTime.mockResolvedValue(10);
      
      const classStartTime = baseTime + (10 * 60 * 1000) + (15 * 1000); 
      buildBaseMock([{
        id: "timer-event",
        summary: "Time Update Class",
        start: { dateTime: new Date(classStartTime).toISOString() },
        location: "H-820",
      }]);

      render(<UpcomingClassBanner />);

      await waitFor(() => {
        expect(screen.queryByTestId("upcoming-class-banner")).toBeNull();
      });

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(screen.getByTestId("upcoming-class-banner")).toBeTruthy();
        expect(screen.getByText(/Next Class: Time Update Class/i)).toBeTruthy();
      });
    });

    it("clears the interval when the component unmounts", () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");
      buildBaseMock([]);
      
      const { unmount } = render(<UpcomingClassBanner />);
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe("PanResponder Gesture Logic", () => {
    const mockEvent = {};

    it("updates translateY and opacity when swiping up (dy < 0)", async () => {
      buildBaseMock([createClassEvent("move-up", "Swipe Up", 5)]);
      render(<UpcomingClassBanner />);

      const banner = await waitFor(() => screen.getByTestId("upcoming-class-banner"));

      const dy = -40;
      act(() => {
        capturedPanConfig.onPanResponderMove(mockEvent, { dy });
      });

      expect(banner.props.style).toEqual(
        expect.objectContaining({
          transform: [{ translateY: -40 }],
          opacity: 0.5,
        })
      );
    });

    it("clumps opacity to 0 if swiped up very far", async () => {
      buildBaseMock([createClassEvent("move-up-far", "Swipe Up Far", 5)]);
      render(<UpcomingClassBanner />);

      const banner = await waitFor(() => screen.getByTestId("upcoming-class-banner"));

      act(() => {
        capturedPanConfig.onPanResponderMove(mockEvent, { dy: -100 });
      });

      expect(banner.props.style).toEqual(
        expect.objectContaining({
          opacity: 0,
        })
      );
    });

    it("does not update translateY or opacity when swiping down (dy > 0)", async () => {
      buildBaseMock([createClassEvent("move-down", "Swipe Down", 5)]);
      render(<UpcomingClassBanner />);

      const banner = await waitFor(() => screen.getByTestId("upcoming-class-banner"));

      act(() => {
        capturedPanConfig.onPanResponderMove(mockEvent, { dy: 20 });
      });

      expect(banner.props.style).toEqual(
        expect.objectContaining({
          transform: [{ translateY: 0 }],
          opacity: 1,
        })
      );
    });

    it("onMoveShouldSetPanResponder only returns true for upward movement > 5px", () => {
      buildBaseMock([createClassEvent("responder-check", "Check", 5)]);
      render(<UpcomingClassBanner />);

      const shouldSet1 = capturedPanConfig.onMoveShouldSetPanResponder(mockEvent, { dy: -6 });
      const shouldSet2 = capturedPanConfig.onMoveShouldSetPanResponder(mockEvent, { dy: -2 });
      const shouldSet3 = capturedPanConfig.onMoveShouldSetPanResponder(mockEvent, { dy: 10 });

      expect(shouldSet1).toBe(true);
      expect(shouldSet2).toBe(false);
      expect(shouldSet3).toBe(false);
    });
  });

  it("dismisses the banner and returns early if the building location is unknown", async () => {
      buildBaseMock([
        {
          id: "unknown-loc-event",
          summary: "Mystery Class",
          start: { dateTime: getFromNow(10) },
          end: { dateTime: getFromNow(70) },
          location: "Somewhere far away", 
        },
      ]);

      render(<UpcomingClassBanner />);

      const banner = await waitFor(() => screen.getByTestId("upcoming-class-banner"));
      expect(banner).toBeTruthy();

      const navigateButton = screen.getByTestId("banner-navigate-button");
      act(() => {
        fireEvent.press(navigateButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId("upcoming-class-banner")).toBeNull();
      });

      expect(mockSetDestination).not.toHaveBeenCalled();
      expect(mockSetShowDirections).not.toHaveBeenCalled();
    });
});
