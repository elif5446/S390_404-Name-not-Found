// import React from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   Pressable,
//   TouchableOpacity,
//   ScrollView,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";

// type IndoorHotspot = {
//   id: string;
//   x: number;
//   y: number;
//   floorLevel: number;
//   label: string;
// };

// type IndoorDestination = {
//   id: string;
//   x: number;
//   y: number;
//   floorLevel: number;
//   label?: string;
// };

// interface Props {
//   searchQuery: string;
//   setSearchQuery: (value: string) => void;
//   showSearchResults: boolean;
//   setShowSearchResults: (value: boolean) => void;
//   filteredRooms: IndoorHotspot[];
//   onSelectDestination: (item: IndoorDestination) => void;
//   onClearDestination: () => void;
//   onExit: () => void;
// }

// const IndoorBottomPanel: React.FC<Props> = ({
//   searchQuery,
//   setSearchQuery,
//   showSearchResults,
//   setShowSearchResults,
//   filteredRooms,
//   onSelectDestination,
//   onClearDestination,
//   onExit,
// }) => {
//   return (
//     <View
//       style={{
//         position: "absolute",
//         left: 16,
//         right: 16,
//         bottom: 24,
//         zIndex: 50,
//         elevation: 12,
//       }}
//     >
//       <View
//         style={{
//           backgroundColor: "#F6F3EE",
//           borderRadius: 24,
//           padding: 14,
//           borderWidth: 1,
//           borderColor: "#E4DDD3",
//         }}
//       >
//         <View style={{ gap: 12 }}>
//           <View
//             style={{
//               backgroundColor: "#F2EFEB",
//               borderRadius: 18,
//               paddingHorizontal: 16,
//               paddingVertical: 16,
//               flexDirection: "row",
//               alignItems: "center",
//               justifyContent: "space-between",
//             }}
//           >
//             <Text
//               style={{
//                 fontSize: 18,
//                 fontWeight: "700",
//                 color: "#E5486B",
//               }}
//             />
//             <Text
//               style={{
//                 fontSize: 16,
//                 color: "#9C948B",
//               }}
//             >
//               Start
//             </Text>
//           </View>

//           <View
//             style={{
//               backgroundColor: "#F2EFEB",
//               borderRadius: 18,
//               paddingHorizontal: 16,
//               paddingVertical: 12,
//               flexDirection: "row",
//               alignItems: "center",
//               justifyContent: "space-between",
//             }}
//           >
//             <View style={{ flex: 1 }}>
//               <TextInput
//                 value={searchQuery}
//                 onChangeText={(text) => {
//                   setSearchQuery(text);
//                   setShowSearchResults(text.trim().length > 0);
//                 }}
//                 placeholder=""
//                 editable
//                 autoCorrect={false}
//                 autoCapitalize="none"
//                 style={{
//                   fontSize: 18,
//                   fontWeight: "700",
//                   color: "#E5486B",
//                   paddingVertical: 0,
//                 }}
//               />
//             </View>

//             <View
//               style={{
//                 flexDirection: "row",
//                 alignItems: "center",
//               }}
//             >
//               <Text
//                 style={{
//                   fontSize: 16,
//                   color: "#9C948B",
//                   marginRight: 12,
//                 }}
//               >
//                 Destination
//               </Text>

//               <TouchableOpacity
//                 activeOpacity={0.8}
//                 style={{
//                   width: 38,
//                   height: 38,
//                   borderRadius: 19,
//                   backgroundColor: "#E5486B",
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//               >
//                 <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>

//         {showSearchResults && filteredRooms.length > 0 && (
//           <View
//             style={{
//               marginTop: 10,
//               backgroundColor: "#FFFFFF",
//               borderRadius: 14,
//               borderWidth: 1,
//               borderColor: "#E3DDD4",
//               maxHeight: 160,
//               overflow: "hidden",
//             }}
//           >
//             <ScrollView keyboardShouldPersistTaps="always">
//               {filteredRooms.map((room) => (
//                 <Pressable
//                   key={room.id}
//                   onPress={() =>
//                     onSelectDestination({
//                       id: room.id,
//                       x: room.x,
//                       y: room.y,
//                       floorLevel: room.floorLevel,
//                       label: room.label,
//                     })
//                   }
//                   style={{
//                     paddingHorizontal: 14,
//                     paddingVertical: 12,
//                     borderBottomWidth: 1,
//                     borderBottomColor: "#F0ECE6",
//                   }}
//                 >
//                   <Text
//                     style={{
//                       fontSize: 14,
//                       fontWeight: "600",
//                       color: "#3C3732",
//                     }}
//                   >
//                     {room.label}
//                   </Text>
//                   <Text
//                     style={{
//                       fontSize: 12,
//                       color: "#8A837A",
//                       marginTop: 2,
//                     }}
//                   >
//                     Floor {room.floorLevel}
//                   </Text>
//                 </Pressable>
//               ))}
//             </ScrollView>
//           </View>
//         )}

