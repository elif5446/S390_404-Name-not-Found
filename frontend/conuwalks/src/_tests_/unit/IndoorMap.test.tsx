import React from "react";
import { Image, View } from "react-native";
import { render, screen } from "@testing-library/react-native";
import MapContent from "../../components/indoor/IndoorMap";
import { FloorData } from "@/src/types/indoor";

// mock expo vector icons to prevent native rendering errors in jest
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("@/src/styles/IndoorMap.styles", () => ({
  styles: {
    floorImage: { flex: 1 },
    errorBox: { justifyContent: "center", alignItems: "center" },
    errorText: { color: "#FF0000" },
  },
}));

describe("MapContent Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a valid SVG component successfully", () => {
    const MockSvg: React.FC<any> = (props) => (
      <View accessibilityLabel="mock-svg" {...props} />
    );

    const floor: FloorData = {
      id: "1",
      level: 1,
      label: "1",
      type: "svg" as const,
      image: MockSvg,
      bounds: {
        northEast: { latitude: 45.49769, longitude: -73.5783 },
        southWest: { latitude: 45.49682, longitude: -73.57954 },
      },
    };

    render(<MapContent floor={floor} width={300} height={400} />);

    // query by the accessibility label
    const svgElement = screen.getByLabelText("mock-svg");
    expect(svgElement).toBeTruthy();
    expect(svgElement.props.width).toBe("100%");
    expect(svgElement.props.height).toBe("100%");
    expect(svgElement.props.preserveAspectRatio).toBe("xMidYMid meet");
  });

  it("falls back to error view and logs a warning when SVG image is invalid", () => {
    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const floor: FloorData = {
      id: "2",
      label: "2",
      level: 2,
      type: "svg" as const,
      image: "invalid-string-not-a-component" as unknown as React.FC<any>,
      bounds: {
        northEast: { latitude: 45.49769, longitude: -73.5783 },
        southWest: { latitude: 45.49682, longitude: -73.57954 },
      },
    };

    render(<MapContent floor={floor} width={300} height={400} />);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "[IndoorMap] Floor 2 has type 'svg' but 'image' is not a valid component",
      ),
    );
    expect(screen.getByText("Map Image Unavailable")).toBeTruthy();

    consoleWarnSpy.mockRestore();
  });

  it("renders a PNG image correctly with exact dimensions", () => {
    const mockImageSource = { uri: "https://example.com/floor3.png" };

    const floor: FloorData = {
      id: "3",
      level: 3,
      label: "3",
      type: "png",
      image: mockImageSource,
      bounds: {
        northEast: { latitude: 45.49769, longitude: -73.5783 },
        southWest: { latitude: 45.49682, longitude: -73.57954 },
      },
    };

    render(<MapContent floor={floor} width={500} height={600} />);
    const imageElement = screen.UNSAFE_getByType(Image);

    expect(imageElement).toBeTruthy();
    expect(imageElement.props.source).toBe(mockImageSource);
    expect(imageElement.props.resizeMode).toBe("contain");

    // verify width and height are injected into the style array properly
    expect(imageElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: 500, height: 600 }),
      ]),
    );
  });

  it("renders the error fallback for unsupported types or completely missing images", () => {
    const floor: FloorData = {
      id: "4",
      level: 4,
      label: "4",
      type: "unknown" as "svg" | "png",
      image: null as any,
      bounds: {
        northEast: { latitude: 45.49769, longitude: -73.5783 },
        southWest: { latitude: 45.49682, longitude: -73.57954 },
      },
    };

    render(<MapContent floor={floor} width={300} height={400} />);

    expect(screen.getByText("Map Image Unavailable")).toBeTruthy();
    expect(
      screen.UNSAFE_getByType(
        "Ionicons" as unknown as React.ComponentType<any>,
      ),
    ).toBeTruthy();
  });
});
