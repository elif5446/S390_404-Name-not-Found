import {StyleSheet, Platform} from "react-native";

const googleCalendarAuthStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
  },
  logo: {
    width: 150,
    height: 150,
    marginTop: 20,
    marginBottom:20
  },
  text: {
    fontSize: 16, 
    paddingBottom:3
},
nestedText: {
    fontSize: 16, 
    paddingBottom:3,
    paddingLeft:20
  },
  link: {
    color: "#B03060CC",
    textDecorationLine:"underline"
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
});
export {googleCalendarAuthStyles as styles};