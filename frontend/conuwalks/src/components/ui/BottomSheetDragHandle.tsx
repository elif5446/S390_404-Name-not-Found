import React, { memo } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  AccessibilityActionEvent,
} from "react-native";

interface BottomSheetDragHandleProps {
  isDark: boolean;
  onToggleHeight?: () => void;
  onAccessibilityAction?: (e: AccessibilityActionEvent) => void;
  accessibilityHint?: string;
}

const BottomSheetDragHandle: React.FC<BottomSheetDragHandleProps> = ({
  isDark,
  onToggleHeight,
  onAccessibilityAction,
  accessibilityHint = "Double tap to toggle height, or swipe to expand/collapse",
}) => {
  return (
    <TouchableOpacity
      style={styles.handleBarContainer}
      onPress={onToggleHeight}
      activeOpacity={1}
      accessible={true}
      accessibilityLabel="Drag handle"
      accessibilityHint={accessibilityHint}
      accessibilityRole="adjustable"
      accessibilityActions={[
        { name: "increment", label: "Expand" },
        { name: "decrement", label: "Collapse" },
      ]}
      onAccessibilityAction={onAccessibilityAction}
    >
      <View
        style={[
          styles.handleBar,
          { backgroundColor: isDark ? "#7A7A7C" : "#B8B8BC" },
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  handleBarContainer: {
    alignSelf: "stretch",
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 999,
  },
});

export default memo(BottomSheetDragHandle);
