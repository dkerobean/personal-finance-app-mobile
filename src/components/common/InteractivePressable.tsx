import React from 'react';
import { Pressable, PressableProps, StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  WithSpringConfig
} from 'react-native-reanimated';

interface InteractivePressableProps extends PressableProps {
  children: React.ReactNode;
  activeScale?: number;
  springConfig?: WithSpringConfig;
  containerStyle?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function InteractivePressable({
  children,
  activeScale = 0.96,
  springConfig = { damping: 10, stiffness: 100 },
  style,
  containerStyle,
  ...props
}: InteractivePressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(activeScale, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
