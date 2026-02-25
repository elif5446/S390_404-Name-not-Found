import { useRef, useCallback, useEffect } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  BackHandler,
} from "react-native";

interface UseBottomSheetConfig {
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
  const screenHeight = Dimensions.get("window").height;
  const MAX_HEIGHT = screenHeight * (Platform.OS === "ios" ? 0.92 : 0.9);
  const SNAP_OFFSET = MAX_HEIGHT - minHeight;
  const PEEK_HEIGHT = screenHeight * peekHeightRatio;
  const MINIMIZED_OFFSET = MAX_HEIGHT - PEEK_HEIGHT;

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const translateYRef = useRef(screenHeight);
  const translateYAtGestureStart = useRef(screenHeight);
  const targetAnimY = useRef<number | null>(null);
  const scrollOffsetRef = useRef(0);
  const expandedStateRef = useRef(false);

  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const reportExpandedState = useCallback(
    (isExpanded: boolean) => {
      if (expandedStateRef.current === isExpanded) return;
      expandedStateRef.current = isExpanded;
      onExpansionChange?.(isExpanded);
    },
    [onExpansionChange],
  );

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
        duration: 240,
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

  const handlePanResponderRelease = (_: any, g: any) => {
    const currentY = translateYRef.current;
    const velocity = g.vy;
    const {
      dismiss: currentDismiss,
      snapTo: currentSnapTo,
      minimize: currentMinimize,
    } = actionsRef.current;

    if (velocity > 1.2) {
      if (currentY >= MINIMIZED_OFFSET - 40) currentDismiss(true);
      else if (currentY >= SNAP_OFFSET - 40) currentMinimize();
      else currentSnapTo(SNAP_OFFSET);
    } else if (velocity < -1.2) {
      if (currentY > SNAP_OFFSET + 40) currentSnapTo(SNAP_OFFSET);
      else currentSnapTo(0);
    } else {
      if (currentY > MINIMIZED_OFFSET + 40) currentDismiss(true);
      else if (currentY > (SNAP_OFFSET + MINIMIZED_OFFSET) / 2)
        currentMinimize();
      else if (currentY > SNAP_OFFSET / 2) currentSnapTo(SNAP_OFFSET);
      else currentSnapTo(0);
    }
  };

  const handlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > Math.abs(g.dx) * 1.2,
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        targetAnimY.current = null;
        translateY.stopAnimation((val) => {
          translateYAtGestureStart.current = val;
          translateYRef.current = val;
        });
      },
      onPanResponderMove: (_, g) => {
        const newY = translateYAtGestureStart.current + g.dy;
        translateY.setValue(Math.max(0, newY));
        reportExpandedState(Math.max(0, newY) <= 12);
      },
      onPanResponderRelease: handlePanResponderRelease,
    }),
  ).current;

  const scrollAreaPanResponder = useRef(
    PanResponder.create({
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
      onPanResponderGrant: () => {
        targetAnimY.current = null;
        translateY.stopAnimation((val) => {
          translateYAtGestureStart.current = val;
          translateYRef.current = val;
        });
      },
      onPanResponderMove: (_, g) => {
        const newY = translateYAtGestureStart.current + g.dy;
        translateY.setValue(Math.max(0, newY));
        reportExpandedState(Math.max(0, newY) <= 12);
      },
      onPanResponderRelease: handlePanResponderRelease,
    }),
  ).current;

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
