import { render, screen, fireEvent } from "@testing-library/react-native";
import MapScheduleToggle from "../../components/MapScheduleToggle";
import { Platform } from "react-native";

process.env.EXPO_OS = "ios";

// Mock external icons
jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-symbols", () => ({ SymbolView: "SymbolView" }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: (props: any) => props.children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe("MapScheduleToggle", () => {
  const mockOnChange = jest.fn();
  const RN = require("react-native");
  let originalOS: string;

  beforeEach(() => {
    jest.clearAllMocks();
    originalOS = RN.Platform.OS;
  });

  afterEach(() => {
    Object.defineProperty(RN.Platform, "OS", {
      get: () => originalOS,
      configurable: true,
    });
  });

  it("renders both Map and Schedule buttons", () => {
    render(<MapScheduleToggle selected="map" onChange={mockOnChange} />);
    expect(screen.getByText("Map")).toBeTruthy();
    expect(screen.getByText("Schedule")).toBeTruthy();
  });

  it("calls onChange when a tab is pressed", () => {
    render(<MapScheduleToggle selected="map" onChange={mockOnChange} />);
    fireEvent.press(screen.getByText("Schedule"));
    expect(mockOnChange).toHaveBeenCalledWith("calendar");
  });

  it("returns null when visible is false", () => {
    const { toJSON } = render(
      <MapScheduleToggle selected="map" onChange={mockOnChange} visible={false} />
    );
    expect(toJSON()).toBeNull();
  });

  it("renders SymbolView icons on iOS", () => {
    Object.defineProperty(RN.Platform, "OS", { get: () => "ios", configurable: true });

    render(<MapScheduleToggle selected="map" onChange={mockOnChange} />);

    const icons = screen.UNSAFE_getAllByType("SymbolView" as any);
    expect(icons.length).toBe(2);
    
    expect(icons[0].props.name).toBe("map");
  });

  it("renders MaterialIcons on Android", () => {
    Object.defineProperty(RN.Platform, "OS", { get: () => "android", configurable: true });

    render(<MapScheduleToggle selected="map" onChange={mockOnChange} />);

    const icons = screen.UNSAFE_getAllByType("MaterialIcons" as any);
    expect(icons.length).toBe(2);
    
    expect(icons[0].props.name).toBe("map");
  });

  it("applies the active color to the selected tab icon", () => {
    Object.defineProperty(RN.Platform, "OS", { get: () => "android", configurable: true });

    render(<MapScheduleToggle selected="map" onChange={mockOnChange} />);

    const icons = screen.UNSAFE_getAllByType("MaterialIcons" as any);
    
    expect(icons[0].props.color).toBe("#FFFFFF");
    
    expect(icons[1].props.color).toBe("#333333");
  });
});