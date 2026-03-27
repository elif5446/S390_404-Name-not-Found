import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import IndoorDirectionsPopup from "@/src/components/indoor/IndoorDirectionsPopup";
import { useBottomSheet } from "@/src/hooks/useBottomSheet";

// --- mocks ---
jest.mock("@/src/hooks/useBottomSheet");
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return { Ionicons: () => <Text testID="mock-ionicon">Icon</Text> };
});

jest.mock("@/src/components/ui/BottomSheetDragHandle", () => {
  const { View } = require("react-native");
  const MockDragHandle = () => <View testID="mock-drag-handle" />;
  return MockDragHandle;
});

// setup mock values for the hook
const mockUseBottomSheet = {
  translateY: { interpolate: jest.fn(() => 0) },
  MAX_HEIGHT: 800,
  SNAP_OFFSET: 400,
  MINIMIZED_OFFSET: 100,
  scrollOffsetRef: { current: 0 },
  minimize: jest.fn(),
  snapTo: jest.fn(),
  handleToggleHeight: jest.fn(),
  handlePanResponder: { panHandlers: {} },
  scrollAreaPanResponder: { panHandlers: {} },
  dismiss: jest.fn(),
};

const mockSteps = [
  { id: "1", text: "Walk down the hallway" },
  { id: "2", text: "Turn left at the stairs" },
  { id: "3", text: "You have arrived" },
];

describe("IndoorDirectionsPopup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useBottomSheet as jest.Mock).mockReturnValue(mockUseBottomSheet);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns null when visible is false", () => {
    const { toJSON } = render(
      <IndoorDirectionsPopup
        visible={false}
        steps={mockSteps}
        activeStepIndex={0}
        onNextStep={jest.fn()}
        onPrevStep={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(toJSON()).toBeNull();
  });

  it("returns null when steps array is empty", () => {
    const { toJSON } = render(
      <IndoorDirectionsPopup
        visible={true}
        steps={[]}
        activeStepIndex={0}
        onNextStep={jest.fn()}
        onPrevStep={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(toJSON()).toBeNull();
  });

  it("renders the steps correctly", () => {
    const { getByText } = render(
      <IndoorDirectionsPopup
        visible={true}
        steps={mockSteps}
        activeStepIndex={0}
        onNextStep={jest.fn()}
        onPrevStep={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(getByText("Walk down the hallway")).toBeTruthy();
    expect(getByText("Turn left at the stairs")).toBeTruthy();
    expect(getByText("You have arrived")).toBeTruthy();
  });

  it("disables the Previous button on the first step", () => {
    const onPrevStep = jest.fn();
    const { getByText } = render(
      <IndoorDirectionsPopup
        visible={true}
        steps={mockSteps}
        activeStepIndex={0}
        onNextStep={jest.fn()}
        onPrevStep={onPrevStep}
        onClose={jest.fn()}
      />,
    );

    const prevButton = getByText("Previous");
    fireEvent.press(prevButton);
    expect(onPrevStep).not.toHaveBeenCalled();
  });

  it("calls onNextStep and snaps sheet on intermediate steps", () => {
    const onNextStep = jest.fn();
    const { getByText } = render(
      <IndoorDirectionsPopup
        visible={true}
        steps={mockSteps}
        activeStepIndex={0}
        onNextStep={onNextStep}
        onPrevStep={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    const nextButton = getByText("Next");
    fireEvent.press(nextButton);

    expect(onNextStep).toHaveBeenCalledTimes(1);
    expect(mockUseBottomSheet.snapTo).toHaveBeenCalledWith(mockUseBottomSheet.SNAP_OFFSET);
  });

  it("disables Next button on the last step if no onFinish prop is provided", () => {
    const onNextStep = jest.fn();
    const { getByText } = render(
      <IndoorDirectionsPopup
        visible={true}
        steps={mockSteps}
        activeStepIndex={2} // Last step
        onNextStep={onNextStep}
        onPrevStep={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    // it should label it "finish" by default when it's the last step
    const finishButton = getByText("Finish");
    fireEvent.press(finishButton);

    // should not trigger anything because it's disabled
    expect(onNextStep).not.toHaveBeenCalled();
  });

  it("calls onFinish and displays custom finishLabel on the last step", () => {
    const onFinish = jest.fn();
    const { getByText } = render(
      <IndoorDirectionsPopup
        visible={true}
        steps={mockSteps}
        activeStepIndex={2} // Last step
        onNextStep={jest.fn()}
        onPrevStep={jest.fn()}
        onClose={jest.fn()}
        onFinish={onFinish}
        finishLabel="Exit Building"
      />,
    );

    const customFinishButton = getByText("Exit Building");
    fireEvent.press(customFinishButton);

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("calls dismiss when the close (X) button is pressed", () => {
    const { getByLabelText } = render(
      <IndoorDirectionsPopup
        visible={true}
        steps={mockSteps}
        activeStepIndex={0}
        onNextStep={jest.fn()}
        onPrevStep={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    fireEvent.press(getByLabelText("Close indoor directions"));
    expect(mockUseBottomSheet.dismiss).toHaveBeenCalledWith(true);
  });
});
