import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  AccessibilityActionEvent,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView } from "expo-symbols";
import { styles, themedStyles } from "@/src/styles/additionalInfoPopup";
import { MetroIcon } from "./MetroIcon";
import { BuildingMetadata, AccessibilityIconDef } from "../types/Building";

interface PopupHeaderProps {
  mode: "light" | "dark";
  buildingId: string;
  buildingInfo: BuildingMetadata | null;
  accessibilityIcons: AccessibilityIconDef[];
  directionsEtaLabel?: string;
  onDismiss: () => void;
  onDirectionsPress: () => void;
  onToggleHeight: () => void;
  onDragHandleAccessibilityAction: (e: AccessibilityActionEvent) => void;
}

const PopupHeader: React.FC<PopupHeaderProps> = ({
  mode,
  buildingId,
  buildingInfo,
  accessibilityIcons,
  directionsEtaLabel,
  onDismiss,
  onDirectionsPress,
  onToggleHeight,
  onDragHandleAccessibilityAction,
}) => {
  const campusPink = "#B03060";

  return (
    <>
      <TouchableOpacity
        style={styles.handleBarContainer}
        onPress={onToggleHeight}
        activeOpacity={1}
        accessible={true}
        accessibilityLabel="Drag handle"
        accessibilityHint="Double tap to toggle height, or swipe to expand/collapse"
        accessibilityRole="adjustable"
        accessibilityActions={[
          { name: "increment", label: "Expand" },
          { name: "decrement", label: "Collapse" },
        ]}
        onAccessibilityAction={onDragHandleAccessibilityAction}
      >
        <View style={styles.handleBar} />
      </TouchableOpacity>

      <TouchableWithoutFeedback onPress={onToggleHeight}>
        <View style={styles.iosHeader}>
          <TouchableOpacity
            onPress={onDismiss}
            style={[
              styles.closeButton,
              Platform.OS === "android" && { width: "auto", padding: 4 },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            {Platform.OS === "android" ? (
              <MaterialIcons
                name="close"
                size={24}
                color={themedStyles.text(mode).color}
              />
            ) : (
              <View
                style={[
                  styles.closeButtonCircle,
                  themedStyles.closeButton(mode),
                ]}
              >
                <Text style={[styles.closeButtonText, themedStyles.text(mode)]}>
                  ✕
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text
              style={[styles.buildingName, themedStyles.text(mode)]}
              accessibilityRole="header"
            >
              {buildingInfo?.name || "Building"}
            </Text>
            <View
              style={[
                styles.buildingIdWithIconsContainer,
                { justifyContent: "center" },
              ]}
            >
              <View style={styles.buildingIdContainer}>
                <Text style={[styles.buildingId, themedStyles.subtext(mode)]}>
                  {buildingId}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.rightHeaderActions}>
            <TouchableOpacity
              onPress={onDirectionsPress}
              style={styles.directionsButton}
              accessibilityRole="button"
              accessibilityLabel={`Directions, ${directionsEtaLabel || "--"}`}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.directionsArrowCircle}>
                <MaterialIcons
                  name="subdirectory-arrow-right"
                  size={12}
                  color={campusPink}
                />
              </View>
              <Text style={styles.directionsEtaText}>
                {directionsEtaLabel || "--"}
              </Text>
            </TouchableOpacity>

            {accessibilityIcons.length > 0 && (
              <View
                style={[
                  styles.accessibilityIconsContainer,
                  styles.rightAccessibilityRow,
                ]}
              >
                {accessibilityIcons.map((icon) => (
                  <View
                    key={icon.key}
                    accessible={true}
                    accessibilityLabel={icon.label}
                  >
                    {icon.key === "metro" ? (
                      <MetroIcon
                        width={25}
                        height={25}
                        color={themedStyles.subtext(mode).color}
                      />
                    ) : Platform.OS === "ios" ? (
                      <SymbolView
                        name={icon.sf}
                        size={25}
                        weight="heavy"
                        tintColor={themedStyles.subtext(mode).color}
                      />
                    ) : (
                      <MaterialIcons
                        name={icon.material}
                        size={25}
                        color={themedStyles.subtext(mode).color}
                      />
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
};

export default memo(PopupHeader);
