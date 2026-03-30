import React from "react";
import { render } from "@testing-library/react-native";
import IndoorPointMarker from "@/src/components/indoor/IndoorPointMarker";

describe("IndoorPointMarker", () => {
  it("calculates the correct absolute positioning and applies the background color", () => {
    const x = 100;
    const y = 200;
    const bgColor = "#3A7BD5";

    const { toJSON } = render(<IndoorPointMarker x={x} y={y} emoji="🔵" bgColor={bgColor} />);

    const tree = toJSON() as any;

    // verify pointer events are disabled so it doesn't block map interactions
    expect(tree.props.pointerEvents).toBe("none");

    // expected math: left = x + 2, top = y - 12
    expect(tree.props.style.left).toBe(102);
    expect(tree.props.style.top).toBe(188);
    expect(tree.props.style.position).toBe("absolute");

    // verify the dynamic background color is applied
    expect(tree.props.style.backgroundColor).toBe(bgColor);
  });

  it("renders the emoji text when a standard emoji is provided", () => {
    const { getByText } = render(<IndoorPointMarker x={0} y={0} emoji="🌟" bgColor="#FFF" />);

    const emojiNode = getByText("🌟");
    expect(emojiNode).toBeTruthy();
    expect(emojiNode.props.style.fontSize).toBe(7);
  });

  it("does not render the text component if the emoji is the default map pin (📍)", () => {
    const { queryByText, toJSON } = render(<IndoorPointMarker x={0} y={0} emoji="📍" bgColor="#FFF" />);

    expect(queryByText("📍")).toBeNull();

    const tree = toJSON() as any;
    expect(tree.children).toBeNull();
  });

  it("does not render any text children if the emoji string is empty", () => {
    const { toJSON } = render(<IndoorPointMarker x={0} y={0} emoji="" bgColor="#FFF" />);

    const tree = toJSON() as any;
    // the parent view should have no children rendered
    expect(tree.children).toBeNull();
  });
});
