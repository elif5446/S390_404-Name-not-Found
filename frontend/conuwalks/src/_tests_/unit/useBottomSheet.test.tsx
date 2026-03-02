import { renderHook, act } from "@testing-library/react-native";
import { Animated, Platform, BackHandler } from "react-native";
import {
  useBottomSheet,
  UseBottomSheetConfig,
} from "../../hooks/useBottomSheet";

// mock window dimensions for deterministic math
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  default: jest.fn(() => ({ height: 1000, width: 500 })),
}));

describe("useBottomSheet Hook", () => {
  let mockSpring: jest.SpyInstance;
  let mockTiming: jest.SpyInstance;
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();

    // mock animated to execute callbacks immediately to test synchronous state changes
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
        peekHeightRatio: 0.2, // 20% of 1000 = 200
      }),
    );

    // max_height: 1000 * 0.92 = 920
    expect(result.current.MAX_HEIGHT).toBe(920);
    // snap_offset: 920 - 400 = 520
    expect(result.current.SNAP_OFFSET).toBe(520);
    // minimized_offset: 920 - 200 = 720
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

    // max_height: 1000 * 0.9 = 900
    expect(result.current.MAX_HEIGHT).toBe(900);
    // snap_offset: 900 - 400 = 500
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

    // initially off-screen
    expect(mockTiming).toHaveBeenCalled();

    // rerender with visible: true
    rerender({ visible: true, onDismiss: jest.fn(), onExpansionChange });

    expect(mockSpring).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: result.current.SNAP_OFFSET }),
    );
  });

  it("calls onDismiss when dismiss action is triggered", () => {
    const onDismissMock = jest.fn();
    const { result } = renderHook(() =>
      useBottomSheet({ visible: true, onDismiss: onDismissMock }),
    );

    act(() => {
      result.current.dismiss("test-payload");
    });

    expect(mockTiming).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: 1000 }), // screenHeight
    );
    expect(onDismissMock).toHaveBeenCalledWith("test-payload");
  });

  it("animates to MINIMIZED_OFFSET when minimize action is triggered", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ visible: true, onDismiss: jest.fn() }),
    );

    act(() => {
      result.current.minimize();
    });

    expect(mockTiming).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: result.current.MINIMIZED_OFFSET }),
    );
  });

  it("registers Android hardware back handler when visible", () => {
    Platform.OS = "android";

    // mock addeventlistener to return the { remove: () => void } object your hook expects
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

    // simulate hardware back press
    const backHandlerCallback = addEventListenerSpy.mock.calls[0][1];

    let handled = false;
    act(() => {
      handled = backHandlerCallback() as boolean;
    });

    expect(handled).toBe(true);
    expect(onDismissMock).toHaveBeenCalled(); // Ensure dismiss was fired

    // clean up
    unmount();
    expect(removeSpy).toHaveBeenCalled(); // Verify your hook's cleanup function fired
  });

  it("does not intercept Android back press when not visible", () => {
    Platform.OS = "android";

    const addEventListenerSpy = jest
      .spyOn(BackHandler, "addEventListener")
      .mockReturnValue({ remove: jest.fn() } as any);

    renderHook(() => useBottomSheet({ visible: false, onDismiss: jest.fn() }));

    const backHandlerCallback = addEventListenerSpy.mock.calls[0][1];

    let handled = true;
    act(() => {
      handled = backHandlerCallback() as boolean;
    });

    // should return false to let the system handle the back action
    expect(handled).toBe(false);
  });
});
