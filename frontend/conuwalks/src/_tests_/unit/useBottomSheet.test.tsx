import { renderHook, act } from "@testing-library/react-native";
import { Animated, Platform, BackHandler, PanResponder } from "react-native";
import {
  useBottomSheet,
  UseBottomSheetConfig,
} from "../../hooks/useBottomSheet";

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  default: jest.fn(() => ({ height: 1000, width: 500 })),
}));

describe("useBottomSheet Hook", () => {
  const originalOS = Platform.OS;

  let mockSpring: jest.SpyInstance;
  let mockTiming: jest.SpyInstance;
  let panCreateSpy: jest.SpyInstance;

  let addListenerSpy: jest.SpyInstance;
  let removeListenerSpy: jest.SpyInstance;
  let setValueSpy: jest.SpyInstance;
  let stopAnimationSpy: jest.SpyInstance;

  let capturedConfigs: any[] = [];

  const getHandleConfig = () => {
    expect(capturedConfigs.length).toBeGreaterThanOrEqual(1);
    return capturedConfigs[0];
  };

  const getScrollConfig = () => {
    expect(capturedConfigs.length).toBeGreaterThanOrEqual(2);
    return capturedConfigs[1];
  };

  const triggerRelease = (gestureState: Partial<any>) => {
    const handleConfig = getHandleConfig();

    act(() => {
      handleConfig.onPanResponderRelease?.({} as any, {
        vx: 0,
        vy: 0,
        dx: 0,
        dy: 0,
        x0: 0,
        y0: 0,
        moveX: 0,
        moveY: 0,
        numberActiveTouches: 1,
        stateID: 1,
        ...gestureState,
      });
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    capturedConfigs = [];

    panCreateSpy = jest.spyOn(PanResponder, "create").mockImplementation((config) => {
      capturedConfigs.push(config);
      return { panHandlers: {} } as any;
    });

    mockSpring = jest.spyOn(Animated, "spring").mockImplementation(
      () =>
        ({
          start: (cb?: (arg: { finished: boolean }) => void) => cb?.({ finished: true }),
        }) as any,
    );

    mockTiming = jest.spyOn(Animated, "timing").mockImplementation(
      () =>
        ({
          start: (cb?: (arg: { finished: boolean }) => void) => cb?.({ finished: true }),
        }) as any,
    );

    addListenerSpy = jest
      .spyOn(Animated.Value.prototype, "addListener")
      .mockImplementation(() => "listener-id");

    removeListenerSpy = jest
      .spyOn(Animated.Value.prototype, "removeListener")
      .mockImplementation(jest.fn());

    setValueSpy = jest
      .spyOn(Animated.Value.prototype, "setValue")
      .mockImplementation(jest.fn());

    stopAnimationSpy = jest
      .spyOn(Animated.Value.prototype, "stopAnimation")
      .mockImplementation((cb?: (value: number) => void) => cb?.(100));
  });

  afterEach(() => {
    Platform.OS = originalOS;
    jest.restoreAllMocks();
  });

  it("calculates offsets correctly on iOS", () => {
    Platform.OS = "ios";

    const { result } = renderHook(() =>
      useBottomSheet({
        visible: false,
        onDismiss: jest.fn(),
        minHeight: 400,
        peekHeightRatio: 0.2,
      }),
    );

    expect(result.current.MAX_HEIGHT).toBe(920);
    expect(result.current.SNAP_OFFSET).toBe(520);
    expect(result.current.MINIMIZED_OFFSET).toBe(720);
  });

  it("calculates offsets correctly on Android", () => {
    Platform.OS = "android";

    const { result } = renderHook(() =>
      useBottomSheet({
        visible: false,
        onDismiss: jest.fn(),
        minHeight: 400,
      }),
    );

    expect(result.current.MAX_HEIGHT).toBe(900);
    expect(result.current.SNAP_OFFSET).toBe(500);
  });

  it("opens to SNAP_OFFSET when visible becomes true from off-screen", () => {
    const onExpansionChange = jest.fn();

    const { result, rerender } = renderHook(
      (props: UseBottomSheetConfig) => useBottomSheet(props),
      {
        initialProps: {
          visible: false,
          onDismiss: jest.fn(),
          onExpansionChange,
        },
      },
    );

    mockSpring.mockClear();
    setValueSpy.mockClear();

    rerender({
      visible: true,
      onDismiss: jest.fn(),
      onExpansionChange,
    });

    expect(setValueSpy).toHaveBeenCalledWith(1000);
    expect(mockSpring).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: result.current.SNAP_OFFSET }),
    );
  });

  it("animates off-screen when visible becomes false while sheet is open", () => {
    const { rerender } = renderHook(
      (props: UseBottomSheetConfig) => useBottomSheet(props),
      {
        initialProps: {
          visible: true,
          onDismiss: jest.fn(),
        },
      },
    );

    mockSpring.mockClear();
    mockTiming.mockClear();

    rerender({
      visible: false,
      onDismiss: jest.fn(),
    });

    expect(mockTiming).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: 1000 }),
    );
  });

  it("does not animate off-screen again when already hidden and visible stays false", () => {
    const { rerender } = renderHook(
      (props: UseBottomSheetConfig) => useBottomSheet(props),
      {
        initialProps: {
          visible: false,
          onDismiss: jest.fn(),
        },
      },
    );

    mockTiming.mockClear();

    rerender({
      visible: false,
      onDismiss: jest.fn(),
    });

    expect(mockTiming).not.toHaveBeenCalled();
  });

  it("dismiss calls onDismiss with payload", () => {
    const onDismiss = jest.fn();

    const { result } = renderHook(() =>
      useBottomSheet({
        visible: true,
        onDismiss,
      }),
    );

    act(() => {
      result.current.dismiss("payload");
    });

    expect(mockTiming).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: 1000 }),
    );
    expect(onDismiss).toHaveBeenCalledWith("payload");
  });

  it("dismiss calls onDismiss with undefined when no payload is given", () => {
    const onDismiss = jest.fn();

    const { result } = renderHook(() =>
      useBottomSheet({
        visible: true,
        onDismiss,
      }),
    );

    act(() => {
      result.current.dismiss();
    });

    expect(onDismiss).toHaveBeenCalledWith(undefined);
  });

  it("dismiss calls onDone after animation finishes", () => {
    const onDone = jest.fn();

    const { result } = renderHook(() =>
      useBottomSheet({
        visible: true,
        onDismiss: jest.fn(),
      }),
    );

    act(() => {
      result.current.dismiss("x", onDone);
    });

    expect(onDone).toHaveBeenCalled();
  });

  it("minimize animates to MINIMIZED_OFFSET by default", () => {
    const { result } = renderHook(() =>
      useBottomSheet({
        visible: true,
        onDismiss: jest.fn(),
      }),
    );

    act(() => {
      result.current.minimize();
    });

    expect(mockTiming).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: result.current.MINIMIZED_OFFSET }),
    );
  });

  it("minimize accepts a custom height", () => {
    const { result } = renderHook(() =>
      useBottomSheet({
        visible: true,
        onDismiss: jest.fn(),
      }),
    );

    act(() => {
      result.current.minimize(600);
    });

    expect(mockTiming).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: 600 }),
    );
  });

  it("minimize calls onDone after animation finishes", () => {
    const onDone = jest.fn();

    const { result } = renderHook(() =>
      useBottomSheet({
        visible: true,
        onDismiss: jest.fn(),
      }),
    );

    act(() => {
      result.current.minimize(undefined, onDone);
    });

    expect(onDone).toHaveBeenCalled();
  });

  it("minimize returns early when already minimized or lower", () => {
    const onDone = jest.fn();

    const { result } = renderHook(() =>
      useBottomSheet({
        visible: true,
        onDismiss: jest.fn(),
      }),
    );

    act(() => {
      result.current.snapTo(result.current.MINIMIZED_OFFSET);
    });

    mockTiming.mockClear();

    act(() => {
      result.current.minimize(result.current.MINIMIZED_OFFSET, onDone);
    });

    expect(onDone).toHaveBeenCalled();
    expect(mockTiming).not.toHaveBeenCalled();
  });

  it("minimize returns early when already targeting the same height", () => {
    const customHeight = 650;
    const onDone = jest.fn();

    mockTiming.mockImplementationOnce(
      () =>
        ({
          start: () => {
            // intentionally do not finish
          },
        }) as any,
    );

    const { result } = renderHook(() =>
      useBottomSheet({
        visible: true,
        onDismiss: jest.fn(),
      }),
    );

    act(() => {
      result.current.minimize(customHeight);
    });

    mockTiming.mockClear();

    act(() => {
      result.current.minimize(customHeight, onDone);
    });

    expect(onDone).toHaveBeenCalled();
    expect(mockTiming).not.toHaveBeenCalled();
  });

  it("snapTo animates to the given value and calls onDone", () => {
    const onDone = jest.fn();

    const { result } = renderHook(() =>
      useBottomSheet({
        visible: true,
        onDismiss: jest.fn(),
      }),
    );

    mockSpring.mockClear();

    act(() => {
      result.current.snapTo(123, onDone);
    });

    expect(mockSpring).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: 123 }),
    );
    expect(onDone).toHaveBeenCalled();
  });

  it("reports expanded=true when snapping to 0", () => {
    const onExpansionChange = jest.fn();

    const { result } = renderHook(() =>
      useBottomSheet({
        visible: true,
        onDismiss: jest.fn(),
        onExpansionChange,
      }),
    );

    onExpansionChange.mockClear();

    act(() => {
      result.current.snapTo(0);
    });

    expect(onExpansionChange).toHaveBeenCalledWith(true);
  });

  it("reports expanded=false when transitioning from expanded to snapped", () => {
    const onExpansionChange = jest.fn();

    const { result } = renderHook(() =>
      useBottomSheet({
        visible: true,
        onDismiss: jest.fn(),
        onExpansionChange,
      }),
    );

    act(() => {
      result.current.snapTo(0);
    });

    onExpansionChange.mockClear();

    act(() => {
      result.current.snapTo(result.current.SNAP_OFFSET);
    });

    expect(onExpansionChange).toHaveBeenCalledWith(false);
  });

  it("handleToggleHeight snaps to SNAP_OFFSET when fully expanded", () => {
    const { result } = renderHook(() =>
      useBottomSheet({
        visible: true,
        onDismiss: jest.fn(),
      }),
    );

    act(() => {
      result.current.snapTo(0);
    });

    mockSpring.mockClear();

    act(() => {
      result.current.handleToggleHeight();
    });

    expect(mockSpring).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: result.current.SNAP_OFFSET }),
    );
  });

  it("handleToggleHeight snaps to 0 when around SNAP_OFFSET", () => {
    const { result } = renderHook(() =>
      useBottomSheet({
        visible: true,
        onDismiss: jest.fn(),
      }),
    );

    act(() => {
      result.current.snapTo(result.current.SNAP_OFFSET);
    });

    mockSpring.mockClear();

    act(() => {
      result.current.handleToggleHeight();
    });

    expect(mockSpring).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: 0 }),
    );
  });

  it("handleToggleHeight snaps to SNAP_OFFSET when well below the snap point", () => {
    const { result } = renderHook(() =>
      useBottomSheet({
        visible: true,
        onDismiss: jest.fn(),
      }),
    );

    act(() => {
      result.current.snapTo(result.current.SNAP_OFFSET + 50);
    });

    mockSpring.mockClear();

    act(() => {
      result.current.handleToggleHeight();
    });

    expect(mockSpring).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: result.current.SNAP_OFFSET }),
    );
  });

  it("registers Android back handler and dismisses when visible", () => {
    Platform.OS = "android";

    const remove = jest.fn();
    const addEventListenerSpy = jest
      .spyOn(BackHandler, "addEventListener")
      .mockReturnValue({ remove } as any);

    const onDismiss = jest.fn();

    const { unmount } = renderHook(() =>
      useBottomSheet({
        visible: true,
        onDismiss,
      }),
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "hardwareBackPress",
      expect.any(Function),
    );

    const callback = addEventListenerSpy.mock.calls[0][1];
    let handled = false;

    act(() => {
      handled = callback() as boolean;
    });

    expect(handled).toBe(true);
    expect(onDismiss).toHaveBeenCalled();

    unmount();
    expect(remove).toHaveBeenCalled();
  });

  it("does not intercept Android back press when not visible", () => {
    Platform.OS = "android";

    const addEventListenerSpy = jest
      .spyOn(BackHandler, "addEventListener")
      .mockReturnValue({ remove: jest.fn() } as any);

    renderHook(() =>
      useBottomSheet({
        visible: false,
        onDismiss: jest.fn(),
      }),
    );

    const callback = addEventListenerSpy.mock.calls[0][1];
    let handled = true;

    act(() => {
      handled = callback() as boolean;
    });

    expect(handled).toBe(false);
  });

  describe("handlePanResponder gesture logic", () => {
    it("creates both pan responders", () => {
      renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      expect(panCreateSpy).toHaveBeenCalledTimes(2);
      expect(getHandleConfig().onPanResponderGrant).toBeDefined();
      expect(getScrollConfig().onMoveShouldSetPanResponder).toBeDefined();
    });

    it("onPanResponderGrant stops animation", () => {
      const handleConfig = (() => {
        renderHook(() =>
          useBottomSheet({
            visible: true,
            onDismiss: jest.fn(),
          }),
        );
        return getHandleConfig();
      })();

      stopAnimationSpy.mockImplementationOnce((cb?: (value: number) => void) => cb?.(321));

      act(() => {
        handleConfig.onPanResponderGrant?.();
      });

      expect(stopAnimationSpy).toHaveBeenCalled();
    });

    it("onPanResponderMove clamps newY to 0 and reports expanded=true", () => {
      const onExpansionChange = jest.fn();

      renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
          onExpansionChange,
        }),
      );

      const handleConfig = getHandleConfig();

      stopAnimationSpy.mockImplementationOnce((cb?: (value: number) => void) => cb?.(20));
      onExpansionChange.mockClear();
      setValueSpy.mockClear();

      act(() => {
        handleConfig.onPanResponderGrant?.();
        handleConfig.onPanResponderMove?.({} as any, { dy: -100, dx: 0 } as any);
      });

      expect(setValueSpy).toHaveBeenCalledWith(0);
      expect(onExpansionChange).toHaveBeenCalledWith(true);
    });

    it("onPanResponderMove reports expanded=false when dragging down from expanded", () => {
      const onExpansionChange = jest.fn();

      const { result } = renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
          onExpansionChange,
        }),
      );

      const handleConfig = getHandleConfig();

      act(() => {
        result.current.snapTo(0);
      });

      onExpansionChange.mockClear();
      setValueSpy.mockClear();
      stopAnimationSpy.mockImplementationOnce((cb?: (value: number) => void) => cb?.(100));

      act(() => {
        handleConfig.onPanResponderGrant?.();
        handleConfig.onPanResponderMove?.({} as any, { dy: 50, dx: 0 } as any);
      });

      expect(setValueSpy).toHaveBeenCalledWith(150);
      expect(onExpansionChange).toHaveBeenCalledWith(false);
    });

    it("dismisses on fast downward swipe when near bottom", () => {
      const { result } = renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      act(() => {
        result.current.snapTo(result.current.MINIMIZED_OFFSET + 50);
      });

      mockTiming.mockClear();

      triggerRelease({ vy: 1.5, dy: 50 });

      expect(mockTiming).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ toValue: 1000 }),
      );
    });

    it("minimizes on fast downward swipe when near SNAP_OFFSET", () => {
      const { result } = renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      act(() => {
        result.current.snapTo(result.current.SNAP_OFFSET);
      });

      mockTiming.mockClear();

      triggerRelease({ vy: 1.5, dy: 10 });

      expect(mockTiming).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ toValue: result.current.MINIMIZED_OFFSET }),
      );
    });

    it("snaps to SNAP_OFFSET on fast downward swipe when above snap point", () => {
      const { result } = renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      act(() => {
        result.current.snapTo(200);
      });

      mockSpring.mockClear();

      triggerRelease({ vy: 1.5, dy: 10 });

      expect(mockSpring).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ toValue: result.current.SNAP_OFFSET }),
      );
    });

    it("snaps to SNAP_OFFSET on fast upward swipe when below snap point", () => {
      const { result } = renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      act(() => {
        result.current.snapTo(result.current.SNAP_OFFSET + 100);
      });

      mockSpring.mockClear();

      triggerRelease({ vy: -1.5, dy: -50 });

      expect(mockSpring).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ toValue: result.current.SNAP_OFFSET }),
      );
    });

    it("snaps to 0 on fast upward swipe when at or above snap point", () => {
      const { result } = renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      act(() => {
        result.current.snapTo(result.current.SNAP_OFFSET);
      });

      mockSpring.mockClear();

      triggerRelease({ vy: -1.5, dy: -50 });

      expect(mockSpring).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ toValue: 0 }),
      );
    });

    it("dismisses on slow release when far below MINIMIZED_OFFSET", () => {
      const { result } = renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      act(() => {
        result.current.snapTo(result.current.MINIMIZED_OFFSET + 100);
      });

      mockTiming.mockClear();

      triggerRelease({ vy: 0, dy: 0 });

      expect(mockTiming).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ toValue: 1000 }),
      );
    });

    it("minimizes on slow release between midpoint and minimized", () => {
      const { result } = renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      act(() => {
        result.current.snapTo(700);
      });

      mockTiming.mockClear();

      triggerRelease({ vy: 0, dy: 0 });

      expect(mockTiming).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ toValue: result.current.MINIMIZED_OFFSET }),
      );
    });

    it("snaps to SNAP_OFFSET on slow release above SNAP_OFFSET / 2", () => {
      const { result } = renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      act(() => {
        result.current.snapTo(300);
      });

      mockSpring.mockClear();

      triggerRelease({ vy: 0, dy: 0 });

      expect(mockSpring).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ toValue: result.current.SNAP_OFFSET }),
      );
    });

    it("snaps to 0 on slow release near the top", () => {
      const { result } = renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      act(() => {
        result.current.snapTo(100);
      });

      mockSpring.mockClear();

      triggerRelease({ vy: 0, dy: 0 });

      expect(mockSpring).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ toValue: 0 }),
      );
    });

    it("handlePanResponder predicates return expected values", () => {
      renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      const handleConfig = getHandleConfig();

      expect(handleConfig.onStartShouldSetPanResponder()).toBe(true);
      expect(handleConfig.onStartShouldSetPanResponderCapture()).toBe(false);

      expect(
        handleConfig.onMoveShouldSetPanResponder(
          {} as any,
          { dy: 20, dx: 5 } as any,
        ),
      ).toBe(true);

      expect(
        handleConfig.onMoveShouldSetPanResponder(
          {} as any,
          { dy: 5, dx: 20 } as any,
        ),
      ).toBe(false);

      expect(
        handleConfig.onMoveShouldSetPanResponderCapture(
          {} as any,
          { dy: 6 } as any,
        ),
      ).toBe(true);

      expect(
        handleConfig.onMoveShouldSetPanResponderCapture(
          {} as any,
          { dy: 4 } as any,
        ),
      ).toBe(false);
    });

    it("scrollAreaPanResponder blocks non-vertical movement", () => {
      renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      const scrollConfig = getScrollConfig();

      expect(scrollConfig.onStartShouldSetPanResponder()).toBe(false);
      expect(scrollConfig.onStartShouldSetPanResponderCapture()).toBe(false);
      expect(scrollConfig.onMoveShouldSetPanResponderCapture()).toBe(false);

      expect(
        scrollConfig.onMoveShouldSetPanResponder(
          {} as any,
          { dy: 5, dx: 20 } as any,
        ),
      ).toBe(false);
    });

    it("scrollAreaPanResponder allows downward drag when not expanded", () => {
      const { result } = renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      const scrollConfig = getScrollConfig();

      act(() => {
        result.current.snapTo(result.current.SNAP_OFFSET);
      });

      expect(
        scrollConfig.onMoveShouldSetPanResponder(
          {} as any,
          { dy: 20, dx: 0 } as any,
        ),
      ).toBe(true);

      expect(
        scrollConfig.onMoveShouldSetPanResponder(
          {} as any,
          { dy: -20, dx: 0 } as any,
        ),
      ).toBe(false);
    });

    it("scrollAreaPanResponder blocks upward drag when expanded", () => {
      const { result } = renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      const scrollConfig = getScrollConfig();

      act(() => {
        result.current.snapTo(0);
      });

      expect(
        scrollConfig.onMoveShouldSetPanResponder(
          {} as any,
          { dy: -20, dx: 0 } as any,
        ),
      ).toBe(false);
    });

    it("scrollAreaPanResponder allows downward drag when expanded and scroll is at top", () => {
      const { result } = renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      const scrollConfig = getScrollConfig();

      act(() => {
        result.current.snapTo(0);
        result.current.scrollOffsetRef.current = 0;
      });

      expect(
        scrollConfig.onMoveShouldSetPanResponder(
          {} as any,
          { dy: 20, dx: 0 } as any,
        ),
      ).toBe(true);
    });

    it("scrollAreaPanResponder blocks downward drag when expanded and scroll is not at top", () => {
      const { result } = renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      const scrollConfig = getScrollConfig();

      act(() => {
        result.current.snapTo(0);
        result.current.scrollOffsetRef.current = 25;
      });

      expect(
        scrollConfig.onMoveShouldSetPanResponder(
          {} as any,
          { dy: 20, dx: 0 } as any,
        ),
      ).toBe(false);
    });
  });

  describe("returned API surface", () => {
    it("exposes all expected properties", () => {
      const { result } = renderHook(() =>
        useBottomSheet({
          visible: true,
          onDismiss: jest.fn(),
        }),
      );

      expect(result.current).toHaveProperty("translateY");
      expect(result.current).toHaveProperty("MAX_HEIGHT");
      expect(result.current).toHaveProperty("SNAP_OFFSET");
      expect(result.current).toHaveProperty("MINIMIZED_OFFSET");
      expect(result.current).toHaveProperty("scrollOffsetRef");
      expect(result.current).toHaveProperty("snapTo");
      expect(result.current).toHaveProperty("minimize");
      expect(result.current).toHaveProperty("dismiss");
      expect(result.current).toHaveProperty("handleToggleHeight");
      expect(result.current).toHaveProperty("handlePanResponder");
      expect(result.current).toHaveProperty("scrollAreaPanResponder");
    });
  });
});