import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMoMoStore, useMoMoSyncData, useMoMoTransactionsData } from '@/stores/momoStore';

interface MoMoSyncDashboardProps {
  onSyncComplete?: () => void;
}

export default function MoMoSyncDashboard({ onSyncComplete }: MoMoSyncDashboardProps) {
  const { syncTransactions, initializeMoMoService } = useMoMoStore();
  const { 
    isSyncing, 
    lastSyncTime, 
    isInitialized, 
    successfulSyncs, 
    failedSyncs, 
    totalSyncs 
  } = useMoMoSyncData();
  
  const { 
    totalTransactions, 
    autoCategorizedCount, 
    totalMoMoIncome, 
    totalMoMoExpenses 
  } = useMoMoTransactionsData();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleInitialize = async () => {
    const success = await initializeMoMoService();
    if (success) {
      Alert.alert('Success', 'MTN MoMo service initialized successfully!');
    }
  };

  const handleSync = async () => {
    if (!isInitialized) {
      Alert.alert(
        'Service Not Initialized',
        'Please initialize the MTN MoMo service first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Initialize', onPress: handleInitialize }
        ]
      );
      return;
    }

    const result = await syncTransactions();
    
    if (result) {
      const { newTransactions, updatedTransactions, errors } = result;
      let message = `Sync completed!\n\n`;
      message += `• New transactions: ${newTransactions}\n`;
      message += `• Updated transactions: ${updatedTransactions}`;
      
      if (errors.length > 0) {
        message += `\n• Errors: ${errors.length}`;
      }

      Alert.alert('Sync Complete', message);
      onSyncComplete?.();
    }
  };

  return (
    <View style={styles.container}>
      {/* Sync Status Card */}
      <View style={styles.card}>
        <View style={styles.header}>
          <MaterialIcons name="sync" size={24} color="#2563eb" />
          <Text style={styles.title}>Sync Status</Text>
        </View>

        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <View style={[
              styles.statusIndicator,
              isInitialized ? styles.statusActive : styles.statusInactive
            ]}>
              <MaterialIcons 
                name={isInitialized ? "check-circle" : "radio-button-unchecked"} 
                size={16} 
                color={isInitialized ? "#059669" : "#9ca3af"} 
              />
            </View>
            <Text style={styles.statusText}>
              Service {isInitialized ? 'Initialized' : 'Not Initialized'}
            </Text>
          </View>

          {lastSyncTime && (
            <View style={styles.statusItem}>
              <MaterialIcons name="access-time" size={16} color="#6b7280" />
              <Text style={styles.statusText}>
                Last sync: {formatDate(lastSyncTime)}
              </Text>
            </View>
          )}

          <View style={styles.syncStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{successfulSyncs}</Text>
              <Text style={styles.statLabel}>Successful</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{failedSyncs}</Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalSyncs}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {!isInitialized && (
            <TouchableOpacity
              style={styles.initButton}
              onPress={handleInitialize}
            >
              <MaterialIcons name="power-settings-new" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Initialize Service</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.syncButton,
              (!isInitialized || isSyncing) && styles.syncButtonDisabled
            ]}
            onPress={handleSync}
            disabled={!isInitialized || isSyncing}
          >
            <MaterialIcons 
              name={isSyncing ? "hourglass-empty" : "sync"} 
              size={20} 
              color="#ffffff" 
            />
            <Text style={styles.buttonText}>
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transaction Summary Card */}
      <View style={styles.card}>
        <View style={styles.header}>
          <MaterialIcons name="assessment" size={24} color="#059669" />
          <Text style={styles.title}>Transaction Summary</Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <MaterialIcons name="receipt" size={24} color="#2563eb" />
            <Text style={styles.summaryValue}>{totalTransactions}</Text>
            <Text style={styles.summaryLabel}>Total Transactions</Text>
          </View>

          <View style={styles.summaryItem}>
            <MaterialIcons name="auto-awesome" size={24} color="#7c3aed" />
            <Text style={styles.summaryValue}>{autoCategorizedCount}</Text>
            <Text style={styles.summaryLabel}>Auto Categorized</Text>
          </View>

          <View style={styles.summaryItem}>
            <MaterialIcons name="trending-up" size={24} color="#059669" />
            <Text style={styles.summaryValue}>{formatCurrency(totalMoMoIncome)}</Text>
            <Text style={styles.summaryLabel}>Total Income</Text>
          </View>

          <View style={styles.summaryItem}>
            <MaterialIcons name="trending-down" size={24} color="#dc3545" />
            <Text style={styles.summaryValue}>{formatCurrency(totalMoMoExpenses)}</Text>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions Card */}
      <View style={styles.card}>
        <View style={styles.header}>
          <MaterialIcons name="flash-on" size={24} color="#f59e0b" />
          <Text style={styles.title}>Quick Actions</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="category" size={20} color="#2563eb" />
            <Text style={styles.actionText}>Manage Categories</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="settings" size={20} color="#6b7280" />
            <Text style={styles.actionText}>Sync Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="history" size={20} color="#059669" />
            <Text style={styles.actionText}>Sync History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    marginRight: 8,
  },
  statusActive: {
    // Style for active status
  },
  statusInactive: {
    // Style for inactive status
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
  },
  syncStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  initButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  syncButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  syncButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    marginHorizontal: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});