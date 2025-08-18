import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SyncedTransactionBadgeProps {
  accountName?: string;
  size?: 'small' | 'medium';
}

export default function SyncedTransactionBadge({ 
  accountName, 
  size = 'medium' 
}: SyncedTransactionBadgeProps) {
  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, isSmall && styles.badgeSmall]}>
      <MaterialIcons 
        name="account-balance-wallet" 
        size={isSmall ? 12 : 16} 
        color="#ff6b00" 
      />
      <Text style={[styles.badgeText, isSmall && styles.badgeTextSmall]}>
        MTN MoMo
      </Text>
      {accountName && !isSmall && (
        <Text style={styles.accountText}>
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
    backgroundColor: '#fff3e0',
    borderColor: '#ff6b00',
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
    color: '#ff6b00',
  },
  badgeTextSmall: {
    fontSize: 10,
    fontWeight: '500',
  },
  accountText: {
    fontSize: 10,
    color: '#ff8c42',
    fontWeight: '500',
  },
});