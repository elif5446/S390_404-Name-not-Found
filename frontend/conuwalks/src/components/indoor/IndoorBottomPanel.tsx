import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";
import { bottomPanelStyles as styles } from "./styles/IndoorBottomPanel.styles";

interface Props {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  showSearchResults: boolean;
  setShowSearchResults: (value: boolean) => void;
  filteredRooms: IndoorHotspot[];
  onSelectDestination: (item: IndoorDestination) => void;
  onClearDestination: () => void;
  onExit: () => void;
}

const IndoorBottomPanel: React.FC<Props> = ({
  searchQuery,
  setSearchQuery,
  showSearchResults,
  setShowSearchResults,
  filteredRooms,
  onSelectDestination,
  onExit,
}) => {
  const [isDestinationFocused, setIsDestinationFocused] = useState(false);

  return (
    <View pointerEvents="box-none" style={styles.outerContainer}>
      <View pointerEvents="auto" style={styles.panelContainer}>
        <View style={styles.cardsWrapper}>
          <View style={styles.startCard}>
            <Text style={styles.startValueText} />
            <Text style={styles.cardLabelText}>Start</Text>
          </View>

          <View
            style={[
              styles.destinationCard,
              isDestinationFocused
                ? styles.destinationCardFocusedBorder
                : styles.destinationCardDefaultBorder,
            ]}
          >
            <View style={styles.destinationInputWrapper}>
              <TextInput
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setShowSearchResults(text.trim().length > 0);
                }}
                onFocus={() => setIsDestinationFocused(true)}
                onBlur={() => setIsDestinationFocused(false)}
                placeholder=""
                editable
                autoCorrect={false}
                autoCapitalize="none"
                style={styles.destinationInput}
              />
            </View>

            <View style={styles.destinationRightSide}>
              {searchQuery.length === 0 && (
              <Text style={styles.destinationLabel}>Destination</Text>
              )}
              <TouchableOpacity activeOpacity={0.8} style={styles.arrowButton}>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {showSearchResults && filteredRooms.length > 0 && (
          <View style={styles.resultsContainer}>
            <ScrollView keyboardShouldPersistTaps="always">
              {filteredRooms.map((room) => (
                <Pressable
                  key={room.id}
                  onPress={() =>
                    onSelectDestination({
                      id: room.id,
                      x: room.x,
                      y: room.y,
                      floorLevel: room.floorLevel,
                      label: room.label,
                    })
                  }
                  style={styles.resultItem}
                >
                  <Text style={styles.resultTitle}>{room.label}</Text>
                  <Text style={styles.resultSubtitle}>
                    Floor {room.floorLevel}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity activeOpacity={0.8} style={styles.directionsButton}>
            <Ionicons
              name="swap-vertical-outline"
              size={18}
              color="#7A746C"
            />
          
            <Text style={styles.directionsText}>Directions</Text>
          </TouchableOpacity>

          <View style={styles.rightActions}>
            <TouchableOpacity
              onPress={onExit}
              activeOpacity={0.8}
              style={styles.exitButton}
            >
              <Ionicons name="close" size={18} color="#FFFFFF" />
              <Text style={styles.exitText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default IndoorBottomPanel;