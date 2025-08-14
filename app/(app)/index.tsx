import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useTransactionStore, useDashboardData } from '@/stores/transactionStore';
import { authService } from '@/services/authService';
import TotalBalanceCard from '@/components/dashboard/TotalBalanceCard';
import RecentTransactions from '@/components/dashboard/RecentTransactions';

export default function DashboardScreen(): React.ReactElement {
  const { user, logout } = useAuthStore();
  const { loadTransactions } = useTransactionStore();
  const { transactions, isLoading, error, recentTransactions } = useDashboardData();

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleSignOut = async (): Promise<void> => {
    const result = await authService.signOut();
    if (result.success) {
      await logout();
      router.replace('/(auth)/login');
    }
  };

  const handleRefresh = async (): Promise<void> => {
    await loadTransactions();
  };

  const handleAddTransaction = (): void => {
    router.push('/transactions/create');
  };

  const handleViewTransactions = (): void => {
    router.push('/transactions');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.welcomeText}>Welcome back, {user?.email?.split('@')[0] || 'User'}!</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleSignOut}>
            <MaterialIcons name="account-circle" size={32} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Total Balance Card */}
        <TotalBalanceCard transactions={transactions} isLoading={isLoading} />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddTransaction}>
            <MaterialIcons name="add" size={24} color="#ffffff" />
            <Text style={styles.actionButtonText}>Add Transaction</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleViewTransactions}>
            <MaterialIcons name="list" size={24} color="#2563eb" />
            <Text style={styles.actionButtonSecondaryText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <RecentTransactions transactions={recentTransactions} isLoading={isLoading} />

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={24} color="#dc3545" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddTransaction}>
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
  },
  profileButton: {
    padding: 8,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 8,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  actionButtonSecondaryText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  bottomSpacing: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});