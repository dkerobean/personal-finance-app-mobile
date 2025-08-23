import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SyncedTransactionBadgeProps {
  accountName?: string;
  accountType?: 'bank' | 'mobile_money';
  institutionName?: string;
  size?: 'small' | 'medium';
}

export default function SyncedTransactionBadge({ 
  accountName, 
  accountType = 'mobile_money',
  institutionName,
  size = 'medium' 
}: SyncedTransactionBadgeProps) {
  const isSmall = size === 'small';
  const isBank = accountType === 'bank';
  
  // Platform-specific styling and content
  const platformConfig = isBank ? {
    icon: 'account-balance' as const,
    color: '#1976d2', // Bank blue
    backgroundColor: '#e3f2fd',
    text: 'Bank',
    displayName: institutionName || 'Bank Account'
  } : {
    icon: 'account-balance-wallet' as const,
    color: '#ff6b00', // MTN orange
    backgroundColor: '#fff3e0',
    text: 'MTN MoMo',
    displayName: institutionName || 'MTN Mobile Money'
  };

  return (
    <View style={[
      styles.badge, 
      isSmall && styles.badgeSmall,
      { backgroundColor: platformConfig.backgroundColor, borderColor: platformConfig.color }
    ]}>
      <MaterialIcons 
        name={platformConfig.icon} 
        size={isSmall ? 12 : 16} 
        color={platformConfig.color} 
      />
      <Text style={[
        styles.badgeText, 
        isSmall && styles.badgeTextSmall,
        { color: platformConfig.color }
      ]}>
        {platformConfig.text}
      </Text>
      {accountName && !isSmall && (
        <Text style={[styles.accountText, { color: platformConfig.color }]}>
          • {accountName}
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
  },
  badgeSmall: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextSmall: {
    fontSize: 10,
    fontWeight: '500',
  },
  accountText: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.8,
  },
});