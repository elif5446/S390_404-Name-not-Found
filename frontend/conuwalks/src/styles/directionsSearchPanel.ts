import { StyleSheet, Platform } from "react-native";

const directionsSearchPanelStyles = StyleSheet.create({
    glassWrapper: {
        position: "absolute",
        right: 20,
        bottom:35,
        borderRadius: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
        backgroundColor: Platform.OS === 'android' ? "#FFFFFF" : "transparent",
        borderWidth: Platform.OS === 'android' ? 1 : 0,
        borderColor: 'rgba(0, 0, 0, 0.05)'
    },
    blurContainer: {
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        display:"flex",
        flexDirection:"column",
        margin:0
    }
})
export default directionsSearchPanelStyles;