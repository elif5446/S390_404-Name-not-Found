import React from "react";
import { render } from "@testing-library/react-native";
import StatusGradient from "@/src/components/StatusGradient";

// Mocking dependencies
jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 50 }),
}));

describe("StatusGradient", () => {
  it("renders correctly", () => {
    const { toJSON } = render(<StatusGradient />);
    expect(toJSON()).toMatchSnapshot();
  });
});
