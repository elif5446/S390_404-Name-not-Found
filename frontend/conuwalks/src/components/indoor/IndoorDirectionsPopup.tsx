import React, { forwardRef, useImperativeHandle, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Animated,
  ScrollView,
  useColorScheme,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBottomSheet } from "@/src/hooks/useBottomSheet";
import BottomSheetDragHandle from "@/src/components/ui/BottomSheetDragHandle";

export type IndoorDirectionsStep = {
  id: string;
  text: string;
};

export interface IndoorDirectionsPopupHandle {
  minimize: () => void;
  dismiss: () => void;
}

interface IndoorDirectionsPopupProps {
  visible: boolean;
  steps: IndoorDirectionsStep[];
  activeStepIndex: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  onClose: () => void;
  onFinish?: () => void;
  finishLabel?: string;
}

// module-scope helpers to reduce cognitive complexity

const getNavBtnBgColor = (disabled: boolean): string => (disabled ? "#DDD" : "#B03060");

const getNavBtnTextColor = (disabled: boolean, isDark: boolean, disabledLightColor: string = "#A0A0A0"): string => {
  if (disabled) return isDark ? "#776D72" : disabledLightColor;
  return "white";
};

const getNextBtnLabel = (isLastStep: boolean, finishLabel?: string): string => (isLastStep ? finishLabel || "Finish" : "Next");

const CloseIcon = ({ isDark }: { isDark: boolean }) =>
  Platform.OS === "ios" ? (
    <Text style={{ fontSize: 16, fontWeight: "600", color: isDark ? "#FFFFFF" : "#333333", marginBottom: 2 }}>✕</Text>
  ) : (
    <Ionicons name="close" size={20} color={isDark ? "#FFFFFF" : "#333333"} />
  );

const getStepContainerStyle = (isActive: boolean, isLast: boolean, isDark: boolean) => {
  const activeBg = isDark ? "#2A2025" : "#FFF0F5";
  return {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: isLast ? 0 : 16,
    opacity: isActive ? 1 : 0.3,
    backgroundColor: isActive ? activeBg : "transparent",
    padding: isActive ? 18 : 10,
    borderRadius: 14,
    transform: [{ scale: isActive ? 1.02 : 1 }],
  };
};

const getStepCircleStyle = (isActive: boolean, isHighlighted: boolean, isDark: boolean) => {
  const unhighlightedBg = isDark ? "#4B3D44" : "#FCE4EC";
  return {
    width: isActive ? 32 : 24,
    height: isActive ? 32 : 24,
    borderRadius: isActive ? 16 : 12,
    backgroundColor: isHighlighted ? "#C2185B" : unhighlightedBg,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 14,
  };
};

const getStepIndexTextStyle = (isActive: boolean, isHighlighted: boolean, isDark: boolean) => {
  const unhighlightedColor = isDark ? "#E8C8D7" : "#C2185B";
  return {
    fontSize: isActive ? 15 : 12,
    fontWeight: "900" as const,
    color: isHighlighted ? "#FFFFFF" : unhighlightedColor,
  };
};

const getStepTextStyle = (isActive: boolean, isHighlighted: boolean, isDark: boolean) => {
  const unhighlightedColor = isDark ? "#E0D7DB" : "#4A4A4A";
  return {
    flex: 1,
    fontSize: isActive ? 18 : 15,
    fontWeight: isActive ? ("800" as const) : ("500" as const),
    color: isHighlighted ? "#C2185B" : unhighlightedColor,
  };
};

interface IndoorStepItemProps {
  step: IndoorDirectionsStep;
  index: number;
  totalSteps: number;
  activeStepIndex: number;
  isDark: boolean;
  onLayout: (index: number, y: number) => void;
}

const IndoorStepItem = ({ step, index, totalSteps, activeStepIndex, isDark, onLayout }: IndoorStepItemProps) => {
  const isActive = index === activeStepIndex;
  const isLast = index === totalSteps - 1;
  const isHighlighted = isActive || isLast;
  return (
    <View onLayout={e => onLayout(index, e.nativeEvent.layout.y)} style={getStepContainerStyle(isActive, isLast, isDark)}>
      <View style={getStepCircleStyle(isActive, isHighlighted, isDark)}>
        <Text style={getStepIndexTextStyle(isActive, isHighlighted, isDark)}>{index + 1}</Text>
      </View>
      <Text testID={`nav-step-text-${index}`} style={getStepTextStyle(isActive, isHighlighted, isDark)}>
        {step.text}
      </Text>
    </View>
  );
};

