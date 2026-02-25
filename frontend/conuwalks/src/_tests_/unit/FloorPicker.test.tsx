import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import FloorPicker from "../../components/indoor/FloorPicker";
import { FloorData } from "@/src/types/indoor";

jest.mock("@/src/styles/IndoorMap.styles", () => ({
  styles: {
    pickerContainer: { flex: 1 },
    glassPanel: { backgroundColor: "rgba(255,255,255,0.5)" },
    scrollContent: { padding: 10 },
    floorButton: { padding: 10 },
    activeButton: { backgroundColor: "blue" },
    pickerText: { color: "black" },
    activePickerText: { color: "white" },
  },
}));

const mockBounds = {
  northEast: { latitude: 45.49769, longitude: -73.5783 },
  southWest: { latitude: 45.49682, longitude: -73.57954 },
};

const mockFloors: FloorData[] = [
  {
    id: "f1",
    level: 1,
    label: "1",
    type: "png",
    image: 1 as any,
    bounds: mockBounds,
  },
  {
    id: "f3",
    level: 3,
    label: "3",
    type: "png",
    image: 1 as any,
    bounds: mockBounds,
  },
  {
    id: "f2",
    level: 2,
    label: "2",
    type: "png",
    image: 1 as any,
    bounds: mockBounds,
  },
];

describe("FloorPicker Component", () => {
  const mockOnFloorSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when the floors array is empty", () => {
    const { toJSON } = render(
      <FloorPicker
        floors={[]}
        currentFloor={1}
        onFloorSelect={mockOnFloorSelect}
      />,
    );

    // if the component returns null, the json representation of the tree is null
    expect(toJSON()).toBeNull();
  });

  it("renders all floors and sorts them in descending order (highest level first)", () => {
    render(
      <FloorPicker
        floors={mockFloors}
        currentFloor={1}
        onFloorSelect={mockOnFloorSelect}
      />,
    );

    const renderedTexts = screen.getAllByText(/^[123]$/);

    expect(renderedTexts.length).toBe(3);
    // verify the visual order matches descending level order (3, then 2, then 1)
    expect(renderedTexts[0].props.children).toBe("3");
    expect(renderedTexts[1].props.children).toBe("2");
    expect(renderedTexts[2].props.children).toBe("1");
  });

  it("applies the active state and styles correctly to the current floor", () => {
    render(
      <FloorPicker
        floors={mockFloors}
        currentFloor={2}
        onFloorSelect={mockOnFloorSelect}
      />,
    );

    const activeFloorButton = screen.getByLabelText("Floor 2");
    const inactiveFloorButton = screen.getByLabelText("Floor 1");

    // verify accessibility state is accurate for screen readers
    expect(activeFloorButton.props.accessibilityState).toEqual({
      selected: true,
    });
    expect(inactiveFloorButton.props.accessibilityState).toEqual({
      selected: false,
    });

    // verify active styles are applied to the button
    expect(activeFloorButton.props.style).toEqual(
      expect.objectContaining({
        padding: 10,
        backgroundColor: "blue",
      }),
    );
  });

  it("calls onFloorSelect with the correct level when a floor is pressed", () => {
    render(
      <FloorPicker
        floors={mockFloors}
        currentFloor={1}
        onFloorSelect={mockOnFloorSelect}
      />,
    );

    const targetFloorButton = screen.getByLabelText("Floor 3");

    // simulate a user tapping the button
    fireEvent.press(targetFloorButton);

    expect(mockOnFloorSelect).toHaveBeenCalledTimes(1);
    expect(mockOnFloorSelect).toHaveBeenCalledWith(3);
  });
});
