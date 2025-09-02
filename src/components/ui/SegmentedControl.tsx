import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/design';

interface SegmentedControlOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  style?: any;
}

export default function SegmentedControl({ 
  options, 
  selectedValue, 
  onValueChange, 
  style 
}: SegmentedControlProps) {
  return (
    <View style={[styles.container, style]}>
      {options.map((option, index) => {
        const isSelected = selectedValue === option.value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;
        
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.segment,
              isFirst && styles.firstSegment,
              isLast && styles.lastSegment,
              isSelected ? styles.activeSegment : styles.inactiveSegment,
            ]}
            onPress={() => onValueChange(option.value)}
          >
            <Text style={[
              styles.segmentText,
              isSelected ? styles.activeText : styles.inactiveText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: BORDER_RADIUS.xl,
    padding: 6,
    gap: 13,
  },
  segment: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 51,
  },
  firstSegment: {
    // No additional styles needed due to flex layout
  },
  lastSegment: {
    // No additional styles needed due to flex layout
  },
  activeSegment: {
    backgroundColor: COLORS.primary,
  },
  inactiveSegment: {
    backgroundColor: 'transparent',
  },
  segmentText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: 'Poppins',
    fontWeight: TYPOGRAPHY.weights.medium,
    textAlign: 'center',
  },
  activeText: {
    color: COLORS.textPrimary,
  },
  inactiveText: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});