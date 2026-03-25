import { useRef, useEffect } from "react";
import { Animated, View } from "react-native";

const PulsingUserMarker = ({ x, y }: { x: number; y: number }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );

    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View
      style={{
        position: "absolute",
        left: x - 12,
        top: y - 12,
        width: 24,
        height: 24,
        zIndex: 1005,
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "#B03060",
          transform: [
            {
              scale: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1.8],
              }),
            },
          ],
          opacity: pulseAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.9, 0],
          }),
        }}
      />

      {/* Static Core */}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "#B03060BF",
          borderWidth: 3,
          borderColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
          elevation: 4,
        }}
      />
    </View>
  );
};

export default PulsingUserMarker;
