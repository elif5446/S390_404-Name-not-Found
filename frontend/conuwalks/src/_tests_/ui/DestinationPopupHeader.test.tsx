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
    openIndoorHeaderButton: {},
    openIndoorHeaderButtonText: {},
  },
}));

jest.mock("../../styles/additionalInfoPopup", () => ({
  themedStyles: {
    openIndoorHeaderButton: jest.fn(() => ({})),
    openIndoorHeaderButtonText: jest.fn(() => ({})),
  },
}));

describe("DestinationHeader — Additional Coverage", () => {
  const mockSetTravelMode = jest.fn();
  const mockGetModeDurationLabel = jest.fn();
  const mockOnDismiss = jest.fn();
  const mockOnToggleHeight = jest.fn();
  const mockOnOpenIndoorPress = jest.fn();

  const originalOS = Platform.OS;

  const defaultProps = {
    mode: "light" as const,
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Indoor Map Button
  // ─────────────────────────────────────────────────────────────────────────────
  describe("Indoor Map Button", () => {
    it("renders the indoor map button when showOpenIndoorButton and onOpenIndoorPress are both provided", () => {
      render(
        <DestinationHeader
          {...defaultProps}
          showOpenIndoorButton
          onOpenIndoorPress={mockOnOpenIndoorPress}
        />,
      );

      expect(screen.getByLabelText("Open indoor map")).toBeTruthy();
      expect(screen.getByText("Indoor Map↗")).toBeTruthy();
    });

    it("calls onOpenIndoorPress when the indoor map button is pressed", () => {
      render(
        <DestinationHeader
          {...defaultProps}
          showOpenIndoorButton
          onOpenIndoorPress={mockOnOpenIndoorPress}
        />,
      );

      fireEvent.press(screen.getByLabelText("Open indoor map"));
      expect(mockOnOpenIndoorPress).toHaveBeenCalledTimes(1);
    });

    it("does NOT render the indoor map button when showOpenIndoorButton is true but onOpenIndoorPress is omitted", () => {
      render(
        <DestinationHeader {...defaultProps} showOpenIndoorButton />,
      );

      expect(screen.queryByLabelText("Open indoor map")).toBeNull();
      expect(screen.queryByText("Indoor Map↗")).toBeNull();
    });

    it("does NOT render the indoor map button when showOpenIndoorButton is false", () => {
      render(
        <DestinationHeader
          {...defaultProps}
          showOpenIndoorButton={false}
          onOpenIndoorPress={mockOnOpenIndoorPress}
        />,
      );

      expect(screen.queryByLabelText("Open indoor map")).toBeNull();
    });

    it("does NOT render the indoor map button when neither prop is provided", () => {
      render(<DestinationHeader {...defaultProps} />);
      expect(screen.queryByText("Indoor Map↗")).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Dark Mode
  // ─────────────────────────────────────────────────────────────────────────────
  describe("Dark Mode rendering", () => {
    it("renders the iOS close button in dark mode without crashing", () => {
      Platform.OS = "ios";
      render(<DestinationHeader {...defaultProps} mode="dark" />);

      // The ✕ close button should still be present on iOS dark mode
      expect(screen.getByText("✕")).toBeTruthy();
    });

    it("renders the Android close button in dark mode using PlatformIcon", () => {
      Platform.OS = "android";
      render(<DestinationHeader {...defaultProps} mode="dark" />);

      expect(screen.getByTestId("platform-icon-close")).toBeTruthy();
    });

    it("passes isDark=true to BottomSheetDragHandle in dark mode", () => {
      render(<DestinationHeader {...defaultProps} mode="dark" />);

      const dragHandle = screen.getByTestId("mock-drag-handle");
      expect(dragHandle.props.isDark).toBe(true);
    });

    it("passes isDark=false to BottomSheetDragHandle in light mode", () => {
      render(<DestinationHeader {...defaultProps} mode="light" />);

      const dragHandle = screen.getByTestId("mock-drag-handle");
      expect(dragHandle.props.isDark).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Transport button — active state
  // ─────────────────────────────────────────────────────────────────────────────
  describe("Transport button active state", () => {
    it("marks the current travelMode button as active (campusPink background)", () => {
      render(<DestinationHeader {...defaultProps} travelMode="driving" />);

      const drivingButton = screen.getByTestId("route-driving");
      expect(drivingButton.props.style).toEqual(
        expect.objectContaining({ backgroundColor: "#B03060" }),
      );
    });

    it("marks non-active transport buttons with transparent background", () => {
      render(<DestinationHeader {...defaultProps} travelMode="driving" />);

      const walkingButton = screen.getByTestId("route-walking");
      expect(walkingButton.props.style).toEqual(
        expect.objectContaining({ backgroundColor: "transparent" }),
      );
    });

    it("fires setTravelMode with 'bicycling' when bicycling button is pressed", () => {
      render(<DestinationHeader {...defaultProps} />);

      fireEvent.press(screen.getByLabelText("Select bicycling mode"));
      expect(mockSetTravelMode).toHaveBeenCalledWith("bicycling");
    });

    it("fires setTravelMode with 'driving' when driving button is pressed", () => {
      render(<DestinationHeader {...defaultProps} />);

      fireEvent.press(screen.getByLabelText("Select driving mode"));
      expect(mockSetTravelMode).toHaveBeenCalledWith("driving");
    });

    it("fires setTravelMode with 'walking' when walking button is pressed", () => {
      render(<DestinationHeader {...defaultProps} />);

      fireEvent.press(screen.getByLabelText("Select walking mode"));
      expect(mockSetTravelMode).toHaveBeenCalledWith("walking");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Time selector not rendered for non-transit modes
  // ─────────────────────────────────────────────────────────────────────────────
  describe("Time selector visibility by travel mode", () => {
    it("does NOT render the time selector button for walking mode", () => {
      render(<DestinationHeader {...defaultProps} travelMode="walking" />);
      expect(
        screen.queryByLabelText("Select departure or arrival time"),
      ).toBeNull();
    });

    it("does NOT render the time selector button for driving mode", () => {
      render(<DestinationHeader {...defaultProps} travelMode="driving" />);
      expect(
        screen.queryByLabelText("Select departure or arrival time"),
      ).toBeNull();
    });

    it("does NOT render the time selector button for bicycling mode", () => {
      render(<DestinationHeader {...defaultProps} travelMode="bicycling" />);
      expect(
        screen.queryByLabelText("Select departure or arrival time"),
      ).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TimeSelectorModal — onClose (dismiss without applying)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("TimeSelectorModal onClose", () => {
    const { useDirections } = require("@/src/context/DirectionsContext");

    it("closes the modal via onClose without updating context", () => {
      useDirections.mockReturnValue({
        timeMode: "leave",
        targetTime: new Date(),
        setTimeMode: mockSetTimeMode,
        setTargetTime: mockSetTargetTime,
      });

      render(<DestinationHeader {...defaultProps} travelMode="transit" />);

      // Open the modal
      fireEvent.press(
        screen.getByLabelText("Select departure or arrival time"),
      );
      expect(
        screen.getByTestId("mock-time-modal").props.accessibilityState.expanded,
      ).toBe(true);

      // Trigger onClose (user dismisses without confirming)
      fireEvent(screen.getByTestId("mock-time-modal"), "close");

      // Modal should be closed
      expect(
        screen.getByTestId("mock-time-modal").props.accessibilityState.expanded,
      ).toBe(false);

      // Context setters must NOT have been called
      expect(mockSetTimeMode).not.toHaveBeenCalled();
      expect(mockSetTargetTime).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TimeSelectorModal — initialMode prop reflects current timeMode
  // ─────────────────────────────────────────────────────────────────────────────
  describe("TimeSelectorModal initialMode prop", () => {
    const { useDirections } = require("@/src/context/DirectionsContext");

    it("passes timeMode='arrive' as initialMode to the modal", () => {
      useDirections.mockReturnValue({
        timeMode: "arrive",
        targetTime: new Date(),
        setTimeMode: mockSetTimeMode,
        setTargetTime: mockSetTargetTime,
      });

      render(<DestinationHeader {...defaultProps} travelMode="transit" />);

      const modal = screen.getByTestId("mock-time-modal");
      expect(modal.props.accessibilityValue.text).toBe("arrive");
    });

    it("passes timeMode='leave' as initialMode to the modal", () => {
      useDirections.mockReturnValue({
        timeMode: "leave",
        targetTime: new Date(),
        setTimeMode: mockSetTimeMode,
        setTargetTime: mockSetTargetTime,
      });

      render(<DestinationHeader {...defaultProps} travelMode="transit" />);

      const modal = screen.getByTestId("mock-time-modal");
      expect(modal.props.accessibilityValue.text).toBe("leave");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Time label — "Arrive by" with non-today date
  // ─────────────────────────────────────────────────────────────────────────────
  describe("Time label — arrive mode with non-today date", () => {
    const { useDirections } = require("@/src/context/DirectionsContext");

    it("renders 'Arrive by HH:MM, <date>' when arrive mode and isToday is false", () => {
      (isToday as jest.Mock).mockReturnValue(false);
      const testDate = new Date("2026-04-10T09:45:00Z");

      useDirections.mockReturnValueOnce({
        timeMode: "arrive",
        targetTime: testDate,
      });

      render(<DestinationHeader {...defaultProps} travelMode="transit" />);
      expect(screen.getByText(/Arrive by \d{1,2}:\d{2},/)).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // BottomSheetDragHandle — onToggleHeight wired correctly
  // ─────────────────────────────────────────────────────────────────────────────
  describe("BottomSheetDragHandle props", () => {
    it("passes onToggleHeight callback to BottomSheetDragHandle", () => {
      render(<DestinationHeader {...defaultProps} />);

      const dragHandle = screen.getByTestId("mock-drag-handle");
      expect(typeof dragHandle.props.onToggleHeight).toBe("function");

      // Invoking it should call the original handler
      dragHandle.props.onToggleHeight();
      expect(mockOnToggleHeight).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getModeDurationLabel called for every transport option
  // ─────────────────────────────────────────────────────────────────────────────
  describe("getModeDurationLabel invocation", () => {
    it("calls getModeDurationLabel for each of the four transport modes", () => {
      render(<DestinationHeader {...defaultProps} />);

      expect(mockGetModeDurationLabel).toHaveBeenCalledWith("walking");
      expect(mockGetModeDurationLabel).toHaveBeenCalledWith("transit");
      expect(mockGetModeDurationLabel).toHaveBeenCalledWith("bicycling");
      expect(mockGetModeDurationLabel).toHaveBeenCalledWith("driving");
      expect(mockGetModeDurationLabel).toHaveBeenCalledTimes(4);
    });
  });
});
