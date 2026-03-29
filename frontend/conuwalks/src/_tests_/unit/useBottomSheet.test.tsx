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
  let capturedPanConfig: any = null;  // add this

  beforeEach(() => {
  jest.clearAllMocks();

  jest.spyOn(PanResponder, 'create').mockImplementation((config) => {
    capturedPanConfig = config;
    return { panHandlers: {} } as any;
  });

  mockSpring = jest.spyOn(Animated, "spring").mockImplementation(
    () =>
      ({
        start: (callback: (arg0: { finished: boolean }) => any) =>
          callback?.({ finished: true }),
      }) as any,
  );

  mockTiming = jest.spyOn(Animated, "timing").mockImplementation(
    () =>
      ({
        start: (callback: (arg0: { finished: boolean }) => any) =>
          callback?.({ finished: true }),
      }) as any,
  );
});

  afterEach(() => {
    Platform.OS = originalOS;
    mockSpring.mockRestore();
    mockTiming.mockRestore();
  });

  it("calculates offsets correctly based on iOS screen dimensions", () => {
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

  it("calculates offsets correctly based on Android screen dimensions", () => {
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

  it("springs to SNAP_OFFSET when visible becomes true", () => {
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
    expect(mockTiming).not.toHaveBeenCalled();
    rerender({ visible: true, onDismiss: jest.fn(), onExpansionChange });
    expect(mockSpring).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: result.current.SNAP_OFFSET }),
    );
  });

  it("animates off-screen when visible becomes false", () => {
    const { rerender } = renderHook(
      (props: UseBottomSheetConfig) => useBottomSheet(props),
      { initialProps: { visible: true, onDismiss: jest.fn() } },
    );
    mockTiming.mockClear();
    mockSpring.mockClear();
    rerender({ visible: false, onDismiss: jest.fn() });
    expect(mockTiming).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: 1000 }),
    );
  });

  it("calls onDismiss when dismiss action is triggered", () => {
    const onDismissMock = jest.fn();
    const { result } = renderHook(() =>
      useBottomSheet({ visible: true, onDismiss: onDismissMock }),
    );
    act(() => { result.current.dismiss("test-payload"); });
    expect(mockTiming).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: 1000 }),
    );
    expect(onDismissMock).toHaveBeenCalledWith("test-payload");
  });

  it("calls onDismiss with undefined when no payload is provided", () => {
    const onDismissMock = jest.fn();
    const { result } = renderHook(() =>
      useBottomSheet({ visible: true, onDismiss: onDismissMock }),
    );
    act(() => { result.current.dismiss(); });
    expect(onDismissMock).toHaveBeenCalledWith(undefined);
  });

  it("animates to MINIMIZED_OFFSET when minimize action is triggered", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ visible: true, onDismiss: jest.fn() }),
    );
    act(() => { result.current.minimize(); });
    expect(mockTiming).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: result.current.MINIMIZED_OFFSET }),
    );
  });

  it("accepts a custom height for minimize", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ visible: true, onDismiss: jest.fn() }),
    );
    act(() => { result.current.minimize(600); });
    expect(mockTiming).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: 600 }),
    );
  });

  it("springs to the given value when snapTo is called", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ visible: true, onDismiss: jest.fn() }),
    );
    mockSpring.mockClear();
    act(() => { result.current.snapTo(100); });
    expect(mockSpring).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: 100 }),
    );
  });

  it("calls onExpansionChange(true) when snapping to 0 (fully expanded)", () => {
    const onExpansionChange = jest.fn();
    const { result } = renderHook(() =>
      useBottomSheet({ visible: true, onDismiss: jest.fn(), onExpansionChange }),
    );
    onExpansionChange.mockClear();
    act(() => { result.current.snapTo(0); });
    expect(onExpansionChange).toHaveBeenCalledWith(true);
  });

  it("calls onExpansionChange(false) when snapping to a non-zero value", () => {
    const onExpansionChange = jest.fn();
    const { result } = renderHook(() =>
      useBottomSheet({ visible: true, onDismiss: jest.fn(), onExpansionChange }),
    );
    act(() => result.current.snapTo(0));
    onExpansionChange.mockClear();
    act(() => result.current.snapTo(result.current.SNAP_OFFSET));
    expect(onExpansionChange).toHaveBeenCalledWith(false);
  });

  it("handleToggleHeight snaps to SNAP_OFFSET when fully expanded (translateY ~0)", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ visible: true, onDismiss: jest.fn() }),
    );
    act(() => result.current.snapTo(0));
    mockSpring.mockClear();
    act(() => { result.current.handleToggleHeight(); });
    expect(mockSpring).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: result.current.SNAP_OFFSET }),
    );
  });

  it("handleToggleHeight snaps to 0 when at SNAP_OFFSET", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ visible: true, onDismiss: jest.fn() }),
    );
    act(() => result.current.snapTo(result.current.SNAP_OFFSET));
    mockSpring.mockClear();
    act(() => { result.current.handleToggleHeight(); });
    expect(mockSpring).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: 0 }),
    );
  });

  it("registers Android hardware back handler when visible", () => {
    Platform.OS = "android";
    const removeSpy = jest.fn();
    const addEventListenerSpy = jest
      .spyOn(BackHandler, "addEventListener")
      .mockReturnValue({ remove: removeSpy } as any);
    const onDismissMock = jest.fn();
    const { unmount } = renderHook(() =>
      useBottomSheet({ visible: true, onDismiss: onDismissMock }),
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "hardwareBackPress",
      expect.any(Function),
    );
    const backHandlerCallback = addEventListenerSpy.mock.calls[0][1];
    let handled = false;
    act(() => { handled = backHandlerCallback() as boolean; });
    expect(handled).toBe(true);
    expect(onDismissMock).toHaveBeenCalled();
    unmount();
    expect(removeSpy).toHaveBeenCalled();
  });

  it("does not intercept Android back press when not visible", () => {
    Platform.OS = "android";
    const addEventListenerSpy = jest
      .spyOn(BackHandler, "addEventListener")
      .mockReturnValue({ remove: jest.fn() } as any);
    renderHook(() => useBottomSheet({ visible: false, onDismiss: jest.fn() }));
    const backHandlerCallback = addEventListenerSpy.mock.calls[0][1];
    let handled = true;
    act(() => { handled = backHandlerCallback() as boolean; });
    expect(handled).toBe(false);
  });

  describe("handlePanResponder gesture logic", () => {
    // ─── Diagnostic: log what translateYRef.current actually is ──────────────
    // The pan responder's onPanResponderRelease reads translateYRef.current
    // (a ref internal to the hook — not directly accessible from tests).
    // We infer its value from what animation gets triggered after release.
    //
    // Mount with visible=true → useEffect spring to SNAP_OFFSET fires
    // synchronously via mock → translateYRef.current = SNAP_OFFSET (500).
    //
    // minimize() guard: bails if translateYRef.current >= MINIMIZED_OFFSET - 5.
    // After mount at SNAP_OFFSET (500), 500 >= 755 is false → guard passes.
    // But targetAnimY.current must also != MINIMIZED_OFFSET.
    //
    // After any snapTo(n) call, targetAnimY.current is set to n then cleared
    // to null inside the mock callback. So it is null before release.
    //
    // Strategy: use snapTo() to position translateYRef, then clear mocks,
    // then call release and assert on the new mock calls only.
    // ─────────────────────────────────────────────────────────────────────────

    function triggerRelease(result: any, gestureState: object) {
  act(() => {
    capturedPanConfig?.onPanResponderRelease?.(
      {} as any,
      { vx: 0, dx: 0, x0: 0, y0: 0, moveX: 0, moveY: 0,
        numberActiveTouches: 1, stateID: 1, ...gestureState },
    );
  });
}

    // ── Diagnostic test: confirms translateYRef after mount and after snapTo ──
    it("DIAGNOSTIC: confirms what translateYRef holds after mount and snapTo", () => {
      const { result } = renderHook(() =>
        useBottomSheet({ visible: true, onDismiss: jest.fn() }),
      );

      // After mount, the visible=true effect fires spring → mock callback →
      // translateYRef = SNAP_OFFSET. Confirm by calling minimize() which has
      // a guard: bails if translateYRef >= MINIMIZED_OFFSET - 5 (755).
      // If translateYRef = 500, guard fails → timing fires.
      // If translateYRef = 1000, guard passes (1000 >= 755) → timing does NOT fire.
      mockTiming.mockClear();
      act(() => { result.current.minimize(); });
      const afterMountCalls = mockTiming.mock.calls.length;
      console.log("minimize() calls after mount (1=SNAP_OFFSET, 0=screenHeight):", afterMountCalls);

      // Now snapTo(0) and confirm translateYRef = 0 by checking snapTo(SNAP_OFFSET+100)
      act(() => { result.current.snapTo(0); });
      mockSpring.mockClear();
      // handleToggleHeight: if currentY <= 10, snapTo(SNAP_OFFSET)
      act(() => { result.current.handleToggleHeight(); });
      const snapToValue = mockSpring.mock.calls[0]?.[1]?.toValue;
      console.log("After snapTo(0), handleToggleHeight snapped to:", snapToValue, "(expected SNAP_OFFSET=500)");

      expect(afterMountCalls).toBeGreaterThan(0); // translateYRef was at SNAP_OFFSET after mount
      expect(snapToValue).toBe(result.current.SNAP_OFFSET); // translateYRef = 0 after snapTo(0)
    });

    it("dismisses on fast downward swipe (velocity > 1.2) when near bottom", () => {
      const onDismiss = jest.fn();
      const { result } = renderHook(() =>
        useBottomSheet({ visible: true, onDismiss }),
      );
      // translateYRef = SNAP_OFFSET (500) after mount.
      // Need >= MINIMIZED_OFFSET - 40 = 720 to hit dismiss branch.
      act(() => result.current.snapTo(result.current.MINIMIZED_OFFSET + 50));
      mockTiming.mockClear();

      triggerRelease(result, { vy: 1.5, dy: 50 });

      expect(mockTiming).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ toValue: 1000 }),
      );
    });

   it("minimizes on fast downward swipe when near SNAP_OFFSET", () => {
  const { result } = renderHook(() =>
    useBottomSheet({ visible: true, onDismiss: jest.fn() }),
  );
  // Explicitly re-seat translateYRef at SNAP_OFFSET to flush any stale targetAnimY
  act(() => result.current.snapTo(result.current.SNAP_OFFSET));
  mockTiming.mockClear();

  triggerRelease(result, { vy: 1.5, dy: 10 });

  expect(mockTiming).toHaveBeenCalledWith(
    expect.any(Object),
    expect.objectContaining({ toValue: result.current.MINIMIZED_OFFSET }),
  );
});


  it("snaps to SNAP_OFFSET on fast downward swipe when above snap point", () => {
  const { result } = renderHook(() =>
    useBottomSheet({ visible: true, onDismiss: jest.fn() }),
  );
  // snapTo(0) then snapTo(200) to land below SNAP_OFFSET-40 without triggering
  // the upward-swipe branch
  act(() => result.current.snapTo(0));
  act(() => result.current.snapTo(200)); // translateYRef=200 < 460 (SNAP_OFFSET-40) ✓
  mockSpring.mockClear();

  triggerRelease(result, { vy: 1.5, dy: 10 });

  expect(mockSpring).toHaveBeenCalledWith(
    expect.any(Object),
    expect.objectContaining({ toValue: result.current.SNAP_OFFSET }),
  );
});

    it("snaps to SNAP_OFFSET on fast upward swipe when below snap point", () => {
      const { result } = renderHook(() =>
        useBottomSheet({ visible: true, onDismiss: jest.fn() }),
      );
      // Need translateYRef > SNAP_OFFSET+40 (540).
      act(() => result.current.snapTo(result.current.SNAP_OFFSET + 100));
      mockSpring.mockClear();

      triggerRelease(result, { vy: -1.5, dy: -50 });

      expect(mockSpring).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ toValue: result.current.SNAP_OFFSET }),
      );
    });

