import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/design';

interface NetWorthCardProps {
  balance: number;
  currency?: string;
  onPress?: () => void;
}

const NetWorthCard: React.FC<NetWorthCardProps> = ({ balance, currency = '₵', onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Format currency with commas and decimals
  const formattedBalance = balance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };
  
  return (
    <Pressable 
      style={styles.container}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
    >
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={[COLORS.emeraldGradientStart, COLORS.emeraldGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.headerRow}>
            <Text style={styles.label}>Total Net Worth</Text>
            <View style={styles.pill}>
               <Text style={styles.pillText}>+2.4% this month</Text>
            </View>
          </View>

          <Text style={styles.balance}>
            {currency}{formattedBalance}
          </Text>

          <View style={styles.footerRow}>
             <TrendingUp size={16} color={COLORS.primaryLight} style={{ marginRight: 6 }} />
             <Text style={styles.footerText}>Growth on track</Text>
          </View>

        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
  },
  gradient: {
    borderRadius: 24,
    padding: SPACING.xl,
    paddingVertical: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    color: COLORS.primaryLight,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '500',
  },
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
  },
  balance: {
    color: COLORS.white,
    fontSize: 40,
    fontWeight: '700',
    marginBottom: SPACING.lg,
    letterSpacing: -0.5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '500',
    opacity: 0.9,
  },
});

export default NetWorthCard;
