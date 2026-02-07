import {StyleSheet, Dimensions, Platform} from "react-native";
import { red100, transparent, white } from "react-native-paper/lib/typescript/styles/themes/v2/colors";

const windowWidth = Dimensions.get("window").width;

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
        //maxHeight:Dimensions.get("window").height*0.8
    },
    iosContentContainer: {
        minHeight:300,
        flex: 1,
        paddingBottom: 8,
    },
    handleBarContainer: {
        
    },
    handleBar: {
        width: 40,
        height:5,
        borderRadius:2.5,
        backgroundColor: "rgba(0, 0, 0, 0.29)",
        alignSelf: "center",
        marginTop: 12,
        marginBottom:0
    },
    iosHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent:"center",
        paddingHorizontal: 20,
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: "transparent",
        width: '100%',
        position: 'relative',
        backgroundColor:"transparent",
        minHeight:80,
    },
    headerTextContainer: {
        flex:1,
        backgroundColor:"transparent"
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
        paddingHorizontal:30,
        lineHeight:24, 
        textAlignVertical:"center"
    },
    buildingIdRow: {
        flexDirection:"row",
        alignItems:"center",
    },
    buildingId: {
        fontSize: 26,
        fontWeight: "600" as const,
        textAlign:"center",
        lineHeight:24,
        paddingTop:3,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        justifyContent:"center",
    },
    accessibilityIconsContainer: {
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"flex-end"
    },
    accessibilityIconWrapper: {
        marginHorizontal:2,
    },
    accessibilityIcon: {
        fontSize:22,
    },
    closeButton: {
        left:10,
        top:0,
        position:"absolute",
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
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
        alignItems:"center"
    },
    contentArea: {
        flex: 1,
        width: '100%', 
    },
    section: {
        paddingHorizontal: 20,
        paddingBottom:15,
    },
    sectionHeader: {

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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
        paddingVertical:3
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
        //paddingVertical: 4,
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
    andriodBackdrop: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
        padding: 20
    },
});

export {additionalInfoPopupStyles as styles};