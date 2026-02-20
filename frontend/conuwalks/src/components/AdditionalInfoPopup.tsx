import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  AccessibilityActionEvent,
  Image,
  View,
  Text,
  TouchableOpacity,
  Platform,
  useColorScheme,
  Dimensions,
  Animated,
  PanResponder,
  ScrollView,
  BackHandler,
  AccessibilityInfo
} from "react-native";
import * as Clipboard from 'expo-clipboard';
import { SymbolView, SFSymbol } from 'expo-symbols'; // SF Symbols (iOS)
import MaterialIcons from '@expo/vector-icons/MaterialIcons'; // Material Design Icons (Android)
import { BlurView } from "expo-blur";
import { LoyolaBuildingMetadata } from "../data/metadata/LOY.BuildingMetadata";
import { SGWBuildingMetadata } from "../data/metadata/SGW.BuildingMetaData";
import { styles, themedStyles } from "../styles/additionalInfoPopup";

interface AdditionalInfoPopupProps {
  visible: boolean;
  buildingId: string;
  campus: "SGW" | "LOY";
  onClose: () => void;
  onDirectionsTrigger?: () => void;
  directionsEtaLabel?: string;
  onExpansionChange?: (isExpanded: boolean) => void;
}
export interface AdditionalInfoPopupHandle {
  collapse: () => void;
}

const BackgroundWrapper = ({ children }: { children: React.ReactNode }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme || "light";

  if (Platform.OS === "ios") {
    return (
      <BlurView
        style={[styles.iosBlurContainer, { height: "100%" }]}
        intensity={100}
        tint={theme === "dark" ? "dark" : "light"}
      >
        {children}
      </BlurView>
    );
  }
  return (
    <View
      style={[
        styles.iosBlurContainer,
        {
          height: "100%",
          backgroundColor: theme === "dark" ? "#1C1C1E" : "#FFFFFF",
          elevation: 8,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28
        },
      ]}
    >
      {children}
    </View>
  );
};

const AdditionalInfoPopup = forwardRef<
  AdditionalInfoPopupHandle,
  AdditionalInfoPopupProps
