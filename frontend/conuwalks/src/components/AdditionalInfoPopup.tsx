import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  useColorScheme,
  Dimensions,
  Alert,
  Animated,
  PanResponder,
  ScrollView,
} from "react-native";
import { setStringAsync } from "expo-clipboard";
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
export interface AdditionalInfoPopupHandle{
  collapse: () =>void;
}

const AdditionalInfoPopup = forwardRef<AdditionalInfoPopupHandle, AdditionInfoPopupProps>(({
  visible,
  buildingId,
  campus,
  onClose,
}, ref) => {
  const mode = useColorScheme() || "light";
  const [buildingInfo, setBuildingInfo] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Default heights
  const screenHeight = Dimensions.get("window").height;
  const MIN_HEIGHT = 300; //initial popup view
  const MAX_HEIGHT = screenHeight * 0.8; //full popup will be around 80% of the screen

  // How far down the popup must sit so that only 300px is visible.
  const SNAP_OFFSET = MAX_HEIGHT - MIN_HEIGHT;

  // An animated value that controls vertical movement (is initially off screen)
  const translateY = useRef(new Animated.Value(MAX_HEIGHT)).current;

  const translateYRef = useRef(MAX_HEIGHT);
  const translateYAtGestureStart = useRef(MAX_HEIGHT);
  const scrollOffsetRef = useRef(0);

  useEffect(() => {
    const id = translateY.addListener(({ value }) => {
      translateYRef.current = value;
    });
    return () => translateY.removeListener(id);
  }, []); //runs only on first render

  useEffect(() => {
    if (visible) {
      //controls the content in the popup
      scrollOffsetRef.current = 0;
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });

      translateY.setValue(MAX_HEIGHT);
      translateYRef.current = MAX_HEIGHT;

      // Start off-screen, spring up to collapsed position
      Animated.spring(translateY, {
        toValue: SNAP_OFFSET,
        useNativeDriver: true, // native driver works on translateY
        tension: 70,
        friction: 12,
      }).start(() => {
        translateYRef.current = SNAP_OFFSET;
      });
    }
  }, [visible]);

  // Fetch building info based on buildingId and campus
  useEffect(() => {
    if (buildingId) {
      const metadata =
        campus === "SGW"
          ? SGWBuildingMetadata[buildingId]
          : LoyolaBuildingMetadata[buildingId];
      if (metadata) {
        setBuildingInfo(metadata);
      } else {
        // Fallback- Create a basic info object if metadata not found
        setBuildingInfo({ name: buildingId });
      }
    }
  }, [buildingId, campus]);

  useImperativeHandle(ref, () => ({
    collapse: () => snapTo(SNAP_OFFSET),
  }));

  //this will allow us to smoothly move the popup up and down
  const snapTo = (toValue: number, onDone?: () => void) => {
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
      overshootClamping: true,
    }).start(({ finished }) => {
      if (finished) {
        translateYRef.current = toValue;
        onDone?.();
      }
    });
  };

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: MAX_HEIGHT,
      duration: 240,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  const isIOS = Platform.OS === "ios";

  // PanResponder for the DRAG HANDLE ONLY — does not intercept button taps
  const handlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false, // ← don't capture, just respond

      onMoveShouldSetPanResponder: (_, g) => {
        return Math.abs(g.dy) > Math.abs(g.dx) * 1.2;
      },
      onMoveShouldSetPanResponderCapture: (_, g) => {
        return Math.abs(g.dy) > 5;
      },

      onPanResponderGrant: () => {
        translateY.stopAnimation((value) => {
          translateYAtGestureStart.current = value;
          translateYRef.current = value;
        });
        translateYAtGestureStart.current = translateYRef.current;
      },

      onPanResponderMove: (_, g) => {
        const newY = translateYAtGestureStart.current + g.dy;
        const clamped = Math.max(0, Math.min(MAX_HEIGHT * 0.92, newY));
        translateY.setValue(clamped);
      },

      onPanResponderRelease: (_, g) => {
        const currentY = translateYRef.current;
        const velocity = g.vy;

        if (velocity > 1.5 && currentY > SNAP_OFFSET - 60) {
          dismiss();
          return;
        }
        if (velocity > 1.0) {
          snapTo(SNAP_OFFSET);
          return;
        }
        if (velocity < -1.0) {
          snapTo(0);
          return;
        }
        if (currentY > MAX_HEIGHT * 0.75) {
          dismiss();
          return;
        }
        const mid = SNAP_OFFSET * 0.5;
        snapTo(currentY < mid ? 0 : SNAP_OFFSET);
      },
    }),
  ).current;

  // PanResponder for the SCROLL AREA — only collapses when scrolled to top and dragging down
  const scrollAreaPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      onMoveShouldSetPanResponder: (_, g) => {
        const isVertical = Math.abs(g.dy) > Math.abs(g.dx) * 1.2;
        if (!isVertical) return false;

        const isExpanded = translateYRef.current < SNAP_OFFSET - 20;

        // Collapsed: intercept all downward drags
        if (!isExpanded) return g.dy > 0;

        // Expanded + dragging up: let ScrollView scroll
        if (g.dy < 0) return false;

        // Expanded + dragging down + at top: collapse the sheet
        return scrollOffsetRef.current <= 0;
      },

      onMoveShouldSetPanResponderCapture: () => false, // ← never capture, so taps always reach children

      onPanResponderGrant: () => {
        translateY.stopAnimation((value) => {
          translateYAtGestureStart.current = value;
          translateYRef.current = value;
        });
        translateYAtGestureStart.current = translateYRef.current;
      },

      onPanResponderMove: (_, g) => {
        const newY = translateYAtGestureStart.current + g.dy;
        const clamped = Math.max(0, Math.min(MAX_HEIGHT * 0.92, newY));
        translateY.setValue(clamped);
      },

      onPanResponderRelease: (_, g) => {
        const currentY = translateYRef.current;
        const velocity = g.vy;

        if (velocity > 1.5 && currentY > SNAP_OFFSET - 60) {
          dismiss();
          return;
        }
        if (velocity > 1.0) {
          snapTo(SNAP_OFFSET);
          return;
        }
        if (velocity < -1.0) {
          snapTo(0);
          return;
        }
        if (currentY > MAX_HEIGHT * 0.75) {
          dismiss();
          return;
        }
        const mid = SNAP_OFFSET * 0.5;
        snapTo(currentY < mid ? 0 : SNAP_OFFSET);
      },
    }),
  ).current;

  // Address copy functionality
  const copyAddressToClipboard = async () => {
    if (buildingInfo?.address) {
      await setStringAsync(buildingInfo.address);
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
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: MAX_HEIGHT,
          zIndex: 999,
        }}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.iosBlurContainer,
            { height: MAX_HEIGHT, transform: [{ translateY: translateY }] },
          ]}
        >
          <BlurView
            style={[styles.iosBlurContainer, { height: "100%" }]}
            intensity={80}
            tint={mode === "dark" ? "dark" : "light"}
          >
            {/* panHandlers are ONLY here, so buttons below are never blocked */}
            <View
              style={styles.iosContentContainer}
              {...handlePanResponder.panHandlers}
            >
              {/* Handle bar */}
              <View style={styles.handleBarContainer}>
                <View style={styles.handleBar} />
              </View>
              {/* Header */}
              <View style={[styles.iosHeader]}>
                {/* Close button */}
                <TouchableOpacity
                  onPress={dismiss}
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
                            color: mode === "dark" ? "#ffffff7d" : "#ff80979b",
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
            </View>

            {/* Scrollable content area (separate from drag zone)*/}
            <View style={{ flex: 1 }} {...scrollAreaPanResponder.panHandlers}>
              <ScrollView
                ref={scrollViewRef}
                style={[styles.contentArea, { flex: 1 }]}
                scrollEnabled={true}
                showsVerticalScrollIndicator={true}
                bounces={true}
                nestedScrollEnabled={true}
                onScroll={(e) => {
                  scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
                }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
                scrollEventThrottle={16}
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
      </View>
    );
  } else {
    // Android (Google Maps) styling
    return null;
  }
});

export default AdditionalInfoPopup;
