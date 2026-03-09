import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useGoogleCalendar } from "@/src/hooks/useGoogleCalendar";
import { parseLocation } from "@/src/hooks/useBuildingEvents";
import { useDirections } from "@/src/context/DirectionsContext";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import {
  SGWBuildingMetadata,
  SGWBuildingSearchMetadata,
} from "@/src/data/metadata/SGW.BuildingMetaData";
import {
  LoyolaBuildingMetadata,
  LoyolaBuildingSearchMetadata,
} from "@/src/data/metadata/LOY.BuildingMetadata";
import {
  getClassReminderLeadTime,
  DEFAULT_CLASS_REMINDER_LEAD_TIME_MINUTES,
  getDismissedClassEventIds,
  saveDismissedClassEventIds,
} from "@/src/utils/tokenStorage";

const BANNER_BG = "#FFD6DF";
const BANNER_ACCENT = "#B03060";
const DISMISS_THRESHOLD = -30; // px upward swipe needed to dismiss

const buildDismissKey = (eventId: string, startStr: string | null): string =>
  startStr ? `${eventId}::${startStr}` : eventId;

interface UpcomingClassBannerProps {
  onNavigateToClass?: () => void;
}

const UpcomingClassBanner: React.FC<UpcomingClassBannerProps> = ({
  onNavigateToClass,
}) => {
  const { events, fetchUpcomingEvents } = useGoogleCalendar();
  const { location: userLocation } = useUserLocation();
  const { setStartPoint, setDestination, setShowDirections } = useDirections();
  const [dismissedEventIds, setDismissedEventIds] = useState<string[]>([]);
  const dismissedEventIdsRef = useRef<string[]>([]);
  const [reminderLeadTimeMinutes, setReminderLeadTimeMinutes] = useState(
    DEFAULT_CLASS_REMINDER_LEAD_TIME_MINUTES,
  );
  const [nowTs, setNowTs] = useState(Date.now());
  const [dismissedLoaded, setDismissedLoaded] = useState(false);

  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchUpcomingEvents(50);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadDismissed = async () => {
      const stored = await getDismissedClassEventIds();
      if (mounted) {
        setDismissedEventIds(stored);
        dismissedEventIdsRef.current = stored;
        setDismissedLoaded(true);
      }
    };

    loadDismissed();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadReminderLeadTime = async () => {
      const value = await getClassReminderLeadTime();
      if (mounted) {
        setReminderLeadTimeMinutes(value);
      }
    };

    loadReminderLeadTime();

    const timer = setInterval(() => {
      setNowTs(Date.now());
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const nextEvent = useMemo(() => {
    const now = nowTs;
    return events
      .filter((e) => {
        const startStr = e.start?.dateTime || e.start?.date;
        const dismissKey = buildDismissKey(e.id, startStr || null);
        return (
          startStr &&
          new Date(startStr).getTime() > now &&
          !dismissedEventIds.includes(dismissKey)
        );
      })
      .sort((a, b) => {
        const aTime = new Date(a.start?.dateTime || a.start?.date || 0).getTime();
        const bTime = new Date(b.start?.dateTime || b.start?.date || 0).getTime();
        return aTime - bTime;
      })[0] ?? null;
  }, [events, nowTs, dismissedEventIds]);

  // Reset animation when a new event becomes the next one
  useEffect(() => {
    if (nextEvent) {
      translateY.setValue(0);
      opacity.setValue(1);
    }
  }, [nextEvent?.id]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy < -5, // only respond to upward movement
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
          opacity.setValue(Math.max(0, 1 + gestureState.dy / 80));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < DISMISS_THRESHOLD) {
          dismissCurrentBanner();
        } else {
          // Snap back
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // Keep a ref to the current event id so the PanResponder closure can read it
  const nextEventIdRef = useRef<string | null>(null);
  useEffect(() => {
    nextEventIdRef.current = nextEvent?.id ?? null;
  }, [nextEvent?.id]);

  const dismissCurrentBanner = () => {
    if (nextEventIdRef.current) {
      const dismissedId = nextEventIdRef.current;
      const dismissedStartStr = nextEvent?.start?.dateTime || nextEvent?.start?.date || null;
      const dismissedKey = buildDismissKey(dismissedId, dismissedStartStr);
      const nextIds = dismissedEventIdsRef.current.includes(dismissedKey)
        ? dismissedEventIdsRef.current
        : [...dismissedEventIdsRef.current, dismissedKey];

      dismissedEventIdsRef.current = nextIds;
      setDismissedEventIds(nextIds);
      saveDismissedClassEventIds(nextIds);
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (!dismissedLoaded || !nextEvent) return null;

  const startTimeMs = new Date(
    nextEvent.start?.dateTime || nextEvent.start?.date || "",
  ).getTime();
  const msUntilClass = startTimeMs - nowTs;

  // 0 means reminders are disabled by user preference.
  if (reminderLeadTimeMinutes <= 0) return null;

  const showWithinMs = reminderLeadTimeMinutes * 60 * 1000;
  if (msUntilClass > showWithinMs || msUntilClass <= 0) return null;

  const startStr = nextEvent.start?.dateTime || nextEvent.start?.date || "";
  const startDate = new Date(startStr);

  const timeLabel = startDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const parsed = nextEvent.location ? parseLocation(nextEvent.location) : null;
  const buildingCode = parsed?.buildingCode ?? null;
  const roomNumber = parsed?.roomNumber ?? null;

  const buildingMeta = buildingCode
    ? SGWBuildingMetadata[buildingCode] ?? LoyolaBuildingMetadata[buildingCode] ?? null
    : null;
  const buildingCoordinates = buildingCode
    ? SGWBuildingSearchMetadata[buildingCode]?.coordinates ??
      LoyolaBuildingSearchMetadata[buildingCode]?.coordinates ??
      null
    : null;

  const locationLabel = buildingMeta && roomNumber
    ? `${buildingMeta.name} \u2013 Room ${roomNumber}`
    : nextEvent.location ?? null;

  const handleNavigatePress = async () => {
    if (!buildingCode || !buildingCoordinates) {
      dismissCurrentBanner();
      return;
    }

    const destinationName = buildingMeta?.name || buildingCode;

    if (userLocation) {
      setStartPoint("USER", userLocation, "My Location");
    }

    setDestination(buildingCode, buildingCoordinates, destinationName);
    setShowDirections(true);
    onNavigateToClass?.();
    dismissCurrentBanner();
  };

  return (
    <Animated.View
      testID="upcoming-class-banner"
      style={{
        transform: [{ translateY }],
        opacity,
        backgroundColor: BANNER_BG,
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 8,
        marginHorizontal: 12,
        marginTop: 8,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
      }}
      {...panResponder.panHandlers}
    >
      <MaterialIcons
        name="notifications-none"
        size={28}
        color={BANNER_ACCENT}
        style={{ marginRight: 12 }}
        testID="banner-bell-icon"
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: BANNER_ACCENT,
          }}
          numberOfLines={1}
        >
          {`Next Class: ${nextEvent.summary}`}
        </Text>
        {locationLabel ? (
          <Text
            style={{ fontSize: 13, color: BANNER_ACCENT, fontWeight: "500" }}
            numberOfLines={1}
          >
            {locationLabel}
          </Text>
        ) : null}
        <Text style={{ fontSize: 13, color: BANNER_ACCENT, fontWeight: "500" }}>
          {`Starts at ${timeLabel}`}
        </Text>
        <TouchableOpacity
          onPress={handleNavigatePress}
          accessibilityRole="button"
          accessibilityLabel="Navigate to next class"
          testID="banner-navigate-button"
          style={{
            marginTop: 8,
            alignSelf: "flex-start",
            backgroundColor: "rgba(176,48,96,0.14)",
            borderWidth: 1,
            borderColor: "rgba(176,48,96,0.28)",
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: BANNER_ACCENT,
            }}
          >
            Navigate
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={dismissCurrentBanner}
        accessibilityRole="button"
        accessibilityLabel="Dismiss upcoming class notification"
        testID="banner-close-button"
        style={{ marginLeft: 8, padding: 4 }}
      >
        <MaterialIcons name="close" size={18} color={BANNER_ACCENT} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default UpcomingClassBanner;
