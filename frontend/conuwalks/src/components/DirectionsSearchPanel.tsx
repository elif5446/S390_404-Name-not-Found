import { BlurView } from "expo-blur"
import { TextInput, View, InputAccessoryView, ScrollView, TouchableOpacity, Text, Keyboard, Platform } from "react-native"
import styles from "../styles/directionsSearchPanel"
import { LatLng } from "react-native-maps"
import { SGWBuildingSearchMetadata } from "../data/metadata/SGW.BuildingMetaData"
import { LoyolaBuildingSearchMetadata } from "../data/metadata/LOY.BuildingMetadata"
import { useEffect, useState } from "react"
import { processStartPointSearch, processDestinationSearch, searchStartPoint, searchDestination } from "../utils/searchbar"
import { guessRoomLocation, guessFutureRoomLocation } from "../utils/schedule"
import { useGoogleCalendar } from "../hooks/useGoogleCalendar"
import { useBuildingEvents } from "../hooks/useBuildingEvents"
import { useUserLocation } from "../hooks/useUserLocation"
import BuildingTheme from "../styles/BuildingTheme"
import { SymbolView, SFSymbol } from "expo-symbols"; // SF Symbols (iOS)
import MaterialIcons from "@expo/vector-icons/MaterialIcons"; // Material Design Icons (Android)

interface DirectionsSearchProps {
  startBuildingId: string | null;
  startRoom: string | null;
  setStartPoint: (buildingId: string, coords: LatLng, label: string, room?: string | null) => void;
  destinationBuildingId: string | null;
  destinationRoom: string | null;
  setDestination: (buildingId: string, coords: LatLng, label: string, room?: string | null) => void;
  userLocationBuildingId: string | null;
}

