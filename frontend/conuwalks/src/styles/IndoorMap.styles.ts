import { StyleSheet, Platform, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

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
  // main container
  container: {
    flex: 1,
    backgroundColor: THEME.background,
    ...StyleSheet.absoluteFillObject,
    zIndex: 5000,
  },

  // header 
  headerWrapper: {
    backgroundColor: "rgba(242, 242, 247, 0.95)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#C6C6C8",
    zIndex: 5002,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buildingTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: THEME.text,
    maxWidth: width * 0.6,
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

  // map area 
  mapContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: THEME.background,
    overflow: "hidden",
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
    backgroundColor: THEME.errorBg,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: 10,
    color: THEME.errorText,
    fontWeight: "600",
  },

  // exit 
  footerContainer: {
    position: "absolute",
    bottom: 30,
    alignSelf: 'center',
    zIndex: 6000,
    pointerEvents: "box-none", // Allows touches to pass through to map if needed (except button)
  },
  exitButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    borderWidth: 2,
    borderColor: THEME.white,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  exitText: {
    color: THEME.secondary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowRadius: 2,
  },

  // floor picker 
  pickerContainer: {
    position: 'absolute',
    right: 12,
    top: '50%',
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
    paddingVertical: 8,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  floorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
  },
  activeButton: {
    backgroundColor: THEME.primary,
    transform: [{ scale: 1.15 }],
  },
  pickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activePickerText: {
    color: THEME.white,
    fontWeight: '800',
  },
});
