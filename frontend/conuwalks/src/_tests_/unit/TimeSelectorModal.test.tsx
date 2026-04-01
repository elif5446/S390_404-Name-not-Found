import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import {
  useColorScheme,
  FlatList,
  Modal,
  TouchableOpacity,
  Text,
} from "react-native";
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

  const baseDate = new Date(2026, 2, 1, 12, 2, 0); // Mar 1, 2026 12:02
  const laterDate = new Date(2026, 2, 2, 18, 37, 0); // Mar 2, 2026 18:37

  const defaultProps = {
    visible: true,
    onClose: mockOnClose,
    onApply: mockOnApply,
    initialMode: "leave" as const,
    initialDate: baseDate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 2, 1, 10, 0, 0));
    (useColorScheme as jest.Mock).mockReturnValue("light");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Rendering", () => {
    it("does not render contents when visible is false", () => {
      render(<TimeSelectorModal {...defaultProps} visible={false} />);

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

    it("renders dark mode text color correctly", () => {
      (useColorScheme as jest.Mock).mockReturnValue("dark");

      render(<TimeSelectorModal {...defaultProps} />);

      const leaveNowText = screen.getByText("Leave now");
      expect(leaveNowText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: "#FFF" }),
        ]),
      );
    });

    it("renders light mode text color correctly", () => {
      (useColorScheme as jest.Mock).mockReturnValue("light");

      render(<TimeSelectorModal {...defaultProps} />);

      const leaveNowText = screen.getByText("Leave now");
      expect(leaveNowText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: "#000" }),
        ]),
      );
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

      fireEvent.press(screen.getByText("Leave now"));

      expect(mockOnApply).toHaveBeenCalledWith("leave", null);
      expect(mockOnApply).toHaveBeenCalledTimes(1);
    });

    it("switches modes between Leave and Arrive when tabs are pressed", () => {
      render(<TimeSelectorModal {...defaultProps} />);

      fireEvent.press(screen.getByText("Arrive"));
      fireEvent.press(screen.getByText("Set time"));

      expect(mockOnApply).toHaveBeenCalledWith("arrive", expect.any(Date));
    });
  });

  describe("WheelPicker scrolling and selection", () => {
    it("calls onApply with the initially selected time when 'Set time' is pressed without scrolling", () => {
      render(<TimeSelectorModal {...defaultProps} />);

      fireEvent.press(screen.getByText("Set time"));

      const appliedDate = mockOnApply.mock.calls[0][1] as Date;
      expect(appliedDate.getHours()).toBe(12);
      expect(appliedDate.getMinutes()).toBe(0); // rounded from 12:02 to 12:00
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

      fireEvent(minuteList, "momentumScrollEnd", {
        nativeEvent: { contentOffset: { y: 6 * ITEM_HEIGHT } },
      });

      fireEvent.press(screen.getByText("Set time"));

      const appliedDate = mockOnApply.mock.calls[0][1] as Date;
      expect(appliedDate.getHours()).toBe(15);
      expect(appliedDate.getMinutes()).toBe(30);
    });

    it("updates selected hour and minute when picker items are pressed", () => {
      render(<TimeSelectorModal {...defaultProps} />);

      fireEvent.press(screen.getByTestId("picker-hour-18"));
      fireEvent.press(screen.getByTestId("picker-minute-45"));
      fireEvent.press(screen.getByText("Set time"));

      const appliedDate = mockOnApply.mock.calls[0][1] as Date;
      expect(appliedDate.getHours()).toBe(18);
      expect(appliedDate.getMinutes()).toBe(45);
    });
  });

  describe("State sync with props", () => {
    it("resets internal state when reopened with new props", () => {
      const { rerender } = render(<TimeSelectorModal {...defaultProps} />);

      fireEvent.press(screen.getByText("Arrive"));
      fireEvent.press(screen.getByTestId("picker-hour-18"));
      fireEvent.press(screen.getByTestId("picker-minute-45"));

      rerender(
        <TimeSelectorModal
          {...defaultProps}
          visible={false}
          initialMode="leave"
          initialDate={baseDate}
        />,
      );

      rerender(
        <TimeSelectorModal
          {...defaultProps}
          visible={true}
          initialMode="arrive"
          initialDate={laterDate}
        />,
      );

      fireEvent.press(screen.getByText("Set time"));

      const [mode, appliedDate] = mockOnApply.mock.calls[0] as [
        "leave" | "arrive",
        Date,
      ];

      expect(mode).toBe("arrive");
      expect(appliedDate.getHours()).toBe(18);
      expect(appliedDate.getMinutes()).toBe(35); // rounded from 37 to 35
    });

    it("uses current date when initialDate is null", () => {
      render(
        <TimeSelectorModal
          {...defaultProps}
          initialDate={null}
        />,
      );

      fireEvent.press(screen.getByText("Set time"));

      const appliedDate = mockOnApply.mock.calls[0][1] as Date;
      expect(appliedDate.getFullYear()).toBe(2026);
      expect(appliedDate.getMonth()).toBe(2);
      expect(appliedDate.getDate()).toBe(1);
      expect(appliedDate.getHours()).toBe(10);
      expect(appliedDate.getMinutes()).toBe(0);
    });

    it("rounds minutes to the nearest 5-minute increment from initialDate", () => {
      render(
        <TimeSelectorModal
          {...defaultProps}
          initialDate={new Date(2026, 2, 1, 9, 58, 0)}
        />,
      );

      fireEvent.press(screen.getByText("Set time"));

      const appliedDate = mockOnApply.mock.calls[0][1] as Date;
      expect(appliedDate.getHours()).toBe(9);
      expect(appliedDate.getMinutes()).toBe(0);
    });
  });
});