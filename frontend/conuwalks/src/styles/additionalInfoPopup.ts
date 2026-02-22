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
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent:"space-between",
        paddingHorizontal: 20,
        paddingVertical: 5,
        width: '100%',
        backgroundColor:"transparent",
        minHeight:80,
    },
    headerTextContainer: {
        flex:0.67,
        backgroundColor:"transparent",
        alignItems:"center",
        justifyContent:"center",
        marginHorizontal:44,
        marginTop: -5,
        position:"relative",
    },
    buildingName: {
        fontSize: 18,
        fontWeight: "600" as const,
        textAlign:"center",
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        marginBottom:4,
        flexWrap:"wrap",
        flexShrink:1,
        width:'100%',
        lineHeight:24, 
        textAlignVertical:"center"
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
        position: "absolute",
        right: -90,
        top: 0,
        bottom: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
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
    scheduleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
        paddingVertical: 3,
},
    noEventsContainer: {
    },
    noEventsText: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    nextEventLabel: {
        fontSize: 14,
        fontWeight: '600',
        paddingBottom:4,
    },
    eventsList: {  
    },
    eventItem: {
    },
    eventItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    eventDetailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    eventTime: {
        fontSize: 16,
        color: '#666',
    },
    eventRoom: {
        fontSize: 16,
        fontWeight: '500',
    },
    // Android styles
});

const themedStyles = {
    text: (mode: string) => ({ color: mode === "dark" ? "#FFFFFF" : "#333333" }),
    subtext: (mode: string) => ({ color: mode === "dark" ? "#CCCCCC" : "#585858" }),
    mutedText: (mode: string) => ({ color: mode === "dark" ? "#CCCCCC" : "#000000" }),
    closeButton: (mode: string) => ({ backgroundColor: mode === "dark" ? "#00000031" : "#85858522" }),
};

export {additionalInfoPopupStyles as styles, themedStyles};