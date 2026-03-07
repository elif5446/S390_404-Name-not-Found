import { StyleSheet, Platform } from "react-native";

//Design tokens 
export const POI_PALETTE = {
  pink: "#E8445A",
  pinkLight: "#FCE0E4",
  cream: "#F8F4EE",
  cardBg: "#F9F7F3",
  mapBg: "#DED7CC",
  pillGray: "#E5E0D7",
  iconDark: "#302C26",
  textDark: "#222222",
  textMid: "#6B6560",
  textMuted: "#9C968D",
  white: "#FFFFFF",
  wcF: "#FCE0E4",     // light pink  – girls WC
  wcM: "#D2E5FA",     // light blue  – boys WC
  wcShared: "#EDEAE4",// neutral     – shared WC
  wcA: "#E8445A",     // pink badge  – accessible WC
  labBg: "#EDEAE4",   // neutral     – lab badge
  printBg: "#EDEAE4",
  itBg: "#EDEAE4",
};

//POI Badge 
export const poiBadgeStyles = StyleSheet.create({
  badge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 5,
      },
      android: { elevation: 4 },
    }),
  },
  badgeLarge: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  highlighted: {
    backgroundColor: POI_PALETTE.pink,
    borderWidth: 2,
    borderColor: POI_PALETTE.white,
  },
});

//Filter row + POI list 
export const poiPanelStyles = StyleSheet.create({
  panelContainer: {
    backgroundColor: POI_PALETTE.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  targetModeRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 8,
  },
  modeChipActive: {
    backgroundColor: POI_PALETTE.pink,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  modeChipInactive: {
    backgroundColor: POI_PALETTE.pillGray,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  modeChipTextActive: {
    color: POI_PALETTE.white,
    fontSize: 11,
    fontWeight: "700",
  },
  modeChipTextInactive: {
    color: POI_PALETTE.textMid,
    fontSize: 11,
    fontWeight: "700",
  },
  searchRow: {
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: POI_PALETTE.white,
    borderWidth: 1,
    borderColor: POI_PALETTE.pillGray,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 9 : 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: POI_PALETTE.textDark,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 6,
  },
  showLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: POI_PALETTE.textMuted,
    letterSpacing: 0.5,
    marginRight: 2,
  },
  chipActive: {
    backgroundColor: POI_PALETTE.iconDark,
    borderRadius: 13,
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  chipInactive: {
    backgroundColor: POI_PALETTE.pillGray,
    borderRadius: 13,
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  chipTextActive: {
    fontSize: 10,
    fontWeight: "700",
    color: POI_PALETTE.white,
  },
  chipTextInactive: {
    fontSize: 10,
    fontWeight: "600",
    color: POI_PALETTE.textMid,
  },
  listCard: {
    marginHorizontal: 8,
    marginBottom: 6,
    backgroundColor: POI_PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 4,
    maxHeight: 290,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
      },
      android: { elevation: 2 },
    }),
  },
  listToggleRow: {
    marginHorizontal: 10,
    marginTop: 2,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: POI_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: POI_PALETTE.pillGray,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listToggleTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: POI_PALETTE.textDark,
  },
  listHeader: {
    fontSize: 10,
    fontWeight: "700",
    color: POI_PALETTE.textMuted,
    letterSpacing: 0.5,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 4,
  },
  listScroll: {
    maxHeight: 245,
  },
  listScrollContent: {
    paddingBottom: 6,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: POI_PALETTE.pillGray,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  listRowDesc: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: POI_PALETTE.textDark,
    marginLeft: 10,
  },
  listRowRoom: {
    fontSize: 10,
    fontWeight: "600",
    color: POI_PALETTE.textMuted,
    backgroundColor: POI_PALETTE.pillGray,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  rolePillSource: {
    fontSize: 9,
    fontWeight: "700",
    color: POI_PALETTE.white,
    backgroundColor: "#3A7BD5",
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginRight: 6,
  },
  rolePillDestination: {
    fontSize: 9,
    fontWeight: "700",
    color: POI_PALETTE.white,
    backgroundColor: POI_PALETTE.pink,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginRight: 6,
  },
  emptyState: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  emptyStateText: {
    fontSize: 12,
    color: POI_PALETTE.textMuted,
  },
});

// Directions panel 
export const directionsStyles = StyleSheet.create({
  panel: {
    backgroundColor: POI_PALETTE.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "52%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.10,
        shadowRadius: 14,
      },
      android: { elevation: 14 },
    }),
  },
  handle: {
    width: 46,
    height: 4,
    borderRadius: 2,
    backgroundColor: POI_PALETTE.pillGray,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: POI_PALETTE.pinkLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: POI_PALETTE.pink,
    lineHeight: 17,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: POI_PALETTE.pink,
    marginRight: 36,
  },
  indoorBadge: {
    fontSize: 11,
    color: POI_PALETTE.textMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: POI_PALETTE.pillGray,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  togglePill: {
    backgroundColor: POI_PALETTE.pillGray,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  togglePillActive: {
    backgroundColor: POI_PALETTE.iconDark,
  },
  toggleText: {
    fontSize: 11,
    color: POI_PALETTE.textDark,
  },
  toggleTextActive: {
    color: POI_PALETTE.white,
    fontWeight: "600",
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: POI_PALETTE.cardBg,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  infoCardRoomNum: {
    fontSize: 20,
    fontWeight: "800",
    color: POI_PALETTE.pink,
    marginRight: 10,
  },
  infoCardLabel: {
    fontSize: 13,
    color: POI_PALETTE.textMuted,
  },
  infoCardDest: {
    flex: 1,
    marginLeft: 10,
  },
  infoCardDestName: {
    fontSize: 13,
    fontWeight: "700",
    color: POI_PALETTE.pink,
  },
  infoCardDestRoom: {
    fontSize: 11,
    color: POI_PALETTE.textMuted,
    marginTop: 1,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: POI_PALETTE.pink,
    alignItems: "center",
    justifyContent: "center",
  },
  stepsLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: POI_PALETTE.textMuted,
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginVertical: 3,
  },
  stepAccent: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
    marginTop: 2,
  },
  stepText: {
    fontSize: 11,
    flex: 1,
    color: POI_PALETTE.textDark,
  },
  stepTextHighlight: {
    fontSize: 11,
    flex: 1,
    color: POI_PALETTE.pink,
    fontWeight: "600",
  },
  etaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 10,
  },
  etaBadge: {
    backgroundColor: POI_PALETTE.pink,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  etaText: {
    color: POI_PALETTE.white,
    fontSize: 12,
    fontWeight: "700",
  },
  etaLabel: {
    fontSize: 11,
    color: POI_PALETTE.textMuted,
  },
  tapHintCard: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: POI_PALETTE.cardBg,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  tapHintText: {
    fontSize: 10,
    color: POI_PALETTE.textMuted,
    textAlign: "center",
  },
});
