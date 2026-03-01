import React from "react";
import { Platform } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import DestinationHeader from "../../components/DestinationPopupHeader";

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

    // we can simulate pressing the top-level touchablewithoutfeedback by pressing a non-interactive child
    const title = screen.getByText("Directions");
    fireEvent.press(title);

    expect(mockOnToggleHeight).toHaveBeenCalledTimes(1);
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
});
