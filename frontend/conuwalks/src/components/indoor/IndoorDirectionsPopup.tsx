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
}

const IndoorDirectionsPopup = forwardRef<IndoorDirectionsPopupHandle, IndoorDirectionsPopupProps>(
  ({ visible, steps, activeStepIndex, onNextStep, onPrevStep, onClose }, ref) => {
    const isDark = (useColorScheme() || "light") === "dark";
    const scrollViewRef = useRef<ScrollView>(null);
    const stepLayouts = useRef<{ [key: number]: number }>({});

    const handleSheetDismiss = useCallback(() => {
      onClose();
    }, [onClose]);

    const {
      translateY,
      MAX_HEIGHT,
      SNAP_OFFSET,
      MINIMIZED_OFFSET,
      minimize,
      snapTo,
      handleToggleHeight,
      handlePanResponder,
      scrollAreaPanResponder,
      dismiss,
    } = useBottomSheet({
      visible,
      onDismiss: handleSheetDismiss,
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
      }, 0);

      return () => clearTimeout(timeoutId);
    }, [activeStepIndex, steps.length]);

    if (!visible || steps.length === 0) return null;

    return (
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "100%",
          zIndex: 1000,
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
                      opacity: isActive ? 1 : 0.35,
                      backgroundColor: isActive ? (isDark ? "#2A2025" : "#FFF0F5") : "transparent",
                      padding: isActive ? 16 : 8,
                      borderRadius: 12,
                      transform: [{ scale: isActive ? 1.02 : 0.98 }],
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
                        marginRight: 12,
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
                        lineHeight: isActive ? 26 : 22,
                        color: isActive || isLast ? "#C2185B" : isDark ? "#E0D7DB" : "#4A4A4A",
                        fontWeight: isActive ? "800" : "500",
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
            padding: 12,
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
            disabled={activeStepIndex === 0}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: activeStepIndex === 0 ? (isDark ? "#332A2F" : "#F5F5F5") : "#C2185B",
              flex: 1,
              marginRight: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: activeStepIndex === 0 ? (isDark ? "#776D72" : "#A0A0A0") : "white", fontWeight: "700" }}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              snapTo(SNAP_OFFSET);
              onNextStep();
            }}
            disabled={activeStepIndex === steps.length - 1}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: activeStepIndex === steps.length - 1 ? (isDark ? "#332A2F" : "#F5F5F5") : "#C2185B",
              flex: 1,
              marginLeft: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: activeStepIndex === steps.length - 1 ? (isDark ? "#776D72" : "#A0A0A0") : "white", fontWeight: "700" }}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

IndoorDirectionsPopup.displayName = "IndoorDirectionsPopup";
export default IndoorDirectionsPopup;