const DirectionsSearchPanel: React.FC<DirectionsSearchProps> = ({
        startBuildingId,
        startRoom,
        setStartPoint,
        destinationBuildingId,
        destinationRoom,
        setDestination,
        userLocationBuildingId
    }) => {
    const { events } = useGoogleCalendar();
    const { todayEvents } = useBuildingEvents(userLocationBuildingId ?? "", SGWBuildingSearchMetadata[userLocationBuildingId ?? ""] ? "SGW" : "LOY");
    const [startPointText, setStartPointText] = useState(`${SGWBuildingSearchMetadata[startBuildingId || guessRoomLocation(events)?.buildingCode || ""]?.name || LoyolaBuildingSearchMetadata[startBuildingId || guessRoomLocation(events)?.buildingCode || ""]?.name || SGWBuildingSearchMetadata[guessRoomLocation(events)?.buildingCode || ""]?.name || LoyolaBuildingSearchMetadata[guessRoomLocation(events)?.buildingCode || ""]?.name || ""} ${startRoom || guessRoomLocation(events)?.roomNumber || ""}`.trim());
    const [stableStartPointText, setStableStartPointText] = useState(startPointText);
    const [destinationText, setDestinationText] = useState(`${SGWBuildingSearchMetadata[destinationBuildingId || guessFutureRoomLocation(events)?.buildingCode || ""]?.name || LoyolaBuildingSearchMetadata[destinationBuildingId || guessFutureRoomLocation(events)?.buildingCode || ""]?.name || SGWBuildingSearchMetadata[guessFutureRoomLocation(events)?.buildingCode || ""]?.name || LoyolaBuildingSearchMetadata[guessFutureRoomLocation(events)?.buildingCode || ""]?.name || ""} ${destinationRoom || guessFutureRoomLocation(events)?.roomNumber || ""}`.trim());
    const [stableDestinationText, setStableDestinationText] = useState(destinationText);
    const [destinationIsHidden, setDestinationIsHidden] = useState<boolean | null>(null);
    const [startPointSelection, setStartPointSelection] = useState({ start: 0, end: 0 });
    const [destinationSelection, setDestinationSelection] = useState({ start: 0, end: 0 });
    const { location } = useUserLocation();
    const INPUT_ACCESSORY_VIEW_ID = "Directions Search";
    const CURRENT_LOCATION = "Current Location";

    useEffect(() => {
        if (startPointText.length === 0) {
            setStartPointText(CURRENT_LOCATION);
            setStableStartPointText(CURRENT_LOCATION)
        }
        if (destinationText.length === 0) {
            setDestinationText(CURRENT_LOCATION);
            setStableDestinationText(CURRENT_LOCATION)
        }
    }, [])

    const setPoint = (newPoint: { buildingName: string; roomNumber: string | null; isLocation: boolean }) => {
        const buildingId = Object
            .keys(SGWBuildingSearchMetadata)
            .find(buildingId => SGWBuildingSearchMetadata[buildingId]?.name.trim().toLowerCase() === newPoint.buildingName.trim().toLowerCase())
        || Object
            .keys(LoyolaBuildingSearchMetadata)
            .find(buildingId => LoyolaBuildingSearchMetadata[buildingId]?.name.trim().toLowerCase() === newPoint.buildingName.trim().toLowerCase());
        return {properSearch: buildingId ? `${newPoint.buildingName} ${newPoint.roomNumber || ""}`.trim() : "", buildingId: buildingId ?? ""};
    }

    const enterStartPoint = () => {
        setDestinationIsHidden(null);
        const newStartPoint = processStartPointSearch(startPointText, todayEvents);
        if (newStartPoint) {
            if (newStartPoint.buildingName.trim().toLowerCase() === "current" && newStartPoint.roomNumber?.trim().toLowerCase() === "location" && newStartPoint.isLocation) {
                if(!location) return;
                setStartPoint("", location, "", "");
                setStartPointText(CURRENT_LOCATION);
                setStableStartPointText(CURRENT_LOCATION);
            } else {
                const {properSearch, buildingId} = setPoint(newStartPoint);
                if(!properSearch || !buildingId) return;
                setStartPoint(
                    buildingId,
                    SGWBuildingSearchMetadata[buildingId]?.coordinates || LoyolaBuildingSearchMetadata[buildingId]?.coordinates,
                    newStartPoint.buildingName,
                    newStartPoint.roomNumber
                );
                setStartPointText(properSearch);
                setStableStartPointText(properSearch);
            }
        } else {
            setStartPointText(stableStartPointText);
        }
    }
    const enterDestination = (forcedText: string | null = null) => {
        setDestinationIsHidden(null);
        const newDestination = processDestinationSearch(destinationText, events);
        if (newDestination) {
            const {properSearch, buildingId} = setPoint(newDestination);
            if(!properSearch || !buildingId) return;
            setDestination(
                buildingId,
                SGWBuildingSearchMetadata[buildingId]?.coordinates || LoyolaBuildingSearchMetadata[buildingId]?.coordinates,
                newDestination.buildingName,
                newDestination.roomNumber
            );
            setDestinationText(properSearch);
            setStableDestinationText(properSearch);
        } else {
            setDestinationText(stableDestinationText);
        }
    }

    const insertStartPointBuildingName = (buildingName: string) => {
        const left = startPointText.substring(0, startPointSelection.start);
        const right = startPointText.substring(startPointSelection.end);
        setStartPointText(left + buildingName + right);
    }
    const insertDestinationBuildingName = (buildingName: string) => {
        const left = destinationText.substring(0, destinationSelection.start);
        const right = destinationText.substring(destinationSelection.end);
        setDestinationText(left + buildingName + right);
    }

    interface SuggestionIconProps {iosName: SFSymbol; androidName: React.ComponentProps<typeof MaterialIcons>["name"]; color: string;}
    const SuggestionIcon = ({ iosName, androidName, color }: SuggestionIconProps) => {
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
    
    return <>
        <View style={styles.glassWrapper}>
            <BlurView intensity={80} tint="light" style={[styles.blurContainer, {gap: destinationIsHidden !== null ? 0 : 10, paddingBottom: destinationIsHidden !== null ? 5 : 15}]}>
                {destinationIsHidden !== false && <View style={{flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10}}>
                        <SuggestionIcon
                            iosName="circle.circle.fill"
                            androidName="adjust"
                            color={"#B03060"}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Start Point"
                            value={startPointText}
                            onChangeText={text => setStartPointText(text)}
                            clearButtonMode="while-editing"
                            onBlur={() => enterStartPoint()}
                            onFocus={() => setDestinationIsHidden(true)}
                            onSelectionChange={event => setStartPointSelection(event.nativeEvent.selection)}
                            inputAccessoryViewID={INPUT_ACCESSORY_VIEW_ID}
                            spellCheck={false} 
                            autoCorrect={false}
                            selectionColor="#B03060"
                            accessibilityLabel="Start Point"
                            accessibilityHint="Enter the building and optionally the room you are starting from"
                        />
                    </View>
                }
                {destinationIsHidden === null && <View style={[styles.listSuggestion, {paddingVertical: 0}]}/>}
                {destinationIsHidden !== true && <View style={{flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10}} accessible={false}>
                        <SuggestionIcon
                            iosName="pin.fill"
                            androidName="location-on"
                            color={"#B03060"}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Destination"
                            value={destinationText}
                            onChangeText={text => setDestinationText(text)}
                            onBlur={() => enterDestination()}
                            onFocus={() => setDestinationIsHidden(false)}
                            onSelectionChange={event => setDestinationSelection(event.nativeEvent.selection)}
                            inputAccessoryViewID={INPUT_ACCESSORY_VIEW_ID}
                            spellCheck={false} 
                            autoCorrect={false}
                            selectionColor="#B03060"
                            accessibilityLabel="Destination"
                            accessibilityHint="Enter the building and optionally the room you are heading to"
                        />
                    </View>
                }

                {destinationIsHidden === true &&
                    <ScrollView keyboardShouldPersistTaps="handled" style={styles.listContainer}>
                        {searchStartPoint(startPointText, todayEvents, userLocationBuildingId).map(suggestion => {
                            const startText = `${suggestion.buildingName} ${suggestion.roomNumber ?? ""}`.trim();
                            return <TouchableOpacity 
                                    key={startText} 
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
                                {suggestion.isLocation && <SuggestionIcon 
                                    iosName="location" 
                                    androidName="near-me"
                                    color={"#B03060" + (suggestion.roomNumber && suggestion.roomNumber !== "Location" ? "80" : "")}
                                />}
                                <Text style={[styles.listSuggestionText, startText === CURRENT_LOCATION ? {color:"#B03060"} : {}]}>
                                    {startText}
                                </Text>
                                {suggestion.buildingName && !suggestion.roomNumber &&
                                    <TouchableOpacity style={styles.suggestionIconButton} onPress={() => setStartPointText(startText)} accessible={true} accessibilityRole="button" accessibilityLabel={`Set the searchbar's text to ${startText}`} accessibilityHint="Tap to replace the text input and continue editing">
                                        <SuggestionIcon 
                                            iosName="arrow.up.backward" 
                                            androidName="arrow-outward"
                                            color="#B03060"
                                        />
                                    </TouchableOpacity>
                                }
                            </TouchableOpacity>;
                        })}
                    </ScrollView>
                }
                {destinationIsHidden === false &&
                    <ScrollView keyboardShouldPersistTaps="handled" style={styles.listContainer}>
                        {searchDestination(destinationText, events).map(suggestion => {
                            const destText = `${suggestion.buildingName} ${suggestion.roomNumber ?? ""}`.trim();
                            return <TouchableOpacity 
                                key={destText} 
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
                                <Text style={styles.listSuggestionText}>
                                    {destText}
                                </Text>
                                {suggestion.buildingName && !suggestion.roomNumber &&
                                    <TouchableOpacity style={styles.suggestionIconButton} onPress={() => setDestinationText(destText)} accessible={true} accessibilityRole="button" accessibilityLabel={`Set the searchbar's text to ${destText}`} accessibilityHint="Tap to replace the text input and continue editing">
                                        <SuggestionIcon 
                                            iosName="arrow.up.backward" 
                                            androidName="arrow-outward"
                                            color="#B03060" 
                                        />
                                    </TouchableOpacity>
                                }
                            </TouchableOpacity>;
                        })}
                    </ScrollView>
                }
            </BlurView>
        </View>

        <InputAccessoryView nativeID={INPUT_ACCESSORY_VIEW_ID}>
            <View style={styles.accessoryContainer}>
                <View style={styles.scrollContainer}>
                    <ScrollView horizontal
                        showsHorizontalScrollIndicator={false}
                        keyboardShouldPersistTaps="always"
                    >
                        {SGWBuildingSearchMetadata[startBuildingId ?? destinationBuildingId ?? ""] ?
                            ["MB", "FG", "FB", "LS", "CL", "EV"].map(id => (
                                <TouchableOpacity
                                    key={id}
                                    onPress={() => insertStartPointBuildingName(SGWBuildingSearchMetadata[id]?.name ?? id)}
                                    style={[styles.buildingButton, { paddingHorizontal: 10 }]}
                                    accessible={true}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Insert ${SGWBuildingSearchMetadata[id]?.name ?? id} into the searchbar where your cursor or text selection is`}
                                    accessibilityHint="Tap to quickly add the complete name of this building to your start point search"
                                >
                                    <Text style={[styles.buildingButtonText, {color: BuildingTheme.SGW[id as keyof typeof BuildingTheme.SGW] ?? "#000000"}]}>
                                        {id}
                                    </Text>
                                </TouchableOpacity>
                            )) : ["VL", "CJ", "SP", "AD", "CC", "HU"].map(id => (
                                <TouchableOpacity
                                    key={id}
                                    onPress={() => insertDestinationBuildingName(LoyolaBuildingSearchMetadata[id]?.name ?? id)}
                                    style={[styles.buildingButton, { paddingHorizontal: 10 }]}
                                    accessible={true}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Insert ${LoyolaBuildingSearchMetadata[id]?.name ?? id} into the searchbar where your cursor or text selection is`}
                                    accessibilityHint="Tap to quickly add the complete name of this building to your destination search"
                                >
                                    <Text style={[styles.buildingButtonText, {color: BuildingTheme.LOY[id as keyof typeof BuildingTheme.LOY] ?? "#000000"}]}>
                                        {id}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        }
                    </ScrollView>
                </View>
            </View>
        </InputAccessoryView>
    </>
}
export default DirectionsSearchPanel;