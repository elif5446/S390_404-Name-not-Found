import React, { memo } from "react";
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, Platform, AccessibilityActionEvent } from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView } from "expo-symbols";
import { styles, themedStyles } from "@/src/styles/additionalInfoPopup";
import { MetroIcon } from "./MetroIcon";
import { BuildingMetadata, AccessibilityIconDef } from "../indoors/types/Building";
import BottomSheetDragHandle from "./ui/BottomSheetDragHandle";
import PlatformIcon from "./ui/PlatformIcon";

interface AdditionalInfoPopupHeaderProps {
  mode: "light" | "dark";
  buildingId: string;
  buildingInfo: BuildingMetadata | null;
  accessibilityIcons: AccessibilityIconDef[];
  directionsEtaLabel?: string;
  onDismiss: () => void;
  onDirectionsPress: () => void;
  onOpenIndoorPress?: () => void;
  showOpenIndoorButton?: boolean;
  onToggleHeight: () => void;
  onDragHandleAccessibilityAction: (e: AccessibilityActionEvent) => void;
}

// helper logic
const renderAccessibilityIcon = (icon: AccessibilityIconDef, mode: "light" | "dark") => {
  const iconColor = themedStyles.subtext(mode).color;

  if (icon.key === "metro") {
    return <MetroIcon width={25} height={25} color={iconColor} />;
  }

  if (Platform.OS === "ios") {
    return <SymbolView name={icon.sf} size={25} weight="heavy" tintColor={iconColor} />;
  }

  return <PlatformIcon materialName={icon.material} iosName={icon.sf} size={25} color={iconColor} weight="heavy" />;
};

const AdditionalInfoPopupHeader: React.FC<AdditionalInfoPopupHeaderProps> = ({
  mode,
  buildingId,
  buildingInfo,
  accessibilityIcons,
  directionsEtaLabel,
  onDismiss,
  onDirectionsPress,
  onOpenIndoorPress,
  showOpenIndoorButton,
  onToggleHeight,
  onDragHandleAccessibilityAction,
}) => {
  const campusPink = "#B03060";
  const isDark = mode === "dark";

  return (
    <>
      <BottomSheetDragHandle isDark={isDark} onToggleHeight={onToggleHeight} onAccessibilityAction={onDragHandleAccessibilityAction} />

      <TouchableWithoutFeedback onPress={onToggleHeight}>
        <View style={styles.iosHeader}>
          <TouchableOpacity
            onPress={onDismiss}
            style={[styles.closeButton, Platform.OS === "android" && { width: "auto", padding: 4 }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible={true}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            {Platform.OS === "android" ? (
              <MaterialIcons name="close" size={24} color={themedStyles.text(mode).color} />
            ) : (
              <View style={[styles.closeButtonCircle, themedStyles.closeButton(mode)]}>
                <Text style={[styles.closeButtonText, themedStyles.text(mode)]}>✕</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={[styles.buildingName, themedStyles.text(mode)]} accessibilityRole="header">
              {buildingInfo?.name || "Building"}
            </Text>
            <View style={[styles.buildingIdWithIconsContainer, { justifyContent: "center" }]}>
              <View style={styles.buildingIdContainer}>
                <Text style={[styles.buildingId, themedStyles.subtext(mode)]}>{buildingId}</Text>
              </View>
            </View>
          </View>

          <View style={styles.rightHeaderActions}>
            {showOpenIndoorButton && onOpenIndoorPress && (
              <TouchableOpacity
                onPress={onOpenIndoorPress}
                style={[styles.openIndoorHeaderButton, themedStyles.openIndoorHeaderButton(mode)]}
                accessibilityRole="button"
                accessibilityLabel="Open indoor map"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.openIndoorHeaderButtonText, themedStyles.openIndoorHeaderButtonText(mode)]}>Indoor Map↗</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onDirectionsPress}
              style={styles.directionsButton}
              accessibilityRole="button"
              accessibilityLabel={`Directions, ${directionsEtaLabel || "--"}`}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.directionsArrowCircle}>
                <MaterialIcons name="subdirectory-arrow-right" size={12} color={campusPink} />
              </View>
              <Text style={styles.directionsEtaText}>{directionsEtaLabel || "--"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onDirectionsPress}
              style={styles.directionsButton}
              accessibilityRole="button"
              accessibilityLabel={`Directions, ${directionsEtaLabel || "--"}`}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.directionsArrowCircle}>
                <MaterialIcons name="subdirectory-arrow-right" size={12} color={campusPink} />
              </View>
              <Text style={styles.directionsEtaText}>{directionsEtaLabel || "--"}</Text>
            </TouchableOpacity>

            {accessibilityIcons.length > 0 && (
              <View style={[styles.accessibilityIconsContainer, styles.rightAccessibilityRow]}>
                {accessibilityIcons.map(icon => (
                  <View key={icon.key} accessible={true} accessibilityLabel={icon.label}>
                    {renderAccessibilityIcon(icon, mode)}
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

export default memo(AdditionalInfoPopupHeader);
