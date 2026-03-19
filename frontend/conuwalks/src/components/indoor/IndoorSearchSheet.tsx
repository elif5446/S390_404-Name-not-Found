import React, { forwardRef, useImperativeHandle, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  StyleSheet,
  useColorScheme,
  AccessibilityActionEvent,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useBottomSheet } from "@/src/hooks/useBottomSheet";
import BottomSheetDragHandle from "@/src/components/ui/BottomSheetDragHandle";
import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";

interface IndoorSearchSheetProps {
  visible: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  showSearchResults: boolean;
  setShowSearchResults: (value: boolean) => void;
  filteredRooms: IndoorHotspot[];
  onSelectDestination: (item: IndoorDestination) => void;
  onClearDestination: () => void;
  onExit: () => void;
}

export interface IndoorSearchSheetHandle {
  minimize: () => void;
  dismiss: () => void;
}

const IndoorSearchSheet = forwardRef<
  IndoorSearchSheetHandle,
  IndoorSearchSheetProps
>((props, ref) => {
  const {
    visible,
    searchQuery,
    setSearchQuery,
    showSearchResults,
    setShowSearchResults,
    filteredRooms,
    onSelectDestination,
    onClearDestination,
    onExit,
  } = props;

  const isDark = (useColorScheme() || "light") === "dark";

  const {
    translateY,
    MAX_HEIGHT,
    SNAP_OFFSET,
    minimize,
    dismiss,
    snapTo,
    handleToggleHeight,
    handlePanResponder,
    scrollAreaPanResponder,
  } = useBottomSheet({
    visible: visible,
    onDismiss: onExit,
  });

  useImperativeHandle(ref, () => ({
    minimize,
    dismiss: () => dismiss(true),
  }));

  const handleDragHandleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      const actionName = event.nativeEvent.actionName;
      if (actionName === "increment") snapTo(0);
      if (actionName === "decrement") snapTo(SNAP_OFFSET);
    },
    [snapTo, SNAP_OFFSET],
  );

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: 999 }]}
      pointerEvents={visible ? "box-none" : "none"}
    >
      <Animated.View
        style={[
          sheetStyles.sheet,
          {
            height: MAX_HEIGHT,
            backgroundColor:
              Platform.OS === "android"
                ? isDark
                  ? "#1C1C1E"
                  : "#FFFFFF"
                : "transparent",
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

        <View style={sheetStyles.headerContainer}>
          <View
            style={sheetStyles.dragAreaWrapper}
            {...handlePanResponder.panHandlers}
          >
            <BottomSheetDragHandle
              isDark={isDark}
              onToggleHeight={handleToggleHeight}
              onAccessibilityAction={handleDragHandleAccessibilityAction}
            />
          </View>

          <TouchableOpacity
            onPress={() => dismiss(true)}
            style={sheetStyles.headerExitButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View
              style={[
                sheetStyles.closeButtonCircle,
                { backgroundColor: isDark ? "#3A3A3C" : "#E5E5EA" },
              ]}
            >
              <Ionicons
                name="close"
                size={18}
                color={isDark ? "#E5E5EA" : "#8E8E93"}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View
          style={sheetStyles.contentContainer}
          {...scrollAreaPanResponder.panHandlers}
        >
          <View
            style={[
              sheetStyles.routingCard,
              { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
            ]}
          >
            <View style={sheetStyles.timeline}>
              <View style={sheetStyles.startDot} />
              <View
                style={[
                  sheetStyles.line,
                  { backgroundColor: isDark ? "#48484A" : "#D1D1D6" },
                ]}
              />
              <View style={sheetStyles.endDot} />
            </View>

            <View style={sheetStyles.inputsContainer}>
              <View style={sheetStyles.inputWrapper}>
                <Text
                  style={[
                    sheetStyles.startText,
                    { color: isDark ? "#E5E5EA" : "#1C1C1E" },
                  ]}
                >
                  Current Location
                </Text>
              </View>

              <View
                style={[
                  sheetStyles.divider,
                  { backgroundColor: isDark ? "#38383A" : "#C6C6C8" },
                ]}
              />

              <View style={sheetStyles.inputWrapper}>
                <TextInput
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    const hasText = text.trim().length > 0;
                    setShowSearchResults(hasText);
                    if (!hasText) {
                      // 2. Bug Fixed: onClearDestination is now in scope
                      onClearDestination();
                    }
                  }}
                  onFocus={() => {
                    snapTo(SNAP_OFFSET);
                  }}
                  placeholder="Where to?"
                  placeholderTextColor="#8E8E93"
                  style={[
                    sheetStyles.destinationInput,
                    { color: isDark ? "#FFFFFF" : "#1C1C1E" },
                  ]}
                  autoCorrect={false}
                />
              </View>
            </View>
          </View>

          {/* Search Results */}
          {showSearchResults && filteredRooms.length > 0 && (
            <View style={sheetStyles.resultsContainer}>
              <FlatList
                data={filteredRooms}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                renderItem={({ item: room }) => (
                  <Pressable
                    onPress={() => onSelectDestination(room)}
                    style={[
                      sheetStyles.resultItem,
                      { borderBottomColor: isDark ? "#38383A" : "#E5E5EA" },
                    ]}
                  >
                    <View
                      style={[
                        sheetStyles.resultIcon,
                        { backgroundColor: isDark ? "#3A3A3C" : "#E5E5EA" },
                      ]}
                    >
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={isDark ? "#E5E5EA" : "#3C3C43"}
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          sheetStyles.resultTitle,
                          { color: isDark ? "#FFFFFF" : "#1C1C1E" },
                        ]}
                      >
                        {room.label}
                      </Text>
                      <Text style={sheetStyles.resultSubtitle}>
                        Floor {room.floorLevel}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
});

IndoorSearchSheet.displayName = "IndoorSearchSheet";

const sheetStyles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  headerContainer: {
    width: "100%",
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  dragAreaWrapper: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  headerExitButton: {
    position: "absolute",
    right: 16,
    zIndex: 10,
  },
  closeButtonCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  routingCard: {
    flexDirection: "row",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  timeline: {
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    marginRight: 12,
  },
  startDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4285F4",
  },
  endDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#B03060",
  },
  line: {
    width: 2,
    height: 24,
    marginVertical: 4,
  },
  inputsContainer: {
    flex: 1,
  },
  inputWrapper: {
    height: 44,
    justifyContent: "center",
  },
  startText: {
    fontSize: 16,
    fontWeight: "500",
  },
  destinationInput: {
    fontSize: 16,
    height: "100%",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  resultsContainer: {
    flex: 1,
    marginTop: 4,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  resultSubtitle: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  exitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(176, 48, 96, 0.1)",
    paddingVertical: 14,
    borderRadius: 16,
  },
  exitText: {
    color: "#B03060",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 6,
  },
});

export default IndoorSearchSheet;
