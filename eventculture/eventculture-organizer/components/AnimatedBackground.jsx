import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function AnimatedBackground({ colors = ['#E0F2FE', '#EFF6FF', '#DBEAFE'] }) {
  const { width, height } = useWindowDimensions();

  // Create two shared values for gentle translation
  const translateX = useSharedValue(-width * 0.2);
  const translateY = useSharedValue(-height * 0.2);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(width * 0.1, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-width * 0.2, { duration: 15000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    translateY.value = withRepeat(
      withSequence(
        withTiming(height * 0.1, { duration: 18000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-height * 0.2, { duration: 18000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [width, height]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: 1.5 }, // Scale up to ensure it covers the screen while moving
      ],
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}
