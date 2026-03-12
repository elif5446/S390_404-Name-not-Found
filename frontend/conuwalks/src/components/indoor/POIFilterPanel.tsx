import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
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
  targetMode: "SOURCE" | "DESTINATION";
  sourcePOI: POI | null;
  destinationPOI: POI | null;
  onTargetModeChange: (mode: "SOURCE" | "DESTINATION") => void;
  onToggleCategory: (cat: POICategory) => void;
  onSelectPOI: (poi: POI) => void;
}

const POIFilterPanel: React.FC<Props> = ({
  pois,
  categories,
  activeCategories,
  floorLabel,
  targetMode,
  sourcePOI,
  destinationPOI,
  onTargetModeChange,
  onToggleCategory,
  onSelectPOI,
}) => {
  const [query, setQuery] = useState("");
  const [listExpanded, setListExpanded] = useState(false);

  const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
  const queryNormalized = normalize(query);
  const queryRoom = queryNormalized.replace(/^h\s*-\s*/i, "").replace(/^room\s+/i, "");

  // Show only POIs whose category is active
  const visiblePOIs = useMemo(() => {
    return pois
      .filter((p) => activeCategories.has(p.category))
      .filter((p) => {
        if (!queryNormalized) return true;

        const roomOnly = p.room.toLowerCase();
        const roomWithBuilding = `h-${roomOnly}`;
        const desc = p.description.toLowerCase();
        const label = p.label.toLowerCase();
        const category = CATEGORY_LABELS[p.category].toLowerCase();

        return (
          desc.includes(queryNormalized) ||
          label.includes(queryNormalized) ||
          category.includes(queryNormalized) ||
          roomOnly.includes(queryNormalized) ||
          roomWithBuilding.includes(queryNormalized) ||
          roomOnly.includes(queryRoom) ||
          roomWithBuilding.includes(queryRoom)
        );
      });
  }, [activeCategories, pois, queryNormalized, queryRoom]);

  useEffect(() => {
    // Auto-open list when searching so users immediately see matches.
    if (query.trim().length > 0) {
      setListExpanded(true);
    }
  }, [query]);

  return (
    <View style={S.panelContainer}>
      <View style={S.targetModeRow}>
        <TouchableOpacity
          onPress={() => onTargetModeChange("SOURCE")}
          style={targetMode === "SOURCE" ? S.modeChipActive : S.modeChipInactive}
          accessibilityRole="button"
          accessibilityState={{ selected: targetMode === "SOURCE" }}
          accessibilityLabel="Set source mode"
        >
          <Text style={targetMode === "SOURCE" ? S.modeChipTextActive : S.modeChipTextInactive}>
            Set Source
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onTargetModeChange("DESTINATION")}
          style={targetMode === "DESTINATION" ? S.modeChipActive : S.modeChipInactive}
          accessibilityRole="button"
          accessibilityState={{ selected: targetMode === "DESTINATION" }}
          accessibilityLabel="Set destination mode"
        >
          <Text style={targetMode === "DESTINATION" ? S.modeChipTextActive : S.modeChipTextInactive}>
            Set Destination
          </Text>
        </TouchableOpacity>
      </View>

      <View style={S.searchRow}>
        <Ionicons name="search-outline" size={14} color={POI_PALETTE.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search POI or room"
          placeholderTextColor={POI_PALETTE.textMuted}
          style={S.searchInput}
          accessibilityLabel="Search POIs"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/*  Filter chips  */}
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

      <TouchableOpacity
        onPress={() => setListExpanded((v) => !v)}
        style={S.listToggleRow}
        accessibilityRole="button"
        accessibilityLabel="Toggle POI list"
      >
        <Text style={S.listToggleTitle}>Points of Interest ({visiblePOIs.length})</Text>
        <Ionicons
          name={listExpanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={POI_PALETTE.textMid}
        />
      </TouchableOpacity>

      {/*  POI list card (collapsible)  */}
      {listExpanded ? (
        <View style={S.listCard}>
          <Text style={S.listHeader}>
            Floor {floorLabel}{"   "}Points of Interest
          </Text>

          {visiblePOIs.length > 0 ? (
            <ScrollView
              style={S.listScroll}
              contentContainerStyle={S.listScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled
            >
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
                  {sourcePOI?.id === poi.id ? (
                    <Text style={S.rolePillSource}>Source</Text>
                  ) : destinationPOI?.id === poi.id ? (
                    <Text style={S.rolePillDestination}>Destination</Text>
                  ) : null}
                  <Text style={S.listRowRoom}>H-{poi.room}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={S.emptyState}>
              <Text style={S.emptyStateText}>No POIs found for your search/filter.</Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
};

// Helpers (kept local — badge colour logic for list rows) 
function getBadgeBg(cat: POICategory): string {
  switch (cat) {
    case "ROOM":
      return POI_PALETTE.wcShared;
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
    case "ROOM":
      return "business-outline";
    case "WC_F":
      return "female-outline";
    case "WC_M":
      return "male-outline";
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
    case "ROOM":
      return POI_PALETTE.iconDark;
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
