import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { Stack } from 'expo-router';
import MoMoAccountLink from '@/components/features/MoMoAccountLink';
import MoMoSyncDashboard from '@/components/features/MoMoSyncDashboard';
import MoMoTransactionsList from '@/components/features/MoMoTransactionsList';
import { useMoMoStore, useMoMoTransactionsData } from '@/stores/momoStore';

export default function MoMoSettingsScreen() {
  const { loadLinkedAccounts, loadMoMoTransactions, loadSyncHistory } = useMoMoStore();
  const { momoTransactions } = useMoMoTransactionsData();

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      await Promise.all([
        loadLinkedAccounts(),
        loadMoMoTransactions(),
        loadSyncHistory(),
      ]);
    };

    loadData();
  }, [loadLinkedAccounts, loadMoMoTransactions, loadSyncHistory]);

  const handleAccountLinked = async () => {
    // Refresh data after account is linked
    await loadLinkedAccounts();
  };

  const handleSyncComplete = async () => {
    // Refresh data after sync
    await Promise.all([
      loadMoMoTransactions(),
      loadSyncHistory(),
    ]);
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'MTN MoMo Integration',
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '600' },
        }} 
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Sync Dashboard */}
        <MoMoSyncDashboard onSyncComplete={handleSyncComplete} />
        
        {/* Account Linking */}
        <MoMoAccountLink onAccountLinked={handleAccountLinked} />
        
        {/* Recent Transactions */}
        {momoTransactions.length > 0 && (
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent MoMo Transactions</Text>
            </View>
            <MoMoTransactionsList 
              transactions={momoTransactions} 
              showAll={false}
            />
          </View>
        )}
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  transactionsSection: {
    marginTop: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  bottomPadding: {
    height: 20,
  },
});