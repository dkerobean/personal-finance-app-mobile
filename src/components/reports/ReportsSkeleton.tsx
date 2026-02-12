import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence 
} from 'react-native-reanimated';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants/design';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SkeletonItem = ({ style }: { style: any }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.skeleton, style, animatedStyle]} />;
};

export default function ReportsSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header Area Skeleton */}
      <View style={styles.headerArea}>
        <SkeletonItem style={styles.headerTitle} />
        <SkeletonItem style={styles.headerSubtitle} />
      </View>

      {/* Summary Card Skeleton */}
      <View style={styles.card}>
        <SkeletonItem style={styles.chartCircle} />
        <View style={styles.summaryRow}>
          <SkeletonItem style={styles.summaryItem} />
          <SkeletonItem style={styles.summaryItem} />
        </View>
        <SkeletonItem style={styles.netIncome} />
      </View>

      {/* Insights Grid Skeleton */}
      <View style={styles.grid}>
        <SkeletonItem style={styles.gridItem} />
        <SkeletonItem style={styles.gridItem} />
        <SkeletonItem style={styles.gridItem} />
        <SkeletonItem style={styles.gridItem} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    gap: SPACING.xl,
  },
  skeleton: {
    backgroundColor: '#E1E9EE',
    borderRadius: BORDER_RADIUS.md,
  },
  headerArea: {
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    width: 200,
    height: 32,
    borderRadius: BORDER_RADIUS.lg,
  },
  headerSubtitle: {
    width: 150,
    height: 20,
    borderRadius: BORDER_RADIUS.md,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xl,
    alignItems: 'center',
  },
  chartCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  summaryRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: SPACING.lg,
  },
  summaryItem: {
    flex: 1,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
  },
  netIncome: {
    width: '100%',
    height: 70,
    borderRadius: BORDER_RADIUS.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (SCREEN_WIDTH - (SPACING.xl * 2) - SPACING.md) / 2,
    height: 100,
    borderRadius: BORDER_RADIUS.lg,
  },
});
