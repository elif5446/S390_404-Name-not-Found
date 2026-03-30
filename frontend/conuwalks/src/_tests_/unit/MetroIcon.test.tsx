import React from "react";
import { render } from "@testing-library/react-native";
import { processColor } from "react-native"; // 👈 Import this
import { MetroIcon } from "../../components/MetroIcon";

describe("MetroIcon", () => {
  it("renders with default props", () => {
    const { getByTestId } = render(<MetroIcon />);

    // check that defaults are applied
    const svgNode = getByTestId("metro-svg");
    expect(svgNode.props.width).toBe(25);
    expect(svgNode.props.height).toBe(25);

    const expectedDefaultColor = { type: 0, payload: processColor("#333333") };

    expect(getByTestId("metro-circle").props.stroke).toEqual(expectedDefaultColor);
    expect(getByTestId("metro-path").props.fill).toEqual(expectedDefaultColor);
  });

  it("renders with custom width, height, and color", () => {
    const customColor = "#ff0000";
    const { getByTestId } = render(<MetroIcon width={50} height={40} color={customColor} />);

    const svgNode = getByTestId("metro-svg");
    expect(svgNode.props.width).toBe(50);
    expect(svgNode.props.height).toBe(40);

    const expectedCustomColor = { type: 0, payload: processColor(customColor) };

    expect(getByTestId("metro-circle").props.stroke).toEqual(expectedCustomColor);
    expect(getByTestId("metro-path").props.fill).toEqual(expectedCustomColor);
  });

  it("accepts string values for width and height", () => {
    const { getByTestId } = render(<MetroIcon width="100%" height="100%" color="#00ff00" />);

    const svgNode = getByTestId("metro-svg");
    expect(svgNode.props.width).toBe("100%");
    expect(svgNode.props.height).toBe("100%");
  });
});
