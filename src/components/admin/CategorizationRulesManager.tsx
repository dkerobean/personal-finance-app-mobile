import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/services/supabaseClient';

interface CategorizationRule {
  id: string;
  category_id: string;
  rule_type: 'keyword' | 'merchant' | 'amount_range' | 'pattern';
  rule_value: string;
  is_active: boolean;
  priority: number;
  category?: {
    name: string;
    icon_name: string;
  };
}

export default function CategorizationRulesManager() {
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState<{
    category_id: string;
    rule_type: 'keyword' | 'merchant' | 'pattern';
    rule_value: string;
    priority: number;
  }>({
    category_id: '',
    rule_type: 'keyword',
    rule_value: '',
    priority: 1,
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('transaction_categorization_rules')
        .select(`
          *,
          categories(name, icon_name)
        `)
        .order('priority', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Failed to load rules:', error);
      Alert.alert('Error', 'Failed to load categorization rules');
    } finally {
      setLoading(false);
    }
  };

  const addRule = async () => {
    if (!newRule.category_id || !newRule.rule_value) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('transaction_categorization_rules')
        .insert([newRule]);

      if (error) throw error;

      setShowAddModal(false);
      setNewRule({
        category_id: '',
        rule_type: 'keyword',
        rule_value: '',
        priority: 1,
      });
      loadRules();
      Alert.alert('Success', 'Rule added successfully');
    } catch (error) {
      console.error('Failed to add rule:', error);
      Alert.alert('Error', 'Failed to add rule');
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('transaction_categorization_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId);

      if (error) throw error;
      loadRules();
    } catch (error) {
      console.error('Failed to update rule:', error);
      Alert.alert('Error', 'Failed to update rule');
    }
  };

  const deleteRule = async (ruleId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this rule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('transaction_categorization_rules')
                .delete()
                .eq('id', ruleId);

              if (error) throw error;
              loadRules();
              Alert.alert('Success', 'Rule deleted successfully');
            } catch (error) {
              console.error('Failed to delete rule:', error);
              Alert.alert('Error', 'Failed to delete rule');
            }
          },
        },
      ]
    );
  };

  const renderRule = ({ item }: { item: CategorizationRule }) => (
    <View style={styles.ruleItem}>
      <View style={styles.ruleHeader}>
        <View style={styles.ruleInfo}>
          <Text style={styles.ruleType}>{item.rule_type.toUpperCase()}</Text>
          <Text style={styles.ruleValue}>{item.rule_value}</Text>
          <Text style={styles.categoryName}>
            → {item.category?.name || 'Unknown Category'}
          </Text>
        </View>
        <View style={styles.ruleControls}>
          <Text style={styles.priority}>P{item.priority}</Text>
          <Switch
            value={item.is_active}
            onValueChange={(value) => toggleRuleStatus(item.id, value)}
            trackColor={{ false: '#e5e7eb', true: '#10b981' }}
            thumbColor={item.is_active ? '#fff' : '#f3f4f6'}
          />
          <TouchableOpacity
            onPress={() => deleteRule(item.id)}
            style={styles.deleteButton}
          >
            <MaterialIcons name="delete" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading categorization rules...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categorization Rules</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={rules}
        renderItem={renderRule}
        keyExtractor={(item) => item.id}
        style={styles.rulesList}
        contentContainerStyle={styles.rulesListContent}
      />

      {/* Add Rule Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Categorization Rule</Text>
            <TouchableOpacity onPress={addRule}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Rule Type</Text>
              <View style={styles.ruleTypeButtons}>
                {(['keyword', 'merchant', 'pattern'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.ruleTypeButton,
                      newRule.rule_type === type && styles.ruleTypeButtonActive,
                    ]}
                    onPress={() => setNewRule({ ...newRule, rule_type: type })}
                  >
                    <Text
                      style={[
                        styles.ruleTypeButtonText,
                        newRule.rule_type === type && styles.ruleTypeButtonTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Rule Value</Text>
              <TextInput
                style={styles.input}
                value={newRule.rule_value}
                onChangeText={(text) => setNewRule({ ...newRule, rule_value: text })}
                placeholder="e.g., 'uber', 'restaurant', '/food.*lunch/i'"
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Priority (1-10)</Text>
              <TextInput
                style={styles.input}
                value={newRule.priority.toString()}
                onChangeText={(text) =>
                  setNewRule({ ...newRule, priority: Math.max(1, Math.min(10, parseInt(text) || 1)) })
                }
                keyboardType="numeric"
                placeholder="1"
              />
            </View>

            <Text style={styles.helpText}>
              Higher priority rules are applied first. Use keywords for simple text matching,
              merchant for business names, and pattern for regex matching.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  addButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    padding: 8,
  },
  rulesList: {
    flex: 1,
  },
  rulesListContent: {
    padding: 16,
  },
  ruleItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleInfo: {
    flex: 1,
  },
  ruleType: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  ruleValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    color: '#6b7280',
  },
  ruleControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priority: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    color: '#007bff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  ruleTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ruleTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  ruleTypeButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  ruleTypeButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  ruleTypeButtonTextActive: {
    color: '#fff',
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});