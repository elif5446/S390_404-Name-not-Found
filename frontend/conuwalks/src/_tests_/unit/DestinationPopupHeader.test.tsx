import React from "react";
import { Platform } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import DestinationHeader from "../../components/DestinationPopupHeader";
import { isToday } from "../../utils/time";

jest.mock("../../utils/time", () => ({
  isToday: jest.fn(),
}));

const mockSetTimeMode = jest.fn();
const mockSetTargetTime = jest.fn();

jest.mock("@/src/context/DirectionsContext", () => ({
  useDirections: jest.fn(() => ({
    timeMode: "leave",
    targetTime: new Date("2026-03-01T12:00:00Z"),
    setTimeMode: mockSetTimeMode,
    setTargetTime: mockSetTargetTime,
  })),
}));

jest.mock("../../components/TimeSelectorModal", () => {
  const { View } = require("react-native");
  const MockModal = (props: any) => (
    <View
      testID="mock-time-modal"
      accessibilityState={{ expanded: props.visible }}
      accessibilityValue={{ text: props.initialMode }}
      {...props}
    />
  );
  MockModal.displayName = "MockTimeSelectorModal";
  return MockModal;
});

// mock the shared ui components with proper display names
jest.mock("../../components/ui/PlatformIcon", () => {
  const { View } = require("react-native");
  const MockPlatformIcon = (props: any) => (
    <View
      testID={`platform-icon-${props.materialName || props.iosName}`}
      {...props}
    />
  );
  MockPlatformIcon.displayName = "MockPlatformIcon";
  return MockPlatformIcon;
});

jest.mock("../../components/ui/BottomSheetDragHandle", () => {
  const { View } = require("react-native");
  const MockDragHandle = (props: any) => (
    <View testID="mock-drag-handle" {...props} />
  );
  MockDragHandle.displayName = "MockDragHandle";
  return MockDragHandle;
});

// mock the styles to prevent undefined object errors
jest.mock("../../styles/DestinationPopup", () => ({
  styles: {
    header: {},
    headerSide: {},
    headerSideLeft: {},
    headerSideRight: {},
    iconButton: {},
    closeButtonCircle: {},
    closeButtonText: {},
    headerCenter: {},
    title: {},
    transportRow: {},
    transportButton: {},
  },
}));

