import React, { createRef } from "react";
import { Animated, Platform } from "react-native";
import { render, screen, act } from "@testing-library/react-native";
import AdditionalInfoPopup, {
  AdditionalInfoPopupHandle,
} from "../../components/AdditionalInfoPopup";

import { useBuildingData } from "../../hooks/useBuildingData";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { useBuildingEvents } from "../../hooks/useBuildingEvents";

jest.mock("../../hooks/useBuildingData");
jest.mock("../../hooks/useBottomSheet");
jest.mock("../../hooks/useBuildingEvents");

// mock child components to isolate the wrapper logic
jest.mock("../../components/AdditionalInfoPopupHeader", () => {
  const { View } = require("react-native");
  const MockHeader = (props: any) => <View testID="mock-header" {...props} />;
  MockHeader.displayName = "MockAdditionalInfoPopupHeader";
  return MockHeader;
});

jest.mock("../../components/AdditionalInfoPopupContent", () => {
  const { View } = require("react-native");
  const MockContent = (props: any) => <View testID="mock-content" {...props} />;
  MockContent.displayName = "MockAdditionalInfoPopupContent";
  return MockContent;
});

jest.mock("expo-blur", () => {
  const { View } = require("react-native");
  return {
    BlurView: (props: any) => <View testID="mock-blur-view" {...props} />,
  };
});

