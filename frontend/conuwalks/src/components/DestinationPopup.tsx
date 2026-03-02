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
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { BlurView } from "expo-blur";
import { useDestinationData } from "../hooks/useDestinationData";
import { useBottomSheet } from "../hooks/useBottomSheet";
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

  // wrapped in useCallback to provide a stable reference to useBottomSheet
  const handleSheetDismiss = useCallback(
    (shouldClear: boolean = true) => {
      if (shouldClear) {
        setIsNavigationActive(false);
        clearRouteData();
      }
      onClose();
    },
    [setIsNavigationActive, clearRouteData, onClose],
  );

  const {
    translateY,
    MAX_HEIGHT,
    SNAP_OFFSET,
    scrollOffsetRef,
    minimize,
    snapTo,
    dismiss,
    handleToggleHeight,
    handlePanResponder,
    scrollAreaPanResponder,
  } = useBottomSheet({
    visible,
    onDismiss: handleSheetDismiss,
  });

  // Expose minimize safely to CampusMap
  useImperativeHandle(ref, () => ({ minimize }));

  const handleTravelModeSelect = useCallback(
    (mode: "walking" | "driving" | "transit" | "bicycling") => {
      setTravelMode(mode);
      snapTo(SNAP_OFFSET);
    },
    [setTravelMode, snapTo, SNAP_OFFSET],
  );

  const handleHeaderDismiss = useCallback(() => {
    dismiss(true);
  }, [dismiss]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
    },
    [scrollOffsetRef],
  );

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
      style={[styles.overlay, { zIndex: 999 }]}
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
              setTravelMode={handleTravelModeSelect}
              getModeDurationLabel={getModeDurationLabel}
              onDismiss={handleHeaderDismiss}
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
              onScroll={handleScroll}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10001,
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  sheet: {
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    width: "100%",
    alignSelf: "stretch",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    marginHorizontal: 0,
    marginBottom: 0,
    minHeight: 300,
    maxHeight: "80%",
    overflow: "hidden",
  },
  dragHandle: {
    width: 38,
    height: 3,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 6,
  },
  dragHandleTouchArea: {
    alignSelf: "stretch",
    paddingTop: 4,
    paddingBottom: 6,
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    minHeight: 46,
    marginBottom: 6,
  },
  headerSide: {
    position: "absolute",
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  headerSideLeft: {
    left: 0,
  },
  headerSideRight: {
    right: 0,
    alignItems: "flex-end",
  },
  headerCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 72,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#B03060",
    textAlign: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  closeButtonCircle: {
    width: 35,
    height: 35,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "300",
    lineHeight: 24,
    includeFontPadding: false,
    textAlign: "center",
  },
  transportRow: {
    flexDirection: "row",
    gap: 0,
    marginBottom: 8,
    borderRadius: 999,
    padding: 4,
  },
  transportButton: {
    flex: 1,
    minWidth: 0,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    flexDirection: "row",
    gap: 2,
  },
  routeList: {
    marginTop: 2,
    maxHeight: 380,
  },
  routeCard: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  durationText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#B03060",
    lineHeight: 26,
  },
  etaText: {
    color: "#C48BA1",
    marginTop: 0,
    fontSize: 14,
    fontWeight: "500",
  },
  routeTransitSummary: {
    color: "#6E6E73",
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  distanceText: {
    color: "#C48BA1",
    marginRight: 10,
    fontWeight: "500",
    fontSize: 14,
  },
  startButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#B03060",
    alignItems: "center",
    justifyContent: "center",
  },
  centerInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  transitSection: {
    marginTop: 6,
    marginBottom: 8,
    gap: 8,
  },
  transitSectionTitle: {
    color: "#B03060",
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 2,
  },
  transitCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  transitCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transitLineName: {
    color: "#B03060",
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
    paddingRight: 8,
  },
  transitTypeBadge: {
    backgroundColor: "#ECECEF",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  transitTypeBadgeText: {
    color: "#5F5F63",
    fontSize: 11,
    fontWeight: "700",
  },
  transitHeadsign: {
    color: "#C48BA1",
    fontSize: 13,
    fontWeight: "500",
  },
  transitStops: {
    color: "#6E6E73",
    fontSize: 13,
    fontWeight: "500",
  },
});

DestinationPopup.displayName = "DestinationPopup";
export default DestinationPopup;
