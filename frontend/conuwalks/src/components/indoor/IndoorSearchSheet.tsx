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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView, SFSymbol } from "expo-symbols";
import { BlurView } from "expo-blur";
import { useBottomSheet } from "@/src/hooks/useBottomSheet";
import BottomSheetDragHandle from "@/src/components/ui/BottomSheetDragHandle";
import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";

interface SuggestionIconProps {
  iosName: SFSymbol;
  androidName: React.ComponentProps<typeof MaterialIcons>["name"];
  color: string;
}

const SuggestionIcon = ({
  iosName,
  androidName,
  color,
}: SuggestionIconProps) => {
  if (Platform.OS === "ios") {
    return (
      <SymbolView
        name={iosName}
        size={20}
        tintColor={color}
        fallback={<MaterialIcons name={androidName} size={20} color={color} />}
      />
    );
  }
  return <MaterialIcons name={androidName} size={20} color={color} />;
};

interface IndoorSearchSheetProps {
  visible: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  showSearchResults: boolean;
  setShowSearchResults: (value: boolean) => void;
  filteredRooms: IndoorHotspot[];
  startPointLabel: string;
  onSelectDestination: (item: IndoorDestination) => void;
  onClearDestination: () => void;
  onExit: () => void;
  onToggleOutdoorMap: () => void;
}

export interface IndoorSearchSheetHandle {
  minimize: () => void;
  dismiss: () => void;
}

const IndoorSearchSheet = forwardRef<
  IndoorSearchSheetHandle,
  IndoorSearchSheetProps
>((props, ref) => {
  const { visible, onClearDestination, onExit, onToggleOutdoorMap } = props;
  const isDark = (useColorScheme() || "light") === "dark";
  const campusPink = "#B03060";

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
      pointerEvents={props.visible ? "box-none" : "none"}
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

        {/* Draggable Handle */}
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

        <View style={sheetStyles.header}>
          <View style={[sheetStyles.headerSide, sheetStyles.headerSideLeft]}>
            <TouchableOpacity
              onPress={() => dismiss(true)}
              style={sheetStyles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Close search panel"
            >
              {Platform.OS === "ios" ? (
                <View
                  style={[
                    sheetStyles.closeButtonCircle,
                    { backgroundColor: isDark ? "#00000031" : "#85858522" },
                  ]}
                >
                  <Text
                    style={[
                      sheetStyles.closeButtonText,
                      { color: isDark ? "#FFFFFF" : "#333333" },
                    ]}
                  >
                    ✕
                  </Text>
                </View>
              ) : (
                <MaterialIcons name="close" size={22} color={campusPink} />
              )}
            </TouchableOpacity>
          </View>
          <View style={[sheetStyles.headerSide, sheetStyles.headerSideRight]}>
            {onToggleOutdoorMap && (
              <TouchableOpacity
                onPress={onToggleOutdoorMap}
                style={[
                  sheetStyles.openOutdoorHeaderButton,
                  { borderColor: isDark ? "#48484A" : "#D1D1D6" },
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text
                  style={[
                    sheetStyles.openOutdoorHeaderButtonText,
                    { color: isDark ? "#E5E5EA" : "#1C1C1E" },
                  ]}
                >
                  Outdoor Map ↘
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View
          style={sheetStyles.contentContainer}
          {...scrollAreaPanResponder.panHandlers}
        >
          <View
            style={[
              sheetStyles.searchPanelContainer,
              { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
            ]}
          >
            <View style={sheetStyles.inputRow}>
              <SuggestionIcon
                iosName="circle.circle.fill"
                androidName="adjust"
                color={campusPink}
              />
              <TextInput
                style={[
                  sheetStyles.input,
                  { color: isDark ? "#E5E5EA" : "#1C1C1E" },
                ]}
                value={props.startPointLabel}
                editable={false}
              />
            </View>

            <View
              style={[
                sheetStyles.divider,
                { backgroundColor: isDark ? "#38383A" : "#C6C6C8" },
              ]}
            />

            <View style={sheetStyles.inputRow}>
              <SuggestionIcon
                iosName="pin.fill"
                androidName="location-on"
                color={campusPink}
              />
              <TextInput
                value={props.searchQuery}
                onChangeText={(text) => {
                  props.setSearchQuery(text);
                  const hasText = text.trim().length > 0;
                  props.setShowSearchResults(hasText);
                  if (!hasText) {
                    onClearDestination();
                  }
                }}
                onFocus={() => {
                  snapTo(SNAP_OFFSET);
                }}
                placeholder="Where to?"
                placeholderTextColor="#8E8E93"
                style={[
                  sheetStyles.input,
                  { color: isDark ? "#FFFFFF" : "#1C1C1E" },
                ]}
                autoCorrect={false}
                selectionColor={campusPink}
              />
            </View>
          </View>

          {/* Search Results */}
          {props.showSearchResults && props.filteredRooms.length > 0 && (
            <View style={sheetStyles.resultsContainer}>
              <ScrollView
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
              >
                {props.filteredRooms.map((room) => (
                  <Pressable
                    key={room.id}
                    onPress={() => props.onSelectDestination(room)}
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
                ))}
              </ScrollView>
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
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
    paddingTop: 8,
  },
  dragAreaWrapper: {
    alignSelf: "stretch",
    paddingTop: 4,
    paddingBottom: 6,
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    minHeight: 46,
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  headerSide: {
    position: "absolute",
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  headerSideLeft: {
    left: 14,
  },
  headerSideRight: {
    right: 14,
    alignItems: "flex-end",
  },
  headerCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "flex-start",
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
  openOutdoorHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: Platform.OS === "android" ? 7 : 6,
    paddingHorizontal: 12,
    minHeight: 30,
  },
  openOutdoorHeaderButtonText: {
    fontWeight: "600",
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  searchPanelContainer: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: 30,
    paddingVertical: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 30,
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
});

export default IndoorSearchSheet;
