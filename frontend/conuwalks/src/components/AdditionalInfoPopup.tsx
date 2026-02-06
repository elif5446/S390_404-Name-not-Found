import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Pressable,
  useColorScheme,
  StyleSheet,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { LoyolaBuildingMetadata } from "../data/metadata/LOY.BuildingMetadata";
import { SGWBuildingMetadata } from "../data/metadata/SGW.BuildingMetaData";
import BuildingTheme from "../styles/BuildingTheme";
import { styles } from "../styles/additionalInfoPopup";

interface AdditionInfoPopupProps {
  visible: boolean;
  buildingId: string;
  campus: "SGW" | "LOY";
  onClose: () => void;
}

const AdditionalInfoPopup: React.FC<AdditionInfoPopupProps> = ({
  visible,
  buildingId,
  campus,
  onClose,
}) => {
  const mode = useColorScheme() || "light";
  const [buildingInfo, setBuildingInfo] = useState<any>(null);

  useEffect(() => {
    if (buildingId) {
      const metadata =
        campus === "SGW"
          ? SGWBuildingMetadata[buildingId]
          : LoyolaBuildingMetadata[buildingId];
      if (metadata) {
        setBuildingInfo(metadata);
      }
    }
  }, [buildingId, campus]);

  if (!buildingInfo) {
    return null;
  }

  const windowWidth = Dimensions.get("window").width;
  const isIOS = Platform.OS === "ios";

  const renderOpeningHours = (openingHours: any) => {
    if (typeof openingHours === "string") {
      return null; // continue...
    }
    return null; // continue...
  };

  // Display building color
  const buildingColor =
    BuildingTheme[campus][
      buildingId as keyof (typeof BuildingTheme)[typeof campus]
    ] || "#888";

  // iOS styling
  if (isIOS) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.iosBackdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <BlurView
            style={styles.iosBlurContainer}
            intensity={80}
            tint={mode === "dark" ? "dark" : "light"}
          ></BlurView>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.iosContentContainer}
          >
            {/* Handle bar */}
            <View style={styles.handleBar} />
            {/* Header */}
            <View />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    ); // continue...
  } else {
    // Android (Google Maps) styling
    return null; // continue...
  }
};

export default AdditionalInfoPopup;
