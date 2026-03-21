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
import { bottomPanelStyles as styles } from "@/src/components/indoor/styles/IndoorTopPanel.styles";
import { POICategory } from "@/src/types/poi";
import { CATEGORY_LABELS } from "@/src/data/poiData";

export type IndoorSearchResult = {
  id: string;
  label: string;
  floorLevel: number;
  x: number;
  y: number;
  type: "room" | "poi";
  room?: string;
};

interface Props {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  showSearchResults: boolean;
  setShowSearchResults: (value: boolean) => void;
  searchResults: IndoorSearchResult[];
  onSelectResult: (item: IndoorSearchResult) => void;
  onClearDestination: () => void;

  startLabel: string;
  destinationLabel: string;
  activeField: "start" | "destination";
  onFocusField: (field: "start" | "destination") => void;

  onDirectionsPress: () => void;
  canShowDirections: boolean;

  categories: POICategory[];
  activeCategories: Set<POICategory>;
  onToggleCategory: (cat: POICategory) => void;
}

const IndoorBottomPanel: React.FC<Props> = ({
  searchQuery,
  setSearchQuery,
  showSearchResults,
  setShowSearchResults,
  searchResults,
  onSelectResult,
  onClearDestination,
  startLabel,
  destinationLabel,
  activeField,
  onFocusField,
  onDirectionsPress,
  canShowDirections,
  categories,
  activeCategories,
  onToggleCategory,
}) => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={[styles.panel, { overflow: "visible", position: "relative" }]}>
        <View
          style={[
            styles.inputContainer,
            activeField === "start" && {
              borderWidth: 1,
              borderColor: "#3A7BD5",
              backgroundColor: "#F4F8FF",
            },
          ]}
        >
          <Ionicons
            name="ellipse"
            size={10}
            color="#3A7BD5"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Start"
            placeholderTextColor="#A0A0A0"
            value={activeField === "start" ? searchQuery : startLabel}
            onFocus={() => {
              onFocusField("start");
              setShowSearchResults(false);
            }}
            onChangeText={(text) => {
              onFocusField("start");
              setSearchQuery(text);
              const hasText = text.trim().length > 0;
              setShowSearchResults(hasText);
            }}
            returnKeyType="search"
          />
        </View>

        <View style={styles.connectorLine} />

        <View
          style={[
            styles.inputContainer,
            activeField === "destination" && {
              borderWidth: 1,
              borderColor: "#C2185B",
              backgroundColor: "#FFF4F8",
            },
          ]}
        >
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
            value={activeField === "destination" ? searchQuery : destinationLabel}
            onFocus={() => {
              onFocusField("destination");
              setShowSearchResults(false);
            }}
            onChangeText={(text) => {
              onFocusField("destination");
              setSearchQuery(text);
              const hasText = text.trim().length > 0;
              setShowSearchResults(hasText);
              if (!hasText && activeField === "destination") {
                onClearDestination();
              }
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

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1, marginRight: 8 }}
            contentContainerStyle={{
              alignItems: "center",
              paddingRight: 8,
              gap: 6,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: "#8A8A8A",
              }}
            >
              SHOW
            </Text>

            {categories.map((cat) => {
              const isActive = activeCategories.has(cat);

              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => onToggleCategory(cat)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Filter ${CATEGORY_LABELS[cat]}`}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 12,
                    backgroundColor: isActive ? "#FCE4EC" : "#F2F2F2",
                    borderWidth: 1,
                    borderColor: isActive ? "#C2185B" : "#E0E0E0",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: isActive ? "#C2185B" : "#666666",
                    }}
                  >
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={onDirectionsPress}
            disabled={!canShowDirections}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: canShowDirections ? "#C2185B" : "#D8D8D8",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 5,
            }}
          >
            <Ionicons name="return-up-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

    {showSearchResults && searchQuery.trim().length > 0 && (
       <View style={styles.resultsContainer}>
        {searchResults.length > 0 ? (
       <ScrollView
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {searchResults.map((item) => (
          <Pressable
            key={`${item.type}-${item.id}`}
            style={styles.resultItem}
            onPress={() => {
              onSelectResult(item);
              setShowSearchResults(false);
              Keyboard.dismiss();
            }}
          >
            <Ionicons
              name={item.type === "poi" ? "location-outline" : "search"}
              size={14}
              color={activeField === "start" ? "#3A7BD5" : "#C2185B"}
              style={styles.resultIcon}
            />

            <View style={styles.resultTextContainer}>
              <Text style={styles.resultTitle}>{item.label}</Text>
              <Text style={styles.resultSubtitle}>
                Floor {item.floorLevel} • {item.type === "poi" ? "POI" : "Room"}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
         ) : (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No matching results found</Text>
      </View>
         )}
       </View>
      )}
      </View>
    </View>
  );
};

export default IndoorBottomPanel;