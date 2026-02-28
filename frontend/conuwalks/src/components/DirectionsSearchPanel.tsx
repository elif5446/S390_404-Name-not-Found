import { BlurView } from "expo-blur"
import { View } from "react-native"
import styles from "../styles/directionsSearchPanel"
import { LatLng } from "react-native-maps"

interface DirectionsSearchProps {
  setStartPoint: (buildingId: string, coords: LatLng, label: string, room?: string | null) => void;
  setDestination: (buildingId: string, coords: LatLng, label: string, room?: string | null) => void;
}

const DirectionsSearchPanel: React.FC<DirectionsSearchProps> = ({setStartPoint, setDestination}) => {
    return <View style={styles.glassWrapper}>
        <BlurView intensity={80} tint="light" style={styles.blurContainer}>
            
        </BlurView>
    </View>
}
export default DirectionsSearchPanel;