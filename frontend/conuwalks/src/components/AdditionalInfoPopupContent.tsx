import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView } from "expo-symbols";
import { styles, themedStyles } from "@/src/styles/additionalInfoPopup";
import { BuildingMetadata, OpeningHours } from "../types/Building";

interface PopupContentProps {
  mode: "light" | "dark";
  buildingInfo: BuildingMetadata | null;
  directionsEtaLabel?: string;
  isCopying: boolean;
  onDirectionsPress: () => void;
  onCopyAddress: () => void;
  scrollViewRef: React.RefObject<ScrollView | null>;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const PopupContent: React.FC<PopupContentProps> = ({
  mode,
  buildingInfo,
  directionsEtaLabel,
  isCopying,
  onDirectionsPress,
  onCopyAddress,
  scrollViewRef,
  onScroll,
}) => {
  const campusPink = "#B03060";

  const renderOpeningHours = (hours: string | OpeningHours) => {
    if (typeof hours === "string") {
      return (
        <View style={styles.section} accessible={true}>
          <Text
            style={[styles.sectionTitle, themedStyles.text(mode)]}
            accessibilityRole="header"
          >
            Opening Hours
          </Text>
          <Text style={[styles.sectionText, themedStyles.text(mode)]}>
            {hours}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, themedStyles.text(mode)]}
          accessibilityRole="header"
        >
          Opening Hours
        </Text>
        <View style={styles.hoursContainer}>
          <View style={styles.hoursRow} accessible={true}>
            <Text style={[styles.hoursLabel, themedStyles.subtext(mode)]}>
              Weekdays:
            </Text>
            <Text style={[styles.hoursValue, themedStyles.text(mode)]}>
              {hours.weekdays}
            </Text>
          </View>
          <View style={styles.hoursRow} accessible={true}>
            <Text style={[styles.hoursLabel, themedStyles.subtext(mode)]}>
              Weekend:
            </Text>
            <Text style={[styles.hoursValue, themedStyles.text(mode)]}>
              {hours.weekend}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.contentArea, localStyles.scrollFlex]}
      scrollEnabled={true}
      showsVerticalScrollIndicator={true}
      bounces={true}
      nestedScrollEnabled={true}
      onScroll={onScroll}
      contentContainerStyle={localStyles.scrollContent}
      scrollEventThrottle={16}
    >
      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, themedStyles.text(mode)]}
          accessibilityRole="header"
        >
          Schedule
        </Text>
        <View style={localStyles.scheduleRow}>
          <Text style={{ color: mode === "dark" ? "#CCCCCC" : "#585858" }}>
            Next class • 5 min walk
          </Text>
          <TouchableOpacity
            onPress={onDirectionsPress}
            style={[
              localStyles.directionsButton,
              { backgroundColor: campusPink },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Directions, ${directionsEtaLabel || "--"}`}
          >
            <View style={localStyles.directionsIconCircle}>
              <MaterialIcons
                name="subdirectory-arrow-right"
                size={12}
                color={campusPink}
              />
            </View>
            <Text style={localStyles.directionsText}>
              {directionsEtaLabel || "--"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {buildingInfo?.openingHours &&
        renderOpeningHours(buildingInfo.openingHours)}

      {buildingInfo?.address && (
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, themedStyles.text(mode)]}
            accessibilityRole="header"
          >
            Address
          </Text>
          <View style={styles.addressContainer}>
            <Text
              style={[styles.addressText, themedStyles.text(mode)]}
              accessible={true}
            >
              {buildingInfo.address}
            </Text>
            <TouchableOpacity
              onPress={onCopyAddress}
              style={styles.copyButton}
              accessibilityRole="button"
            >
              {Platform.OS === "ios" ? (
                <SymbolView
                  name={
                    isCopying
                      ? "document.on.document.fill"
                      : "document.on.document"
                  }
                  size={25}
                  tintColor={mode === "dark" ? "#FFFFFF" : "#333333"}
                />
              ) : (
                <MaterialIcons
                  name={isCopying ? "task" : "content-copy"}
                  size={22}
                  color={mode === "dark" ? "#FFFFFF" : "#333333"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {buildingInfo?.description && (
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, themedStyles.text(mode)]}
            accessibilityRole="header"
          >
            Description
          </Text>
          <Text
            style={[styles.descriptionText, themedStyles.mutedText(mode)]}
            accessible={true}
          >
            {buildingInfo.description}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

// Extracted styles from inline objects to prevent re-allocation
const localStyles = StyleSheet.create({
  scrollFlex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  scheduleRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 7,
    gap: 5,
  },
  directionsIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  directionsText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 14,
  },
});

export default memo(PopupContent);
