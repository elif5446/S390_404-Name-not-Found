import { BlurView } from "expo-blur";
import {
  TextInput,
  View,
  InputAccessoryView,
  ScrollView,
  TouchableOpacity,
  Text,
  Keyboard,
  Platform,
} from "react-native";
import styles from "../styles/directionsSearchPanel";
import { LatLng } from "react-native-maps";
import { SGWBuildingSearchMetadata } from "../data/metadata/SGW.BuildingMetaData";
import { LoyolaBuildingSearchMetadata } from "../data/metadata/LOY.BuildingMetadata";
import { useEffect, useState } from "react";
import {
  processStartPointSearch,
  processDestinationSearch,
  searchStartPoint,
  searchDestination,
} from "../utils/searchbar";
import { guessRoomLocation, guessFutureRoomLocation } from "../utils/schedule";
import { useGoogleCalendar } from "../hooks/useGoogleCalendar";
import { useBuildingEvents } from "../hooks/useBuildingEvents";
import { useUserLocation } from "../hooks/useUserLocation";
import BuildingTheme from "../styles/BuildingTheme";
import { SymbolView, SFSymbol } from "expo-symbols";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface SuggestionIconProps {
  iosName: SFSymbol;
  androidName: React.ComponentProps<typeof MaterialIcons>["name"];
  color: string;
}

const SuggestionIcon = ({
  iosName,
  androidName,
  color,
}: SuggestionIconProps) => {
  if (Platform.OS === "ios") {
    return (
      <SymbolView
        name={iosName}
        size={20}
        tintColor={color}
        fallback={<MaterialIcons name={androidName} size={20} color={color} />}
      />
    );
  }
  return <MaterialIcons name={androidName} size={20} color={color} />;
};

interface DirectionsSearchProps {
  startBuildingId: string | null;
  startRoom: string | null;
  setStartPoint: (
    buildingId: string,
    coords: LatLng,
    label: string,
    room?: string | null,
  ) => void;
  destinationBuildingId: string | null;
  destinationRoom: string | null;
  destinationLabel?: string | null;
  setDestination: (
    buildingId: string,
    coords: LatLng,
    label: string,
    room?: string | null,
  ) => void;
  userLocationBuildingId: string | null;
  isIndoorView?: boolean;
}

