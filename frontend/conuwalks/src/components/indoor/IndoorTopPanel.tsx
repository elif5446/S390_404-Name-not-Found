
// import React from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   Pressable,
//   TouchableOpacity,
//   ScrollView,
//   Keyboard,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";
// import { bottomPanelStyles as styles } from "@/src/components/indoor/styles/IndoorTopPanel.styles";

// interface Props {
//   searchQuery: string;
//   setSearchQuery: (value: string) => void;
//   showSearchResults: boolean;
//   setShowSearchResults: (value: boolean) => void;
//   filteredRooms: IndoorHotspot[];
//   onSelectDestination: (item: IndoorDestination) => void;
//   onClearDestination: () => void;
// }

// const IndoorBottomPanel: React.FC<Props> = ({
//   searchQuery,
//   setSearchQuery,
//   showSearchResults,
//   setShowSearchResults,
//   filteredRooms,
//   onSelectDestination,
//   onClearDestination,
// }) => {
//   return (
//     <View style={styles.container} pointerEvents="box-none">
//       <View style={styles.panel}>
//         <View style={styles.inputContainer}>
//           <Ionicons
//             name="ellipse"
//             size={10}
//             color="#C2185B"
//             style={styles.inputIcon}
//           />
//           <TextInput
//             style={styles.input}
//             placeholder="Start"
//             placeholderTextColor="#A0A0A0"
//             editable={false}
//             value="Current position"
//           />
//         </View>

//         <View style={styles.connectorLine} />

//         <View style={styles.inputContainer}>
//           <Ionicons
//             name="location"
//             size={16}
//             color="#C2185B"
//             style={styles.inputIcon}
//           />

//           <TextInput
//             style={styles.input}
//             placeholder="Destination"
//             placeholderTextColor="#A0A0A0"
//             value={searchQuery}
//             onChangeText={(text) => {
//               setSearchQuery(text);
//               const hasText = text.trim().length > 0;
//               setShowSearchResults(hasText);
//               if (!hasText) {
//                 onClearDestination();
//               }
//             }}
//             onFocus={() => {
//               if(searchQuery.length > 0){
//               setShowSearchResults(true);
//               }
//             }}
//             returnKeyType="search"
//           />

//           {searchQuery.length > 0 && (
//             <TouchableOpacity
//               onPress={() => {
//                 setSearchQuery("");
//                 setShowSearchResults(false);
//                 onClearDestination();
//               }}
//               hitSlop={10}
//             >
//               <Ionicons name="close-circle" size={17} color="#C2185B" />
//             </TouchableOpacity>
//           )}
//         </View>

//         {showSearchResults && (
//           <View style={styles.resultsContainer}>
//             {filteredRooms.length > 0 ? (
//               <ScrollView
//                 keyboardShouldPersistTaps="handled"
//                 nestedScrollEnabled
//                 showsVerticalScrollIndicator={false}
//               >
//                 {filteredRooms.map((room) => (
//                   <Pressable
//                     key={room.id}
//                     style={styles.resultItem}
//                     onPress={() => {
//                       onSelectDestination(room as IndoorDestination);
//                       setShowSearchResults(false);
//                       Keyboard.dismiss();
//                     }}
//                   >
//                     <Ionicons
//                       name="search"
//                       size={14}
//                       color="#C2185B"
//                       style={styles.resultIcon}
//                     />

//                     <View style={styles.resultTextContainer}>
//                       <Text style={styles.resultTitle}>{room.label ?? room.id}</Text>
//                       {"floorLevel" in room && room.floorLevel !== undefined ? (
//                         <Text style={styles.resultSubtitle}>
//                           Floor {room.floorLevel}
//                         </Text>
//                       ) : null}
//                     </View>
//                   </Pressable>
//                 ))}
//               </ScrollView>
//             ) : (
//               <View style={styles.emptyContainer}>
//                 <Text style={styles.emptyText}>No matching rooms found</Text>
//               </View>
//             )}
//           </View>
//         )}
//       </View>
//     </View>
//   );
// };

// export default IndoorBottomPanel;
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
  onClearSelection: () => void;

  startLabel: string;
  destinationLabel: string;
  activeField: "start" | "destination";
  onFocusField: (field: "start" | "destination") => void;
}

const IndoorBottomPanel: React.FC<Props> = ({
  searchQuery,
  setSearchQuery,
  showSearchResults,
  setShowSearchResults,
  searchResults,
  onSelectResult,
  onClearSelection,
  startLabel,
  destinationLabel,
  activeField,
  onFocusField,
}) => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.panel}>
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
              if (searchQuery.length > 0) setShowSearchResults(true);
            }}
            onChangeText={(text) => {
              onFocusField("start");
              setSearchQuery(text);
              const hasText = text.trim().length > 0;
              setShowSearchResults(hasText);
              if (!hasText) onClearSelection();
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
              if (searchQuery.length > 0) setShowSearchResults(true);
            }}
            onChangeText={(text) => {
              onFocusField("destination");
              setSearchQuery(text);
              const hasText = text.trim().length > 0;
              setShowSearchResults(hasText);
              if (!hasText) onClearSelection();
            }}
            returnKeyType="search"
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setShowSearchResults(false);
                onClearSelection();
              }}
              hitSlop={10}
            >
              <Ionicons name="close-circle" size={17} color="#C2185B" />
            </TouchableOpacity>
          )}
        </View>

        {showSearchResults && (
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