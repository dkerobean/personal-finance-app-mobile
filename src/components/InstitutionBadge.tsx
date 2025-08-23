import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface InstitutionBadgeProps {
  institutionName: string;
  accountType: 'bank' | 'mobile_money' | 'manual';
  size?: 'small' | 'medium';
}

export default function InstitutionBadge({ 
  institutionName,
  accountType,
  size = 'medium'
}: InstitutionBadgeProps) {
  const isSmall = size === 'small';
  
  // Platform-specific styling and icons
  const getConfig = () => {
    switch (accountType) {
      case 'bank':
        return {
          icon: 'account-balance' as const,
          color: '#1976d2',
          backgroundColor: '#e3f2fd',
          borderColor: '#1976d2',
        };
      case 'mobile_money':
        return {
          icon: 'smartphone' as const,
          color: '#ff6b00',
          backgroundColor: '#fff3e0',
          borderColor: '#ff6b00',
        };
      default: // manual
        return {
          icon: 'person' as const,
          color: '#6b7280',
          backgroundColor: '#f3f4f6',
          borderColor: '#6b7280',
        };
    }
  };

  const config = getConfig();
  const displayName = accountType === 'manual' ? 'Manual Entry' : institutionName;

  return (
    <View style={[
      styles.badge,
      isSmall && styles.badgeSmall,
      {
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
      }
    ]}>
      <MaterialIcons 
        name={config.icon}
        size={isSmall ? 12 : 14}
        color={config.color}
      />
      <Text style={[
        styles.badgeText,
        isSmall && styles.badgeTextSmall,
        { color: config.color }
      ]}>
        {displayName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  badgeTextSmall: {
    fontSize: 9,
    fontWeight: '500',
  },
});