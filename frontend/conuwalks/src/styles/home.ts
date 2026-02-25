import {StyleSheet, Platform} from "react-native";

const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  glassWrapper: {
    position: "absolute",
    right: 20,
    bottom:35,
    borderRadius: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    backgroundColor: Platform.OS === 'android' ? "#FFFFFF" : "transparent",
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  blurContainer: {
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    display:"flex",
    flexDirection:"column",
    margin:0,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingRight: 8,
    maxWidth: 400,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  placeholderImage: {
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    maxWidth: 120,
  },
});
export {homeStyles as styles};