import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center', // Children; horizontally
    paddingHorizontal: 20
  },
  segmentedIos: {
    width: '100%',
    alignSelf: 'center',
  },
  shadowiOS: {
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, // Light shadow
    shadowRadius: 3, // Soft blur
  },
  blurContainer: {
    borderRadius: 100,
    overflow: 'hidden', 
  },
  segmentedAndroid: {},
  shadowAndroid: {
    width: '90%',
    alignSelf: 'center',
    borderRadius: 20,
    elevation: 4
  },
});

export default styles;