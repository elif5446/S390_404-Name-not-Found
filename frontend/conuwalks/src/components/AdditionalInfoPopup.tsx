import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  View,
  Platform,
  useColorScheme,
  Animated,
  ScrollView,
  AccessibilityActionEvent,
} from "react-native";
import { BlurView } from "expo-blur";
import { styles } from "@/src/styles/additionalInfoPopup";
import { useBuildingData } from "../hooks/useBuildingData";
import { useBottomSheet } from "../hooks/useBottomSheet";
import PopupHeader from "./AdditionalInfoPopupHeader";
import PopupContent from "./AdditionalInfoPopupContent";

export interface AdditionalInfoPopupHandle {
  collapse: () => void;
  minimize: () => void;
}

interface AdditionalInfoPopupProps {
  visible: boolean;
  buildingId: string;
  campus: "SGW" | "LOY";
  onClose: () => void;
  onDirectionsTrigger?: () => void;
  directionsEtaLabel?: string;
  onExpansionChange?: (isExpanded: boolean) => void;
}

const BackgroundWrapper = ({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: "light" | "dark";
}) => {
  if (Platform.OS === "ios") {
    return (
      <BlurView
        style={[styles.iosBlurContainer, { height: "100%" }]}
        intensity={100}
        tint={mode}
      >
        {children}
      </BlurView>
    );
  }
  return (
    <View
      style={[
        styles.iosBlurContainer,
        {
          height: "100%",
          backgroundColor: mode === "dark" ? "#1C1C1E" : "#FFFFFF",
          elevation: 8,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        },
      ]}
    >
      {children}
    </View>
  );
};

const AdditionalInfoPopup = forwardRef<
  AdditionalInfoPopupHandle,
  AdditionalInfoPopupProps
>((props, ref) => {
  const {
    visible,
    buildingId,
    campus,
    onClose,
    onDirectionsTrigger,
    directionsEtaLabel,
    onExpansionChange,
  } = props;
  const mode = useColorScheme() || "light";
  const { buildingInfo, isCopying, copyAddress, accessibilityIcons } =
    useBuildingData(buildingId, campus);

  const scrollViewRef = useRef<ScrollView>(null);
  const opacity = useRef(new Animated.Value(1)).current;

  // --- CORE ENGINE INJECTION ---
  const {
    translateY,
    MAX_HEIGHT,
    SNAP_OFFSET,
    scrollOffsetRef,
    snapTo,
    minimize,
    dismiss,
    handleToggleHeight,
    handlePanResponder,
    scrollAreaPanResponder,
  } = useBottomSheet({
    visible,
    onDismiss: onClose,
    onExpansionChange,
  });

  const handleDragHandleAccessibilityAction = (
    event: AccessibilityActionEvent,
  ) => {
    const actionName = event.nativeEvent.actionName;
    if (actionName === "increment") {
      snapTo(0);
    }
    if (actionName === "decrement") {
      snapTo(SNAP_OFFSET);
    }
  };

  const handleDirectionsPress = () => {
    dismiss(undefined, () => {
      onDirectionsTrigger?.();
    });
  };

  useImperativeHandle(ref, () => ({
    collapse: () => snapTo(SNAP_OFFSET),
    minimize,
  }));

  const prevBuildingId = useRef(buildingId);
  useEffect(() => {
    if (!visible || prevBuildingId.current === buildingId) return;
    prevBuildingId.current = buildingId;
    snapTo(SNAP_OFFSET);

    // Crossfade animation when a new building is clicked
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buildingId, visible, snapTo, SNAP_OFFSET, opacity]);

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "100%",
        zIndex: 999,
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
            inputRange: [0, SNAP_OFFSET],
            outputRange: [0.5, 0],
            extrapolate: "clamp",
          }),
        }}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.iosBlurContainer,
          { height: MAX_HEIGHT, transform: [{ translateY }] },
        ]}
        importantForAccessibility="yes"
        focusable={true}
      >
        <BackgroundWrapper mode={mode}>
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: mode === "dark" ? "#1C1C1E" : "#FFFFFF",
              opacity: translateY.interpolate({
                inputRange: [0, 50],
                outputRange: [1, 0],
                extrapolate: "clamp",
              }),
            }}
          />
          <Animated.View style={{ flex: 1, opacity }}>
            <View
              style={styles.iosContentContainer}
              {...handlePanResponder.panHandlers}
            >
              <PopupHeader
                mode={mode}
                buildingId={buildingId}
                buildingInfo={buildingInfo}
                accessibilityIcons={accessibilityIcons}
                directionsEtaLabel={directionsEtaLabel}
                onDismiss={() => dismiss()}
                onDirectionsPress={handleDirectionsPress}
                onToggleHeight={handleToggleHeight}
                onDragHandleAccessibilityAction={
                  handleDragHandleAccessibilityAction
                }
              />
            </View>

            <View style={{ flex: 1 }} {...scrollAreaPanResponder.panHandlers}>
              <PopupContent
                mode={mode}
                buildingInfo={buildingInfo}
                directionsEtaLabel={directionsEtaLabel}
                isCopying={isCopying}
                onDirectionsPress={handleDirectionsPress}
                onCopyAddress={copyAddress}
                scrollViewRef={scrollViewRef}
                onScroll={(e) =>
                  (scrollOffsetRef.current = e.nativeEvent.contentOffset.y)
                }
              />
            </View>
          </Animated.View>
        </BackgroundWrapper>
      </Animated.View>
    </View>
  );
});

AdditionalInfoPopup.displayName = "AdditionalInfoPopup";
export default AdditionalInfoPopup;
