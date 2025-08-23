import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Budget, UpdateBudgetRequest } from '@/types/models';
import { useBudgetStore } from '@/stores/budgetStore';

interface EditBudgetModalProps {
  visible: boolean;
  budget: Budget | null;
  onClose: () => void;
}

export default function EditBudgetModal({
  visible,
  budget,
  onClose,
}: EditBudgetModalProps): React.ReactElement {
  const { updateBudget, isLoading, error, clearError } = useBudgetStore();
  
  const [amount, setAmount] = useState<string>('');
  const [amountError, setAmountError] = useState<string>('');

  useEffect(() => {
    if (visible && budget) {
      // Pre-fill form with current budget data
      setAmount(budget.amount.toString());
      setAmountError('');
      clearError();
    }
  }, [visible, budget, clearError]);

  const validateForm = (): boolean => {
    // Validate amount
    const amountNum = parseFloat(amount);
    if (!amount.trim()) {
      setAmountError('Amount is required');
      return false;
    } else if (isNaN(amountNum) || amountNum <= 0) {
      setAmountError('Amount must be a positive number');
      return false;
    } else if (amountNum > 1000000) {
      setAmountError('Amount cannot exceed ₵1,000,000');
      return false;
    } else {
      setAmountError('');
      return true;
    }
  };

  const handleUpdate = async (): Promise<void> => {
    if (!budget || !validateForm()) {
      return;
    }

    const request: UpdateBudgetRequest = {
      amount: parseFloat(amount),
    };

    const success = await updateBudget(budget.id, request);
    
    if (success) {
      Alert.alert('Success', 'Budget updated successfully');
      onClose();
    }
  };

  const handleCancel = (): void => {
    onClose();
  };

  const formatCurrency = (value: string): string => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return numericValue;
  };

  if (!budget) {
    return <></>;
  }

  const budgetMonth = new Date(budget.month);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Budget</Text>
          <TouchableOpacity 
            style={[styles.updateButton, isLoading && styles.updateButtonDisabled]} 
            onPress={handleUpdate}
            disabled={isLoading}
          >
            <Text style={styles.updateButtonText}>
              {isLoading ? 'Updating...' : 'Update'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Budget Info */}
          <View style={styles.budgetInfo}>
            <View style={styles.categoryRow}>
              <MaterialIcons 
                name={budget.category_icon_name as any || 'category'} 
                size={24} 
                color="#374151" 
              />
              <Text style={styles.categoryName}>{budget.category_name}</Text>
            </View>
            <Text style={styles.monthText}>
              {budgetMonth.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Monthly Budget Amount</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>₵</Text>
              <TextInput
                style={[styles.amountInput, amountError && styles.inputError]}
                value={amount}
                onChangeText={(text) => {
                  const formatted = formatCurrency(text);
                  setAmount(formatted);
                  setAmountError('');
                }}
                placeholder="0.00"
                keyboardType="decimal-pad"
                autoCapitalize="none"
                autoFocus
              />
            </View>
            {amountError && (
              <Text style={styles.errorText}>{amountError}</Text>
            )}
          </View>

          {/* Current vs New Amount Comparison */}
          <View style={styles.comparisonSection}>
            <Text style={styles.comparisonLabel}>Budget Comparison</Text>
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonSubtext}>Current</Text>
                <Text style={styles.currentAmount}>₵{budget.amount.toFixed(2)}</Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color="#9ca3af" />
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonSubtext}>New</Text>
                <Text style={styles.newAmount}>
                  ₵{amount ? parseFloat(amount).toFixed(2) : '0.00'}
                </Text>
              </View>
            </View>
            {amount && parseFloat(amount) !== budget.amount && (
              <View style={styles.changeIndicator}>
                {parseFloat(amount) > budget.amount ? (
                  <View style={styles.increaseIndicator}>
                    <MaterialIcons name="arrow-upward" size={16} color="#059669" />
                    <Text style={styles.increaseText}>
                      +₵{(parseFloat(amount) - budget.amount).toFixed(2)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.decreaseIndicator}>
                    <MaterialIcons name="arrow-downward" size={16} color="#dc3545" />
                    <Text style={styles.decreaseText}>
                      -₵{(budget.amount - parseFloat(amount)).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color="#dc3545" />
              <Text style={styles.errorMessage}>{error}</Text>
            </View>
          )}

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialIcons name="info-outline" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              Note: You can only edit the budget amount. To change the category or month, 
              delete this budget and create a new one.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  budgetInfo: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  monthText: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    color: '#111827',
  },
  comparisonSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comparisonItem: {
    alignItems: 'center',
    flex: 1,
  },
  comparisonSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  currentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  newAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  changeIndicator: {
    alignItems: 'center',
    marginTop: 12,
  },
  increaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  increaseText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  decreaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  decreaseText: {
    color: '#dc3545',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorMessage: {
    color: '#dc3545',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    color: '#3b82f6',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});