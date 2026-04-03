import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface UserProfileHeaderProps {
  userInfo: any;
  onClose: () => void;
  mode: "light" | "dark";
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ userInfo, onClose, mode }) => {
  const textColor = mode === "dark" ? "#FFFFFF" : "#333333";

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="profile-close-button">
        <MaterialIcons name="close" size={28} color={textColor} />
      </TouchableOpacity>

      <View style={styles.profileHero}>
        {userInfo?.photo ? (
          <Image source={{ uri: userInfo.photo }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholderAvatar}>
            <Text style={styles.placeholderText}>{userInfo?.name?.charAt(0) || "U"}</Text>
          </View>
        )}
        <Text style={[styles.userName, { color: textColor }]}>{userInfo?.name || "User Name"}</Text>
        <Text style={styles.userRole}>Concordia University Student</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  closeBtn: { padding: 8, marginLeft: -8, marginBottom: 10 },
  profileHero: { alignItems: "center" },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15 },
  placeholderAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#B03060",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  placeholderText: { color: "#FFF", fontSize: 40, fontWeight: "bold" },
  userName: { fontSize: 24, fontWeight: "800" },
  userRole: { fontSize: 14, color: "#B03060", fontWeight: "600", marginTop: 4 },
});

export default UserProfileHeader;
