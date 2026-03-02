import React, { memo } from "react";
import { Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView, SFSymbol } from "expo-symbols";

export interface PlatformIconProps {
  /** The Material icon name for Android */
  materialName: React.ComponentProps<typeof MaterialIcons>["name"];
  /** The SF Symbol name for iOS */
  iosName: SFSymbol;
  size?: number;
  color?: string;
  weight?:
    | "ultraLight"
    | "light"
    | "regular"
    | "medium"
    | "semibold"
    | "bold"
    | "heavy"
    | "black";
}

const PlatformIcon: React.FC<PlatformIconProps> = ({
  materialName,
  iosName,
  size = 24,
  color = "#000000",
  weight = "medium",
}) => {
  if (Platform.OS === "ios") {
    return (
      <SymbolView
        name={iosName}
        size={size}
        weight={weight}
        tintColor={color}
      />
    );
  }

  return <MaterialIcons name={materialName} size={size} color={color} />;
};

export default memo(PlatformIcon);
