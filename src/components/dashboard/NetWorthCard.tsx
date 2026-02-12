import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, TrendingDown, TrendingUp } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/design';

interface NetWorthCardProps {
  balance: number;
  currency?: string;
  percentageChange?: number;
  onPress?: () => void;
}

const NetWorthCard: React.FC<NetWorthCardProps> = ({ 
  balance, 
  currency = '₵', 
  percentageChange = 0,
  onPress 
}) => {
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
  
  const isPositive = percentageChange >= 0;
  const formattedChange = Math.abs(percentageChange).toFixed(1);

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
          colors={['#034B38', COLORS.emeraldGradientStart, COLORS.emeraldGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.glowA} />
          <View style={styles.glowB} />

          <View style={styles.headerRow}>
            <View>
              <Text style={styles.label}>Total Net Worth</Text>
              <Text style={styles.subLabel}>Assets - liabilities</Text>
            </View>
            <View style={styles.pill}>
               <Text style={styles.pillText}>
                 {isPositive ? '+' : '-'}{formattedChange}% this month
               </Text>
            </View>
          </View>

          <Text style={styles.balance} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {currency}{formattedBalance}
          </Text>

          <View style={styles.footerRowContainer}>
            <View style={styles.footerRow}>
              {isPositive ? (
                <TrendingUp size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              ) : (
                <TrendingDown size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.footerText}>
                {isPositive ? 'Growth on track' : 'Decreased value'}
              </Text>
            </View>
            <View style={styles.detailPill}>
              <Text style={styles.detailPillText}>Details</Text>
              <ChevronRight size={14} color={COLORS.white} />
            </View>
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
    overflow: 'hidden',
    padding: SPACING.xl,
    paddingVertical: 24,
  },
  glowA: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    top: -36,
    right: -22,
  },
  glowB: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: -22,
    right: 56,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
  },
  subLabel: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '500',
  },
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
  },
  balance: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '700',
    marginBottom: SPACING.lg,
    letterSpacing: -0.7,
  },
  footerRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '500',
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(2, 44, 34, 0.35)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 999,
  },
  detailPillText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
  },
});

export default NetWorthCard;
