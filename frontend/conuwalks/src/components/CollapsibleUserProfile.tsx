import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  Button,
  Platform,
  useColorScheme,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import PlatformIcon from "./ui/PlatformIcon";

interface Props {
  userInfo: any;
  onSignOut: () => void;
}
// helper for complexity, extracts avatar logic
const UserAvatar = ({ photo, name, size, campusPink }: any) => {
  const radius = size / 2;
  const fontSize = size * 0.4;

  if (photo) {
    return <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: radius }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: campusPink, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "#FFFFFF", fontSize, fontWeight: "600" }}>
        {name?.charAt(0) || "U"}
      </Text>
    </View>
  );
};
const CollapsibleUserProfile: React.FC<Props> = ({ userInfo, onSignOut }) => {
  const mode = useColorScheme() || "light";
  const isDark = mode === "dark";
  const campusPink = "#B03060";
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <TouchableOpacity
        onPress={() => setIsExpanded(true)}
        style={{
          position: "absolute",
          right: 16,
          top: 16,
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: mode === "dark" ? "#1C1B1F" : "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 6,
          zIndex: 9999,
        }}
        accessible={true}
        accessibilityLabel="Open user profile"
        accessibilityRole="button"
      >
        <UserAvatar photo={userInfo?.photo} name={userInfo?.name} size={48} campusPink={campusPink} />
      </TouchableOpacity>
    );
  }

  const content = (
    <View style={{ padding: 16, alignItems: "center" }}>
    <UserAvatar photo={userInfo?.photo} name={userInfo?.name} size={60} campusPink={campusPink} />

      {userInfo?.name && (
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: mode === "dark" ? "#FFFFFF" : "#333333",
            marginBottom: 12,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {userInfo.name}
        </Text>
      )}

      <View
        style={{
          backgroundColor: Platform.OS === "ios" ? "#B03060CC" : "#feeded",
          borderRadius: 20,
          marginBottom: 8,
        }}
      >
        <Button
          title="Sign Out"
          onPress={() => {
            setIsExpanded(false);
            onSignOut();
          }}
          color={Platform.OS === "ios" ? "#feeded" : "#B03060CC"}
        />
      </View>

      <TouchableOpacity
        onPress={() => setIsExpanded(false)}
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel="Close Profile"
      >
        {Platform.OS === "ios" ? (
          <View
            style={[
              styles.closeButtonCircle,
              { backgroundColor: isDark ? "#00000031" : "#85858522" },
            ]}
          >
            <Text
              style={[
                styles.closeButtonText,
                { color: isDark ? "#FFFFFF" : "#333333" },
              ]}
            >
              ✕
            </Text>
          </View>
        ) : (
          <PlatformIcon
            materialName="close"
            iosName="xmark"
            size={22}
            color={campusPink}
          />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 999,
      }}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        testID="profile-overlay"
        activeOpacity={1}
        onPress={() => setIsExpanded(false)}
        style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      />
      <View
        style={{
          position: "absolute",
          right: 16,
          top: 16,
          borderRadius: 16,
          overflow: "hidden",
          minWidth: 200,
          zIndex: 9999,
        }}
        pointerEvents="box-none"
      >
        {Platform.OS === "ios" ? (
          <BlurView intensity={80} tint="extraLight">
            {content}
          </BlurView>
        ) : (
          <View
            testID="expanded-content-container"
            style={{
              backgroundColor:
                mode === "dark" ? "#1C1B1F" : "rgba(255, 255, 255, 0.95)",
            }}
          >
            {content}
          </View>
        )}
      </View>
    </View>
  );
};

// Added Missing Styles
const styles = StyleSheet.create({
  iconButton: {
    padding: 8,
    marginTop: 8,
  },
  closeButtonCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default CollapsibleUserProfile;