describe("AdditionalInfoPopup Component", () => {
  const mockSnapTo = jest.fn();
  const mockMinimize = jest.fn();
  // simulate dismiss calling its completion callback immediately
  const mockDismiss = jest.fn((payload, onDone) => onDone?.());
  const mockOnClose = jest.fn();
  const mockOnDirectionsTrigger = jest.fn();

  // create a mutable ref object so we can assert if handlescroll updates it
  const mockScrollOffsetRef = { current: 0 };

  const defaultProps = {
    visible: true,
    buildingId: "H",
    campus: "SGW" as const,
    onClose: mockOnClose,
    onDirectionsTrigger: mockOnDirectionsTrigger,
    directionsEtaLabel: "10 min",
  };

  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // Intercept timers to prevent act() warnings from animations

    // setup standard returns for our mocked hooks
    (useBuildingData as jest.Mock).mockReturnValue({
      buildingInfo: { name: "Henry F. Hall" },
      isCopying: false,
      copyAddress: jest.fn(),
      accessibilityIcons: [
        {
          key: "wheelchair",
          sf: "figure.roll",
          material: "accessible",
          label: "Accessible",
        },
      ],
    });

    (useBuildingEvents as jest.Mock).mockReturnValue({
      todayEvents: [{ id: "1", courseName: "Test Course" }],
      nextEvent: null,
      loading: false,
    });

    (useBottomSheet as jest.Mock).mockReturnValue({
      translateY: new Animated.Value(0),
      MAX_HEIGHT: 800,
      SNAP_OFFSET: 400,
      scrollOffsetRef: mockScrollOffsetRef,
      snapTo: mockSnapTo,
      minimize: mockMinimize,
      dismiss: mockDismiss,
      handleToggleHeight: jest.fn(),
      handlePanResponder: { panHandlers: {} },
      scrollAreaPanResponder: { panHandlers: {} },
    });
  });

  afterEach(() => {
    Platform.OS = originalOS;
    jest.useRealTimers();
  });

  it("renders the blurred background wrapper on iOS", () => {
    Platform.OS = "ios";
    render(<AdditionalInfoPopup {...defaultProps} />);
    expect(screen.getByTestId("mock-blur-view")).toBeTruthy();
  });

  it("renders the standard elevation view on Android", () => {
    Platform.OS = "android";
    render(<AdditionalInfoPopup {...defaultProps} />);
    // if it's android, the blurview mock shouldn't be rendered
    expect(screen.queryByTestId("mock-blur-view")).toBeNull();
  });

  it("passes correct props to Header and Content children", () => {
    render(<AdditionalInfoPopup {...defaultProps} />);

    const header = screen.getByTestId("mock-header");
    const content = screen.getByTestId("mock-content");

    expect(header).toBeTruthy();
    expect(content).toBeTruthy();

    // verify header props
    expect(header.props.buildingId).toBe("H");
    expect(header.props.directionsEtaLabel).toBe("10 min");
    expect(header.props.accessibilityIcons.length).toBe(1);

    // verify content props (including the newly added building events data)
    expect(content.props.buildingInfo.name).toBe("Henry F. Hall");
    expect(content.props.directionsEtaLabel).toBe("10 min");
    expect(content.props.eventsLoading).toBe(false);
    expect(content.props.todayEvents.length).toBe(1);
    expect(content.props.nextEvent).toBeNull();
  });

  it("exposes collapse and minimize methods via ref", () => {
    const ref = createRef<AdditionalInfoPopupHandle>();
    render(<AdditionalInfoPopup {...defaultProps} ref={ref} />);

    // call the imperative methods
    act(() => {
      ref.current?.collapse();
      ref.current?.minimize();
    });

    // verify they map to the correct usebottomsheet methods
    expect(mockSnapTo).toHaveBeenCalledWith(400); // 400 is our mocked SNAP_OFFSET
    expect(mockMinimize).toHaveBeenCalledTimes(1);
  });

  it("triggers dismiss and invokes onDirectionsTrigger when directions are pressed", () => {
    render(<AdditionalInfoPopup {...defaultProps} />);

    const header = screen.getByTestId("mock-header");

    // simulate the header calling the handledirectionspress callback
    act(() => {
      header.props.onDirectionsPress();
    });

    expect(mockDismiss).toHaveBeenCalled();
    expect(mockOnDirectionsTrigger).toHaveBeenCalled();
  });

  it("triggers a crossfade animation and snaps to offset when buildingId changes while visible", () => {
    const timingSpy = jest.spyOn(Animated, "timing");
    const { rerender } = render(
      <AdditionalInfoPopup {...defaultProps} buildingId="H" />,
    );

    // clear initial render calls
    mockSnapTo.mockClear();
    timingSpy.mockClear();

    // rerender with a new building id
    rerender(<AdditionalInfoPopup {...defaultProps} buildingId="MB" />);

    // fast-forward through the animation timers
    act(() => {
      jest.runAllTimers();
    });

    // verify it snaps back to the default reading height
    expect(mockSnapTo).toHaveBeenCalledWith(400);

    // verify the crossfade animation sequence was queued (tovalue: 0 then tovalue: 1)
    expect(timingSpy).toHaveBeenCalledTimes(2);
    expect(timingSpy).toHaveBeenNthCalledWith(
      1,
      expect.any(Object),
      expect.objectContaining({ toValue: 0, duration: 150 }),
    );
    expect(timingSpy).toHaveBeenNthCalledWith(
      2,
      expect.any(Object),
      expect.objectContaining({ toValue: 1, duration: 150 }),
    );

    timingSpy.mockRestore();
  });

  it("handles accessibility increment and decrement correctly", () => {
    render(<AdditionalInfoPopup {...defaultProps} />);

    const header = screen.getByTestId("mock-header");

    // simulate swipe up (increment)
    act(() => {
      header.props.onDragHandleAccessibilityAction({
        nativeEvent: { actionName: "increment" },
      });
    });
    expect(mockSnapTo).toHaveBeenCalledWith(0); // Expand fully

    // simulate swipe down (decrement)
    act(() => {
      header.props.onDragHandleAccessibilityAction({
        nativeEvent: { actionName: "decrement" },
      });
    });
    expect(mockSnapTo).toHaveBeenCalledWith(400); // Collapse to SNAP_OFFSET
  });

  it("updates scrollOffsetRef when onScroll is called", () => {
    render(<AdditionalInfoPopup {...defaultProps} />);

    const content = screen.getByTestId("mock-content");

    // simulate a scroll event
    act(() => {
      content.props.onScroll({
        nativeEvent: { contentOffset: { y: 150 } },
      });
    });

    // verify the ref object provided by the mock hook was updated correctly
    expect(mockScrollOffsetRef.current).toBe(150);
  });
});
