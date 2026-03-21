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
