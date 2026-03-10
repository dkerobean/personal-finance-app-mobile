import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { COLORS } from '@/constants/design';
import { KIPPO_MARK_WHITE_SVG } from '@/constants/brand';
import { TYPOGRAPHY } from '@/constants/design';

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
        <SvgXml xml={KIPPO_MARK_WHITE_SVG} width={60} height={60} />
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
    fontFamily: TYPOGRAPHY.fonts.display,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  tagline: {
    position: 'absolute',
    bottom: 80,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fonts.medium,
  },
});
