import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/design';
import type { TimePeriodConfig, HistoricalDataPoint } from '../../../app/(app)/networth/history';

interface TimePeriodSelectorProps {
  periods: TimePeriodConfig[];
  selectedPeriod: TimePeriodConfig;
  onPeriodChange: (period: TimePeriodConfig) => void;
  availableData: HistoricalDataPoint[];
  disabled?: boolean;
}

interface CustomDateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export default function TimePeriodSelector({
  periods,
  selectedPeriod,
  onPeriodChange,
  availableData,
  disabled = false,
}: TimePeriodSelectorProps): React.ReactElement {
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({
    startDate: null,
    endDate: null,
  });
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Get earliest and latest available dates
  const getDataBounds = () => {
    if (availableData.length === 0) {
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      return {
        earliest: threeMonthsAgo,
        latest: today,
      };
    }

    const dates = availableData.map(d => new Date(d.date));
    return {
      earliest: new Date(Math.min(...dates.map(d => d.getTime()))),
      latest: new Date(Math.max(...dates.map(d => d.getTime()))),
    };
  };

  const { earliest, latest } = getDataBounds();

  // Check if a period has sufficient data
  const isPeriodAvailable = (period: TimePeriodConfig): boolean => {
    if (period.months === -1) return availableData.length >= 2; // All time needs at least 2 points
    
    const requiredDate = new Date();
    requiredDate.setMonth(requiredDate.getMonth() - period.months);
    
    return earliest <= requiredDate;
  };

  // Handle period selection
  const handlePeriodSelect = (period: TimePeriodConfig) => {
    if (disabled || !isPeriodAvailable(period)) return;
    onPeriodChange(period);
  };

  // Handle custom date range
  const handleCustomDateRange = () => {
    setShowCustomDatePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      if (datePickerMode === 'start') {
        setCustomDateRange(prev => ({ ...prev, startDate: selectedDate }));
      } else {
        setCustomDateRange(prev => ({ ...prev, endDate: selectedDate }));
      }
    }
  };

  const applyCustomDateRange = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      // Create a custom period configuration
      const monthsDiff = Math.ceil(
        (customDateRange.endDate.getTime() - customDateRange.startDate.getTime()) / 
        (1000 * 60 * 60 * 24 * 30)
      );
      
      const customPeriod: TimePeriodConfig = {
        label: 'Custom',
        months: monthsDiff,
        defaultChart: 'line',
        dataPoints: monthsDiff > 12 ? 'monthly' : 'all',
      };
      
      onPeriodChange(customPeriod);
      setShowCustomDatePicker(false);
      setCustomDateRange({ startDate: null, endDate: null });
    }
  };

  const formatCustomDate = (date: Date | null) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      {/* Period Filter Buttons */}
      <View style={styles.periodButtons}>
        {periods.map((period) => {
          const isSelected = selectedPeriod.label === period.label && selectedPeriod.months === period.months;
          const isAvailable = isPeriodAvailable(period);
          
          return (
            <TouchableOpacity
              key={`${period.label}-${period.months}`}
              style={[
                styles.periodButton,
                isSelected && styles.selectedPeriodButton,
                !isAvailable && styles.disabledPeriodButton,
              ]}
              onPress={() => handlePeriodSelect(period)}
              disabled={disabled || !isAvailable}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  isSelected && styles.selectedPeriodButtonText,
                  !isAvailable && styles.disabledPeriodButtonText,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        
        {/* Custom Date Range Button */}
        <TouchableOpacity
          style={[
            styles.customButton,
            selectedPeriod.label === 'Custom' && styles.selectedPeriodButton,
          ]}
          onPress={handleCustomDateRange}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <MaterialIcons name="date-range" size={16} color={
            selectedPeriod.label === 'Custom' ? COLORS.white : COLORS.textSecondary
          } />
          <Text
            style={[
              styles.customButtonText,
              selectedPeriod.label === 'Custom' && styles.selectedPeriodButtonText,
            ]}
          >
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {/* Data Availability Info */}
      <View style={styles.dataInfo}>
        <MaterialIcons name="info-outline" size={14} color={COLORS.textSecondary} />
        <Text style={styles.dataInfoText}>
          Data available from {earliest.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} 
          {' '}to {latest.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </Text>
      </View>

      {/* Custom Date Range Modal */}
      <Modal
        visible={showCustomDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date Range</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCustomDatePicker(false)}
              >
                <MaterialIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateSelectors}>
              {/* Start Date */}
              <View style={styles.dateSelector}>
                <Text style={styles.dateSelectorLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateSelectorButton}
                  onPress={() => {
                    setDatePickerMode('start');
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.dateSelectorText}>
                    {formatCustomDate(customDateRange.startDate)}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* End Date */}
              <View style={styles.dateSelector}>
                <Text style={styles.dateSelectorLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateSelectorButton}
                  onPress={() => {
                    setDatePickerMode('end');
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.dateSelectorText}>
                    {formatCustomDate(customDateRange.endDate)}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCustomDatePicker(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalApplyButton,
                  (!customDateRange.startDate || !customDateRange.endDate) && styles.disabledApplyButton,
                ]}
                onPress={applyCustomDateRange}
                disabled={!customDateRange.startDate || !customDateRange.endDate}
              >
                <Text style={styles.modalApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={
            datePickerMode === 'start' 
              ? customDateRange.startDate || earliest
              : customDateRange.endDate || latest
          }
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={earliest}
          maximumDate={latest}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  periodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  periodButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundContent,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedPeriodButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  disabledPeriodButton: {
    backgroundColor: COLORS.backgroundContent,
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  periodButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  selectedPeriodButtonText: {
    color: COLORS.white,
  },
  disabledPeriodButtonText: {
    color: COLORS.textSecondary,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundContent,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  customButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  dataInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dataInfoText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  dateSelectors: {
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  dateSelector: {},
  dateSelectorLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  dateSelectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundContent,
  },
  dateSelectorText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  modalCancelButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  modalCancelText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  modalApplyButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  disabledApplyButton: {
    backgroundColor: COLORS.border,
  },
  modalApplyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});