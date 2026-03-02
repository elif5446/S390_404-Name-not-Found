import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { BuildingMetadata, OpeningHours } from "../types/Building";
import { BuildingEvent } from "../hooks/useBuildingEvents";
import ScheduleSection from "./ScheduleSection";
import { styles, themedStyles } from "@/src/styles/additionalInfoPopup";
import PlatformIcon from "./ui/PlatformIcon";

interface AdditionalInfoPopupContentProps {
  mode: "light" | "dark";
  buildingInfo: BuildingMetadata | null;
  directionsEtaLabel?: string;
  isCopying: boolean;
  onDirectionsPress: () => void;
  onCopyAddress: () => void;
  scrollViewRef: React.RefObject<ScrollView | null>;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  todayEvents?: BuildingEvent[];
  nextEvent?: BuildingEvent | null;
  eventsLoading?: boolean;
}

const AdditionalInfoPopupContent: React.FC<AdditionalInfoPopupContentProps> = ({
  mode,
  buildingInfo,
  directionsEtaLabel,
  isCopying,
  onDirectionsPress,
  onCopyAddress,
  scrollViewRef,
  onScroll,
  todayEvents = [],
  nextEvent,
  eventsLoading,
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
      style={[styles.contentArea, { flex: 1 }]}
      scrollEnabled={true}
      showsVerticalScrollIndicator={true}
      bounces={true}
      nestedScrollEnabled={true}
      onScroll={onScroll}
      contentContainerStyle={styles.scrollContent}
      scrollEventThrottle={16}
    >
      <ScheduleSection
        eventsLoading={!!eventsLoading}
        todayEvents={todayEvents}
        nextEvent={nextEvent || null}
        campusPink={campusPink}
        directionsEtaLabel={directionsEtaLabel}
        onDirectionsPress={onDirectionsPress}
        mode={mode}
      />

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
              accessible={true}
              accessibilityLabel={isCopying ? "Address copied" : "Copy address"}
              accessibilityRole="button"
            >
              <PlatformIcon
                materialName={isCopying ? "task" : "content-copy"}
                iosName={
                  isCopying
                    ? "document.on.document.fill"
                    : "document.on.document"
                }
                size={24}
                color={mode === "dark" ? "#FFFFFF" : "#333333"}
                weight="regular"
              />
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

export default memo(AdditionalInfoPopupContent);
