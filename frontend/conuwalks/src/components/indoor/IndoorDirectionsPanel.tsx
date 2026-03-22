import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { POI, POICategory } from "@/src/types/poi";
import { getDirectionsForPOI } from "@/src/data/poiData";
import {
  directionsStyles as S,
  POI_PALETTE,
} from "@/src/styles/IndoorPOI.styles";
import POIBadge from "./POIBadge";

interface Props {
  poi: POI;
  startingRoom: string;
  sourcePOI?: POI | null;
  onClose: () => void;
}

const formatRoomWithBuilding = (room: string): string => {
  const value = room.trim();
  return /^h\s*-/i.test(value) ? value.toUpperCase() : `H-${value}`;
};

const IndoorDirectionsPanel: React.FC<Props> = ({
  poi,
  startingRoom,
  sourcePOI,
  onClose,
}) => {
  const [avoidStairs, setAvoidStairs] = useState(false);
  const [avoidElevator, setAvoidElevator] = useState(false);

  const { steps, estimatedMinutes } = getDirectionsForPOI(
    poi,
    startingRoom,
    sourcePOI,
  );

  return (
    <View style={S.panel}>
      {/* Drag handle */}
      <View style={S.handle} />

      {/* Header */}
      <View style={S.headerRow}>
        <TouchableOpacity
          onPress={onClose}
          style={S.closeBtn}
          accessibilityLabel="Close directions"
          accessibilityRole="button"
        >
          <Text style={S.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={S.headerTitle}>Directions</Text>
        <Text style={S.indoorBadge}>Indoor</Text>
      </View>

      {/* Divider */}
      <View style={S.divider} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
      {/* Avoid toggles */}
      <View style={S.toggleRow}>
        <TouchableOpacity
          onPress={() => setAvoidStairs((v) => !v)}
          style={[S.togglePill, avoidStairs && S.togglePillActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: avoidStairs }}
          accessibilityLabel="Avoid stairs"
        >
          <Text style={[S.toggleText, avoidStairs && S.toggleTextActive]}>
            avoid stairs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Starting room card */}
      <View style={S.infoCard}>
        <Text style={S.infoCardRoomNum}>
          {formatRoomWithBuilding(sourcePOI ? sourcePOI.room : startingRoom)}
        </Text>
        <Text style={S.infoCardLabel}>{sourcePOI ? sourcePOI.description : "Starting Room"}</Text>
      </View>

      {/* Destination POI card */}
      <View style={S.infoCard}>
        {/* Inline badge (not absolute-positioned) */}
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: POI_PALETTE.pink,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
          }}
        >
          <Ionicons
            name={getCategoryIcon(poi.category)}
            size={18}
            color={POI_PALETTE.white}
          />
        </View>

        <View style={S.infoCardDest}>
          <Text style={S.infoCardDestName}>{poi.description}</Text>
          <Text style={S.infoCardDestRoom}>
            H-{poi.room}{"  "}(POI)
          </Text>
        </View>

        <TouchableOpacity
          style={S.navArrowBtn}
          accessibilityRole="button"
          accessibilityLabel={`Start navigation to ${poi.description}`}
        >
          <Ionicons name="arrow-forward" size={16} color={POI_PALETTE.white} />
        </TouchableOpacity>
      </View>

      {/* Route steps */}
      <Text style={S.stepsLabel}>ROUTE STEPS</Text>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <View key={idx} style={S.stepRow}>
            <View
              style={[
                S.stepAccent,
                { backgroundColor: isLast ? POI_PALETTE.pink : POI_PALETTE.pillGray },
              ]}
            />
            <Text style={isLast ? S.stepTextHighlight : S.stepText}>
              {idx + 1}.{"  "}
              {step}
            </Text>
          </View>
        );
      })}

      {/* ETA */}
      <View style={S.etaRow}>
        <View style={S.etaBadge}>
          <Text style={S.etaText}>~{estimatedMinutes} min</Text>
        </View>
        <Text style={S.etaLabel}>estimated walk</Text>
      </View>

      {/* Tap hint */}
      <View style={S.tapHintCard}>
        <Text style={S.tapHintText}>
          Tap any POI marker on the map to set as destination.
        </Text>
      </View>
      </ScrollView>
    </View>
  );
};

//helpers 

function getCategoryIcon(
  cat: POICategory,
): keyof typeof Ionicons.glyphMap {
  switch (cat) {
    case "LAB":
      return "desktop-outline";
    case "ROOM":
      return "business-outline";
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

export default IndoorDirectionsPanel;
