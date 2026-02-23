import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  useColorScheme,
  Dimensions,
  Animated,
  PanResponder,
  ScrollView,
  ActivityIndicator,
  BackHandler,
  AccessibilityInfo,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { SymbolView, SFSymbol } from "expo-symbols";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";

import { LoyolaBuildingMetadata } from "../data/metadata/LOY.BuildingMetadata";
import { SGWBuildingMetadata } from "../data/metadata/SGW.BuildingMetaData";
import { styles, themedStyles } from "../styles/additionalInfoPopup";
import {
  useBuildingEvents,
  BuildingEvent,
} from "@/src/hooks/useBuildingEvents";
import { MetroIcon } from "./MetroIcon";

interface AdditionalInfoPopupProps {
  visible: boolean;
  buildingId: string;
  campus: "SGW" | "LOY";
  onClose: () => void;
}
export interface AdditionalInfoPopupHandle {
  collapse: () => void;
}

export interface OpeningHours {
  weekdays: string;
  weekend: string;
}

export interface BuildingMetadata {
  name: string;
  address?: string;
  description?: string;
  openingHours?: string | OpeningHours;
  facilities?: string[];
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
          borderTopRightRadius: 28,
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
>(({ visible, buildingId, campus, onClose }, ref) => {
  const mode = useColorScheme() || "light";
  const [buildingInfo, setBuildingInfo] = useState<BuildingMetadata | null>(
    null,
  );
  const [copying, setCopying] = useState(false);

  // Calendar hook
  const {
    todayEvents,
    nextEvent,
    loading: eventsLoading,
  } = useBuildingEvents(buildingId, campus);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Animation values
  const scrollViewRef = useRef<ScrollView>(null);
  const screenHeight = Dimensions.get("window").height;
  const MIN_HEIGHT = 300;
  const MAX_HEIGHT = screenHeight * 0.8;
  const SNAP_OFFSET = MAX_HEIGHT - MIN_HEIGHT;

  // An animated value that controls vertical movement (is initially off screen)
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const translateYRef = useRef(screenHeight);
  const translateYAtGestureStart = useRef(screenHeight);
  const scrollOffsetRef = useRef(0);
  //change building info animation
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = translateY.addListener(({ value }) => {
      translateYRef.current = value;
    });
    return () => translateY.removeListener(id);
  }, [translateY]);

