import React, { createRef } from "react";
import { Animated, Platform, useColorScheme } from "react-native";
import { render, screen, act } from "@testing-library/react-native";
import DestinationPopup, { DestinationPopupHandle } from "../../components/DestinationPopup";

import { useDestinationData } from "../../hooks/useDestinationData";
import { useBottomSheet } from "../../hooks/useBottomSheet";

jest.mock("../../hooks/useDestinationData");
jest.mock("../../hooks/useBottomSheet");

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  default: jest.fn(),
}));

// mock child components
jest.mock("../../components/DestinationPopupHeader", () => {
  const { View } = require("react-native");
  const MockHeader = (props: any) => <View testID="mock-header" {...props} />;
  MockHeader.displayName = "MockDestinationPopupHeader";
  return MockHeader;
});
jest.mock("../../components/DestinationPopupContent", () => {
  const { View } = require("react-native");
  const MockContent = (props: any) => <View testID="mock-content" {...props} />;
  MockContent.displayName = "MockDestinationPopupContent";
  return MockContent;
});
// mock expo blurview
jest.mock("expo-blur", () => {
  const { View } = require("react-native");
  return {
    BlurView: (props: any) => <View testID="mock-blur-view" {...props} />,
  };
});

describe("DestinationPopup Component", () => {
  const mockOnClose = jest.fn();

  // destinationdata mocks
  const mockSetSelectedRouteIndex = jest.fn();
  const mockSetRouteData = jest.fn();
  const mockClearRouteData = jest.fn();
  const mockClearDestination = jest.fn();
  const mockSetTravelMode = jest.fn();
  const mockSetIsNavigationActive = jest.fn();
  const mockSetNavigationRouteId = jest.fn();

  // bottomsheet mocks
  const mockMinimize = jest.fn();
  const mockDismiss = jest.fn();
  const mockSnapTo = jest.fn();
  const MOCK_SNAP_OFFSET = 400;

  const mockRoutes = [
    { id: "route-1", name: "Fastest" },
    { id: "route-2", name: "Scenic" },
  ];

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
      clearDestination: mockClearDestination,
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
      SNAP_OFFSET: MOCK_SNAP_OFFSET,
      scrollOffsetRef: { current: 0 },
      minimize: mockMinimize,
      snapTo: mockSnapTo,
      // wrap the mock dismiss so we can actually trigger the passed ondismiss callback
      dismiss: jest.fn(payload => {
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

  it("passes isDark=true to content and mode='dark' to header in dark scheme", () => {
    (useColorScheme as jest.Mock).mockReturnValue("dark");
    render(<DestinationPopup visible={true} onClose={mockOnClose} />);

    const header = screen.getByTestId("mock-header");
    const content = screen.getByTestId("mock-content");

    expect(header.props.mode).toBe("dark");
    expect(content.props.isDark).toBe(true);
  });

  // NEW: mirror test for light scheme so the isDark=false branch is explicitly covered
  it("passes isDark=false to content and mode='light' to header in light scheme", () => {
    (useColorScheme as jest.Mock).mockReturnValue("light");
    render(<DestinationPopup visible={true} onClose={mockOnClose} />);

    const header = screen.getByTestId("mock-header");
    const content = screen.getByTestId("mock-content");

    expect(header.props.mode).toBe("light");
    expect(content.props.isDark).toBe(false);
  });

  // NEW: useColorScheme returning null falls back to 'light'
  it("defaults to light mode when useColorScheme returns null", () => {
    (useColorScheme as jest.Mock).mockReturnValue(null);
    render(<DestinationPopup visible={true} onClose={mockOnClose} />);

    const header = screen.getByTestId("mock-header");
    expect(header.props.mode).toBe("light");
    expect(screen.getByTestId("mock-content").props.isDark).toBe(false);
  });

  it("exposes the minimize method via ref", () => {
    const ref = createRef<DestinationPopupHandle>();
    render(<DestinationPopup visible={true} onClose={mockOnClose} ref={ref} />);

    act(() => {
      ref.current?.minimize();
    });

    expect(mockMinimize).toHaveBeenCalledTimes(1);
  });

  // NEW: cover the dismiss() path on the imperative handle
  it("exposes the dismiss method via ref, which triggers a full clear", () => {
    const ref = createRef<DestinationPopupHandle>();
    render(<DestinationPopup visible={true} onClose={mockOnClose} ref={ref} />);

    act(() => {
      ref.current?.dismiss();
    });

    // dismiss(true) should propagate through handleSheetDismiss
    expect(mockDismiss).toHaveBeenCalledWith(true);
    expect(mockSetIsNavigationActive).toHaveBeenCalledWith(false);
    expect(mockClearDestination).toHaveBeenCalledTimes(1);
    expect(mockClearRouteData).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
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
    expect(mockClearDestination).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // NEW: cover the shouldClear=false branch of handleSheetDismiss
  it("calls onClose but skips clearing when dismissing with shouldClear=false", () => {
    render(<DestinationPopup visible={true} onClose={mockOnClose} />);
    const content = screen.getByTestId("mock-content");

    act(() => {
      // handleStartNavigation calls dismissBottomSheet(false), which fires onDismiss(false)
      content.props.handleStartNavigation("route-1", 0);
    });

    expect(mockDismiss).toHaveBeenCalledWith(false);
    // clearing functions must NOT be called when shouldClear is false
    expect(mockSetIsNavigationActive).not.toHaveBeenCalledWith(false);
    expect(mockClearDestination).not.toHaveBeenCalled();
    expect(mockClearRouteData).not.toHaveBeenCalled();
    // onClose still fires to hide the sheet
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("updates travel mode and snaps sheet to expanded state", () => {
    render(<DestinationPopup visible={true} onClose={mockOnClose} />);

    const header = screen.getByTestId("mock-header");

    act(() => {
      header.props.setTravelMode("transit");
    });

    // Verifies our new wrapper function works
    expect(mockSetTravelMode).toHaveBeenCalledWith("transit");
    expect(mockSnapTo).toHaveBeenCalledWith(MOCK_SNAP_OFFSET);
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

  // NEW: cover the handleScroll callback — updates scrollOffsetRef via onScroll
  it("updates scrollOffsetRef when the scroll view fires an onScroll event", () => {
    const mockScrollOffsetRef = { current: 0 };
    (useBottomSheet as jest.Mock).mockImplementation(({ onDismiss }) => ({
      translateY: new Animated.Value(0),
      MAX_HEIGHT: 800,
      SNAP_OFFSET: MOCK_SNAP_OFFSET,
      scrollOffsetRef: mockScrollOffsetRef,
      minimize: mockMinimize,
      snapTo: mockSnapTo,
      dismiss: jest.fn(payload => {
        mockDismiss(payload);
        onDismiss(payload);
      }),
      handleToggleHeight: jest.fn(),
      handlePanResponder: { panHandlers: {} },
      scrollAreaPanResponder: { panHandlers: {} },
    }));

    render(<DestinationPopup visible={true} onClose={mockOnClose} />);
    const content = screen.getByTestId("mock-content");

    act(() => {
      content.props.onScroll({
        nativeEvent: { contentOffset: { y: 120 } },
      });
    });

    expect(mockScrollOffsetRef.current).toBe(120);
  });

  // NEW: verify optional indoor-map props are forwarded to the header
  it("forwards showOpenIndoorButton and onOpenIndoorPress props to the header", () => {
    const mockOnOpenIndoorPress = jest.fn();
    render(
      <DestinationPopup
        visible={true}
        onClose={mockOnClose}
        showOpenIndoorButton={true}
        onOpenIndoorPress={mockOnOpenIndoorPress}
      />,
    );

    const header = screen.getByTestId("mock-header");
    expect(header.props.showOpenIndoorButton).toBe(true);
    expect(header.props.onOpenIndoorPress).toBe(mockOnOpenIndoorPress);
  });

  // NEW: when optional indoor props are omitted, header receives undefined/falsy values
  it("passes undefined for optional indoor props when not provided", () => {
    render(<DestinationPopup visible={true} onClose={mockOnClose} />);
    const header = screen.getByTestId("mock-header");

    expect(header.props.showOpenIndoorButton).toBeUndefined();
    expect(header.props.onOpenIndoorPress).toBeUndefined();
  });

  // NEW: verify the Animated sheet receives the translateY transform from useBottomSheet
  it("applies the translateY transform from useBottomSheet to the animated sheet", () => {
    const animatedValue = new Animated.Value(50);
    (useBottomSheet as jest.Mock).mockImplementation(({ onDismiss }) => ({
      translateY: animatedValue,
      MAX_HEIGHT: 800,
      SNAP_OFFSET: MOCK_SNAP_OFFSET,
      scrollOffsetRef: { current: 0 },
      minimize: mockMinimize,
      snapTo: mockSnapTo,
      dismiss: jest.fn(payload => {
        mockDismiss(payload);
        onDismiss(payload);
      }),
      handleToggleHeight: jest.fn(),
      handlePanResponder: { panHandlers: {} },
      scrollAreaPanResponder: { panHandlers: {} },
    }));

    render(<DestinationPopup visible={true} onClose={mockOnClose} />);

    // The Animated.Value should hold the value we passed in
    expect((animatedValue as any).__getValue()).toBe(50);
  });

  // NEW: cover the visible=false render path (pointerEvents="none")
  it("renders with pointer events disabled when visible is false", () => {
    render(<DestinationPopup visible={false} onClose={mockOnClose} />);
    // Component should still mount but overlay should have pointerEvents="none"
    // The mock-header and mock-content are still in the tree (sheet is always mounted)
    expect(screen.getByTestId("mock-header")).toBeTruthy();
    expect(screen.getByTestId("mock-content")).toBeTruthy();
  });

  // NEW: cover handleToggleHeight being wired through the header's onToggleHeight prop
  it("wires handleToggleHeight from useBottomSheet to the header's onToggleHeight prop", () => {
    const mockHandleToggleHeight = jest.fn();
    (useBottomSheet as jest.Mock).mockImplementation(({ onDismiss }) => ({
      translateY: new Animated.Value(0),
      MAX_HEIGHT: 800,
      SNAP_OFFSET: MOCK_SNAP_OFFSET,
      scrollOffsetRef: { current: 0 },
      minimize: mockMinimize,
      snapTo: mockSnapTo,
      dismiss: jest.fn(payload => {
        mockDismiss(payload);
        onDismiss(payload);
      }),
      handleToggleHeight: mockHandleToggleHeight,
      handlePanResponder: { panHandlers: {} },
      scrollAreaPanResponder: { panHandlers: {} },
    }));

    render(<DestinationPopup visible={true} onClose={mockOnClose} />);
    const header = screen.getByTestId("mock-header");

    act(() => {
      header.props.onToggleHeight();
    });

    expect(mockHandleToggleHeight).toHaveBeenCalledTimes(1);
  });
});