const IndoorDirectionsPopup = forwardRef<IndoorDirectionsPopupHandle, IndoorDirectionsPopupProps>(
  ({ visible, steps, activeStepIndex, onNextStep, onPrevStep, onClose, onFinish, finishLabel }, ref) => {
    const isDark = (useColorScheme() || "light") === "dark";
    const scrollViewRef = useRef<ScrollView>(null);
    const stepLayouts = useRef<{ [key: number]: number }>({});

    const {
      translateY,
      MAX_HEIGHT,
      SNAP_OFFSET,
      MINIMIZED_OFFSET,
      scrollOffsetRef,
      minimize,
      snapTo,
      handleToggleHeight,
      handlePanResponder,
      scrollAreaPanResponder,
      dismiss,
    } = useBottomSheet({
      visible,
      onDismiss: onClose,
    });
    useImperativeHandle(ref, () => ({
      minimize: () => minimize(MINIMIZED_OFFSET - 60),
      dismiss: () => dismiss(true),
    }));

    useEffect(() => {
      if (!scrollViewRef.current || steps.length === 0) return;

      const anchorIndex = Math.max(0, activeStepIndex - 1);
      const timeoutId = setTimeout(() => {
        const targetY = stepLayouts.current[anchorIndex] || 0;

        scrollViewRef.current?.scrollTo({
          y: targetY,
          animated: true,
        });
      }, 50);

      return () => clearTimeout(timeoutId);
    }, [activeStepIndex, steps.length]);

    const handleScroll = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
      },
      [scrollOffsetRef],
    );

    const disablePrev = activeStepIndex === 0;
    const isLastStep = activeStepIndex === steps.length - 1;
    const disableNext = isLastStep && !onFinish;

    const handleNextPress = useCallback(() => {
      if (isLastStep && onFinish) {
        onFinish();
        return;
      }
      snapTo(SNAP_OFFSET);
      onNextStep();
    }, [isLastStep, onFinish, snapTo, SNAP_OFFSET, onNextStep]);

    if (!visible || steps.length === 0) return null;

    return (
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "100%",
          zIndex: 3000,
          justifyContent: "flex-end",
        }}
        pointerEvents="box-none"
        accessibilityViewIsModal={visible}
      >
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "black",
            opacity: translateY.interpolate({
              inputRange: [0, 300],
              outputRange: [0.18, 0],
              extrapolate: "clamp",
            }),
          }}
          pointerEvents="none"
        />

        <Animated.View
          style={{
            height: MAX_HEIGHT,
            transform: [{ translateY }],
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: "hidden",
            backgroundColor: isDark ? "#1F1A1D" : "#FFF7FA",
          }}
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark ? "#1F1A1D" : "#FFF7FA",
              },
            ]}
          />

          <View {...handlePanResponder.panHandlers}>
            <TouchableWithoutFeedback onPress={handleToggleHeight}>
              <View
                style={{
                  paddingBottom: 12,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: isDark ? "#4B3D44" : "#E8C8D7",
                }}
              >
                <BottomSheetDragHandle isDark={isDark} onToggleHeight={handleToggleHeight} />

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingTop: 4,
                  }}
                >
                  {/* Close Button */}
                  <TouchableOpacity
                    onPress={() => dismiss(true)}
                    style={{
                      marginRight: 12,
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: isDark ? "#00000031" : "#85858522",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Close indoor directions"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    testID="indoor-directions-popup-close-btn"
                  >
                    <CloseIcon isDark={isDark} />
                  </TouchableOpacity>

                  {/* Icon */}
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#C2185B",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <Ionicons name="walk" size={17} color="#FFFFFF" />
                  </View>

                  {/* Title Content */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: "#C2185B",
                      }}
                    >
                      Indoor directions
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: isDark ? "#C8BDC2" : "#6F6F6F",
                        marginTop: 2,
                      }}
                    >
                      Step-by-step indoor route
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>

          <View style={{ flex: 1 }} {...scrollAreaPanResponder.panHandlers}>
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1 }}
              // hack to show current step in middle
              contentContainerStyle={{ padding: 16, paddingBottom: 600 }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {steps.map((step, index) => (
                <IndoorStepItem
                  key={step.id}
                  step={step}
                  index={index}
                  totalSteps={steps.length}
                  activeStepIndex={activeStepIndex}
                  isDark={isDark}
                  onLayout={(idx, y) => {
                    stepLayouts.current[idx] = y;
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </Animated.View>

        {/* Navigation Controls Sticky Footer */}
        <View
          style={{
            position: "absolute",
            bottom: Platform.OS === "ios" ? 40 : 24,
            left: 16,
            right: 16,
            backgroundColor: isDark ? "#1F1A1D" : "#FFFFFF",
            borderRadius: 16,
            gap: 12,
            padding: 8,
            flexDirection: "row",
            justifyContent: "space-between",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 10,
            borderWidth: 1,
            borderColor: isDark ? "#4B3D44" : "#FCE4EC",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              snapTo(SNAP_OFFSET);
              onPrevStep();
            }}
            disabled={disablePrev}
            style={[styles.navBtn, { backgroundColor: getNavBtnBgColor(disablePrev) }]}
            testID="nav-prev-button"
          >
            <Text style={{ color: getNavBtnTextColor(disablePrev, isDark), fontWeight: "700" }}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNextPress}
            disabled={disableNext}
            style={[styles.navBtn, { backgroundColor: getNavBtnBgColor(disableNext) }]}
            testID="nav-next-button"
          >
            <Text style={{ color: getNavBtnTextColor(disableNext, isDark, "#FFF"), fontWeight: "700" }}>
              {getNextBtnLabel(isLastStep, finishLabel)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  navBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

IndoorDirectionsPopup.displayName = "IndoorDirectionsPopup";
export default IndoorDirectionsPopup;
