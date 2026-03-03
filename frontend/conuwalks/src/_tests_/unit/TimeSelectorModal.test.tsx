import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { useColorScheme, FlatList, Modal, TouchableOpacity } from "react-native";
import TimeSelectorModal from "../../components/TimeSelectorModal";

jest.mock("expo-blur", () => {
  const { View } = require("react-native");
  const MockBlurView = (props: any) => (
    <View testID="mock-blur-view" {...props} />
  );
  return { BlurView: MockBlurView };
});

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  default: jest.fn(),
}));

describe("TimeSelectorModal Component", () => {
  const mockOnClose = jest.fn();
  const mockOnApply = jest.fn();

  const testDate = new Date(2026, 2, 1, 12, 0, 0);

  const defaultProps = {
    visible: true,
    onClose: mockOnClose,
    onApply: mockOnApply,
    initialMode: "leave" as const,
    initialDate: testDate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useColorScheme as jest.Mock).mockReturnValue("light");
  });

  describe("Rendering", () => {
    it("does not render contents when visible is false", () => {
      render(<TimeSelectorModal {...defaultProps} visible={false} />);

      // Use UNSAFE_getByType to find the React Native Modal component
      const modal = screen.UNSAFE_getByType(Modal);
      expect(modal.props.visible).toBe(false);
    });

    it("renders tabs and buttons correctly when visible", () => {
      render(<TimeSelectorModal {...defaultProps} />);

      expect(screen.getByText("Leave")).toBeTruthy();
      expect(screen.getByText("Arrive")).toBeTruthy();
      expect(screen.getByText("Leave now")).toBeTruthy();
      expect(screen.getByText("Set time")).toBeTruthy();
    });
  });

  describe("User Interactions", () => {
    it("calls onClose when the backdrop is pressed", () => {
      render(<TimeSelectorModal {...defaultProps} />);

      const touchables = screen.UNSAFE_getAllByType(TouchableOpacity);
      const backdrop = touchables[0];

      fireEvent.press(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onApply with 'leave' and null when 'Leave now' is pressed", () => {
      render(<TimeSelectorModal {...defaultProps} />);

      const leaveNowButton = screen.getByText("Leave now");
      fireEvent.press(leaveNowButton);

      expect(mockOnApply).toHaveBeenCalledWith("leave", null);
      expect(mockOnApply).toHaveBeenCalledTimes(1);
    });

    it("switches modes between Leave and Arrive when tabs are pressed", () => {
      render(<TimeSelectorModal {...defaultProps} />);

      const arriveTab = screen.getByText("Arrive");
      fireEvent.press(arriveTab);

      const applyButton = screen.getByText("Set time");
      fireEvent.press(applyButton);

      expect(mockOnApply).toHaveBeenCalledWith("arrive", expect.any(Date));
    });
  });

  describe("WheelPicker Scrolling & Selection", () => {
    it("calls onApply with the initially selected time when 'Set time' is pressed without scrolling", () => {
      render(<TimeSelectorModal {...defaultProps} />);

      const applyButton = screen.getByText("Set time");
      fireEvent.press(applyButton);

      const appliedDate = mockOnApply.mock.calls[0][1] as Date;
      expect(appliedDate.getHours()).toBe(12);
      expect(appliedDate.getMinutes()).toBe(0);
      expect(mockOnApply.mock.calls[0][0]).toBe("leave");
    });

    it("updates the selected time when FlatLists are scrolled", () => {
      render(<TimeSelectorModal {...defaultProps} />);

      const flatLists = screen.UNSAFE_getAllByType(FlatList);
      expect(flatLists.length).toBe(3);

      const hourList = flatLists[1];
      const minuteList = flatLists[2];

      const ITEM_HEIGHT = 44;

      fireEvent(hourList, "momentumScrollEnd", {
        nativeEvent: { contentOffset: { y: 15 * ITEM_HEIGHT } },
      });

      // simulate scrolling the minute picker to index 6 (30 minutes)
      fireEvent(minuteList, "momentumScrollEnd", {
        nativeEvent: { contentOffset: { y: 6 * ITEM_HEIGHT } },
      });

      const applyButton = screen.getByText("Set time");
      fireEvent.press(applyButton);

      const appliedDate = mockOnApply.mock.calls[0][1] as Date;

      expect(appliedDate.getHours()).toBe(15);
      expect(appliedDate.getMinutes()).toBe(30);
    });
  });
});
