import { StyleSheet, Platform } from "react-native";

const additionalInfoPopupStyles = StyleSheet.create({
  // iOS styles
  iosBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  iosBlurContainer: {
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    overflow: "hidden",
  },
  iosContentContainer: {
    paddingBottom: 8,
  },
  handleBarContainer: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(0, 0, 0, 0.29)",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 0,
  },
  iosHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    position: "relative",
    paddingHorizontal: 20,
    width: "100%",
    backgroundColor: "transparent",
    paddingTop: 8,
    marginBottom: 10
  },
  headerTextContainer: {
    position:"absolute",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  buildingName: {
    fontSize: 18,
    fontWeight: "600" as const,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    marginBottom: 4,
    flexWrap: "wrap",
    flexShrink: 0,
    textAlignVertical: "center",
    alignSelf: "stretch",
  },
  buildingIdAccessibilityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  buildingIdContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  buildingId: {
    fontSize: 26,
    fontWeight: "600" as const,
    textAlign: "center",
    lineHeight: 24,
    paddingTop: 3,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
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
    marginTop: 2,
    width: "100%",
    position: "relative",
  },
  accessibilityIcon: {
    fontSize: 22,
  },
  leftHeaderActions: {
    flexDirection: "column",
    position:"absolute",
    gap: Platform.OS === "ios" ? 5 : 0,
    left:20,
    top:10,
    alignItems:"flex-start",
    flex:1
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    left: 20,
    top: 0,
    padding: 4,
    zIndex: 10,
    marginTop: -10,
    marginLeft: -20
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "300" as const,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    includeFontPadding: false,
    textAlign: "center",
    lineHeight: 24,
  },
  closeButtonCircle: {
    width: 35,
    height: 35,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  rightSpacer: {
    width: 44,
    height: 44,
  },
rightHeaderActions: {
  position: "absolute",
  right: 20,
  alignItems: "flex-end",
  justifyContent: "flex-start",
  flex:1,
  gap: 8,
},
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#B03060",
    gap: 0
  },
  directionsArrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  directionsEtaText: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
    fontSize: 15,
    lineHeight: 15,
    paddingRight: 10,
  },
  rightAccessibilityRow: {
    marginTop: 2,
  },
  contentArea: {
    flex: 1,
    width: "100%",
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    borderBottomWidth: 1.5,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  hoursContainer: {
    gap: 8,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 4,
    paddingVertical: 2,
    gap: 10,
  },
  hoursLabel: {
    fontSize: 16,
  },
  hoursValue: {
    fontSize: 15,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
  },
  addressIcon: {
    marginRight: 10,
    fontSize: 22,
  },
  addressText: {
    fontSize: 16,
    lineHeight: 20,
    flex: 1,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

openIndoorHeaderButton: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderRadius: 999,
  paddingVertical: 7,
  paddingHorizontal: 8,
  minHeight: 30,
  gap: 5
},

openIndoorHeaderButtonText: {
  fontWeight: "600" as const,
  fontSize: 15,
  fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
},
  // Android styles
});

const themedStyles = {
  text: (mode: string) => ({ color: mode === "dark" ? "#FFFFFF" : "#333333" }),
  subtext: (mode: string) => ({
    color: mode === "dark" ? "#CCCCCC" : "#585858",
  }),
  mutedText: (mode: string) => ({
    color: mode === "dark" ? "#CCCCCC" : "#000000",
  }),
  closeButton: (mode: string) => ({
    backgroundColor: mode === "dark" ? "#00000031" : "#85858522",
  }),
  openIndoorHeaderButton: (mode: string) => ({
    backgroundColor:
      mode === "dark" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.06)",
    borderColor:
      mode === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.10)",
  }),
  openIndoorHeaderButtonText: (mode: string) => ({
    color: mode === "dark" ? "#FFFFFF" : "#222222",
  }),
};

export { additionalInfoPopupStyles as styles, themedStyles };
