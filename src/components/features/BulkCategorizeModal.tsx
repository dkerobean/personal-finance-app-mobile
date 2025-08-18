import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { transactionsApi } from '@/services/api/transactions';
import CategorySuggestionBadge from '@/components/transactions/CategorySuggestionBadge';
import type { Transaction, Category } from '@/types/models';

interface BulkCategorizeModalProps {
  visible: boolean;
  onClose: () => void;
  referenceTransaction: Transaction;
}

interface SimilarTransaction {
  transaction: Transaction;
  selected: boolean;
  similarity: number;
}

export default function BulkCategorizeModal({
  visible,
  onClose,
  referenceTransaction,
}: BulkCategorizeModalProps) {
  const [similarTransactions, setSimilarTransactions] = useState<SimilarTransaction[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const { transactions, updateTransaction } = useTransactionStore();
  const { categories } = useCategoryStore();

  useEffect(() => {
    if (visible && referenceTransaction) {
      findSimilarTransactions();
      getSuggestedCategories();
    }
  }, [visible, referenceTransaction]);

  const findSimilarTransactions = () => {
    setLoading(true);
    
    // Find transactions with similar descriptions
    const referenceDesc = referenceTransaction.description?.toLowerCase() || '';
    const referenceWords = referenceDesc.split(/\s+/).filter(word => word.length > 2);
    
    const similar = transactions
      .filter(tx => tx.id !== referenceTransaction.id)
      .map(tx => {
        const txDesc = tx.description?.toLowerCase() || '';
        const txWords = txDesc.split(/\s+/);
        
        // Calculate similarity based on common words
        const commonWords = referenceWords.filter(word => txWords.includes(word));
        const similarity = commonWords.length / Math.max(referenceWords.length, 1);
        
        return {
          transaction: tx,
          selected: false,
          similarity,
        };
      })
      .filter(item => item.similarity > 0.3) // At least 30% similarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20); // Limit to 20 most similar

    setSimilarTransactions(similar);
    setLoading(false);
  };

  const getSuggestedCategories = async () => {
    if (!referenceTransaction.description) return;

    try {
      const response = await transactionsApi.getCategorySuggestions(
        referenceTransaction.description,
        referenceTransaction.amount,
        referenceTransaction.merchant_name
      );

      if (response.data) {
        setSuggestedCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to get category suggestions:', error);
    }
  };

  const toggleTransactionSelection = (transactionId: string) => {
    setSimilarTransactions(prev =>
      prev.map(item =>
        item.transaction.id === transactionId
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };

  const selectAllTransactions = () => {
    setSimilarTransactions(prev =>
      prev.map(item => ({ ...item, selected: true }))
    );
  };

  const deselectAllTransactions = () => {
    setSimilarTransactions(prev =>
      prev.map(item => ({ ...item, selected: false }))
    );
  };

  const handleBulkUpdate = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    const selectedTransactions = similarTransactions
      .filter(item => item.selected)
      .map(item => item.transaction);

    if (selectedTransactions.length === 0) {
      Alert.alert('Error', 'Please select at least one transaction');
      return;
    }

    Alert.alert(
      'Confirm Bulk Update',
      `Update ${selectedTransactions.length} transaction(s) to "${selectedCategory.name}" category?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setUpdating(true);
            try {
              for (const transaction of selectedTransactions) {
                await updateTransaction(transaction.id, {
                  category_id: selectedCategory.id,
                } as any);
              }
              Alert.alert('Success', `Updated ${selectedTransactions.length} transactions`);
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to update transactions');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const renderTransactionItem = ({ item }: { item: SimilarTransaction }) => (
    <TouchableOpacity
      style={[
        styles.transactionItem,
        item.selected && styles.transactionItemSelected,
      ]}
      onPress={() => toggleTransactionSelection(item.transaction.id)}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.checkbox}>
          {item.selected && (
            <MaterialIcons name="check" size={16} color="#007bff" />
          )}
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>
            {item.transaction.description}
          </Text>
          <Text style={styles.transactionAmount}>
            GH₵ {item.transaction.amount.toFixed(2)}
          </Text>
        </View>
        <View style={styles.similarityBadge}>
          <Text style={styles.similarityText}>
            {Math.round(item.similarity * 100)}% match
          </Text>
        </View>
      </View>
      
      <View style={styles.transactionDetails}>
        <CategorySuggestionBadge
          isAutoCategorized={item.transaction.auto_categorized || false}
          confidence={item.transaction.categorization_confidence ? item.transaction.categorization_confidence * 100 : 0}
          size="small"
        />
        <Text style={styles.currentCategory}>
          Current: {item.transaction.category?.name || 'Uncategorized'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory?.id === item.id && styles.categoryItemSelected,
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <MaterialIcons
        name={item.icon_name as any}
        size={20}
        color={selectedCategory?.id === item.id ? '#007bff' : '#666'}
      />
      <Text
        style={[
          styles.categoryName,
          selectedCategory?.id === item.id && styles.categoryNameSelected,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const selectedCount = similarTransactions.filter(item => item.selected).length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Bulk Re-categorize</Text>
          <TouchableOpacity
            onPress={handleBulkUpdate}
            disabled={updating || selectedCount === 0 || !selectedCategory}
            style={[
              styles.updateButton,
              (updating || selectedCount === 0 || !selectedCategory) && styles.updateButtonDisabled,
            ]}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Update ({selectedCount})</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.referenceSection}>
          <Text style={styles.sectionTitle}>Reference Transaction</Text>
          <View style={styles.referenceTransaction}>
            <Text style={styles.transactionDescription}>
              {referenceTransaction.description}
            </Text>
            <Text style={styles.transactionAmount}>
              GH₵ {referenceTransaction.amount.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Select New Category</Text>
          <FlatList
            data={suggestedCategories.length > 0 ? suggestedCategories : categories}
            renderItem={renderCategoryItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesList}
          />
        </View>

        <View style={styles.transactionsSection}>
          <View style={styles.transactionsSectionHeader}>
            <Text style={styles.sectionTitle}>
              Similar Transactions ({similarTransactions.length})
            </Text>
            <View style={styles.selectionControls}>
              <TouchableOpacity onPress={selectAllTransactions} style={styles.controlButton}>
                <Text style={styles.controlButtonText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={deselectAllTransactions} style={styles.controlButton}>
                <Text style={styles.controlButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>Finding similar transactions...</Text>
            </View>
          ) : (
            <FlatList
              data={similarTransactions}
              renderItem={renderTransactionItem}
              keyExtractor={item => item.transaction.id}
              style={styles.transactionsList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  updateButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  updateButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  referenceSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  referenceTransaction: {
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  categoriesSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  categoriesList: {
    marginTop: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  categoryItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007bff',
  },
  categoryName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#495057',
  },
  categoryNameSelected: {
    color: '#007bff',
    fontWeight: '600',
  },
  transactionsSection: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  transactionsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectionControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  controlButtonText: {
    fontSize: 12,
    color: '#495057',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6c757d',
  },
  transactionsList: {
    flex: 1,
  },
  transactionItem: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  transactionItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007bff',
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 4,
  },
  transactionAmount: {
    fontSize: 12,
    color: '#6c757d',
  },
  similarityBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  similarityText: {
    fontSize: 10,
    color: '#856404',
    fontWeight: '600',
  },
  transactionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  currentCategory: {
    fontSize: 12,
    color: '#6c757d',
  },
});