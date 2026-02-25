import React, {
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  View,
  Platform,
  Animated,
  ScrollView,
  useColorScheme,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import { styles } from "../styles/DestinationPopup";
import { useDestinationData } from "../hooks/useDestinationData";
import { useBottomSheet } from "../hooks/useBottomSheet"; // Adjust path to hook
import DestinationHeader from "./DestinationPopupHeader";
import DestinationContent from "./DestinationPopupContent";

interface DestinationPopupProps {
  visible: boolean;
  onClose: () => void;
}

export interface DestinationPopupHandle {
  minimize: () => void;
}

const DestinationPopup = forwardRef<
  DestinationPopupHandle,
  DestinationPopupProps
>(({ visible, onClose }, ref) => {
  const isDark = (useColorScheme() || "light") === "dark";

  const {
    routes,
    selectedRouteIndex,
    setSelectedRouteIndex,
    setRouteData,
    clearRouteData,
    loading,
    error,
    travelMode,
    setTravelMode,
    setIsNavigationActive,
    navigationRouteId,
    setNavigationRouteId,
    getModeDurationLabel,
    getTransitBadgeLabel,
    getRouteTransitSummary,
    transitSteps,
  } = useDestinationData(visible);

  const scrollViewRef = useRef<ScrollView>(null);

  // --- CORE ENGINE INJECTION ---
  const {
    translateY,
    MAX_HEIGHT,
    scrollOffsetRef,
    minimize,
    dismiss,
    handleToggleHeight,
    handlePanResponder,
    scrollAreaPanResponder,
  } = useBottomSheet({
    visible,
    onDismiss: (shouldClear: boolean = true) => {
      if (shouldClear) {
        setIsNavigationActive(false);
        clearRouteData();
      }
      onClose();
    },
  });

  // Expose minimize safely to CampusMap
  useImperativeHandle(ref, () => ({ minimize }));

  const handleSelectRoute = useCallback(
    (index: number) => {
      setSelectedRouteIndex(index);
      if (routes[index]) setRouteData(routes[index]);
    },
    [routes, setSelectedRouteIndex, setRouteData],
  );

  const handleStartNavigation = useCallback(
    (routeId: string, index: number) => {
      if (routes[index]) {
        setSelectedRouteIndex(index);
        setRouteData(routes[index]);
        setNavigationRouteId(routeId);
        setIsNavigationActive(true);
        dismiss(false); // Pass false so it doesn't clear the route when closing
        return;
      }
      setNavigationRouteId(routeId);
    },
    [
      routes,
      setSelectedRouteIndex,
      setRouteData,
      setIsNavigationActive,
      setNavigationRouteId,
      dismiss,
    ],
  );

  return (
    <View
      style={[styles.overlay, { zIndex: visible ? 999 : -1 }]}
      pointerEvents={visible ? "box-none" : "none"}
      accessibilityViewIsModal={visible}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.sheet,
            {
              height: MAX_HEIGHT,
              maxHeight: "100%",
              backgroundColor:
                Platform.OS === "android" ? "#FFFFFF" : "transparent",
              transform: [{ translateY }],
            },
          ]}
        >
          {Platform.OS === "ios" && (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          )}

          <View {...handlePanResponder.panHandlers}>
            <DestinationHeader
              isDark={isDark}
              travelMode={travelMode as any}
              setTravelMode={setTravelMode}
              getModeDurationLabel={getModeDurationLabel}
              onDismiss={() => dismiss(true)}
              onToggleHeight={handleToggleHeight}
            />
          </View>

          <View style={{ flex: 1 }} {...scrollAreaPanResponder.panHandlers}>
            <DestinationContent
              isDark={isDark}
              loading={loading}
              error={error}
              routes={routes}
              selectedRouteIndex={selectedRouteIndex}
              travelMode={travelMode}
              navigationRouteId={navigationRouteId}
              transitSteps={transitSteps}
              getRouteTransitSummary={getRouteTransitSummary}
              getTransitBadgeLabel={getTransitBadgeLabel}
              handleSelectRoute={handleSelectRoute}
              handleStartNavigation={handleStartNavigation}
              scrollViewRef={scrollViewRef}
              onScroll={(e) =>
                (scrollOffsetRef.current = e.nativeEvent.contentOffset.y)
              }
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
});

DestinationPopup.displayName = "DestinationPopup";
export default DestinationPopup;
