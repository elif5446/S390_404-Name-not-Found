import React, { useMemo, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { POI, POICategory } from "@/src/types/poi";
import { CATEGORY_LABELS } from "@/src/data/poiData";
import { poiPanelStyles as S, POI_PALETTE } from "@/src/styles/IndoorPOI.styles";
import { useBottomSheet } from "@/src/hooks/useBottomSheet";
import BottomSheetDragHandle from "@/src/components/ui/BottomSheetDragHandle";

type CategoryIcon =
  | { lib: "ion"; name: keyof typeof Ionicons.glyphMap }
  | { lib: "mci"; name: keyof typeof MaterialCommunityIcons.glyphMap }
  | { lib: "custom"; name: string };

export interface POIFilterPanelHandle {
  minimize: () => void;
}

interface Props {
  visible: boolean;
  buildingId: string;
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

const POIFilterPanel = forwardRef<POIFilterPanelHandle, Props>(
  ({ visible, buildingId, pois, activeCategories, floorLabel, sourcePOI, destinationPOI, onSelectPOI }, ref) => {
    const [query] = useState("");
    const [expanded, setExpanded] = useState(false);

    const { translateY, MAX_HEIGHT, scrollOffsetRef, handleToggleHeight, handlePanResponder, scrollAreaPanResponder, minimize } =
      useBottomSheet({
        visible,
        onDismiss: () => {},
        onExpansionChange: setExpanded,
        peekHeightRatio: 0.11,
      });

    useImperativeHandle(
      ref,
      () => ({
        minimize: () => {
          if (visible) {
            minimize();
          }
        },
      }),
      [minimize, visible],
    );

    const handleScroll = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
      },
      [scrollOffsetRef],
    );

    const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

    const queryNormalized = normalize(query);
    const queryRoom = queryNormalized.replace(/^h\s*-\s*/i, "").replace(/^room\s+/i, "");

    const visiblePOIs = useMemo(() => {
      return pois
        .filter(p => activeCategories.has(p.category))
        .filter(p => {
          if (!queryNormalized) return true;

          const roomOnly = p.room.toLowerCase();
          const roomWithBuilding = `${buildingId.toLowerCase()}-${roomOnly}`;
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
    }, [activeCategories, buildingId, pois, queryNormalized, queryRoom]);

    return (
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "100%",
          zIndex: 2000,
          justifyContent: "flex-end",
        }}
        pointerEvents="box-none"
      >
        <Animated.View
          style={{
            height: MAX_HEIGHT,
            transform: [{ translateY }],
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 16,
          }}
        >
          {/* Header & Drag Handle Area */}
          <View
            {...handlePanResponder.panHandlers}
            style={{
              paddingBottom: 16,
              borderBottomWidth: expanded ? 1 : 0,
              borderBottomColor: "#F0F0F0",
            }}
          >
            <TouchableWithoutFeedback onPress={handleToggleHeight}>
              <View>
                <BottomSheetDragHandle isDark={false} onToggleHeight={handleToggleHeight} />

                <View
                  style={{
                    paddingHorizontal: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "#333333",
                    }}
                  >
                    Points of Interest ({visiblePOIs.length})
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>

          {/* Scrollable POI List */}
          <View style={{ flex: 1 }} {...scrollAreaPanResponder.panHandlers}>
            {visiblePOIs.length > 0 ? (
              <ScrollView
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: 600,
                }}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#777777",
                    marginBottom: 12,
                    marginTop: 8,
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
                        paddingVertical: 12,
                        paddingHorizontal: 8,
                        borderBottomWidth: idx === visiblePOIs.length - 1 ? 0 : 1,
                        borderBottomColor: "#F1F1F1",
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Maps to ${poi.description}, Room ${poi.room}`}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: getBadgeBg(poi.category),
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        {categoryIcon.lib === "ion" ? (
                          <Ionicons name={categoryIcon.name} size={16} color={getCategoryIconColor(poi.category)} />
                        ) : categoryIcon.lib === "mci" ? (
                          <MaterialCommunityIcons name={categoryIcon.name} size={16} color={getCategoryIconColor(poi.category)} />
                        ) : (
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "bold",
                              color: getCategoryIconColor(poi.category),
                            }}
                          >
                            IT
                          </Text>
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "600",
                            color: "#222222",
                          }}
                        >
                          {poi.description}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#777777",
                            marginTop: 2,
                          }}
                        >
                          {formatPoiRoomLabel(poi, buildingId, floorLabel)}
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
                <Text style={S.emptyStateText}>No POIs found for your search/filter.</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    );
  },
);

POIFilterPanel.displayName = "POIFilterPanel";

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
    case "ESCALATOR":
      return { lib: "mci", name: "escalator" };
    case "WC_F":
      return { lib: "ion", name: "female-outline" };
    case "WC_M":
      return { lib: "ion", name: "male-outline" };
    case "WC_A":
      return { lib: "ion", name: "accessibility-outline" };
    case "WC_SHARED":
      return { lib: "mci", name: "human-male-female" };
    case "PRINT":
      return { lib: "ion", name: "print-outline" };
    case "IT":
      return { lib: "custom", name: "IT_TEXT" };
    case "HELP_DESK":
      return { lib: "ion", name: "shield-outline" };
    case "STUDENT_UNION":
      return { lib: "mci", name: "account-group" };
    case "STUDY_ROOM":
      return { lib: "ion", name: "book-outline" };
    case "SECOND_CUP":
      return { lib: "mci", name: "coffee" };
    case "MICROWAVE":
      return { lib: "mci", name: "microwave" };
    case "VINHS_CAFE":
      return { lib: "mci", name: "coffee" };
    case "FOOD":
      return { lib: "mci", name: "coffee" };
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

function formatPoiRoomLabel(poi: POI, buildingId: string, floorLabel: string): string {
  return `${buildingId}.${floorLabel}.${poi.room}`;
}

export default POIFilterPanel;
