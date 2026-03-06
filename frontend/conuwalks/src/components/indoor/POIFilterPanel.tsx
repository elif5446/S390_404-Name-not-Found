import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { POI, POICategory } from "@/src/types/poi";
import { CATEGORY_LABELS } from "@/src/data/poiData";
import {
  poiPanelStyles as S,
  POI_PALETTE,
} from "@/src/styles/IndoorPOI.styles";

interface Props {
  pois: POI[];
  categories: POICategory[];
  activeCategories: Set<POICategory>;
  floorLabel: string;
  onToggleCategory: (cat: POICategory) => void;
  onSelectPOI: (poi: POI) => void;
}

const POIFilterPanel: React.FC<Props> = ({
  pois,
  categories,
  activeCategories,
  floorLabel,
  onToggleCategory,
  onSelectPOI,
}) => {
  // Show only POIs whose category is active
  const visiblePOIs = pois.filter((p) => activeCategories.has(p.category));

  return (
    <View style={S.panelContainer}>
      {/* ── Filter chips ──────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.filterRow}
      >
        <Text style={S.showLabel}>SHOW</Text>
        {categories.map((cat) => {
          const isActive = activeCategories.has(cat);
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => onToggleCategory(cat)}
              style={isActive ? S.chipActive : S.chipInactive}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Filter ${CATEGORY_LABELS[cat]}`}
            >
              <Text style={isActive ? S.chipTextActive : S.chipTextInactive}>
                {CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── POI list card ─────────────────────────────────────── */}
      <View style={S.listCard}>
        <Text style={S.listHeader}>
          Floor {floorLabel}{"   "}Points of Interest
        </Text>
        {visiblePOIs.map((poi, idx) => (
          <TouchableOpacity
            key={poi.id}
            onPress={() => onSelectPOI(poi)}
            style={[
              S.listRow,
              idx === visiblePOIs.length - 1 && S.listRowLast,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Navigate to ${poi.description}, Room ${poi.room}`}
          >
            {/* Inline badge (not absolute-positioned) */}
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                backgroundColor: getBadgeBg(poi.category),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={getCategoryIcon(poi.category)}
                size={14}
                color={getCategoryIconColor(poi.category)}
              />
            </View>

            <Text style={S.listRowDesc}>{poi.description}</Text>
            <Text style={S.listRowRoom}>H-{poi.room}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Helpers (kept local — badge colour logic for list rows) 
function getBadgeBg(cat: POICategory): string {
  switch (cat) {
    case "WC_F":
      return POI_PALETTE.wcF;
    case "WC_M":
      return POI_PALETTE.wcM;
    case "WC_A":
      return POI_PALETTE.wcA;
    default:
      return POI_PALETTE.wcShared;
  }
}

function getCategoryIcon(cat: POICategory): keyof typeof Ionicons.glyphMap {
  switch (cat) {
    case "LAB":
      return "desktop-outline";
    case "WC_F":
      return "person-outline";
    case "WC_M":
      return "person-outline";
    case "WC_A":
      return "accessibility-outline";
    case "WC_SHARED":
      return "people-outline";
    case "PRINT":
      return "print-outline";
    case "IT":
      return "help-circle-outline";
    default:
      return "location-outline";
  }
}

function getCategoryIconColor(cat: POICategory): string {
  switch (cat) {
    case "WC_F":
      return POI_PALETTE.pink;
    case "WC_M":
      return "#3A7BD5";
    case "WC_A":
      return POI_PALETTE.white;
    default:
      return POI_PALETTE.iconDark;
  }
}

export default POIFilterPanel;
