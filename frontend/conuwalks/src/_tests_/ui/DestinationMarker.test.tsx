import React from "react";
import { render } from "@testing-library/react-native";
import DestinationMarker from "@/src/components/indoor/DestinationMarker";

// Mock the vector icons to prevent native rendering errors in Jest
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name, size, color }: any) => <Text testID="mock-ionicon">{`${name}-${size}-${color}`}</Text>,
  };
});

describe("DestinationMarker", () => {
  it("calculates the correct absolute positioning based on x and y props", () => {
    const x = 100;
    const y = 200;
    const { toJSON } = render(<DestinationMarker x={x} y={y} />);

    const tree = toJSON() as any;

    // Expected: x - 14 = 86
    expect(tree.props.style.left).toBe(86);
    // Expected: y - 34 = 166
    expect(tree.props.style.top).toBe(166);
    expect(tree.props.style.position).toBe("absolute");
  });

  it("sets pointerEvents to none so it doesn't block map interactions", () => {
    const { toJSON } = render(<DestinationMarker x={50} y={50} />);

    const tree = toJSON() as any;

    expect(tree.props.pointerEvents).toBe("none");
  });

  it("renders the Ionicons component with correct props", () => {
    const { getByTestId } = render(<DestinationMarker x={0} y={0} />);

    const icon = getByTestId("mock-ionicon");

    // Verifies the icon is rendered with "location-sharp", size 30, and the correct hex color
    expect(icon.children[0]).toBe("location-sharp-30-#B03060");
  });
});
