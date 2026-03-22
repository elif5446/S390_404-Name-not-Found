import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  Animated,
  ScrollView,
  useColorScheme,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBottomSheet } from "@/src/hooks/useBottomSheet";

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
  onClose: () => void;
}

const IndoorDirectionsPopup = forwardRef<
  IndoorDirectionsPopupHandle,
  IndoorDirectionsPopupProps
>(({ visible, steps, onClose }, ref) => {
  const isDark = (useColorScheme() || "light") === "dark";
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSheetDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const {
    translateY,
    MAX_HEIGHT,
    scrollOffsetRef,
    minimize,
    handleToggleHeight,
    handlePanResponder,
    scrollAreaPanResponder,
    dismiss,
  } = useBottomSheet({
    visible,
    onDismiss: handleSheetDismiss,
  });

  useImperativeHandle(ref, () => ({
    minimize,
    dismiss: () => dismiss(true),
  }));

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
    },
    [scrollOffsetRef],
  );

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

        <View
          {...handlePanResponder.panHandlers}
          style={{
            paddingTop: 10,
            paddingHorizontal: 16,
            paddingBottom: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: isDark ? "#4B3D44" : "#E8C8D7",
          }}
        >
          <View
            style={{
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? "#7A6570" : "#D9AFC2",
              }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
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

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
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

            <TouchableOpacity onPress={handleToggleHeight} hitSlop={10}>
              <Ionicons name="chevron-down" size={22} color="#C2185B" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flex: 1 }} {...scrollAreaPanResponder.panHandlers}>
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;

              return (
                <View
                  key={step.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: isLast ? 0 : 12,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: isLast ? "#C2185B" : "#FCE4EC",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                      marginTop: 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: isLast ? "#FFFFFF" : "#C2185B",
                      }}
                    >
                      {index + 1}
                    </Text>
                  </View>

                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      lineHeight: 22,
                      color: isLast
                        ? "#C2185B"
                        : isDark
                          ? "#F4EEF1"
                          : "#1F1F1F",
                      fontWeight: isLast ? "700" : "600",
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
    </View>
  );
});

IndoorDirectionsPopup.displayName = "IndoorDirectionsPopup";
export default IndoorDirectionsPopup;