import React from "react";
import {
  View,
  Platform,
  useColorScheme,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from "expo-blur";
import UserProfileHeader from "./UserProfileHeader";
import UserProfileContent from "./UserProfileContent";

interface UserProfilePopupProps {
  visible: boolean;
  userInfo: any;
  onClose: () => void;
  onSignOut: () => void;
}

const UserProfilePopup: React.FC<UserProfilePopupProps> = ({
  visible,
  userInfo,
  onClose,
  onSignOut,
}) => {
  const mode = useColorScheme() || "light";
  const isDark = mode === "dark";

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={{ flex: 1, backgroundColor: "transparent" }}>
        <View
          testID="theme-container"
          style={{
            flex: 1,
            width: "100%",
            backgroundColor: isDark ? "#1C1B1F" : "#FFF",
          }}
        >
          {Platform.OS === "ios" && (
            <BlurView
              intensity={100}
              tint={mode}
              style={StyleSheet.absoluteFill}
            />
          )}

          <SafeAreaView style={{ flex: 1, paddingTop: 20}}>
            <UserProfileHeader
              userInfo={userInfo}
              onClose={onClose}
              mode={mode}
            />
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              bounces={true}
              showsVerticalScrollIndicator={false}
            >
              <UserProfileContent
                userInfo={userInfo}
                onSignOut={onSignOut}
                mode={mode}
              />
              <View style={{ flex: 1 }} />
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
});

export default UserProfilePopup;