//         <View
//           style={{
//             flexDirection: "row",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginTop: 14,
//           }}
//         >
//           <TouchableOpacity
//             activeOpacity={0.8}
//             style={{
//               flexDirection: "row",
//               alignItems: "center",
//               backgroundColor: "#ECE6DD",
//               borderRadius: 14,
//               paddingHorizontal: 14,
//               paddingVertical: 10,
//               opacity: 0.7,
//             }}
//           >
//             <Ionicons name="swap-vertical-outline" size={18} color="#7A746C" />
//             <Text
//               style={{
//                 marginLeft: 8,
//                 color: "#7A746C",
//                 fontWeight: "600",
//               }}
//             >
//               Directions
//             </Text>
//           </TouchableOpacity>

//           <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
//             {searchQuery.length > 0 && (
//               <Pressable onPress={onClearDestination}>
//                 <Ionicons name="close-circle" size={20} color="#9A948C" />
//               </Pressable>
//             )}

//             <TouchableOpacity
//               onPress={onExit}
//               activeOpacity={0.8}
//               style={{
//                 flexDirection: "row",
//                 alignItems: "center",
//                 backgroundColor: "#D9385E",
//                 borderRadius: 14,
//                 paddingHorizontal: 14,
//                 paddingVertical: 10,
//               }}
//             >
//               <Ionicons name="close" size={18} color="#FFFFFF" />
//               <Text
//                 style={{
//                   marginLeft: 8,
//                   color: "#FFFFFF",
//                   fontWeight: "600",
//                 }}
//               >
//                 Exit
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </View>
//   );
// };

// export default IndoorBottomPanel;
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

type IndoorHotspot = {
  id: string;
  x: number;
  y: number;
  floorLevel: number;
  label: string;
};

type IndoorDestination = {
  id: string;
  x: number;
  y: number;
  floorLevel: number;
  label?: string;
};

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
  onClearDestination,
  onExit,
}) => {
  const [isDestinationFocused, setIsDestinationFocused] = useState(false);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 24,
        zIndex: 50,
        elevation: 12,
      }}
    >
      <View
        pointerEvents="auto"
        style={{
          backgroundColor: "#F6F3EE",
          borderRadius: 24,
          padding: 14,
          borderWidth: 1,
          borderColor: "#E4DDD3",
        }}
      >
        <View style={{ gap: 12 }}>
          {/* START CARD */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderWidth: 1.5,
              borderColor: "#E4DDD3",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 3 },
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#E5486B",
              }}
            />

            <Text
              style={{
                fontSize: 16,
                color: "#9C948B",
              }}
            >
              Start
            </Text>
          </View>

          {/* DESTINATION CARD */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderWidth: 1.5,
              borderColor: isDestinationFocused ? "#E5486B" : "#E4DDD3",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 3 },
            }}
          >
            <View style={{ flex: 1 }}>
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
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#E5486B",
                  paddingVertical: 0,
                }}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: "#9C948B",
                  marginRight: 12,
                }}
              >
                Destination
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: "#E5486B",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {showSearchResults && filteredRooms.length > 0 && (
          <View
            style={{
              marginTop: 10,
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#E3DDD4",
              maxHeight: 160,
              overflow: "hidden",
            }}
          >
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
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F0ECE6",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#3C3732",
                    }}
                  >
                    {room.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#8A837A",
                      marginTop: 2,
                    }}
                  >
                    Floor {room.floorLevel}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 14,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#ECE6DD",
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
              opacity: 0.7,
            }}
          >
            <Ionicons name="swap-vertical-outline" size={18} color="#7A746C" />
            <Text
              style={{
                marginLeft: 8,
                color: "#7A746C",
                fontWeight: "600",
              }}
            >
              Directions
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {searchQuery.length > 0 && (
              <Pressable onPress={onClearDestination}>
                <Ionicons name="close-circle" size={20} color="#9A948C" />
              </Pressable>
            )}

            <TouchableOpacity
              onPress={onExit}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#D9385E",
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Ionicons name="close" size={18} color="#FFFFFF" />
              <Text
                style={{
                  marginLeft: 8,
                  color: "#FFFFFF",
                  fontWeight: "600",
                }}
              >
                Exit
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default IndoorBottomPanel;