it("snaps to 0 on fast upward swipe when at or above snap point", () => {
  const { result } = renderHook(() =>
    useBottomSheet({ visible: true, onDismiss: jest.fn() }),
  );
  // Re-seat at SNAP_OFFSET explicitly so translateYRef is clean
  act(() => result.current.snapTo(result.current.SNAP_OFFSET));
  mockSpring.mockClear();

  triggerRelease(result, { vy: -1.5, dy: -50 });

  expect(mockSpring).toHaveBeenCalledWith(
    expect.any(Object),
    expect.objectContaining({ toValue: 0 }),
  );
});

    it("dismisses on slow release when dragged far below MINIMIZED_OFFSET", () => {
      const onDismiss = jest.fn();
      const { result } = renderHook(() =>
        useBottomSheet({ visible: true, onDismiss }),
      );
      // Need translateYRef > MINIMIZED_OFFSET+40 (800).
      act(() => result.current.snapTo(result.current.MINIMIZED_OFFSET + 100));
      mockTiming.mockClear();

      triggerRelease(result, { vy: 0, dy: 0 });

      expect(mockTiming).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ toValue: 1000 }),
      );
    });

    it("minimizes on slow release between snap and minimized midpoint", () => {
      const { result } = renderHook(() =>
        useBottomSheet({ visible: true, onDismiss: jest.fn() }),
      );
      // 700 > midpoint (500+760)/2=630 and 700 <= MINIMIZED_OFFSET+40=800 → minimize.
      act(() => result.current.snapTo(700));
      mockTiming.mockClear();

      triggerRelease(result, { vy: 0, dy: 0 });

      expect(mockTiming).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ toValue: result.current.MINIMIZED_OFFSET }),
      );
    });
  });

  describe("returned API surface", () => {
    it("exposes all expected properties", () => {
      const { result } = renderHook(() =>
        useBottomSheet({ visible: true, onDismiss: jest.fn() }),
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