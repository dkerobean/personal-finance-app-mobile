import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface PlatformSourceIndicatorProps {
  accountType?: 'bank' | 'mobile_money' | 'manual';
  size?: 'small' | 'medium';
}

export default function PlatformSourceIndicator({ 
  accountType = 'manual',
  size = 'medium'
}: PlatformSourceIndicatorProps) {
  const isSmall = size === 'small';
  
  // Platform-specific configuration
  const getConfig = () => {
    switch (accountType) {
      case 'bank':
        return {
          icon: 'cloud-sync' as const,
          text: 'Mono API',
          color: '#1976d2',
          backgroundColor: '#e3f2fd',
        };
      case 'mobile_money':
        return {
          icon: 'cloud-sync' as const,
          text: 'MTN MoMo API',
          color: '#ff6b00',
          backgroundColor: '#fff3e0',
        };
      default: // manual
        return {
          icon: 'edit' as const,
          text: 'Manual',
          color: '#6b7280',
          backgroundColor: '#f3f4f6',
        };
    }
  };

  const config = getConfig();

  return (
    <View style={[
      styles.indicator,
      isSmall && styles.indicatorSmall,
      { backgroundColor: config.backgroundColor }
    ]}>
      <MaterialIcons 
        name={config.icon}
        size={isSmall ? 10 : 12}
        color={config.color}
      />
      <Text style={[
        styles.indicatorText,
        isSmall && styles.indicatorTextSmall,
        { color: config.color }
      ]}>
        {config.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
    alignSelf: 'flex-start',
  },
  indicatorSmall: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    gap: 2,
  },
  indicatorText: {
    fontSize: 10,
    fontWeight: '500',
  },
  indicatorTextSmall: {
    fontSize: 9,
    fontWeight: '400',
  },
});