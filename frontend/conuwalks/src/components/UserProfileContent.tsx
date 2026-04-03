import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView } from "expo-symbols";
import { openNotificationSettings, openAppearanceSettings } from "@/src/utils/openSystemSettings";
import {
  getClassReminderLeadTime,
  saveClassReminderLeadTime,
  getWheelchairAccessibilityPreference,
  saveWheelchairAccessibilityPreference,
  MAX_CLASS_REMINDER_LEAD_TIME_MINUTES,
  MIN_CLASS_REMINDER_LEAD_TIME_MINUTES,
} from "@/src/utils/tokenStorage";

const REMINDER_OPTIONS_MINUTES = [0, 5, 10, 15, 30, 45, 60];

const ProfileSection = ({ title, children, mode }: any) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: mode === "dark" ? "#AAA" : "#888" }]}>{title}</Text>
    <View
      style={[
        styles.card,
        {
          backgroundColor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        },
      ]}
    >
      {children}
    </View>
  </View>
);

const UserProfileContent = ({ userInfo, onSignOut, mode }: any) => {
  const textColor = mode === "dark" ? "#FFF" : "#333";
  const [reminderLeadTime, setReminderLeadTime] = useState<number>(10);
  const [customReminderInput, setCustomReminderInput] = useState("");
  const [isWheelchairAccessible, setIsWheelchairAccessible] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadPreference = async () => {
      const value = await getClassReminderLeadTime();
      if (mounted) {
        setReminderLeadTime(value);
        if (!REMINDER_OPTIONS_MINUTES.includes(value)) {
          setCustomReminderInput(String(value));
        }
        setIsWheelchairAccessible(await getWheelchairAccessibilityPreference());
      }
    };

    loadPreference();

    return () => {
      mounted = false;
    };
  }, []);

  const enableWheelchairAccessibility = async () => {
    if (await saveWheelchairAccessibilityPreference(true)) {
      setIsWheelchairAccessible(true);
    } else {
      setIsWheelchairAccessible(false);
    }
  };

  const disableWheelchairAccessibility = async () => {
    if (await saveWheelchairAccessibilityPreference(false)) {
      setIsWheelchairAccessible(false);
    } else {
      setIsWheelchairAccessible(true);
    }
  };

  const handleReminderChange = async (minutes: number) => {
    setReminderLeadTime(minutes);
    const ok = await saveClassReminderLeadTime(minutes);

    // Revert UI only if persistence fails.
    if (!ok) {
      const fallback = await getClassReminderLeadTime();
      setReminderLeadTime(fallback);
    }
  };

  const parsedCustomReminder = Number(customReminderInput);
  const isCustomReminderValid =
    customReminderInput.trim().length > 0 &&
    Number.isFinite(parsedCustomReminder) &&
    parsedCustomReminder >= MIN_CLASS_REMINDER_LEAD_TIME_MINUTES &&
    parsedCustomReminder <= MAX_CLASS_REMINDER_LEAD_TIME_MINUTES;

  return (
    <View style={styles.container}>
      <ProfileSection title="Account" mode={mode}>
        <View style={styles.row}>
          <MaterialIcons name="mail-outline" size={22} color="#B03060" />
          <Text style={[styles.rowText, { color: textColor }]}>{userInfo?.email || "No email linked"}</Text>
        </View>
        <View style={styles.row}>
          <MaterialIcons name="badge" size={22} color="#B03060" />
          <Text style={[styles.rowText, { color: textColor }]}>Student ID: {userInfo?.studentId || "12345678"}</Text>
        </View>
      </ProfileSection>

      <ProfileSection title="Preferences" mode={mode}>
        <View style={styles.row}>
          <MaterialIcons name="notifications-none" size={22} color="#B03060" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowText, { color: textColor }]}>Class Reminder</Text>
            <Text style={[styles.helperText, { color: mode === "dark" ? "#B8B8B8" : "#777" }]}>
              Choose how many minutes before class the banner appears
            </Text>
          </View>
        </View>

        <View style={styles.optionWrap}>
          {[...REMINDER_OPTIONS_MINUTES, ...(REMINDER_OPTIONS_MINUTES.includes(reminderLeadTime) ? [] : [reminderLeadTime])].map(
            minutes => {
              const selected = reminderLeadTime === minutes;
              const label = minutes === 0 ? "Off" : `${minutes}m`;

              return (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.optionChip,
                    selected
                      ? { backgroundColor: "#B03060", borderColor: "#B03060" }
                      : {
                          backgroundColor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                          borderColor: mode === "dark" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)",
                        },
                  ]}
                  onPress={() => handleReminderChange(minutes)}
                  accessibilityRole="button"
                  accessibilityLabel={`Set class reminder to ${label}`}
                >
                  <Text
                    style={{
                      color: selected ? "#FFF" : textColor,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </View>

        <View style={styles.customReminderRow}>
          <TextInput
            value={customReminderInput}
            onChangeText={setCustomReminderInput}
            keyboardType="number-pad"
            placeholder="Custom minutes"
            placeholderTextColor={mode === "dark" ? "#8B8B8B" : "#9A9A9A"}
            style={[
              styles.customReminderInput,
              {
                color: textColor,
                borderColor: mode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
                backgroundColor: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
              },
            ]}
            accessibilityLabel="Custom class reminder minutes"
          />
          <TouchableOpacity
            style={[styles.applyButton, { opacity: isCustomReminderValid ? 1 : 0.5 }]}
            disabled={!isCustomReminderValid}
            onPress={() => {
              handleReminderChange(Math.round(parsedCustomReminder));
            }}
            accessibilityRole="button"
            accessibilityLabel="Apply custom class reminder"
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.rangeText, { color: mode === "dark" ? "#AFAFAF" : "#666" }]}>
          {`Set any value from ${MIN_CLASS_REMINDER_LEAD_TIME_MINUTES} to ${MAX_CLASS_REMINDER_LEAD_TIME_MINUTES} minutes`}
        </Text>

        {/* Wheelchair-Accessible Directions & Navigation Toggle */}
        <View
          accessible={true}
          accessibilityRole="switch"
          accessibilityLabel="Wheelchair-Accessible Directions and Navigation"
          accessibilityHint="Toggle to enable wheelchair accessible routes"
          accessibilityState={{ checked: !!isWheelchairAccessible }}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 20,
            alignItems: "center",
            paddingHorizontal: 15,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {Platform.OS === "ios" ? (
              <SymbolView
                name="figure.roll"
                size={24}
                tintColor="#B03060"
                fallback={<MaterialIcons name="accessible-forward" size={24} />}
              />
            ) : (
              <MaterialIcons name="accessible-forward" size={24} tintColor="#B03060" color="#B03060" />
            )}
            <View style={{ flexDirection: "column", paddingLeft: 10 }}>
              <Text style={[styles.rowText, { color: textColor }]}>{`Wheelchair-Accessible\nDirections & Navigation`}</Text>
            </View>
          </View>
          <Switch
            importantForAccessibility="no-hide-descendants"
            style={{ paddingVertical: 10 }}
            value={isWheelchairAccessible}
            onValueChange={value => (value ? enableWheelchairAccessibility() : disableWheelchairAccessibility())}
            testID="wheelchair-switch"
          />
        </View>

        <TouchableOpacity style={[styles.row, Platform.OS === "ios" ? { paddingTop: 35 } : {}]} onPress={() => openNotificationSettings()}>
          <MaterialIcons name="settings" size={22} color="#B03060" />
          <Text style={[styles.rowText, { color: textColor }]}>System Notification Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.row, { paddingBottom: 0 }]} onPress={() => openAppearanceSettings()}>
          <MaterialIcons name="dark-mode" size={22} color="#B03060" />
          <Text style={[styles.rowText, { color: textColor }]}>Appearance</Text>
        </TouchableOpacity>
      </ProfileSection>

      <TouchableOpacity onPress={onSignOut} style={styles.signOutBtn}>
        <MaterialIcons name="logout" size={20} color="#FFF" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  section: { marginBottom: Platform.OS === "ios" ? 25 : 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  card: { borderRadius: 16, padding: 8, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 14, gap: 15 },
  rowText: { fontSize: 16, fontWeight: "500" },
  helperText: { marginTop: 2, fontSize: 12 },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  optionChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  customReminderRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    alignItems: "center",
    paddingBottom: 8,
  },
  customReminderInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  applyButton: {
    backgroundColor: "#B03060",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  applyButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
  rangeText: {
    fontSize: 12,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  signOutBtn: {
    flexDirection: "row",
    backgroundColor: "#B03060",
    padding: 16,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
    gap: 10,
  },
  signOutText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});

export default UserProfileContent;
