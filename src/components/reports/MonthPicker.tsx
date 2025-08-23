import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface MonthPickerProps {
  selectedMonth: string; // Format: 'YYYY-MM'
  availableMonths: string[]; // Array of available months in 'YYYY-MM' format
  onMonthSelect: (month: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

interface MonthItem {
  value: string;
  label: string;
  isAvailable: boolean;
  isSelected: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const MonthPicker: React.FC<MonthPickerProps> = ({
  selectedMonth,
  availableMonths,
  onMonthSelect,
  isLoading = false,
  disabled = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Generate last 12 months from current month
  const generateMonths = (): MonthItem[] => {
    const months: MonthItem[] = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthValue = `${year}-${month}`;
      
      const monthLabel = date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });

      months.push({
        value: monthValue,
        label: monthLabel,
        isAvailable: availableMonths.includes(monthValue),
        isSelected: monthValue === selectedMonth,
      });
    }
    
    return months;
  };

  const months = generateMonths();

  const formatSelectedMonth = (month: string): string => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleMonthSelect = (month: string): void => {
    onMonthSelect(month);
    setIsModalVisible(false);
  };

  const openModal = (): void => {
    if (!disabled && !isLoading) {
      setIsModalVisible(true);
    }
  };

  return (
    <>
      {/* Month Selector Button */}
      <TouchableOpacity
        style={[
          styles.selectorButton,
          disabled && styles.disabledButton,
        ]}
        onPress={openModal}
        disabled={disabled || isLoading}
        testID="month-picker-button"
      >
        <View style={styles.selectorContent}>
          <View style={styles.monthInfo}>
            <Text style={styles.monthLabel}>Selected Month</Text>
            <Text style={[
              styles.monthValue,
              disabled && styles.disabledText,
            ]}>
              {formatSelectedMonth(selectedMonth)}
            </Text>
          </View>
          <View style={styles.iconContainer}>
            {isLoading ? (
              <MaterialIcons name="hourglass-empty" size={24} color="#9ca3af" />
            ) : (
              <MaterialIcons 
                name="keyboard-arrow-down" 
                size={24} 
                color={disabled ? "#d1d5db" : "#6b7280"} 
              />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Month Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
                testID="close-modal-button"
              >
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Month List */}
            <ScrollView style={styles.monthList} showsVerticalScrollIndicator={false}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={month.value}
                  style={[
                    styles.monthItem,
                    month.isSelected && styles.selectedMonthItem,
                    !month.isAvailable && styles.unavailableMonthItem,
                  ]}
                  onPress={() => month.isAvailable && handleMonthSelect(month.value)}
                  disabled={!month.isAvailable}
                  testID={`month-item-${index}`}
                >
                  <View style={styles.monthItemContent}>
                    <Text style={[
                      styles.monthItemText,
                      month.isSelected && styles.selectedMonthText,
                      !month.isAvailable && styles.unavailableMonthText,
                    ]}>
                      {month.label}
                    </Text>
                    
                    <View style={styles.monthItemIndicators}>
                      {!month.isAvailable && (
                        <View style={styles.noDataIndicator}>
                          <Text style={styles.noDataText}>No data</Text>
                        </View>
                      )}
                      
                      {month.isSelected && (
                        <MaterialIcons name="check" size={20} color="#3b82f6" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Text style={styles.footerText}>
                Showing last 12 months • {availableMonths.length} months with data
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selectorButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  disabledButton: {
    backgroundColor: '#f9fafb',
    borderColor: '#f3f4f6',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  monthInfo: {
    flex: 1,
  },
  monthLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  monthValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  disabledText: {
    color: '#9ca3af',
  },
  iconContainer: {
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  monthList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  monthItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  selectedMonthItem: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderBottomColor: 'transparent',
  },
  unavailableMonthItem: {
    opacity: 0.5,
  },
  monthItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthItemText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  selectedMonthText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  unavailableMonthText: {
    color: '#9ca3af',
  },
  monthItemIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noDataIndicator: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  noDataText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default MonthPicker;