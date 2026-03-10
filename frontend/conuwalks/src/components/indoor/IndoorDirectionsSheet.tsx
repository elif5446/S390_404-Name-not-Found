import React, { forwardRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useBottomSheet } from "@/src/hooks/useBottomSheet";
import BottomSheetDragHandle from "@/src/components/ui/BottomSheetDragHandle";

interface IndoorDirectionsSheetProps {
  visible: boolean;
  destinationLabel: string;
  onStartNavigation: () => void;
  onCancel: () => void;
}

const IndoorDirectionsSheet = forwardRef<any, IndoorDirectionsSheetProps>(
  ({ visible, destinationLabel, onStartNavigation, onCancel }, ref) => {
    const isDark = (useColorScheme() || "light") === "dark";

    const {
      translateY,
      MAX_HEIGHT,
      dismiss,
      handleToggleHeight,
      handlePanResponder,
    } = useBottomSheet({
      visible,
      onDismiss: onCancel,
      minHeight: 250,
    });

    return (
      <View
        style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}
        pointerEvents={visible ? "box-none" : "none"}
      >
        <Animated.View
          style={[
            styles.sheet,
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

          <View {...handlePanResponder.panHandlers}>
            <BottomSheetDragHandle
              isDark={isDark}
              onToggleHeight={handleToggleHeight}
            />
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Route to {destinationLabel}</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={onStartNavigation}
              >
                <Ionicons name="navigate" size={20} color="#FFF" />
                <Text style={styles.navText}>Start</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => dismiss(true)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  },
);

IndoorDirectionsSheet.displayName = "IndoorDirectionsSheet";

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  content: { padding: 24, alignItems: "center" },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
    color: "#B03060",
  },
  buttonRow: { flexDirection: "row", gap: 12, width: "100%" },
  navButton: {
    flex: 1,
    backgroundColor: "#4285F4",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  navText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  cancelButton: {
    flex: 1,
    backgroundColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelText: { color: "#3C3C43", fontSize: 16, fontWeight: "600" },
});

export default IndoorDirectionsSheet;