describe("DestinationHeader Component", () => {
  const mockSetTravelMode = jest.fn();
  const mockGetModeDurationLabel = jest.fn();
  const mockOnDismiss = jest.fn();
  const mockOnToggleHeight = jest.fn();

  const originalOS = Platform.OS;

  const defaultProps = {
    isDark: false,
    travelMode: "walking" as const,
    setTravelMode: mockSetTravelMode,
    getModeDurationLabel: mockGetModeDurationLabel,
    onDismiss: mockOnDismiss,
    onToggleHeight: mockOnToggleHeight,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (isToday as jest.Mock).mockReturnValue(true);

    mockGetModeDurationLabel.mockImplementation((mode) => {
      const times: Record<string, string> = {
        walking: "15 min",
        driving: "5 min",
        transit: "12 min",
        bicycling: "8 min",
      };
      return times[mode] || "--";
    });
  });

  afterEach(() => {
    Platform.OS = originalOS;
  });

  describe("Base Rendering & Interactions", () => {
    it("renders correctly with default props", () => {
      render(<DestinationHeader {...defaultProps} />);

      // check title
      expect(screen.getByText("Directions")).toBeTruthy();

      // check custom drag handle renders
      expect(screen.getByTestId("mock-drag-handle")).toBeTruthy();

      // check that all durations fetched from getmodedurationlabel are rendered
      expect(screen.getByText("15 min")).toBeTruthy();
      expect(screen.getByText("5 min")).toBeTruthy();
      expect(screen.getByText("12 min")).toBeTruthy();
      expect(screen.getByText("8 min")).toBeTruthy();
    });

    it("calls setTravelMode when a transport button is pressed", () => {
      render(<DestinationHeader {...defaultProps} />);

      const transitButton = screen.getByLabelText("Select transit mode");
      fireEvent.press(transitButton);

      expect(mockSetTravelMode).toHaveBeenCalledWith("transit");
      expect(mockSetTravelMode).toHaveBeenCalledTimes(1);
    });

    it("calls onToggleHeight when the header area is pressed", () => {
      render(<DestinationHeader {...defaultProps} />);

      // simulate pressing the top-level touchablewithoutfeedback by pressing a child
      const title = screen.getByText("Directions");
      fireEvent.press(title);

      expect(mockOnToggleHeight).toHaveBeenCalledTimes(1);
    });
  });

  describe("Platform Specific Rendering", () => {
    it("renders iOS close button and calls onDismiss when pressed", () => {
      Platform.OS = "ios";
      render(<DestinationHeader {...defaultProps} isDark={true} />);

      // the ios version renders a text '✕' inside a circle
      const closeButtonText = screen.getByText("✕");
      expect(closeButtonText).toBeTruthy();

      // find the touchable via accessibility label and fire press
      const closeButton = screen.getByLabelText("Close directions");
      fireEvent.press(closeButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it("renders Android close button using PlatformIcon and calls onDismiss when pressed", () => {
      Platform.OS = "android";
      render(<DestinationHeader {...defaultProps} />);

      // the android version should render our mocked platformicon
      expect(screen.getByTestId("platform-icon-close")).toBeTruthy();
      expect(screen.queryByText("✕")).toBeNull();

      const closeButton = screen.getByLabelText("Close directions");
      fireEvent.press(closeButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("Time Selector & Formatting", () => {
    const { useDirections } = require("@/src/context/DirectionsContext");

    it("renders the time selector button when travelMode is transit", () => {
      const { useDirections } = require("@/src/context/DirectionsContext");

      useDirections.mockReturnValue({
        timeMode: "leave",
        targetTime: new Date(),
        setTimeMode: jest.fn(),
        setTargetTime: jest.fn(),
      });

      render(<DestinationHeader {...defaultProps} travelMode="transit" />);
      expect(
        screen.getByLabelText("Select departure or arrival time"),
      ).toBeTruthy();
    });

    it("renders 'Leave now' when targetTime is null", () => {
      useDirections.mockReturnValueOnce({
        timeMode: "leave",
        targetTime: null,
        setTimeMode: mockSetTimeMode,
        setTargetTime: mockSetTargetTime,
      });

      render(<DestinationHeader {...defaultProps} travelMode="transit" />);
      expect(screen.getByText("Leave now")).toBeTruthy();
    });

    it("renders 'Leave at HH:MM' for today's date", () => {
      // isToday is mocked to true in beforeEach
      const testDate = new Date("2026-03-01T14:30:00Z");
      useDirections.mockReturnValueOnce({
        timeMode: "leave",
        targetTime: testDate,
      });

      render(<DestinationHeader {...defaultProps} travelMode="transit" />);
      // Note: Exact string depends on local time zone of the test runner,
      // but it will contain "Leave at"
      expect(screen.getByText(/Leave at \d{2}:\d{2}/)).toBeTruthy();
    });

    it("renders 'Arrive by HH:MM' for 'arrive' mode", () => {
      const testDate = new Date("2026-03-01T14:30:00Z");
      useDirections.mockReturnValueOnce({
        timeMode: "arrive",
        targetTime: testDate,
      });

      render(<DestinationHeader {...defaultProps} travelMode="transit" />);
      expect(screen.getByText(/Arrive by \d{2}:\d{2}/)).toBeTruthy();
    });

    it("appends the date string if isToday is false", () => {
      (isToday as jest.Mock).mockReturnValue(false);
      const testDate = new Date("2026-03-05T14:30:00Z"); // Future date
      useDirections.mockReturnValueOnce({
        timeMode: "leave",
        targetTime: testDate,
      });

      render(<DestinationHeader {...defaultProps} travelMode="transit" />);
      // Should include comma and date formatting e.g., "Leave at 14:30, Thu, Mar 5"
      expect(screen.getByText(/Leave at \d{2}:\d{2},/)).toBeTruthy();
    });
  });

  describe("TimeSelectorModal Interactions", () => {
    const { useDirections } = require("@/src/context/DirectionsContext");

    it("opens the modal when the time selector button is pressed", () => {
      useDirections.mockReturnValue({
        timeMode: "leave",
        targetTime: new Date(),
      });

      render(<DestinationHeader {...defaultProps} travelMode="transit" />);

      const modal = screen.getByTestId("mock-time-modal");
      expect(modal.props.accessibilityState.expanded).toBe(false);

      const timeButton = screen.getByLabelText(
        "Select departure or arrival time",
      );
      fireEvent.press(timeButton);

      expect(modal.props.accessibilityState.expanded).toBe(true);
    });

    it("updates context and closes modal when onApply is called", () => {
      useDirections.mockReturnValue({
        timeMode: "leave",
        targetTime: new Date(),
        setTimeMode: mockSetTimeMode,
        setTargetTime: mockSetTargetTime,
      });

      render(<DestinationHeader {...defaultProps} travelMode="transit" />);

      // Open modal
      fireEvent.press(
        screen.getByLabelText("Select departure or arrival time"),
      );
      const modal = screen.getByTestId("mock-time-modal");
      expect(modal.props.accessibilityState.expanded).toBe(true);

      // Simulate onApply callback from the modal
      const newDate = new Date("2026-04-01T10:00:00Z");
      fireEvent(modal, "apply", "arrive", newDate); // triggers onApply

      // Verify context functions were called
      expect(mockSetTimeMode).toHaveBeenCalledWith("arrive");
      expect(mockSetTargetTime).toHaveBeenCalledWith(newDate);

      // Modal should be closed (state reset)
      // Since it's a re-render, we re-query
      const updatedModal = screen.getByTestId("mock-time-modal");
      expect(updatedModal.props.accessibilityState.expanded).toBe(false);
    });
  });
});
