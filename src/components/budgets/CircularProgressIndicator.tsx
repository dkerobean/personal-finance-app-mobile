import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { BUDGET } from '@/constants/design';

interface CircularProgressIndicatorProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  progressColor?: string;
  backgroundColor?: string;
}

export default function CircularProgressIndicator({
  progress,
  size = BUDGET.circularProgress.size,
  strokeWidth = BUDGET.circularProgress.strokeWidth,
  iconName = 'directions-car',
  iconColor = BUDGET.circularProgress.iconColor,
  progressColor = BUDGET.circularProgress.progressColor,
  backgroundColor = BUDGET.circularProgress.backgroundStroke,
}: CircularProgressIndicatorProps): React.ReactElement {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Ensure we show at least some visual feedback even with 0 progress
  const displayProgress = Math.min(Math.max(progress, 5), 100); // Show 5% minimum, cap at 100%

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background circle */}
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth + 2}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth + 2}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={circumference - (displayProgress / 100) * circumference}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      
      {/* Center icon */}
      <View style={styles.iconContainer}>
        <MaterialIcons
          name={iconName}
          size={BUDGET.circularProgress.iconSize}
          color={iconColor}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});