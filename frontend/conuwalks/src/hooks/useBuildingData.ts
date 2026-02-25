import { useState, useEffect, useCallback } from "react";
import { AccessibilityInfo } from "react-native";
import * as Clipboard from "expo-clipboard";
import { SGWBuildingMetadata } from "@/src/data/metadata/SGW.BuildingMetaData";
import { LoyolaBuildingMetadata } from "@/src/data/metadata/LOY.BuildingMetadata";
import { AccessibilityIconDef, BuildingMetadata } from "../types/Building";

export const useBuildingData = (buildingId: string, campus: "SGW" | "LOY") => {
  const [buildingInfo, setBuildingInfo] = useState<BuildingMetadata | null>(
    null,
  );
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (buildingId) {
      const metadata =
        campus === "SGW"
          ? SGWBuildingMetadata[buildingId]
          : LoyolaBuildingMetadata[buildingId];
      setBuildingInfo(metadata || { name: buildingId });
    }
  }, [buildingId, campus]);

  const copyAddress = useCallback(async () => {
    if (buildingInfo?.address) {
      setIsCopying(true);
      await Clipboard.setStringAsync(buildingInfo.address);
      setTimeout(() => {
        AccessibilityInfo.announceForAccessibility("Address copied");
        setTimeout(() => setIsCopying(false), 500);
      }, 500);
    }
  }, [buildingInfo?.address]);

  const accessibilityIcons = useCallback(() => {
    const facilities = buildingInfo?.facilities;
    if (!facilities) return [];

    const icons: AccessibilityIconDef[] = [];
    const hasFacility = (keyword: string) =>
      facilities.some((f) => f.toLowerCase().includes(keyword));

    if (hasFacility("metro") || hasFacility("underground passage")) {
      icons.push({
        key: "metro",
        sf: "tram.fill.tunnel",
        material: "subway",
        label: "Access to the Concordia Underground Passage and the Metro",
      });
    }

    if (
      hasFacility("accessible") ||
      hasFacility("accessibility") ||
      hasFacility("wheelchair")
    ) {
      icons.push({
        key: "wheelchair",
        sf: "figure.roll",
        material: "accessible",
        label: "First Floor is Wheelchair Accessible",
      });
    }

    if (hasFacility("elevator") || hasFacility("lift")) {
      icons.push({
        key: "elevator",
        sf: "arrow.up.arrow.down.square",
        material: "elevator",
        label: "Elevators Are Available",
      });
    }

    return icons;
  }, [buildingInfo?.facilities])();

  return { buildingInfo, isCopying, copyAddress, accessibilityIcons };
};