  useEffect(() => {
    if (visible) {
      //controls the content in the popup
      scrollOffsetRef.current = 0;
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });

      Animated.spring(translateY, {
        toValue: SNAP_OFFSET,
        useNativeDriver: true, // native driver works on translateY
        tension: 70,
        friction: 12,
      }).start(() => {
        translateYRef.current = SNAP_OFFSET;
      });
    } else {
      // on false dismiss
      Animated.timing(translateY, {
        toValue: MAX_HEIGHT,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        translateYRef.current = MAX_HEIGHT;
      });
    }
  }, [visible, translateY, MAX_HEIGHT, SNAP_OFFSET]);

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, SNAP_OFFSET],
    outputRange: [0.5, 0],
    extrapolate: "clamp",
  });

  const sheetSolidOpacity = translateY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  useEffect(() => {
    if (!visible) return;
    const animation = Animated.sequence([
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
    ]);

    animation.start();
    return () => {
      animation.stop(); // prevents memleaks if the component unmounts mid-animation
    };
  }, [buildingId, visible, opacity]);

  // Fetch building info based on buildingId and campus
  useEffect(() => {
    if (buildingId) {
      const metadata =
        campus === "SGW"
          ? SGWBuildingMetadata[buildingId]
          : LoyolaBuildingMetadata[buildingId];
      setBuildingInfo(metadata || { name: buildingId });
    }
  }, [buildingId, campus]);

  //this will allow us to smoothly move the popup up and down
  const snapTo = useCallback(
    (toValue: number, onDone?: () => void) => {
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
    },
    [translateY],
  );

  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 240,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onCloseRef.current(); // Use ref to avoid stale closures
    });
  }, [translateY, screenHeight]);

  useImperativeHandle(ref, () => ({
    collapse: () => snapTo(SNAP_OFFSET),
  }));

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
        backAction,
      );

      return () => backHandler.remove();
    }
  }, [dismiss, visible]);

  // PanResponder for the DRAG HANDLE ONLY — does not intercept button taps
  const handlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false, // don't capture, just respond
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > Math.abs(g.dx) * 1.2,
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dy) > 5,

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

      onMoveShouldSetPanResponderCapture: () => false, // never capture, so taps always reach children

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

  // Address copy functionality
  const copyAddressToClipboard = useCallback(async () => {
    if (buildingInfo?.address) {
      setCopying(true);
      await Clipboard.setStringAsync(buildingInfo.address);
      setTimeout(() => {
        AccessibilityInfo.announceForAccessibility("Address copied");
        setTimeout(() => {
          setCopying(false);
        }, 500);
      }, 500);
    }
  }, [buildingInfo?.address]);

  const getAccessibilityIcons = useCallback((facilities?: string[]) => {
    if (!facilities) return null;

    const icons: {
      key: string;
      sf: SFSymbol;
      material: "elevator" | "accessible" | "subway";
      label: string;
    }[] = [];

    if (
      facilities.some(
        (f: string) =>
          f.toLowerCase().includes("metro") ||
          f.toLowerCase().includes("underground passage"),
      )
    ) {
      icons.push({
        key: "metro",
        sf: "tram.fill.tunnel",
        material: "subway",
        label: "Access to the Concordia Underground Passage and the Metro",
      });
    }

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

    if (
      facilities.some(
        (f: string) =>
          f.toLowerCase().includes("elevator") ||
          f.toLowerCase().includes("lift"),
      )
    ) {
      icons.push({
        key: "elevator",
        sf: "arrow.up.arrow.down.square",
        material: "elevator",
        label: "Elevators Are Available",
      });
    }

    return icons;
  }, []);

  const renderOpeningHours = useCallback(
    (openingHours?: string | OpeningHours) => {
      if (typeof openingHours === "string") {
        return (
          <View style={styles.section} accessible={true}>
            <Text
              style={[styles.sectionTitle, themedStyles.text(mode)]}
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
              style={[styles.sectionTitle, themedStyles.text(mode)]}
              accessible={true}
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
                  {openingHours.weekdays}
                </Text>
              </View>
              <View style={styles.hoursRow} accessible={true}>
                <Text style={[styles.hoursLabel, themedStyles.subtext(mode)]}>
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
    },
    [mode],
  );

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
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: mode === "dark" ? "#1C1C1E" : "#FFFFFF",
            opacity: sheetSolidOpacity,
          }}
        />
        <Animated.View style={{ flex: 1, opacity }}>
          {/* panHandlers are ONLY here, so buttons below are never blocked */}
          <View
            style={styles.iosContentContainer}
            {...handlePanResponder.panHandlers}
          >
            {/* Handle bar */}
            <View
              style={styles.handleBarContainer}
              accessible={true}
              accessibilityLabel="Drag handle"
              accessibilityHint="Swipe up to expand building details or down to collapse"
              accessibilityRole="adjustable"
            >
              <View style={styles.handleBar} />
            </View>
            {/* Header */}
            <View
              style={[
                styles.iosHeader,
                { justifyContent: "center", paddingHorizontal: 0 },
              ]}
            >
              {/* Close button */}
              <TouchableOpacity
                onPress={dismiss}
                style={[
                  styles.closeButton,
                  Platform.OS === "android" && { width: "auto", padding: 4 },
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessible={true}
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
                    <Text
                      style={[styles.closeButtonText, themedStyles.text(mode)]}
                    >
                      ✕
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Center text container */}
              <View style={styles.headerTextContainer}>
                <Text style={[styles.buildingName, themedStyles.text(mode)]}>
                  {buildingInfo?.name || "Building"}
                </Text>

                {/* Building ID and icons */}
                <View style={styles.buildingIdWithIconsContainer}>
                  <View style={styles.buildingIdContainer}>
                    <Text
                      style={[styles.buildingId, themedStyles.subtext(mode)]}
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
                              weight={"heavy"}
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
              {/* Schedule section with calendar events */}
              <View style={styles.section}>
                <View style={styles.scheduleHeader}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: mode === "dark" ? "#FFFFFF" : "#333333" },
                    ]}
                  >
                    Schedule
                  </Text>
                  {eventsLoading && (
                    <ActivityIndicator size="small" color="#666666" />
                  )}
                </View>

                {!eventsLoading && todayEvents.length === 0 ? (
                  <View style={styles.noEventsContainer}>
                    <Text
                      style={[
                        styles.noEventsText,
                        { color: mode === "dark" ? "#999999" : "#666666" },
                      ]}
                    >
                      No classes scheduled in this building today
                    </Text>
                    {nextEvent && (
                      <>
                        <Text
                          style={[
                            styles.nextEventLabel,
                            {
                              color: mode === "dark" ? "#CCCCCC" : "#585858",
                              marginTop: 12,
                            },
                          ]}
                        >
                          Next class in this building:
                        </Text>
                        <View style={styles.eventItem}>
                          <Text
                            style={[
                              styles.eventTitle,
                              {
                                color: mode === "dark" ? "#FFFFFF" : "#333333",
                              },
                            ]}
                          >
                            {nextEvent.courseName}
                          </Text>
                          <View style={styles.eventDetailsRow}>
                            <Text
                              style={[
                                styles.eventTime,
                                {
                                  color:
                                    mode === "dark" ? "#CCCCCC" : "#585858",
                                },
                              ]}
                            >
                              {nextEvent.start.toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              at{" "}
                              {nextEvent.start.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                            {nextEvent.roomNumber && (
                              <Text
                                style={[
                                  styles.eventRoom,
                                  {
                                    color:
                                      mode === "dark" ? "#CCCCCC" : "#585858",
                                  },
                                ]}
                              >
                                Room {nextEvent.roomNumber}
                              </Text>
                            )}
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                ) : (
                  <View style={styles.eventsList}>
                    {todayEvents.map((event: BuildingEvent, index: number) => (
                      <View
                        key={event.id}
                        style={[
                          styles.eventItem,
                          index < todayEvents.length - 1 &&
                            styles.eventItemBorder,
                        ]}
                      >
                        <Text
                          style={[
                            styles.eventTitle,
                            {
                              color: mode === "dark" ? "#FFFFFF" : "#333333",
                            },
                          ]}
                        >
                          {event.courseName}
                        </Text>

                        <View style={styles.eventDetailsRow}>
                          <Text
                            style={[
                              styles.eventTime,
                              {
                                color: mode === "dark" ? "#CCCCCC" : "#585858",
                              },
                            ]}
                          >
                            {event.start.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {event.end.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>

                          {event.roomNumber && (
                            <Text
                              style={[
                                styles.eventRoom,
                                {
                                  color:
                                    mode === "dark" ? "#CCCCCC" : "#585858",
                                },
                              ]}
                            >
                              Room {event.roomNumber}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Opening hours section */}
              {buildingInfo?.openingHours &&
                renderOpeningHours(buildingInfo.openingHours)}

              {/* Address section */}
              {buildingInfo?.address && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, themedStyles.text(mode)]}>
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
                      onPress={copyAddressToClipboard}
                      style={styles.copyButton}
                      accessible={true}
                      accessibilityLabel={
                        copying ? "Address copied" : "Copy address"
                      }
                      accessibilityRole="button"
                    >
                      {Platform.OS === "ios" ? (
                        <SymbolView
                          name={
                            copying
                              ? "document.on.document.fill"
                              : "document.on.document"
                          }
                          size={25}
                          weight={"regular"}
                          tintColor={mode === "dark" ? "#FFFFFF" : "#333333"}
                        />
                      ) : (
                        <MaterialIcons
                          name={copying ? "task" : "content-copy"}
                          size={22}
                          color={mode === "dark" ? "#FFFFFF" : "#333333"}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Description section */}
              {buildingInfo?.description && (
                <View style={styles.section}>
                  <Text
                    style={[styles.sectionTitle, themedStyles.text(mode)]}
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
        justifyContent: "flex-end",
      }}
      pointerEvents="box-none"
      accessibilityViewIsModal={visible}
    >
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "black",
          opacity: backdropOpacity,
        }}
        pointerEvents="none"
      />
      {Content}
    </View>
  );
});

AdditionalInfoPopup.displayName = "AdditionalInfoPopup";

export default AdditionalInfoPopup;
