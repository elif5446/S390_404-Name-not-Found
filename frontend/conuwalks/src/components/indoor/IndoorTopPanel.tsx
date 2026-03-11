
import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";
import { bottomPanelStyles as styles } from "./styles/IndoorTopPanel.styles";

interface Props {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  showSearchResults: boolean;
  setShowSearchResults: (value: boolean) => void;
  filteredRooms: IndoorHotspot[];
  onSelectDestination: (item: IndoorDestination) => void;
  onClearDestination: () => void;
}

const IndoorBottomPanel: React.FC<Props> = ({
  searchQuery,
  setSearchQuery,
  showSearchResults,
  setShowSearchResults,
  filteredRooms,
  onSelectDestination,
  onClearDestination,
}) => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.panel}>
        <View style={styles.inputContainer}>
          <Ionicons
            name="ellipse"
            size={10}
            color="#C2185B"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Start"
            placeholderTextColor="#A0A0A0"
            editable={false}
            value="Current position"
          />
        </View>

        <View style={styles.connectorLine} />

        <View style={styles.inputContainer}>
          <Ionicons
            name="location"
            size={16}
            color="#C2185B"
            style={styles.inputIcon}
          />

          <TextInput
            style={styles.input}
            placeholder="Destination"
            placeholderTextColor="#A0A0A0"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowSearchResults(true);
            }}
            onFocus={() => {
              setShowSearchResults(true);
            }}
            returnKeyType="search"
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setShowSearchResults(false);
                onClearDestination();
              }}
              hitSlop={10}
            >
              <Ionicons name="close-circle" size={17} color="#C2185B" />
            </TouchableOpacity>
          )}
        </View>

        {showSearchResults && (
          <View style={styles.resultsContainer}>
            {filteredRooms.length > 0 ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {filteredRooms.map((room) => (
                  <Pressable
                    key={room.id}
                    style={styles.resultItem}
                    onPress={() => {
                      onSelectDestination(room as IndoorDestination);
                      setShowSearchResults(false);
                      Keyboard.dismiss();
                    }}
                  >
                    <Ionicons
                      name="search"
                      size={14}
                      color="#C2185B"
                      style={styles.resultIcon}
                    />

                    <View style={styles.resultTextContainer}>
                      <Text style={styles.resultTitle}>{room.label ?? room.id}</Text>
                      {"floorLevel" in room && room.floorLevel !== undefined ? (
                        <Text style={styles.resultSubtitle}>
                          Floor {room.floorLevel}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No matching rooms found</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default IndoorBottomPanel;