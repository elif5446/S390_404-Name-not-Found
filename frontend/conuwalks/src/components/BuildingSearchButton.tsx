import React from "react";
import { TouchableOpacity, View, Text, StyleSheet, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface BuildingSearchButtonProps {
    onPress: () => void;
}

const BuildingSearchButton: React.FC<BuildingSearchButtonProps> = ({ onPress }) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={onPress}
                style={styles.button}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Open building search"
                accessibilityHint="Tap to search for a building and view its info"
            >
                <MaterialIcons name="search" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 260, // adjust this to sit **under your relocate button**
        right: 15,
        zIndex: 20,
        ...Platform.select({
            android: { elevation: 20 },
        }),
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#B03060", // match your theme
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    text: {
        color: "#fff",
        fontWeight: "600",
        marginLeft: 6,
        fontSize: 16,
    },
});

export default BuildingSearchButton;