>(({ visible, buildingId, campus, onClose, onDirectionsTrigger, directionsEtaLabel, onExpansionChange }, ref) => {
  const campusPink = "#B03060";
  const mode = useColorScheme() || "light";
  const [buildingInfo, setBuildingInfo] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Default heights
  const screenHeight = Dimensions.get("window").height;
  const MIN_HEIGHT = Platform.OS === 'ios' ? 380 : 340; 
  const MAX_HEIGHT = screenHeight * (Platform.OS === 'ios' ? 0.92 : 0.9);

  // How far down the popup must sit so that only 300px is visible.
  const SNAP_OFFSET = MAX_HEIGHT - MIN_HEIGHT;

  // An animated value that controls vertical movement (is initially off screen)
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const translateYRef = useRef(screenHeight);
  const translateYAtGestureStart = useRef(screenHeight);
  const expandedStateRef = useRef(false);
  const scrollOffsetRef = useRef(0);
  //change building info animation
  const opacity = useRef(new Animated.Value(2)).current;

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, SNAP_OFFSET],
    outputRange: [0.5, 0], // Shadow Backdrop Opacity -- Expanded: 0.5; Collapsed: 0
    extrapolate: 'clamp',
  });

  const sheetSolidOpacity = translateY.interpolate({ // Liquid Glass Effect When Collapsed, Opaque When Pulled Up
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const reportExpandedState = (isExpanded: boolean) => {
    if (expandedStateRef.current === isExpanded) {
      return;
    }
    expandedStateRef.current = isExpanded;
    onExpansionChange?.(isExpanded);
  };
  
  useEffect(() => {
    if (!visible) return;
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buildingId, visible, opacity]);

  useEffect(() => {
    const id = translateY.addListener(({ value }) => {
      translateYRef.current = value;
    });
    return () => translateY.removeListener(id);
  }, [translateY]); //runs only on first render

  useEffect(() => {
    if (visible) {
      //controls the content in the popup
      scrollOffsetRef.current = 0;
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });

      translateY.setValue(screenHeight);
      translateYRef.current = screenHeight;

      // Start off-screen, spring up to collapsed position
      Animated.spring(translateY, {
        toValue: SNAP_OFFSET,
        useNativeDriver: true, // native driver works on translateY
        tension: 70,
        friction: 12,
      }).start(() => {
        translateYRef.current = SNAP_OFFSET;
        reportExpandedState(false);
      });
    } else {
      reportExpandedState(false);
    }
  }, [visible, translateY, screenHeight, SNAP_OFFSET, onExpansionChange]);

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
    reportExpandedState(toValue <= 1);
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
      overshootClamping: true,
    }).start(({ finished }) => {
      if (finished) {
        translateYRef.current = toValue;
        reportExpandedState(toValue <= 1);
        onDone?.();
      }
    });
  };

  const dismiss = (onDone?: () => void) => {
    reportExpandedState(false);
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 240,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onClose();
        onDone?.();
      }
    });
  };

  const handleDirectionsPress = () => {
    dismiss(() => {
      onDirectionsTrigger?.();
    });
  };

  const handleDragHandleAccessibilityAction = (event: AccessibilityActionEvent) => {
    const actionName = event.nativeEvent.actionName;
    if (actionName === "increment") {
      snapTo(0);
      return;
    }
    if (actionName === "decrement") {
      snapTo(SNAP_OFFSET);
    }
  };

  useEffect(() => {
    if (Platform.OS === "android") {
      const backAction = () => {
        if (visible) {
          dismiss();
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }
  }, [visible]);

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
        reportExpandedState(clamped <= 12);
      },

      onPanResponderRelease: (_, g) => {
        const currentY = translateYRef.current;
        const velocity = g.vy;

        if (velocity > 1.5 && currentY > SNAP_OFFSET - 60) {
          dismiss();
        } else if (velocity > 1.0) {
          snapTo(SNAP_OFFSET);
        } else if (velocity < -1.0) {
          snapTo(0);
        } else if (currentY > MAX_HEIGHT * 0.75) {
          dismiss();
        } else {
          const mid = SNAP_OFFSET * 0.5;
          snapTo(currentY < mid ? 0 : SNAP_OFFSET);
        }
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
        reportExpandedState(clamped <= 12);
      },

      onPanResponderRelease: (_, g) => {
        const currentY = translateYRef.current;
        const velocity = g.vy;

        if (velocity > 1.5 && currentY > SNAP_OFFSET - 60) {
          dismiss();
        } else if (velocity > 1.0) {
          snapTo(SNAP_OFFSET);
        } else if (velocity < -1.0) {
          snapTo(0);
        } else if (currentY > MAX_HEIGHT * 0.75) {
          dismiss();
        } else {
          const mid = SNAP_OFFSET * 0.5;
          snapTo(currentY < mid ? 0 : SNAP_OFFSET);
        }
      },
    }),
  ).current;

  const [copying, setCopying] = useState(false);

  // Address copy functionality
  const copyAddressToClipboard = async () => {
    if (buildingInfo?.address) {
      setCopying(true);
      await Clipboard.setStringAsync(buildingInfo.address);
      setTimeout(() => {
        AccessibilityInfo.announceForAccessibility("Address copied")
        setTimeout(() => {
          setCopying(false);
        }, 500);
      }, 500);
    }
  };

  // Fetching accessibility info from metadata (facilities) and rendering in popup as icons (emojis for now)
  const getAccessibilityIcons = (facilities: any) => {
    if (!facilities) return null;

    const icons: {
      key: string;
      sf: SFSymbol;
      material: "elevator" | "accessible" | "subway";
      label: string;
    }[] = [];

    // Check for direct metro access
    if (
      facilities.some(
        (f: string) =>
          f.toLowerCase().includes("metro") ||
          f.toLowerCase().includes("undergound passage"),
      )
    ) {
      icons.push({ key: "metro", sf: "tram.fill.tunnel", material: "subway", label: "Access to the Concordia Underground Passage and the Metro" });
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
        sf: "figure.roll",
        material: "accessible",
        label: "First Floor is Wheelchair Accessible",
      });
    }

    // Check for elevator - Elevator icon
    if (
      facilities.some(
        (f: string) =>
          f.toLowerCase().includes("elevator") ||
          f.toLowerCase().includes("lift"),
      )
    ) {
      icons.push({ key: "elevator", sf: "arrow.up.arrow.down.square", material: "elevator", label: "Elevators Are Available" });
    }

    return icons;
  };

  const renderOpeningHours = (openingHours: any) => {
    if (typeof openingHours === "string") {
      return (
        <View style={styles.section} accessible={true}>
          <Text
            style={[
              styles.sectionTitle,
              themedStyles.text(mode)
            ]}
            accessible={true}
            accessibilityRole="header"
          >
            Opening Hours
          </Text>
          <Text style={[styles.sectionText, themedStyles.text(mode)]}>
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
              themedStyles.text(mode),
            ]}
            accessible={true}
            accessibilityRole="header"
          >
            Opening Hours
          </Text>
          <View style={styles.hoursContainer}>
            <View style={styles.hoursRow} accessible={true}>
              <Text
                style={[
                  styles.hoursLabel,
                  themedStyles.subtext(mode),
                ]}
              >
                Weekdays:
              </Text>
              <Text style={[styles.hoursValue, themedStyles.text(mode)]}>
                {openingHours.weekdays}
              </Text>
            </View>
            <View style={styles.hoursRow} accessible={true}>
              <Text
                style={[
                  styles.hoursLabel,
                  themedStyles.subtext(mode),
                ]}
              >
                Weekend:
              </Text>
              <Text style={[styles.hoursValue, themedStyles.text(mode)]}>
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

  const Content = (
    <Animated.View
        style={[
        styles.iosBlurContainer,
        { height: MAX_HEIGHT, transform: [{ translateY: translateY }] },
        ]}
        importantForAccessibility="yes"
        focusable={true}
    >
        <BackgroundWrapper>
        <Animated.View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: mode === 'dark' ? '#1C1C1E' : '#FFFFFF', 
            opacity: sheetSolidOpacity 
          }} 
        />
        <Animated.View style={{ flex: 1, opacity }}>
        {/* panHandlers are ONLY here, so buttons below are never blocked */}
        <View
          style={styles.iosContentContainer}
          {...handlePanResponder.panHandlers}
        >
            {/* Handle bar */}
          <TouchableOpacity
            style={styles.handleBarContainer}
            onPress={() => snapTo(expandedStateRef.current ? SNAP_OFFSET : 0)}
            activeOpacity={1}
            accessible={true}
            focusable={true}
            accessibilityLabel="Drag handle"
            accessibilityHint="Swipe up with one finger to expand, or swipe down to collapse"
            accessibilityRole="adjustable"
            accessibilityActions={[
              { name: "increment", label: "Expand" },
              { name: "decrement", label: "Collapse" },
            ]}
            onAccessibilityAction={handleDragHandleAccessibilityAction}
          >
            <View style={styles.handleBar} />
            </TouchableOpacity>
            {/* Header */}
            <View style={styles.iosHeader}>
            {/* Close button */}
            <TouchableOpacity
              onPress={() => dismiss()}
                style={[styles.closeButton, Platform.OS === 'android' && { width: 'auto', padding: 4 }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessible={true}
                accessibilityLabel="Close"
                accessibilityRole="button"
            >
              {Platform.OS === "android" ? (
                  <MaterialIcons name="close" size={24} color={themedStyles.text(mode).color} />
                ) : (
                <View
                style={[
                    styles.closeButtonCircle,
                    themedStyles.closeButton(mode),
                ]}
                >
                <Text
                    style={[
                    styles.closeButtonText,
                    themedStyles.text(mode),
                    ]}
                >
                    ✕
                </Text>
                </View>
                )}
            </TouchableOpacity>
            {/* Center text container */}
            <View style={styles.headerTextContainer}>
                <Text
                style={[
                    styles.buildingName,
                    themedStyles.text(mode)
                ]}
                accessible={true}
                accessibilityLabel={`Name: ${buildingInfo?.name}`}
                accessibilityRole="header"
                >
                {buildingInfo?.name || "Building"}
                </Text>
                {/* Building ID and icons */}
                <View style={[styles.buildingIdWithIconsContainer, { justifyContent: 'center', position: 'relative' }]}>
                {/* Building ID */}
                <View style={styles.buildingIdContainer}>
                    <Text
                    style={[
                        styles.buildingId,
                        themedStyles.subtext(mode),
                    ]}
                    accessible={true}
                    accessibilityLabel={`Name Abbreviation: ${buildingId}`}
                    >
                    {buildingId}
                    </Text>
                </View>
                </View>
            </View>
            <View style={styles.rightHeaderActions}>
              <TouchableOpacity
                onPress={handleDirectionsPress}
                style={styles.directionsButton}
                accessibilityRole="button"
                accessibilityLabel={`Directions, ${directionsEtaLabel || "--"}`}
                accessibilityHint="Opens directions panel"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.directionsArrowCircle}>
                  <MaterialIcons name="subdirectory-arrow-right" size={12} color={campusPink} />
                </View>
                <Text style={styles.directionsEtaText}>
                  {directionsEtaLabel || "--"}
                </Text>
              </TouchableOpacity>

              {accessibilityIcons && accessibilityIcons.length > 0 && (
                <View style={[styles.accessibilityIconsContainer, styles.rightAccessibilityRow]}>
                  {accessibilityIcons.map((icon) => (
                    <View
                      key={icon.key}
                      accessible={true}
                      accessibilityLabel={icon.label}
                      accessibilityRole="image"
                    >
                      {icon.key !== "metro" && (Platform.OS === "ios" ? <SymbolView 
                          name={icon.sf}
                          accessible={true}
                          accessibilityLabel={icon.label}
                          size={25}
                          weight={"heavy"}
                          tintColor={themedStyles.subtext(mode).color}
                        /> : <MaterialIcons name={icon.material} size={25} color={themedStyles.subtext(mode).color}/>)
                        || <Image source={require(`../../assets/images/metro.png`)}
                          style={{width: 25,
                          height: 25,
                          tintColor: themedStyles.subtext(mode).color}}
                          accessibilityLabel={icon.label}
                        />}
                    </View>
                  ))}
                </View>
              )}
            </View>
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
                    themedStyles.text(mode),
                ]}
                accessible={true}
                accessibilityRole="header"
                >
                Schedule
                </Text>
                <View
                  style={{
                    marginTop: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: mode === "dark" ? "#CCCCCC" : "#585858" }}>
                    Next class • 5 min walk
                  </Text>
                  <TouchableOpacity
                    onPress={handleDirectionsPress}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderRadius: 999,
                      backgroundColor: campusPink,
                      paddingVertical: 4,
                      paddingHorizontal: 7,
                      gap: 5,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Directions, ${directionsEtaLabel || "--"}`}
                    accessibilityHint="Opens directions panel"
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: "#FFFFFF",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialIcons name="subdirectory-arrow-right" size={12} color={campusPink} />
                    </View>
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontWeight: "700",
                        fontSize: 12,
                        lineHeight: 14,
                      }}
                    >
                      {directionsEtaLabel || "--"}
                    </Text>
                  </TouchableOpacity>
                </View>
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
                    themedStyles.text(mode),
                    ]}
                    accessible={true}
                    accessibilityRole="header"
                >
                    Address
                </Text>
                <View style={styles.addressContainer}>
                    <Text
                    style={[
                        styles.addressText,
                        themedStyles.text(mode),
                    ]}
                    accessible={true}
                    >
                    {buildingInfo.address}
                    </Text>
                    <TouchableOpacity
                    onPress={copyAddressToClipboard}
                    style={styles.copyButton}
                    accessible={true}
                    accessibilityLabel={copying ? "Address copied" : "Copy address"}
                    accessibilityRole="button"
                    >
                    {Platform.OS === "ios" && <SymbolView 
                        name={copying ? "document.on.document.fill" : "document.on.document"}
                        size={25}
                        weight={"regular"}
                        tintColor={mode === "dark" ? "#FFFFFF" : "#333333"} 
                        /> || <MaterialIcons
                        name={copying ? "task" : "content-copy"}
                        size={22}
                        color={mode === "dark" ? "#FFFFFF" : "#333333"}
                        />}
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
                    themedStyles.text(mode),
                    ]}
                    accessible={true}
                    accessibilityRole="header"
                >
                    Description
                </Text>
                <Text
                    style={[
                    styles.descriptionText,
                    themedStyles.mutedText(mode),
                    ]}
                    accessible={true}
                >
                    {buildingInfo.description}
                </Text>
                </View>
            )}
            </ScrollView>
        </View>
        </Animated.View>
        </BackgroundWrapper>
    </Animated.View>
  );

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: screenHeight,
        zIndex: 999,
        justifyContent: 'flex-end'
      }}
      pointerEvents="box-none"
      accessibilityViewIsModal={visible}
    >
      <Animated.View 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'black',
          opacity: backdropOpacity 
        }} 
        pointerEvents="none"
      />
        {Content}
    </View>
  );
});

AdditionalInfoPopup.displayName = "AdditionalInfoPopup";

export default AdditionalInfoPopup;