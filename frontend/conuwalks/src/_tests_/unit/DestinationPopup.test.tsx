import React, { createRef } from "react";
import { Animated, Platform, useColorScheme } from "react-native";
import { render, screen, act } from "@testing-library/react-native";
import DestinationPopup, { DestinationPopupHandle } from "../../components/DestinationPopup";

jest.mock("../../hooks/useDestinationData");
jest.mock("../../hooks/useBottomSheet");

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  default: jest.fn(),
}));

// mock child components
jest.mock("../../components/DestinationPopupHeader", () => {
  const { View } = require("react-native");
  return (props: any) => <View testID="mock-header" {...props} />;
});
jest.mock("../../components/DestinationPopupContent", () => {
  const { View } = require("react-native");
  return (props: any) => <View testID="mock-content" {...props} />;
});

// 4. mock expo blurview
jest.mock("expo-blur", () => {
  const { View } = require("react-native");
  return {
    BlurView: (props: any) => <View testID="mock-blur-view" {...props} />,
  };
});

// import hooks for mocking return values
import { useDestinationData } from "../../hooks/useDestinationData";
import { useBottomSheet } from "../../hooks/useBottomSheet";

describe("DestinationPopup Component", () => {
  const mockOnClose = jest.fn();

  // destinationdata mocks
  const mockSetSelectedRouteIndex = jest.fn();
  const mockSetRouteData = jest.fn();
  const mockClearRouteData = jest.fn();
  const mockSetTravelMode = jest.fn();
  const mockSetIsNavigationActive = jest.fn();
  const mockSetNavigationRouteId = jest.fn();

  // bottomsheet mocks
  const mockMinimize = jest.fn();
  const mockDismiss = jest.fn();

  const mockRoutes = [{ id: "route-1", name: "Fastest" }, { id: "route-2", name: "Scenic" }];

  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    (useColorScheme as jest.Mock).mockReturnValue("light");

    (useDestinationData as jest.Mock).mockReturnValue({
      routes: mockRoutes,
      selectedRouteIndex: 0,
      setSelectedRouteIndex: mockSetSelectedRouteIndex,
      setRouteData: mockSetRouteData,
      clearRouteData: mockClearRouteData,
      loading: false,
      error: null,
      travelMode: "walking",
      setTravelMode: mockSetTravelMode,
      setIsNavigationActive: mockSetIsNavigationActive,
      navigationRouteId: null,
      setNavigationRouteId: mockSetNavigationRouteId,
      getModeDurationLabel: jest.fn(),
      getTransitBadgeLabel: jest.fn(),
      getRouteTransitSummary: jest.fn(),
      transitSteps: [],
    });

    (useBottomSheet as jest.Mock).mockImplementation(({ onDismiss }) => ({
      translateY: new Animated.Value(0),
      MAX_HEIGHT: 800,
      scrollOffsetRef: { current: 0 },
      minimize: mockMinimize,
      // wrap the mock dismiss so we can actually trigger the passed ondismiss callback
      dismiss: jest.fn((payload) => {
        mockDismiss(payload);
        onDismiss(payload); 
      }),
      handleToggleHeight: jest.fn(),
      handlePanResponder: { panHandlers: {} },
      scrollAreaPanResponder: { panHandlers: {} },
    }));
  });

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it("renders BlurView on iOS and solid background on Android", () => {
    Platform.OS = "ios";
    const { rerender } = render(<DestinationPopup visible={true} onClose={mockOnClose} />);
    expect(screen.getByTestId("mock-blur-view")).toBeTruthy();

    Platform.OS = "android";
    rerender(<DestinationPopup visible={true} onClose={mockOnClose} />);
    expect(screen.queryByTestId("mock-blur-view")).toBeNull();
  });

  it("passes the correct isDark prop based on system color scheme", () => {
    (useColorScheme as jest.Mock).mockReturnValue("dark");
    render(<DestinationPopup visible={true} onClose={mockOnClose} />);

    const header = screen.getByTestId("mock-header");
    const content = screen.getByTestId("mock-content");

    expect(header.props.isDark).toBe(true);
    expect(content.props.isDark).toBe(true);
  });

  it("exposes the minimize method via ref", () => {
    const ref = createRef<DestinationPopupHandle>();
    render(<DestinationPopup visible={true} onClose={mockOnClose} ref={ref} />);

    act(() => {
      ref.current?.minimize();
    });

    expect(mockMinimize).toHaveBeenCalledTimes(1);
  });

  it("handles header dismiss request correctly (clearing routes)", () => {
    render(<DestinationPopup visible={true} onClose={mockOnClose} />);
    
    const header = screen.getByTestId("mock-header");

    act(() => {
      header.props.onDismiss();
    });

    // the header dismiss should call dismiss(true) to indicate a full clear
    expect(mockDismiss).toHaveBeenCalledWith(true);
    
    // because the sheet dismissed with 'true', the clearing functions should fire
    expect(mockSetIsNavigationActive).toHaveBeenCalledWith(false);
    expect(mockClearRouteData).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("updates state correctly when a route is selected", () => {
    render(<DestinationPopup visible={true} onClose={mockOnClose} />);
    
    const content = screen.getByTestId("mock-content");

    act(() => {
      content.props.handleSelectRoute(1); // Select the second route
    });

    expect(mockSetSelectedRouteIndex).toHaveBeenCalledWith(1);
    expect(mockSetRouteData).toHaveBeenCalledWith(mockRoutes[1]);
  });

  it("starts navigation, retains route data, and dismisses sheet", () => {
    render(<DestinationPopup visible={true} onClose={mockOnClose} />);
    
    const content = screen.getByTestId("mock-content");

    act(() => {
      // start navigation on the first route
      content.props.handleStartNavigation("route-1", 0);
    });

    expect(mockSetSelectedRouteIndex).toHaveBeenCalledWith(0);
    expect(mockSetRouteData).toHaveBeenCalledWith(mockRoutes[0]);
    expect(mockSetNavigationRouteId).toHaveBeenCalledWith("route-1");
    expect(mockSetIsNavigationActive).toHaveBeenCalledWith(true);

    // it should call dismiss(false) so the popup hides but the map keeps the route drawn
    expect(mockDismiss).toHaveBeenCalledWith(false);

    // verify clear functions were not called because payload was false
    expect(mockClearRouteData).not.toHaveBeenCalled();
    // onclose should still be called to hide the component
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("handles starting navigation with an invalid index safely", () => {
    render(<DestinationPopup visible={true} onClose={mockOnClose} />);
    const content = screen.getByTestId("mock-content");

    act(() => {
      // pass an index that doesn't exist in mockroutes
      content.props.handleStartNavigation("invalid-route", 99);
    });

    // it should still set the navigation id, but skip the route data setters
    expect(mockSetNavigationRouteId).toHaveBeenCalledWith("invalid-route");
    expect(mockSetRouteData).not.toHaveBeenCalled();
    expect(mockDismiss).not.toHaveBeenCalled(); // Safely aborted
  });
});
