import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Share, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/design';
import { formatCurrency } from '@/lib/formatters';
import type { HistoricalDataPoint, TimePeriodConfig } from '../../../app/(app)/networth/history';

interface ExportOptionsProps {
  data: HistoricalDataPoint[];
  timePeriod: TimePeriodConfig;
  disabled?: boolean;
  onExport?: (format: 'csv' | 'image' | 'share') => void;
}

export default function ExportOptions({
  data,
  timePeriod,
  disabled = false,
  onExport,
}: ExportOptionsProps): React.ReactElement {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Generate CSV content
  const generateCSV = (): string => {
    const headers = [
      'Date',
      'Net Worth',
      'Total Assets',
      'Total Liabilities',
      'Connected Value',
      'Manual Assets',
      'Manual Liabilities',
      'Month-over-Month Change'
    ];

    const csvData = data.map(point => [
      point.date,
      point.netWorth.toString(),
      point.totalAssets.toString(),
      point.totalLiabilities.toString(),
      point.connectedValue.toString(),
      point.manualAssets.toString(),
      point.manualLiabilities.toString(),
      point.monthOverMonth.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  };

  // Generate summary text for sharing
  const generateSummary = (): string => {
    if (data.length === 0) return 'No data available for export.';

    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstPoint = sortedData[0];
    const lastPoint = sortedData[sortedData.length - 1];
    
    const totalGrowth = lastPoint.netWorth - firstPoint.netWorth;
    const growthPercentage = firstPoint.netWorth !== 0 ? (totalGrowth / firstPoint.netWorth) * 100 : 0;

    const startDate = new Date(firstPoint.date).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    const endDate = new Date(lastPoint.date).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });

    return `📈 Net Worth Progress Report (${timePeriod.label})

Period: ${startDate} - ${endDate}
Data Points: ${data.length}

💰 Starting Net Worth: ${formatCurrency(firstPoint.netWorth)}
💰 Current Net Worth: ${formatCurrency(lastPoint.netWorth)}

📊 Total Growth: ${formatCurrency(totalGrowth)} (${growthPercentage >= 0 ? '+' : ''}${growthPercentage.toFixed(1)}%)

🏦 Current Assets: ${formatCurrency(lastPoint.totalAssets)}
💳 Current Liabilities: ${formatCurrency(lastPoint.totalLiabilities)}

Generated from kippo - Personal Finance Tracker`;
  };

  // Handle CSV export
  const handleCSVExport = async () => {
    try {
      setIsExporting('csv');
      
      const csvContent = generateCSV();
      
      // For now, just share the CSV content as text
      // In a future update, this could write to a file and share the file
      await Share.share({
        message: csvContent,
        title: 'Net Worth History Data (CSV)',
      });

      onExport?.('csv');
    } catch (error) {
      console.error('CSV export error:', error);
      Alert.alert(
        'Export Failed',
        'Unable to export CSV data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(null);
    }
  };

  // Handle image export (placeholder - would need chart screenshot functionality)
  const handleImageExport = async () => {
    try {
      setIsExporting('image');
      
      // TODO: Implement actual chart screenshot functionality
      Alert.alert(
        'Feature Coming Soon',
        'Chart image export functionality will be available in a future update.',
        [{ text: 'OK' }]
      );
      
      onExport?.('image');
    } catch (error) {
      console.error('Image export error:', error);
      Alert.alert(
        'Export Failed',
        'Unable to export chart image. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(null);
    }
  };

  // Handle share summary
  const handleShareSummary = async () => {
    try {
      setIsExporting('share');
      
      const summary = generateSummary();
      
      await Share.share({
        message: summary,
        title: 'Net Worth Progress Report',
      });

      onExport?.('share');
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert(
        'Share Failed',
        'Unable to share summary. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(null);
    }
  };

  const exportOptions = [
    {
      id: 'csv',
      title: 'Export as CSV',
      subtitle: 'Download detailed data',
      icon: 'file-download',
      color: COLORS.primary,
      action: handleCSVExport,
    },
    {
      id: 'image',
      title: 'Export Chart',
      subtitle: 'Save chart as image',
      icon: 'photo',
      color: COLORS.success,
      action: handleImageExport,
    },
    {
      id: 'share',
      title: 'Share Summary',
      subtitle: 'Share progress report',
      icon: 'share',
      color: COLORS.secondary,
      action: handleShareSummary,
    },
  ];

  // Show disabled state
  if (disabled || data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Export & Share</Text>
        </View>
        <View style={styles.disabledContainer}>
          <MaterialIcons name="cloud-off" size={32} color={COLORS.textSecondary} />
          <Text style={styles.disabledText}>
            {data.length === 0 
              ? 'No data available for export' 
              : 'Export temporarily unavailable'
            }
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Export & Share</Text>
        <Text style={styles.subtitle}>
          {data.length} data points • {timePeriod.label} period
        </Text>
      </View>

      {/* Export Options */}
      <View style={styles.optionsContainer}>
        {exportOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionButton,
              isExporting === option.id && styles.exportingButton,
            ]}
            onPress={option.action}
            disabled={isExporting !== null}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <MaterialIcons 
                name={option.icon as any} 
                size={24} 
                color={isExporting === option.id ? COLORS.white : option.color} 
              />
            </View>
            
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionTitle,
                isExporting === option.id && styles.exportingText,
              ]}>
                {isExporting === option.id ? 'Exporting...' : option.title}
              </Text>
              <Text style={[
                styles.optionSubtitle,
                isExporting === option.id && styles.exportingText,
              ]}>
                {option.subtitle}
              </Text>
            </View>
            
            <View style={styles.optionArrow}>
              <MaterialIcons 
                name="keyboard-arrow-right" 
                size={20} 
                color={isExporting === option.id ? COLORS.white : COLORS.textSecondary} 
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Data Info */}
      <View style={styles.dataInfo}>
        <MaterialIcons name="info-outline" size={16} color={COLORS.textSecondary} />
        <Text style={styles.dataInfoText}>
          CSV exports include all data points with detailed breakdown. 
          Shared summaries show key metrics and growth analysis.
        </Text>
      </View>
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
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  
  // Export options
  optionsContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundContent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exportingButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  exportingText: {
    color: COLORS.white,
  },
  optionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  optionArrow: {
    marginLeft: SPACING.sm,
  },
  
  // Data info
  dataInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.backgroundContent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  dataInfoText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.sizes.xs * 1.4,
    flex: 1,
  },
  
  // Disabled state
  disabledContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  disabledText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: TYPOGRAPHY.sizes.md * 1.4,
  },
});