import { useRef, useCallback, useEffect, useMemo } from "react";
import {
  Animated,
  PanResponder,
  Platform,
  BackHandler,
  useWindowDimensions,
  PanResponderGestureState,
  GestureResponderEvent,
} from "react-native";

export interface UseBottomSheetConfig {
  visible: boolean;
  onDismiss: (payload?: any) => void;
  onExpansionChange?: (isExpanded: boolean) => void;
  minHeight?: number;
  peekHeightRatio?: number;
}

export const useBottomSheet = ({
  visible,
  onDismiss,
  onExpansionChange,
  minHeight = Platform.OS === "ios" ? 420 : 380,
  peekHeightRatio = 0.16,
}: UseBottomSheetConfig) => {
  const { height: screenHeight } = useWindowDimensions();

  // memoize height calculations so they only update on orientation/resize
  const { MAX_HEIGHT, SNAP_OFFSET, MINIMIZED_OFFSET } = useMemo(() => {
    const max = screenHeight * (Platform.OS === "ios" ? 0.92 : 0.9);
    return {
      MAX_HEIGHT: max,
      SNAP_OFFSET: max - minHeight,
      MINIMIZED_OFFSET: max - screenHeight * peekHeightRatio,
    };
  }, [screenHeight, minHeight, peekHeightRatio]);

  // animation & state refs
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const translateYRef = useRef(screenHeight);
  const translateYAtGestureStart = useRef(screenHeight);
  const targetAnimY = useRef<number | null>(null);
  const scrollOffsetRef = useRef(0);
  const expandedStateRef = useRef(false);

  // stable callback refs (prevents stale closures in gestures)
  const onDismissRef = useRef(onDismiss);
  const onExpansionChangeRef = useRef(onExpansionChange);

  useEffect(() => {
    onDismissRef.current = onDismiss;
    onExpansionChangeRef.current = onExpansionChange;
  }, [onDismiss, onExpansionChange]);

  const reportExpandedState = useCallback((isExpanded: boolean) => {
    if (expandedStateRef.current === isExpanded) return;
    expandedStateRef.current = isExpanded;
    onExpansionChangeRef.current?.(isExpanded);
  }, []);

  // sync animated.Value to standard ref for gesture math
  useEffect(() => {
    const id = translateY.addListener(({ value }) => {
      translateYRef.current = value;
    });
    return () => translateY.removeListener(id);
  }, [translateY]);

  const snapTo = useCallback(
    (toValue: number, onDone?: () => void) => {
      targetAnimY.current = toValue;
      Animated.spring(translateY, {
        toValue,
        useNativeDriver: true,
        tension: 68,
        friction: 12,
        overshootClamping: true,
      }).start(({ finished }) => {
        if (finished) {
          translateYRef.current = toValue;
          reportExpandedState(toValue <= 1);
          onDone?.();
        }
        if (targetAnimY.current === toValue) targetAnimY.current = null;
      });
    },
    [translateY, reportExpandedState],
  );

  const minimize = useCallback(
    (onDone?: () => void) => {
      // If it's already minimized (or lower), ignore the command
      if (
        translateYRef.current >= MINIMIZED_OFFSET - 5 ||
        targetAnimY.current === MINIMIZED_OFFSET
      ) {
        onDone?.();
        return;
      }
      targetAnimY.current = MINIMIZED_OFFSET;
      reportExpandedState(false);

      Animated.timing(translateY, {
        toValue: MINIMIZED_OFFSET,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          translateYRef.current = MINIMIZED_OFFSET;
          onDone?.();
        }
        if (targetAnimY.current === MINIMIZED_OFFSET)
          targetAnimY.current = null;
      });
    },
    [translateY, MINIMIZED_OFFSET, reportExpandedState],
  );

  const dismiss = useCallback(
    (payload?: any, onDone?: () => void) => {
      targetAnimY.current = screenHeight;
      reportExpandedState(false);
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onDismissRef.current(payload);
          onDone?.();
        }
        if (targetAnimY.current === screenHeight) targetAnimY.current = null;
      });
    },
    [translateY, screenHeight, reportExpandedState],
  );

  const handleToggleHeight = useCallback(() => {
    const currentY = translateYRef.current;
    if (currentY > SNAP_OFFSET + 10) snapTo(SNAP_OFFSET);
    else if (currentY > 10) snapTo(0);
    else snapTo(SNAP_OFFSET);
  }, [snapTo, SNAP_OFFSET]);

  const actionsRef = useRef({ snapTo, dismiss, minimize });
  useEffect(() => {
    actionsRef.current = { snapTo, dismiss, minimize };
  }, [snapTo, dismiss, minimize]);

  useEffect(() => {
    if (visible) {
      scrollOffsetRef.current = 0;
      if (translateYRef.current >= screenHeight - 10) {
        translateY.setValue(screenHeight);
        Animated.spring(translateY, {
          toValue: SNAP_OFFSET,
          useNativeDriver: true,
          tension: 70,
          friction: 12,
        }).start(() => {
          translateYRef.current = SNAP_OFFSET;
          reportExpandedState(false);
        });
      }
    } else {
      reportExpandedState(false);
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        translateYRef.current = screenHeight;
      });
    }
  }, [visible, translateY, screenHeight, SNAP_OFFSET, reportExpandedState]);

  useEffect(() => {
    if (Platform.OS === "android") {
      const backAction = () => {
        if (visible) {
          dismiss();
          return true;
        }
        return false;
      };
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction,
      );
      return () => backHandler.remove();
    }
  }, [dismiss, visible]);

  const { handlePanResponder, scrollAreaPanResponder } = useMemo(() => {
    const onPanResponderGrant = () => {
      targetAnimY.current = null;
      translateY.stopAnimation((val) => {
        translateYAtGestureStart.current = val;
        translateYRef.current = val;
      });
    };

    const onPanResponderMove = (
      _: GestureResponderEvent,
      g: PanResponderGestureState,
    ) => {
      const newY = Math.max(0, translateYAtGestureStart.current + g.dy);
      translateY.setValue(newY);
      reportExpandedState(newY <= 12);
    };

    const onPanResponderRelease = (
      _: GestureResponderEvent,
      g: PanResponderGestureState,
    ) => {
      const currentY = translateYRef.current;
      const velocity = g.vy;

      if (velocity > 1.2) {
        if (currentY >= MINIMIZED_OFFSET - 40) dismiss(true);
        else if (currentY >= SNAP_OFFSET - 40) minimize();
        else snapTo(SNAP_OFFSET);
      } else if (velocity < -1.2) {
        if (currentY > SNAP_OFFSET + 40) snapTo(SNAP_OFFSET);
        else snapTo(0);
      } else {
        if (currentY > MINIMIZED_OFFSET + 40) dismiss(true);
        else if (currentY > (SNAP_OFFSET + MINIMIZED_OFFSET) / 2) minimize();
        else if (currentY > SNAP_OFFSET / 2) snapTo(SNAP_OFFSET);
        else snapTo(0);
      }
    };

    return {
      handlePanResponder: PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dy) > Math.abs(g.dx) * 1.2,
        onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dy) > 5,
        onPanResponderGrant,
        onPanResponderMove,
        onPanResponderRelease,
      }),
      scrollAreaPanResponder: PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, g) => {
          const isVertical = Math.abs(g.dy) > Math.abs(g.dx) * 1.2;
          if (!isVertical) return false;
          const isExpanded = translateYRef.current < SNAP_OFFSET - 20;
          if (!isExpanded) return g.dy > 0;
          if (g.dy < 0) return false;
          return scrollOffsetRef.current <= 0;
        },
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderGrant,
        onPanResponderMove,
        onPanResponderRelease,
      }),
    };
  }, [
    SNAP_OFFSET,
    MINIMIZED_OFFSET,
    dismiss,
    minimize,
    snapTo,
    translateY,
    reportExpandedState,
  ]);

  return {
    translateY,
    MAX_HEIGHT,
    SNAP_OFFSET,
    MINIMIZED_OFFSET,
    scrollOffsetRef,
    snapTo,
    minimize,
    dismiss,
    handleToggleHeight,
    handlePanResponder,
    scrollAreaPanResponder,
  };
};
