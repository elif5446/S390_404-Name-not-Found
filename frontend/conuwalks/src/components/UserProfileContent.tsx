import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const ProfileSection = ({ title, children, mode }: any) => (
  <View style={styles.section}>
    <Text
      style={[
        styles.sectionTitle,
        { color: mode === "dark" ? "#AAA" : "#888" },
      ]}
    >
      {title}
    </Text>
    <View
      style={[
        styles.card,
        {
          backgroundColor:
            mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        },
      ]}
    >
      {children}
    </View>
  </View>
);

const UserProfileContent = ({ userInfo, onSignOut, mode }: any) => {
  const textColor = mode === "dark" ? "#FFF" : "#333";

  return (
    <View style={styles.container}>
      <ProfileSection title="Account" mode={mode}>
        <View style={styles.row}>
          <MaterialIcons name="mail-outline" size={22} color="#B03060" />
          <Text style={[styles.rowText, { color: textColor }]}>
            {userInfo?.email || "No email linked"}
          </Text>
        </View>
        <View style={styles.row}>
          <MaterialIcons name="badge" size={22} color="#B03060" />
          <Text style={[styles.rowText, { color: textColor }]}>
            Student ID: {userInfo?.studentId || "12345678"}
          </Text>
        </View>
      </ProfileSection>

      <ProfileSection title="Preferences" mode={mode}>
        <TouchableOpacity style={styles.row}>
          <MaterialIcons name="notifications-none" size={22} color="#B03060" />
          <Text style={[styles.rowText, { color: textColor }]}>
            Notifications
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
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
  section: { marginBottom: 25 },
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
  signOutBtn: {
    flexDirection: "row",
    backgroundColor: "#B03060",
    padding: 16,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 10,
  },
  signOutText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});

export default UserProfileContent;
