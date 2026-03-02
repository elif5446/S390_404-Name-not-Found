import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  Button,
  Alert,
  Platform,
  useColorScheme,
  Animated,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";

interface Props {
  userInfo: any;
  onSignOut: () => void;
}

const CollapsibleUserProfile: React.FC<Props> = ({ userInfo, onSignOut }) => {
  const mode = useColorScheme() || "light";
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    // Collapsed: just show icon
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
          zIndex: 9999, // Below location button but above map
        }}
        accessible={true}
        accessibilityLabel="Open user profile"
        accessibilityRole="button"
      >
        {userInfo?.photo ? (
          <Image
            source={{ uri: userInfo.photo }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
            }}
          />
        ) : (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "#B03060",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 18,
                fontWeight: "600",
              }}
            >
              {userInfo?.name?.charAt(0) || "U"}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Expanded: show full profile
  const content = (
    <View
      style={{
        padding: 16,
        alignItems: "center",
      }}
    >
      {userInfo?.photo ? (
        <Image
          source={{ uri: userInfo.photo }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            marginBottom: 12,
          }}
        />
      ) : (
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: "#B03060",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 24,
              fontWeight: "600",
            }}
          >
            {userInfo?.name?.charAt(0) || "U"}
          </Text>
        </View>
      )}

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
        style={{
          padding: 8,
        }}
        accessible={true}
        accessibilityLabel="Close profile"
        accessibilityRole="button"
      >
        <MaterialIcons
          name="close"
          size={24}
          color={mode === "dark" ? "#FFFFFF" : "#333333"}
        />
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
      {/* Backdrop - tap to close */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setIsExpanded(false)}
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        }}
      />

      {/* Profile card */}
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

export default CollapsibleUserProfile;

