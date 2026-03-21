import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  PanResponder,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { POI, POICategory } from "@/src/types/poi";
import { CATEGORY_LABELS } from "@/src/data/poiData";
import {
  poiPanelStyles as S,
  POI_PALETTE,
} from "@/src/styles/IndoorPOI.styles";

type CategoryIcon =
  | { lib: "ion"; name: keyof typeof Ionicons.glyphMap }
  | { lib: "mci"; name: keyof typeof MaterialCommunityIcons.glyphMap };

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
  activeCategories,
  floorLabel,
  sourcePOI,
  destinationPOI,
  onSelectPOI,
}) => {
  const [query] = useState("");
  const [expanded, setExpanded] = useState(false);

  const normalize = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");

  const queryNormalized = normalize(query);
  const queryRoom = queryNormalized
    .replace(/^h\s*-\s*/i, "")
    .replace(/^room\s+/i, "");

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

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -30) {
          setExpanded(true);
        } else if (gesture.dy > 30) {
          setExpanded(false);
        }
      },
    }),
  ).current;

  return (
    <View
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 900,
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 18,
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 8,
          overflow: "hidden",
        }}
      >
        <View
          {...panResponder.panHandlers}
          style={{
            alignItems: "center",
            paddingTop: 8,
            paddingBottom: 10,
            borderBottomWidth: expanded ? 1 : 0,
            borderBottomColor: "#F0F0F0",
          }}
        >
          <TouchableOpacity
            onPress={() => setExpanded((v) => !v)}
            style={{ width: "100%" }}
            accessibilityRole="button"
            accessibilityLabel="Expand or collapse points of interest panel"
          >
            <View
              style={{
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#D0D0D0",
                  marginBottom: 8,
                }}
              />
            </View>

            <View
              style={{
                width: "100%",
                paddingHorizontal: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#333333",
                }}
              >
                Points of Interest ({visiblePOIs.length})
              </Text>

              <Ionicons
                name={expanded ? "chevron-down" : "chevron-up"}
                size={18}
                color={POI_PALETTE.textMid}
                style={{ marginTop: -2 }}
              />
            </View>
          </TouchableOpacity>
        </View>

        {expanded && (
          <View style={{ maxHeight: 250 }}>
            {visiblePOIs.length > 0 ? (
              <ScrollView
                style={{ maxHeight: 180 }}
                contentContainerStyle={{
                  paddingHorizontal: 10,
                  paddingBottom: 12,
                }}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#777777",
                    marginBottom: 8,
                    marginLeft: 4,
                  }}
                >
                  Floor {floorLabel} · Points of Interest
                </Text>

                {visiblePOIs.map((poi, idx) => {
                  const categoryIcon = getCategoryIcon(poi.category);

                  return (
                    <TouchableOpacity
                      key={poi.id}
                      onPress={() => onSelectPOI(poi)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        borderBottomWidth:
                          idx === visiblePOIs.length - 1 ? 0 : 1,
                        borderBottomColor: "#F1F1F1",
                      }}
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
                          marginRight: 10,
                        }}
                      >
                        {categoryIcon.lib === "ion" ? (
                          <Ionicons
                            name={categoryIcon.name}
                            size={14}
                            color={getCategoryIconColor(poi.category)}
                          />
                        ) : (
                          <MaterialCommunityIcons
                            name={categoryIcon.name}
                            size={14}
                            color={getCategoryIconColor(poi.category)}
                          />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: "#222222",
                          }}
                        >
                          {poi.description}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#777777",
                            marginTop: 2,
                          }}
                        >
                          {formatPoiRoomLabel(poi)}
                        </Text>
                      </View>

                      {sourcePOI?.id === poi.id ? (
                        <Text style={S.rolePillSource}>Source</Text>
                      ) : destinationPOI?.id === poi.id ? (
                        <Text style={S.rolePillDestination}>Destination</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={S.emptyState}>
                <Text style={S.emptyStateText}>
                  No POIs found for your search/filter.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

function getBadgeBg(cat: POICategory): string {
  switch (cat) {
    case "ROOM":
      return POI_PALETTE.wcShared;
    case "STAIRS":
      return POI_PALETTE.stairsBg;
    case "ELEVATOR":
      return POI_PALETTE.elevatorBg;
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

function getCategoryIcon(cat: POICategory): CategoryIcon {
  switch (cat) {
    case "LAB":
      return { lib: "ion", name: "desktop-outline" };
    case "ROOM":
      return { lib: "ion", name: "business-outline" };
    case "STAIRS":
      return { lib: "mci", name: "stairs" };
    case "ELEVATOR":
      return { lib: "mci", name: "elevator" };
    case "WC_F":
      return { lib: "ion", name: "female-outline" };
    case "WC_M":
      return { lib: "ion", name: "male-outline" };
    case "WC_A":
      return { lib: "ion", name: "accessibility-outline" };
    case "WC_SHARED":
      return { lib: "ion", name: "people-outline" };
    case "PRINT":
      return { lib: "ion", name: "print-outline" };
    case "IT":
      return { lib: "ion", name: "help-circle-outline" };
    default:
      return { lib: "ion", name: "location-outline" };
  }
}

function getCategoryIconColor(cat: POICategory): string {
  switch (cat) {
    case "ROOM":
      return POI_PALETTE.iconDark;
    case "STAIRS":
      return POI_PALETTE.iconDark;
    case "ELEVATOR":
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

function formatPoiRoomLabel(poi: POI): string {
  if (poi.category === "STAIRS" && /^S\d+$/i.test(poi.room)) {
    return `H${poi.floor}-${poi.room.toUpperCase()}`;
  }
  return `H-${poi.room}`;
}

export default POIFilterPanel;