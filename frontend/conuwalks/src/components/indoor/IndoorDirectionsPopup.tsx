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

    if (!visible || steps.length === 0) return null;

    const disablePrev = activeStepIndex === 0;
    const isLastStep = activeStepIndex === steps.length - 1;
    const disableNext = isLastStep && !onFinish;

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
                  >
                    {Platform.OS === "ios" ? (
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: isDark ? "#FFFFFF" : "#333333",
                          marginBottom: 2,
                        }}
                      >
                        ✕
                      </Text>
                    ) : (
                      <Ionicons name="close" size={20} color={isDark ? "#FFFFFF" : "#333333"} />
                    )}
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
              {steps.map((step, index) => {
                const isLast = index === steps.length - 1;
                const isActive = index === activeStepIndex;

                return (
                  <View
                    key={step.id}
                    onLayout={e => {
                      stepLayouts.current[index] = e.nativeEvent.layout.y;
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: isLast ? 0 : 16,
                      opacity: isActive ? 1 : 0.3,
                      backgroundColor: isActive ? (isDark ? "#2A2025" : "#FFF0F5") : "transparent",
                      padding: isActive ? 18 : 10,
                      borderRadius: 14,
                      transform: [{ scale: isActive ? 1.02 : 1 }],
                    }}
                  >
                    <View
                      style={{
                        width: isActive ? 32 : 24,
                        height: isActive ? 32 : 24,
                        borderRadius: isActive ? 16 : 12,
                        backgroundColor: isActive || isLast ? "#C2185B" : isDark ? "#4B3D44" : "#FCE4EC",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 14,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: isActive ? 15 : 12,
                          fontWeight: "900",
                          color: isActive || isLast ? "#FFFFFF" : isDark ? "#E8C8D7" : "#C2185B",
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <Text
                      style={{
                        flex: 1,
                        fontSize: isActive ? 18 : 15,
                        fontWeight: isActive ? "800" : "500",
                        color: isActive || isLast ? "#C2185B" : isDark ? "#E0D7DB" : "#4A4A4A",
                      }}
                    >
                      {step.text}
                    </Text>
                  </View>
                );
              })}
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
            style={[styles.navBtn, { backgroundColor: disablePrev ? "#DDD" : "#B03060" }]}
          >
            <Text style={{ color: disablePrev ? (isDark ? "#776D72" : "#A0A0A0") : "white", fontWeight: "700" }}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (isLastStep && onFinish) {
                onFinish();
              } else {
                snapTo(SNAP_OFFSET);
                onNextStep();
              }
            }}
            disabled={disableNext}
            style={[styles.navBtn, { backgroundColor: disableNext ? "#DDD" : "#B03060" }]}
          >
            <Text style={{ color: disableNext ? (isDark ? "#776D72" : "#FFF") : "white", fontWeight: "700" }}>
              {isLastStep ? finishLabel || "Finish" : "Next"}
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
