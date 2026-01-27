import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { COLORS } from '@/constants/design';

// Kippo K Logo SVG - White for green background
const KIPPO_LOGO = `<svg width="60" height="60" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
  <path d="M17.5 65 L37.5 15 L57.5 15 L37.5 65 Z" fill="white"/>
  <path d="M62.5 15 L82.5 15 L70.5 40 L60.5 65 L40.5 65 L50.5 40 Z" fill="white"/>
</svg>`;

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Wait for 2 seconds then fade out
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <SvgXml xml={KIPPO_LOGO} width={60} height={60} />
        <Text style={styles.logoText}>kippo</Text>
      </View>
      <Text style={styles.tagline}>Smart Money. Simple Life.</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary, // Emerald green #006D4F
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  tagline: {
    position: 'absolute',
    bottom: 80,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
