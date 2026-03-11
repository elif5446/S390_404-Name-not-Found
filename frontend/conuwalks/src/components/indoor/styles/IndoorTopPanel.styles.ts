// import { StyleSheet } from "react-native";

// export const bottomPanelStyles = StyleSheet.create({
//   outerContainer: {
//     position: "absolute",
//     left: 16,
//     right: 16,
//     bottom: 24,
//     zIndex: 50,
//     elevation: 12,
//   },
//   panelContainer: {
//     backgroundColor: "#F6F3EE",
//     borderRadius: 24,
//     padding: 14,
//     borderWidth: 1,
//     borderColor: "#E4DDD3",
//   },
//   cardsWrapper: {
//     gap: 12,
//   },
//   startCard: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 18,
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     borderWidth: 1.5,
//     borderColor: "#E4DDD3",
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 3 },
//   },
//   destinationCard: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 18,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderWidth: 1.5,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 3 },
//   },
//   destinationCardDefaultBorder: {
//     borderColor: "#E4DDD3",
//   },
//   destinationCardFocusedBorder: {
//     borderColor: "#B03060",
//   },
//   startValueText: {
//     fontSize: 18,
//     fontWeight: "700",
//   color: "#B03060",
//   },
//   cardLabelText: {
//     fontSize: 16,
//     color: "#9C948B",
//   },
//   destinationInputWrapper: {
//     flex: 1,
//   },
//   destinationInput: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#B03060",
//     paddingVertical: 0,
//   },
//   destinationRightSide: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   destinationLabel: {
//     fontSize: 16,
//     color: "#9C948B",
//     marginRight: 12,
//   },
//   arrowButton: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: "#B03060",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   resultsContainer: {
//     marginTop: 10,
//     backgroundColor: "#FFFFFF",
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: "#E3DDD4",
//     maxHeight: 160,
//     overflow: "hidden",
//   },
//   resultItem: {
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F0ECE6",
//   },
//   resultTitle: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#3C3732",
//   },
//   resultSubtitle: {
//     fontSize: 12,
//     color: "#8A837A",
//     marginTop: 2,
//   },
//   actionsRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginTop: 14,
//   },
//   directionsButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#ECE6DD",
//     borderRadius: 14,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     opacity: 0.7,
//   },
//   directionsText: {
//     marginLeft: 8,
//     color: "#7A746C",
//     fontWeight: "600",
//   },
//   rightActions: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   exitButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#B03060",
//     borderRadius: 14,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//   },
//   exitText: {
//     marginLeft: 8,
//     color: "#FFFFFF",
//     fontWeight: "600",
//   },
// });
// import { StyleSheet } from "react-native";

// export const bottomPanelStyles = StyleSheet.create({
//   container: {
//     width: "100%",
//     paddingHorizontal: 12,
//     paddingBottom: 12,
//     backgroundColor: "transparent",
//   },

//   panel: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 18,
//     padding: 14,
//     borderWidth: 1,
//     borderColor: "#E5E5EA",
//     shadowColor: "#000",
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 2 },
//     elevation: 4,
//   },

//   headerRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 10,
//   },

//   title: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#1C1C1E",
//   },

//   inputContainer: {
//     minHeight: 48,
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: "#E5E5EA",
//     backgroundColor: "#F7F7FA",
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 12,
//   },

//   inputIcon: {
//     marginRight: 8,
//   },

//   input: {
//     flex: 1,
//     fontSize: 15,
//     color: "#1C1C1E",
//     paddingVertical: 10,
//   },

//   resultsContainer: {
//     marginTop: 10,
//     maxHeight: 180,
//     borderWidth: 1,
//     borderColor: "#E5E5EA",
//     borderRadius: 14,
//     backgroundColor: "#FFFFFF",
//     overflow: "hidden",
//   },

//   resultItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 12,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F0F0F0",
//   },

//   resultIcon: {
//     marginRight: 10,
//   },

//   resultTextContainer: {
//     flex: 1,
//   },

//   resultTitle: {
//     fontSize: 15,
//     fontWeight: "600",
//     color: "#1C1C1E",
//   },

//   resultSubtitle: {
//     marginTop: 2,
//     fontSize: 12,
//     color: "#6E6E73",
//   },

//   emptyContainer: {
//     paddingVertical: 16,
//     paddingHorizontal: 12,
//   },

//   emptyText: {
//     fontSize: 14,
//     color: "#6E6E73",
//   },
// });




import { StyleSheet } from "react-native";

export const bottomPanelStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 125,
    left: 12,
    right: 12,
  },

  panel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 5,
    borderWidth: 1,
    borderColor: "#F3C1D7",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  topRow: {
    alignItems: "flex-end",
    marginBottom: 6,
  },

  exitButton: {
    width: 22,
    height: 22,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF4F8",
  },

  inputContainer: {
    minHeight: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3C1D7",
    backgroundColor: "#FFF7FA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  inputIcon: {
    marginRight: 8,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: "#1C1C1E",
    paddingVertical: 8,
  },

  connectorLine: {
    width: 1.5,
    height: 8,
    backgroundColor: "#E88AB0",
    marginLeft: 14,
    marginVertical: 4,
  },

  resultsContainer: {
    marginTop: 8,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: "#F3C1D7",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F9D8E6",
  },

  resultIcon: {
    marginRight: 8,
  },

  resultTextContainer: {
    flex: 1,
  },

  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },

  resultSubtitle: {
    marginTop: 1,
    fontSize: 11,
    color: "#8A8A8E",
  },

  emptyContainer: {
    paddingVertical: 12,
    paddingHorizontal: 10,
  },

  emptyText: {
    fontSize: 13,
    color: "#8A8A8E",
  },
  backButton: {
  width: 40,
  height: 40,
  alignItems: "center",
  justifyContent: "center",
},

title: {
  flex: 1,
  textAlign: "center",
  fontSize: 20,
  fontWeight: "700",
  color: "#1C1C1E",
},

headerRightPlaceholder: {
  width: 40,
},
});