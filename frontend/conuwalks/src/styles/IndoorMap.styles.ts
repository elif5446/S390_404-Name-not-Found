import { StyleSheet } from "react-native";

export const THEME = {
  background: "#F2F2F7", // iOS System Gray 6
  text: "#1C1C1E",
  primary: "#B03060",
  secondary: "#912F40",
  white: "#FFFFFF",
  errorBg: "#ffcccc",
  errorText: "#cc0000",
};

export const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5000,
    backgroundColor: THEME.background,
    flexDirection: "column",
    justifyContent: "space-between",
  },

  mapSection: {
    flex: 1,
    width: "100%",
    backgroundColor: THEME.white,
  },

  bottomSection: {
    width: "100%",
    justifyContent: "flex-end",
    paddingBottom: 24,
  },

  // header
  headerWrapper: {
    backgroundColor: "#f2f2f7cc",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#C6C6C8",
    zIndex: 5002,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitleWrap: {
    flex: 1,
    justifyContent: "center",
  },
  buildingTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: THEME.text,
  },
  floorBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  floorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: THEME.text,
  },
  headerFloorToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerFloorToggle: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#C6C6C8",
    backgroundColor: "#ECECF1",
    alignItems: "center",
    justifyContent: "center",
  },
  headerFloorToggleActive: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: THEME.secondary,
    backgroundColor: THEME.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerFloorToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4A4A53",
  },
  headerFloorToggleTextActive: {
    fontSize: 13,
    fontWeight: "800",
    color: THEME.white,
  },

  currentFloorButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  currentFloorText: {
    color: THEME.white,
    fontWeight: "700",
    fontSize: 14,
  },
  floorDropdownMenu: {
    position: "absolute",
    top: "100%",
    right: 16,
    backgroundColor: THEME.white,
    borderRadius: 12,
    paddingVertical: 8,
    width: 130,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 5005,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemActive: {
    backgroundColor: "rgba(176, 48, 96, 0.1)",
  },
  dropdownItemText: {
    fontSize: 15,
    color: THEME.text,
    fontWeight: "500",
  },
  dropdownItemTextActive: {
    color: THEME.primary,
    fontWeight: "700",
  },

  // map area components
  mapContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.background,
  },
  mapCanvas: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  // map content component
  floorImage: {
    width: "100%",
    height: "100%",
  },
  errorBox: {
    flex: 1,
    backgroundColor: THEME.errorBg,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: 10,
    color: THEME.errorText,
    fontWeight: "600",
  },

  activeNavOverlay: {
    position: "absolute",
    bottom: 40,
    right: 20,
    zIndex: 1001,
  },
  endNavButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#C83A32",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  // floor picker
  pickerContainer: {
    position: "absolute",
    right: 12,
    top: "50%",
    maxHeight: 300,
    width: 50,
    transform: [{ translateY: -100 }], // centering logic
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 5003,
  },
  glassPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    overflow: "hidden",
    paddingVertical: 8,
  },
  scrollContent: {
    alignItems: "center",
    paddingVertical: 4,
    gap: 8,
  },
  floorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E5EA",
  },
  activeButton: {
    backgroundColor: THEME.primary,
    transform: [{ scale: 1.15 }],
  },
  pickerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  activePickerText: {
    color: THEME.white,
    fontWeight: "800",
  },
});
