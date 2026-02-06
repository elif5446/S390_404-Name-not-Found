import {StyleSheet, Dimensions, Platform} from "react-native";

const windowWidth = Dimensions.get("window").width;

const additionalInfoPopupStyles = StyleSheet.create({
    iosBackdrop: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    andriodBackdrop: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: 20
    },
    iosBlurContainer: {

    },
    iosContentContainer: {

    },
    handleBar: {
        
    }
});

export {additionalInfoPopupStyles as styles};