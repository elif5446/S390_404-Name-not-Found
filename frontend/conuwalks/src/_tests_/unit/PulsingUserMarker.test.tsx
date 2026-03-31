import React from "react";
import { render } from "@testing-library/react-native";
import PulsingUserMarker from "@/src/components/indoor/PulsingUserMarker";

describe("PulsingUserMarker", () => {
  it("renders at the correct position and is accessible", () => {
    const { getByLabelText, getByRole } = render(
      <PulsingUserMarker x={100} y={200} />
    );
    const marker = getByLabelText("Your current location");
    expect(marker).toBeTruthy();
    expect(getByRole("image")).toBeTruthy();
  });

  it("matches snapshot", () => {
    const { toJSON } = render(<PulsingUserMarker x={50} y={75} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
