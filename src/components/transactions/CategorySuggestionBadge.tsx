import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CategorySuggestionBadgeProps {
  isAutoCategorized: boolean;
  confidence?: number;
  size?: 'small' | 'medium';
  showConfidence?: boolean;
}

export default function CategorySuggestionBadge({ 
  isAutoCategorized, 
  confidence = 0,
  size = 'medium',
  showConfidence = false 
}: CategorySuggestionBadgeProps) {
  const isSmall = size === 'small';

  if (!isAutoCategorized) {
    return (
      <View style={[styles.badge, styles.manualBadge, isSmall && styles.badgeSmall]}>
        <MaterialIcons 
          name="edit" 
          size={isSmall ? 10 : 12} 
          color="#6366f1" 
        />
        <Text style={[styles.badgeText, styles.manualText, isSmall && styles.badgeTextSmall]}>
          Manual
        </Text>
      </View>
    );
  }

  // Determine confidence color and text
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return { bg: '#ecfdf5', border: '#10b981', text: '#059669' }; // High - Green
    if (conf >= 60) return { bg: '#fffbeb', border: '#f59e0b', text: '#d97706' }; // Medium - Orange  
    return { bg: '#fef2f2', border: '#ef4444', text: '#dc2626' }; // Low - Red
  };

  const confidenceColors = getConfidenceColor(confidence);
  const confidenceText = confidence >= 80 ? 'High' : confidence >= 60 ? 'Medium' : 'Low';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: confidenceColors.bg, borderColor: confidenceColors.border },
      isSmall && styles.badgeSmall
    ]}>
      <MaterialIcons 
        name="auto-awesome" 
        size={isSmall ? 10 : 12} 
        color={confidenceColors.text} 
      />
      <Text style={[
        styles.badgeText, 
        { color: confidenceColors.text },
        isSmall && styles.badgeTextSmall
      ]}>
        Auto
      </Text>
      {showConfidence && !isSmall && (
        <Text style={[styles.confidenceText, { color: confidenceColors.text }]}>
          • {confidenceText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  manualBadge: {
    backgroundColor: '#f8fafc',
    borderColor: '#6366f1',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextSmall: {
    fontSize: 10,
    fontWeight: '500',
  },
  manualText: {
    color: '#6366f1',
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '500',
  },
});