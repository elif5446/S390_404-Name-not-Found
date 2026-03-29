import React, { useState, memo } from "react";
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, Platform, AccessibilityActionEvent, LayoutChangeEvent } from "react-native";

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
  const iconSize = 25;

  if (icon.key === "metro") {
    return <MetroIcon width={iconSize} height={iconSize} color={iconColor} />;
  }

  if (Platform.OS === "ios") {
    return <SymbolView name={icon.sf} size={iconSize} weight="heavy" tintColor={iconColor} />;
  }

  return <PlatformIcon materialName={icon.material} iosName={icon.sf} size={iconSize} color={iconColor} weight="heavy" />;
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
  const isDark = mode === "dark";

  const [sidePadding, setSidePadding] = useState(80);
  const adjustTitleWidth = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setSidePadding(width + 1);
    handleRightHeight(event);
  };

  const [leftHeight, setLeftHeight] = useState(10);
  const handleLeftHeight = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setLeftHeight(height);
  }
  const [centerHeight, setCenterHeight] = useState(10);
  const handleCenterHeight = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setCenterHeight(height);
  }
  const [rightHeight, setRightHeight] = useState(10);
  const handleRightHeight = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setRightHeight(height);
  }

  return (
    <>
      <BottomSheetDragHandle isDark={isDark} onToggleHeight={onToggleHeight} onAccessibilityAction={onDragHandleAccessibilityAction} />

      <TouchableWithoutFeedback onPress={onToggleHeight}>
        <View style={[styles.iosHeader, {height: Math.max(leftHeight, centerHeight, rightHeight)}]}>
          <View style={styles.leftHeaderActions} onLayout={handleLeftHeight}>
            <TouchableOpacity
              onPress={() => {onDismiss()}}
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

            {showOpenIndoorButton && onOpenIndoorPress && (
              <TouchableOpacity
                onPress={onOpenIndoorPress}
                style={[styles.openIndoorHeaderButton, themedStyles.openIndoorHeaderButton(mode)]}
                accessibilityRole="button"
                accessibilityLabel="Open indoor map"
              >
                <PlatformIcon materialName="map" iosName="map" size={25} color="black"/>
                <Text style={[styles.openIndoorHeaderButtonText, themedStyles.openIndoorHeaderButtonText(mode)]}>Indoor</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.headerTextContainer, {paddingHorizontal:sidePadding}]} onLayout={handleCenterHeight}>
            <Text style={[styles.buildingName, themedStyles.text(mode)]} accessibilityRole="header">
              {buildingInfo?.name || "Building"}
            </Text>
            <View style={[styles.buildingIdWithIconsContainer, { justifyContent: "center" }]}>
              <View style={styles.buildingIdContainer}>
                <Text style={[styles.buildingId, themedStyles.subtext(mode)]}>{buildingId}</Text>
              </View>
            </View>
          </View>

          <View style={styles.rightHeaderActions} onLayout={adjustTitleWidth}>
            <TouchableOpacity
              onPress={onDirectionsPress}
              style={styles.directionsButton}
              accessibilityRole="button"
              accessibilityLabel={`Directions, ${directionsEtaLabel || "--"}`}
            >
              <View style={styles.directionsArrowCircle}>
                <PlatformIcon materialName="directions" iosName="arrow.trianglehead.turn.up.right.circle.fill" size={33} color="#FFFFFF" />
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