const DirectionsSearchPanel: React.FC<DirectionsSearchProps> = ({
  startBuildingId,
  startRoom,
  setStartPoint,
  destinationBuildingId,
  destinationRoom,
  destinationLabel, 
  setDestination,
  userLocationBuildingId,
  isIndoorView = false,
}) => {
  const { events, fetchUpcomingEvents } = useGoogleCalendar();
  const { todayEvents, refresh } = useBuildingEvents(
    userLocationBuildingId ?? "",
    SGWBuildingSearchMetadata[userLocationBuildingId ?? ""] ? "SGW" : "LOY",
  );
  const [startPointText, setStartPointText] = useState(
    `${SGWBuildingSearchMetadata[startBuildingId || guessRoomLocation(events)?.buildingCode || ""]?.name || LoyolaBuildingSearchMetadata[startBuildingId || guessRoomLocation(events)?.buildingCode || ""]?.name || SGWBuildingSearchMetadata[guessRoomLocation(events)?.buildingCode || ""]?.name || LoyolaBuildingSearchMetadata[guessRoomLocation(events)?.buildingCode || ""]?.name || ""} ${startRoom || guessRoomLocation(events)?.roomNumber || ""}`.trim(),
  );
  const [stableStartPointText, setStableStartPointText] =
    useState(startPointText);
  const [destinationText, setDestinationText] = useState(
    `${SGWBuildingSearchMetadata[destinationBuildingId || guessFutureRoomLocation(events)?.buildingCode || ""]?.name || LoyolaBuildingSearchMetadata[destinationBuildingId || guessFutureRoomLocation(events)?.buildingCode || ""]?.name || SGWBuildingSearchMetadata[guessFutureRoomLocation(events)?.buildingCode || ""]?.name || LoyolaBuildingSearchMetadata[guessFutureRoomLocation(events)?.buildingCode || ""]?.name || ""} ${destinationRoom || guessFutureRoomLocation(events)?.roomNumber || ""}`.trim(),
  );
  const [stableDestinationText, setStableDestinationText] =
    useState(destinationText);
  const [destinationIsHidden, setDestinationIsHidden] = useState<
    boolean | null
  >(null);
  const [startPointSelection, setStartPointSelection] = useState({
    start: 0,
    end: 0,
  });
  const [destinationSelection, setDestinationSelection] = useState({
    start: 0,
    end: 0,
  });
  const [isAndroidKeyboardVisible, setIsAndroidKeyboardVisible] =
    useState(false);
  const { location } = useUserLocation();
  const INPUT_ACCESSORY_VIEW_ID = "Directions Search";
  const CURRENT_LOCATION = "Current Location";

  useEffect(() => {
    refresh();
    fetchUpcomingEvents();
    if (startPointText.length === 0) {
      setStartPointText(CURRENT_LOCATION);
      setStableStartPointText(CURRENT_LOCATION);
    }
    if (destinationText.length === 0) {
      setDestinationText(CURRENT_LOCATION);
      setStableDestinationText(CURRENT_LOCATION);
    }
  }, []);

  // sync local text state when global destination changes (e.g., from Indoor Map room select)
  useEffect(() => {
      // 1. POI/custom label first
      console.log('DEBUG:', { destinationLabel, destinationBuildingId });
  
  if (destinationLabel) {
    console.log('Using POI name:', destinationLabel);

    setDestinationText(destinationLabel);
    setStableDestinationText(destinationLabel);
    return;
  }

  // 2. POI fallback
  if (destinationBuildingId?.startsWith("POI-")) {
    setDestinationText("Outdoor POI");
    setStableDestinationText("Outdoor POI");
    return;
  }
    const buildingName =
      SGWBuildingSearchMetadata[destinationBuildingId || ""]?.name ||
      LoyolaBuildingSearchMetadata[destinationBuildingId || ""]?.name ||
      "";

    if (buildingName) {
      const newText = `${buildingName} ${destinationRoom || ""}`.trim();
      setDestinationText(newText);
      setStableDestinationText(newText);
    } else if (destinationBuildingId === "USER") {
      setDestinationText(CURRENT_LOCATION);
      setStableDestinationText(CURRENT_LOCATION);
    }
  }, [destinationLabel, destinationBuildingId, destinationRoom]);  // ✅ ADD destinationLabel

  // also sync the start text just in case it's changed externally
  useEffect(() => {
    const buildingName =
      SGWBuildingSearchMetadata[startBuildingId || ""]?.name ||
      LoyolaBuildingSearchMetadata[startBuildingId || ""]?.name ||
      "";

    if (buildingName) {
      const newText = `${buildingName} ${startRoom || ""}`.trim();
      setStartPointText(newText);
      setStableStartPointText(newText);
    } else if (startBuildingId === "USER" || startBuildingId === "") {
      setStartPointText(CURRENT_LOCATION);
      setStableStartPointText(CURRENT_LOCATION);
    }
  }, [startBuildingId, startRoom]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    // Listeners for when the keyboard opens and closes
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsAndroidKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsAndroidKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const setPoint = (newPoint: {
    buildingName: string;
    roomNumber: string | null;
    isLocation: boolean;
  }) => {
    const buildingId =
      Object.keys(SGWBuildingSearchMetadata).find(
        (buildingId) =>
          SGWBuildingSearchMetadata[buildingId]?.name.trim().toLowerCase() ===
          newPoint.buildingName.trim().toLowerCase(),
      ) ||
      Object.keys(LoyolaBuildingSearchMetadata).find(
        (buildingId) =>
          LoyolaBuildingSearchMetadata[buildingId]?.name
            .trim()
            .toLowerCase() === newPoint.buildingName.trim().toLowerCase(),
      );
    return {
      properSearch: buildingId
        ? `${newPoint.buildingName} ${newPoint.roomNumber || ""}`.trim()
        : "",
      buildingId: buildingId ?? "",
    };
  };

  const enterStartPoint = () => {
    setDestinationIsHidden(null);
    const newStartPoint = processStartPointSearch(startPointText, todayEvents);
    if (newStartPoint) {
      if (
        newStartPoint.buildingName.trim().toLowerCase() === "current" &&
        newStartPoint.roomNumber?.trim().toLowerCase() === "location" &&
        newStartPoint.isLocation
      ) {
        if (!location) return;
        setStartPoint("", location, "", "");
        setStartPointText(CURRENT_LOCATION);
        setStableStartPointText(CURRENT_LOCATION);
      } else {
        const { properSearch, buildingId } = setPoint(newStartPoint);
        if (!properSearch || !buildingId) return;
        setStartPoint(
          buildingId,
          SGWBuildingSearchMetadata[buildingId]?.coordinates ||
            LoyolaBuildingSearchMetadata[buildingId]?.coordinates,
          newStartPoint.buildingName,
          newStartPoint.roomNumber,
        );
        setStartPointText(properSearch);
        setStableStartPointText(properSearch);
      }
    } else {
      setStartPointText(stableStartPointText);
    }
  };
  const enterDestination = () => {
    setDestinationIsHidden(null);
    const newDestination = processDestinationSearch(destinationText, events);
    if (newDestination) {
      const { properSearch, buildingId } = setPoint(newDestination);
      if (!properSearch || !buildingId) return;
      setDestination(
        buildingId,
        SGWBuildingSearchMetadata[buildingId]?.coordinates ||
          LoyolaBuildingSearchMetadata[buildingId]?.coordinates,
        newDestination.buildingName,
        newDestination.roomNumber,
      );
      setDestinationText(properSearch);
      setStableDestinationText(properSearch);
    } else {
      setDestinationText(stableDestinationText);
    }
  };

  const insertStartPointBuildingName = (buildingName: string) => {
    const left = startPointText.substring(0, startPointSelection.start);
    const right = startPointText.substring(startPointSelection.end);
    setStartPointText(left + buildingName + right);
  };
  const insertDestinationBuildingName = (buildingName: string) => {
    const left = destinationText.substring(0, destinationSelection.start);
    const right = destinationText.substring(destinationSelection.end);
    setDestinationText(left + buildingName + right);
  };

  const accessoryViewContent = (
    <View style={styles.accessoryContainer}>
      <View style={styles.scrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {SGWBuildingSearchMetadata[
            startBuildingId ?? destinationBuildingId ?? ""
          ]
            ? ["MB", "FG", "FB", "LS", "CL", "EV"].map((id) => (
                <TouchableOpacity
                  key={id}
                  onPress={() =>
                    destinationIsHidden === true
                      ? insertStartPointBuildingName(
                          SGWBuildingSearchMetadata[id]?.name ?? id,
                        )
                      : insertDestinationBuildingName(
                          SGWBuildingSearchMetadata[id]?.name ?? id,
                        )
                  }
                  style={[styles.buildingButton, { paddingHorizontal: 10 }]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Insert ${SGWBuildingSearchMetadata[id]?.name ?? id} into the searchbar`}
                  accessibilityHint="Tap to quickly add the complete name of this building to your search"
                >
                  <Text
                    style={[
                      styles.buildingButtonText,
                      {
                        color:
                          BuildingTheme.SGW[
                            id as keyof typeof BuildingTheme.SGW
                          ] ?? "#000000",
                      },
                    ]}
                  >
                    {id}
                  </Text>
                </TouchableOpacity>
              ))
            : ["VL", "CJ", "SP", "AD", "CC", "HU"].map((id) => (
                <TouchableOpacity
                  key={id}
                  onPress={() =>
                    destinationIsHidden === true
                      ? insertStartPointBuildingName(
                          LoyolaBuildingSearchMetadata[id]?.name ?? id,
                        )
                      : insertDestinationBuildingName(
                          LoyolaBuildingSearchMetadata[id]?.name ?? id,
                        )
                  }
                  style={[styles.buildingButton, { paddingHorizontal: 10 }]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Insert ${LoyolaBuildingSearchMetadata[id]?.name ?? id} into the searchbar`}
                  accessibilityHint="Tap to quickly add the complete name of this building to your search"
                >
                  <Text
                    style={[
                      styles.buildingButtonText,
                      {
                        color:
                          BuildingTheme.LOY[
                            id as keyof typeof BuildingTheme.LOY
                          ] ?? "#000000",
                      },
                    ]}
                  >
                    {id}
                  </Text>
                </TouchableOpacity>
              ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <>
      <View
        style={styles.glassWrapper}
        pointerEvents={isIndoorView ? "none" : "auto"}
      >
        <BlurView
          intensity={80}
          tint="light"
          style={[
            styles.blurContainer,
            {
              gap: destinationIsHidden ? 0 : 10,
              paddingBottom: destinationIsHidden ? 5 : 15,
            },
          ]}
        >
          {destinationIsHidden !== false && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <SuggestionIcon
                iosName="circle.circle.fill"
                androidName="adjust"
                color={"#B03060"}
              />
              <TextInput
                style={[styles.input, isIndoorView && styles.disabledInput]}
                placeholder="Start Point"
                value={startPointText}
                editable={!isIndoorView}
                onChangeText={(text) => setStartPointText(text)}
                clearButtonMode="while-editing"
                onBlur={() => enterStartPoint()}
                onFocus={() => setDestinationIsHidden(true)}
                onSelectionChange={(event) =>
                  setStartPointSelection(event.nativeEvent.selection)
                }
                inputAccessoryViewID={INPUT_ACCESSORY_VIEW_ID}
                spellCheck={false}
                autoCorrect={false}
                selectionColor="#B03060"
                accessibilityLabel="Start Point"
                accessibilityHint="Enter the building and optionally the room you are starting from"
              />
            </View>
          )}
          {destinationIsHidden === null && (
            <View style={[styles.listSuggestion, { paddingVertical: 0 }]} />
          )}
          {destinationIsHidden !== true && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
              accessible={false}
            >
              <SuggestionIcon
                iosName="pin.fill"
                androidName="location-on"
                color={"#B03060"}
              />
              <TextInput
                style={[styles.input, isIndoorView && styles.disabledInput]}
                placeholder="Destination"
                value={destinationText}
                editable={!isIndoorView}
                onChangeText={(text) => setDestinationText(text)}
                onBlur={() => enterDestination()}
                onFocus={() => setDestinationIsHidden(false)}
                onSelectionChange={(event) =>
                  setDestinationSelection(event.nativeEvent.selection)
                }
                inputAccessoryViewID={INPUT_ACCESSORY_VIEW_ID}
                spellCheck={false}
                autoCorrect={false}
                selectionColor="#B03060"
                accessibilityLabel="Destination"
                accessibilityHint="Enter the building and optionally the room you are heading to"
              />
            </View>
          )}

          {destinationIsHidden === true && (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={styles.listContainer}
            >
              {searchStartPoint(
                startPointText,
                todayEvents,
                userLocationBuildingId,
              ).map((suggestion, index) => {
                const startText =
                  `${suggestion.buildingName} ${suggestion.roomNumber ?? ""}`.trim();
                return (
                  <TouchableOpacity
                    key={`${startText}-${index}`}
                    style={styles.listSuggestion}
                    onPress={() => {
                      setStartPointText(startText);
                      Keyboard.dismiss();
                    }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Set the start point to ${startText}`}
                    accessibilityHint="Tap to select and enter this location"
                  >
                    {suggestion.isLocation && (
                      <SuggestionIcon
                        iosName="location"
                        androidName="near-me"
                        color={
                          "#B03060" +
                          (suggestion.roomNumber &&
                          suggestion.roomNumber !== "Location"
                            ? "80"
                            : "")
                        }
                      />
                    )}
                    <Text
                      style={[
                        styles.listSuggestionText,
                        startText === CURRENT_LOCATION
                          ? { color: "#B03060" }
                          : {},
                      ]}
                    >
                      {startText}
                    </Text>
                    {!!(suggestion.buildingName && !suggestion.roomNumber) && (
                      <TouchableOpacity
                        style={styles.suggestionIconButton}
                        onPress={() => setStartPointText(startText)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Set the searchbar's text to ${startText}`}
                        accessibilityHint="Tap to replace the text input and continue editing"
                      >
                        <SuggestionIcon
                          iosName="arrow.up.backward"
                          androidName="arrow-outward"
                          color="#B03060"
                        />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          {destinationIsHidden === false && (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={styles.listContainer}
            >
              {searchDestination(destinationText, events).map(
                (suggestion, index) => {
                  const destText =
                    `${suggestion.buildingName} ${suggestion.roomNumber ?? ""}`.trim();
                  return (
                    <TouchableOpacity
                      key={`${destText}-${index}`}
                      style={styles.listSuggestion}
                      onPress={() => {
                        setDestinationText(destText);
                        Keyboard.dismiss();
                      }}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Set the destination to ${destText}`}
                      accessibilityHint="Tap to select and enter this location"
                    >
                      <Text style={styles.listSuggestionText}>{destText}</Text>
                      {!!(suggestion.buildingName && !suggestion.roomNumber) && (
                        <TouchableOpacity
                          style={styles.suggestionIconButton}
                          onPress={() => setDestinationText(destText)}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Set the searchbar's text to ${destText}`}
                          accessibilityHint="Tap to replace the text input and continue editing"
                        >
                          <SuggestionIcon
                            iosName="arrow.up.backward"
                            androidName="arrow-outward"
                            color="#B03060"
                          />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                },
              )}
            </ScrollView>
          )}
        </BlurView>
      </View>

      {Platform.OS === "ios" ? (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_VIEW_ID}>
          {accessoryViewContent}
        </InputAccessoryView>
      ) : (
        destinationIsHidden !== null &&
        isAndroidKeyboardVisible && (
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              elevation: 5,
              backgroundColor: "#FFFFFF",
            }}
          >
            {accessoryViewContent}
          </View>
        )
      )}
    </>
  );
};
export default DirectionsSearchPanel;
