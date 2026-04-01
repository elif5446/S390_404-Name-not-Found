// Mock SafeAreaView and Ionicons to prevent invalid element type errors
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import IndoorMapHeader, { IndoorMapHeaderProps } from "@/src/components/indoor/IndoorMapHeader";


const dummyBounds = {
  northEast: { latitude: 0, longitude: 0 },
  southWest: { latitude: 0, longitude: 0 },
};
const dummyImage = () => null;
const floor = (level: number, label: string) => ({
  id: `f${level}`,
  level,
  label,
  type: "svg" as const,
  image: dummyImage,
  bounds: dummyBounds,
});

const buildingData = {
  name: "Hall Building",
  floors: [
    floor(1, "1"),
    floor(2, "2"),
    floor(3, "3"),
  ],
};

describe("IndoorMapHeader", () => {
  const baseProps: IndoorMapHeaderProps = {
    buildingData: buildingData as any,
    activeFloor: buildingData.floors[1],
    currentLevel: 2,
    onFloorChange: jest.fn(),
    onExit: jest.fn(),
    isProgrammaticDismissRef: { current: false },
  };

  it("renders building name and active floor", () => {
    const { getByText } = render(<IndoorMapHeader {...baseProps} />);
    expect(getByText("Hall Building")).toBeTruthy();
    expect(getByText("2")).toBeTruthy();
  });

  it("calls onFloorChange when a floor is pressed", () => {
    const onFloorChange = jest.fn();
    const { getByText } = render(
      <IndoorMapHeader {...baseProps} onFloorChange={onFloorChange} />
    );
    fireEvent.press(getByText("1"));
    expect(onFloorChange).toHaveBeenCalledWith(1);
  });

  it("applies active style to current floor", () => {
    const { getByText } = render(<IndoorMapHeader {...baseProps} />);
    const floorBtn = getByText("2");
    expect(floorBtn.props.style).toBeDefined();
  });

  it("calls onExit when back button is pressed and not programmatic", () => {
    const onExit = jest.fn();
    const ref = { current: false };
    const { getByLabelText } = render(
      <IndoorMapHeader {...baseProps} onExit={onExit} isProgrammaticDismissRef={ref} />
    );
    fireEvent.press(getByLabelText("Go back"));
    expect(onExit).toHaveBeenCalled();
  });

  it("does not call onExit if programmatic dismiss is true", () => {
    const onExit = jest.fn();
    const ref = { current: true };
    const { getByLabelText } = render(
      <IndoorMapHeader {...baseProps} onExit={onExit} isProgrammaticDismissRef={ref} />
    );
    fireEvent.press(getByLabelText("Go back"));
    expect(onExit).not.toHaveBeenCalled();
  });

  it("applies accessibility props to header and buttons", () => {
    const { getByLabelText, getAllByRole } = render(<IndoorMapHeader {...baseProps} />);
    expect(getByLabelText("Go back")).toBeTruthy();
    expect(getAllByRole("button").length).toBeGreaterThan(1);
  });
});
