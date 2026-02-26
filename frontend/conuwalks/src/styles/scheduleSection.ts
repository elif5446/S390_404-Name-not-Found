import { Platform, StyleSheet } from "react-native";

const scheduleStyles = StyleSheet.create({
  contentArea: {
    flex: 1,
    width: "100%",
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    width: "100%",
  },
  noEventsText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  nextEventLabel: {
    fontSize: 14,
    fontWeight: "600",
    paddingBottom: 4,
  },
  eventsList: {
    marginTop:1,
  },
  eventItem: {
    marginBottom:12,
  },
  eventItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 12,
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  eventDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventTime: {
    fontSize: 16,
    color: "#666",
  },
  eventRoom: {
    fontSize: 16,
    fontWeight: "500",
  },
  eventContent: {flex: 1,
    marginRight: 12,
  },
  eventItemWithButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  noEventsContainer: {
    paddingVertical: 8,
    alignItems: "center",
  },

});

export default scheduleStyles;