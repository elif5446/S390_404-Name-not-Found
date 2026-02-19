import {StyleSheet, Platform} from "react-native";

const additionalInfoPopupStyles = StyleSheet.create({
    // iOS styles
    iosBackdrop: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "transparent",
    },
    iosBlurContainer: {
        borderTopLeftRadius: 45,
        borderTopRightRadius:45,
        overflow:"hidden",
    },
    iosContentContainer: {
        paddingBottom: 8,
    },
    handleBarContainer: {
        paddingTop: 4,
        paddingBottom:8,
    },
    handleBar: {
        width: 40,
        height:5,
        borderRadius:2.5,
        backgroundColor: "rgba(0, 0, 0, 0.29)",
        alignSelf: "center",
        marginTop: 8,
        marginBottom:0
    },
    iosHeader: {
        alignItems: "center",
        justifyContent:"center",
        position: "relative",
        paddingHorizontal: 20,
        paddingVertical: 8,
        width: '100%',
        backgroundColor:"transparent",
        minHeight:136,
    },
    headerTextContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 6,
        bottom: 6,
        backgroundColor:"transparent",
        alignItems:"center",
        justifyContent:"center",
        paddingLeft:110,
        paddingRight:110,
    },
    buildingName: {
        fontSize: 18,
        fontWeight: "600" as const,
        textAlign:"center",
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        marginBottom:4,
        flexWrap:"wrap",
        flexShrink:0,
        width:'100%',
        maxWidth: '100%',
        lineHeight:22, 
        textAlignVertical:"center",
        alignSelf: "stretch",
    },
    buildingIdAccessibilityRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    buildingIdContainer: {
        alignItems: "center",
        justifyContent: "center",
        flex:1,
    },
    buildingId: {
        fontSize: 26,
        fontWeight: "600" as const,
        textAlign: "center",
        lineHeight: 24,
        paddingTop: 3,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    accessibilityIconsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 6,
        minHeight: 25,
    },
    buildingIdWithIconsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 4,
        width: "100%",
        position: "relative",},
    accessibilityIcon: {
        fontSize:22,
        lineHeight:24,
    },
    closeButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        left: 20,
        top: 0,
        padding: 4,
        zIndex: 10,
        marginTop: -5,
    },
    closeButtonText: {
        fontSize: 24,
        fontWeight: "300" as const,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        includeFontPadding: false,
        textAlign:"center",
        lineHeight:24,
    },
    closeButtonCircle: {
        width:35,
        height:35,
        borderRadius:80,
        justifyContent:"center",
        alignItems:"center",
    },
    rightSpacer: {
        width: 44,
        height: 44,
    },
    rightHeaderActions: {
        position: "absolute",
        right: 20,
        top: 0,
        alignItems: "flex-end",
        justifyContent: "center",
    },
    directionsButton: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 999,
        backgroundColor: "#B03060",
        paddingVertical: 4,
        paddingHorizontal: 7,
        gap: 5,
    },
    directionsArrowCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    directionsEtaText: {
        color: "#FFFFFF",
        fontWeight: "700" as const,
        fontSize: 12,
        lineHeight: 14,
    },
    rightAccessibilityRow: {
        marginTop: 8,
    },
    contentArea: {
        flex: 1,
        width: '100%', 
    },
    section: {
        paddingHorizontal: 20,
        paddingBottom:15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600' as const,
        marginBottom: 5,
        paddingBottom:5,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        borderBottomWidth: 1.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    sectionText: {
        fontSize: 18,
        lineHeight: 22,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    hoursContainer: {
        gap: 8,
    },
    hoursRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 4,
        paddingVertical: 3,
        gap: 10
    },
    hoursLabel: {
        fontSize: 16,
    },
    hoursValue: {
        fontSize: 15,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 3,
    },
    addressIcon: {
        marginRight: 10,
        fontSize:22    
    },
    addressText: {
        fontSize: 16,
        lineHeight: 22,
        flex: 1,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',},
    descriptionText: {  
        fontSize: 15,
        lineHeight: 22,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',},

    // Android styles
});

const themedStyles = {
    text: (mode: string) => ({ color: mode === "dark" ? "#FFFFFF" : "#333333" }),
    subtext: (mode: string) => ({ color: mode === "dark" ? "#CCCCCC" : "#585858" }),
    mutedText: (mode: string) => ({ color: mode === "dark" ? "#CCCCCC" : "#000000" }),
    closeButton: (mode: string) => ({ backgroundColor: mode === "dark" ? "#00000031" : "#85858522" }),
};

export {additionalInfoPopupStyles as styles, themedStyles};