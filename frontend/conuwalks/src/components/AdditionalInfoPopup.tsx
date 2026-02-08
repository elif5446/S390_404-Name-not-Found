import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Platform,
  useColorScheme,
  Dimensions,
  Clipboard,
  Alert,
  Animated,
  PanResponder,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { LoyolaBuildingMetadata } from "../data/metadata/LOY.BuildingMetadata";
import { SGWBuildingMetadata } from "../data/metadata/SGW.BuildingMetaData";
import { styles } from "../styles/additionalInfoPopup";
import { Ionicons } from "@expo/vector-icons";

interface AdditionInfoPopupProps {
  visible: boolean;
  buildingId: string;
  campus: "SGW" | "LOY";
  onClose: () => void;
}

const AdditionalInfoPopup: React.FC<AdditionInfoPopupProps> = ({
  visible,
  buildingId,
  campus,
  onClose,
}) => {
  const mode = useColorScheme() || "light";
  const [buildingInfo, setBuildingInfo] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Animation values
  const panY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const screenHeight = Dimensions.get("window").height;

  // Default height
  const MIN_HEIGHT = 300;
  const MAX_HEIGHT = screenHeight * 0.8;
  const [currentHeight, setCurrentHeight] = useState(MIN_HEIGHT);

  useEffect(() => {
    if (visible) {
      setCurrentHeight(MIN_HEIGHT);
      setIsExpanded(false);

      panY.setValue(0);
    }
  }, [visible]);

  // Fetch building info based on buildingId and campus
  useEffect(() => {
    if (buildingId) {
      const metadata =
        campus === "SGW"
          ? SGWBuildingMetadata[buildingId]
          : LoyolaBuildingMetadata[buildingId];
      console.log(`Looking for ${buildingId} in ${campus}:`, metadata);
      if (metadata) {
        setBuildingInfo(metadata);
      } else {
        // Fallback- Create a basic info object if metadata not found
        setBuildingInfo({ name: buildingId });
      }
    }
  }, [buildingId, campus]);

  const isIOS = Platform.OS === "ios";

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        // Don't adjust if scrolling in expanded view
        if (isExpanded && scrollViewRef.current) {
          return;
        }

        const sensitivity = 0.2;
        const newHeight = MIN_HEIGHT - gestureState.dy * sensitivity;
        const clampedHeight = Math.max(
          MIN_HEIGHT,
          Math.min(MAX_HEIGHT, newHeight),
        );
        setCurrentHeight(clampedHeight);

        setIsExpanded(clampedHeight > MIN_HEIGHT + 20);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isExpanded && Math.abs(gestureState.dy) < 10) {
          return;
        }

        let targetHeight = currentHeight;

        // If dragged up significantly, expand
        if (gestureState.dy < -50) {
          targetHeight = MAX_HEIGHT;
          setIsExpanded(true);
        }
        // If dragged down significantly from expanded, collapse
        else if (gestureState.dy > 50) {
          if (currentHeight > MIN_HEIGHT + 100) {
            targetHeight = MIN_HEIGHT;
            setIsExpanded(false);
          } else {
            onClose();
            return;
          }
        } else {
          const threshold = MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) * 0.3;
          if (currentHeight > threshold) {
            targetHeight = MAX_HEIGHT;
            setIsExpanded(true);
          } else {
            targetHeight = MIN_HEIGHT;
            setIsExpanded(false);
          }
        }

        // Update height immediately so the UI matches the user's gesture
        setCurrentHeight(targetHeight);
        setIsExpanded(targetHeight > MIN_HEIGHT + 20);
      },
    }),
  ).current;

  // Address copy functionality
  const copyAddressToClipboard = () => {
    if (buildingInfo?.address) {
      Clipboard.setString(buildingInfo.address);
      Alert.alert("Address copied to clipboard.");
    }
  };

  // Fetching accessibility info from metadata (facilities) and rendering in popup as icons (emojis for now)
  const getAccessibilityIcons = (facilities: any) => {
    if (!buildingInfo?.facilities) {
      return null;
    }

    const icons = [];

    // Check for elevator - Elevator icon
    if (
      facilities.some(
        (f: string) =>
          f.toLowerCase().includes("elevator") ||
          f.toLowerCase().includes("lift"),
      )
    ) {
      icons.push({ key: "elevator", icon: "🛗", label: "Elevator" });
    }

    // Check for accessible features - Wheelchair icon
    if (
      facilities.some(
        (f: string) =>
          f.toLowerCase().includes("accessible") ||
          f.toLowerCase().includes("accessibility") ||
          f.toLowerCase().includes("wheelchair"),
      )
    ) {
      icons.push({
        key: "wheelchair",
        icon: "♿",
        label: "Wheelchair accessible",
      });
    }

    // Check for direct metro access
    if (
      facilities.some(
        (f: string) =>
          f.toLowerCase().includes("metro") ||
          f.toLowerCase().includes("undergound passage"),
      )
    ) {
      icons.push({ key: "metro", icon: "🚇", label: "Metro access" });
    }

    return icons;
  };

  const renderOpeningHours = (openingHours: any) => {
    if (typeof openingHours === "string") {
      return (
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: mode === "dark" ? "#FFFFFF" : "#FF2D55" },
            ]}
          >
            Opening Hours
          </Text>
          <Text
            style={[
              styles.sectionText,
              { color: mode === "dark" ? "#CCCCCC" : "#333333" },
            ]}
          >
            {openingHours}
          </Text>
        </View>
      );
    } else if (openingHours && typeof openingHours === "object") {
      return (
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: mode === "dark" ? "#FFFFFF" : "#FF2D55" },
            ]}
          >
            Opening Hours
          </Text>
          <View style={styles.hoursContainer}>
            <View style={styles.hoursRow}>
              <Text
                style={[
                  styles.hoursLabel,
                  { color: mode === "dark" ? "#cccccc9b" : "#ff2d5398" },
                ]}
              >
                Weekdays:
              </Text>
              <Text
                style={[
                  styles.hoursValue,
                  { color: mode === "dark" ? "#FFFFFF" : "#333333" },
                ]}
              >
                {openingHours.weekdays}
              </Text>
            </View>
            <View style={styles.hoursRow}>
              <Text
                style={[
                  styles.hoursLabel,
                  { color: mode === "dark" ? "#cccccc9b" : "#ff2d5398" },
                ]}
              >
                Weekend:
              </Text>
              <Text
                style={[
                  styles.hoursValue,
                  { color: mode === "dark" ? "#FFFFFF" : "#333333" },
                ]}
              >
                {openingHours.weekend}
              </Text>
            </View>
          </View>
        </View>
      );
    }
    return null;
  };

  const accessibilityIcons = getAccessibilityIcons(buildingInfo?.facilities);

  // iOS styling
  if (isIOS) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.iosBackdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[styles.iosBlurContainer, { height: currentHeight }]}
          >
            <BlurView
              style={[styles.iosBlurContainer, { height: "100%" }]}
              intensity={80}
              tint={mode === "dark" ? "dark" : "light"}
            >
              <View style={styles.iosContentContainer}>
                {/* Handle bar */}
                <View
                  style={styles.handleBarContainer}
                  {...panResponder.panHandlers}
                >
                  <View style={styles.handleBar} />
                </View>
                {/* Header */}
                <View style={[styles.iosHeader]}>
                  {/* Close button */}
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View
                      style={[
                        styles.closeButtonCircle,
                        {
                          backgroundColor:
                            mode === "dark" ? "#00000031" : "#ff839c22",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.closeButtonText,
                          { color: mode === "dark" ? "#FFFFFF" : "#FF2D55" },
                        ]}
                      >
                        ✕
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {/* Center text container */}
                  <View style={styles.headerTextContainer}>
                    <Text
                      style={[
                        styles.buildingName,
                        {
                          color: mode === "dark" ? "#FFFFFF" : "#FF2D55",
                        },
                      ]}
                    >
                      {buildingInfo?.name || "Building"}
                    </Text>
                    {/* Building ID and icons */}
                    <View style={styles.buildingIdWithIconsContainer}>
                      {/* Building ID */}
                      <View style={styles.buildingIdContainer}>
                        <Text
                          style={[
                            styles.buildingId,
                            {
                              color:
                                mode === "dark" ? "#ffffff7d" : "#ff80979b",
                            },
                          ]}
                        >
                          {buildingId}
                        </Text>
                      </View>
                      {/* Accessibility icons - on the far right of this row */}
                      {accessibilityIcons && accessibilityIcons.length > 0 && (
                        <View style={styles.accessibilityIconsContainer}>
                          {accessibilityIcons.map((icon) => (
                            <View
                              key={icon.key}
                              style={styles.accessibilityIconWrapper}
                              accessible={true}
                              accessibilityLabel={icon.label}
                            >
                              <Text style={styles.accessibilityIcon}>
                                {icon.icon}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.rightSpacer} />
                </View>
                {/* Scrollable content area */}
                <ScrollView
                  ref={scrollViewRef}
                  style={[styles.contentArea, { flex: 1 }]}
                  scrollEnabled={isExpanded || currentHeight >= MAX_HEIGHT}
                  showsVerticalScrollIndicator={
                    isExpanded || currentHeight >= MAX_HEIGHT
                  }
                  bounces={isExpanded || currentHeight >= MAX_HEIGHT}
                  nestedScrollEnabled={true}
                  contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
                >
                  {/* Schedule section */}
                  <View style={styles.section}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: mode === "dark" ? "#FFFFFF" : "#FF2D55" },
                      ]}
                    >
                      Schedule
                    </Text>
                    {/* Schedule information will be here in future versions */}
                  </View>
                  {/* Opening hours section */}
                  {buildingInfo?.openingHours &&
                    renderOpeningHours(buildingInfo.openingHours)}
                  {/* Address section */}
                  {buildingInfo?.address && (
                    <View style={styles.section}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: mode === "dark" ? "#FFFFFF" : "#FF2D55" },
                        ]}
                      >
                        Address
                      </Text>
                      <View style={styles.addressContainer}>
                        <Ionicons
                          name="location-outline"
                          size={20}
                          color={mode === "dark" ? "#FFFFFF" : "#FF2D55"}
                          style={styles.addressIcon}
                        />
                        <Text
                          style={[
                            styles.addressText,
                            { color: mode === "dark" ? "#FFFFFF" : "#333333" },
                          ]}
                        >
                          {buildingInfo.address}
                        </Text>
                        <TouchableOpacity
                          onPress={copyAddressToClipboard}
                          style={styles.copyButton}
                        >
                          <Ionicons
                            name="copy-outline"
                            size={22}
                            color={mode === "dark" ? "#FFFFFF" : "#FF2D55"}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  {/* Description section */}
                  {buildingInfo?.description && (
                    <View style={styles.section}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: mode === "dark" ? "#FFFFFF" : "#FF2D55" },
                        ]}
                      >
                        Description
                      </Text>
                      <Text
                        style={[
                          styles.descriptionText,
                          { color: mode === "dark" ? "#CCCCCC" : "#000000" },
                        ]}
                      >
                        {buildingInfo.description}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </BlurView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  } else {
    // Android (Google Maps) styling
    return null;
  }
};

export default AdditionalInfoPopup;
