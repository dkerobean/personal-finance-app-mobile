import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useCategoryStore } from '@/stores/categoryStore';
import GradientHeader from '@/components/budgets/GradientHeader';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/ui/CustomAlert';

const ICON_GROUPS = [
  {
    title: 'Money',
    icons: ['attach-money', 'savings', 'account-balance-wallet', 'credit-card', 'receipt', 'payment'],
  },
  {
    title: 'Daily Life',
    icons: ['restaurant', 'local-grocery-store', 'local-mall', 'shopping-cart', 'home', 'fitness-center'],
  },
  {
    title: 'Transport',
    icons: ['directions-car', 'directions-bus', 'local-taxi', 'flight', 'train', 'local-gas-station'],
  },
  {
    title: 'Lifestyle',
    icons: ['movie', 'music-note', 'sports-soccer', 'event', 'pets', 'spa'],
  },
  {
    title: 'Business',
    icons: ['work', 'business-center', 'laptop-mac', 'school', 'construction', 'support-agent'],
  },
] as const;

type IconGroup = (typeof ICON_GROUPS)[number]['title'] | 'All';

const ALL_ICONS = Array.from(new Set(ICON_GROUPS.flatMap((group) => group.icons)));

export default function CreateCategoryScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { createCategory, isLoading, error } = useCategoryStore();
  const { alert, alertProps } = useCustomAlert();

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('attach-money');
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<IconGroup>('All');
  const [nameError, setNameError] = useState('');

  const filteredIcons = useMemo(() => {
    const groupIcons =
      activeGroup === 'All' ? ALL_ICONS : ICON_GROUPS.find((group) => group.title === activeGroup)?.icons || [];

    const query = search.trim().toLowerCase();
    if (!query) return groupIcons;

    return groupIcons.filter((iconName) => iconName.replace(/[-_]/g, ' ').toLowerCase().includes(query));
  }, [activeGroup, search]);

  const validateForm = () => {
    if (!name.trim()) {
      setNameError('Category name is required');
      return false;
    }

    if (name.trim().length < 2) {
      setNameError('Category name must be at least 2 characters');
      return false;
    }

    setNameError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!userId) {
      alert('Sign In Required', 'Please sign in to create categories.');
      return;
    }

    const success = await createCategory(userId, name.trim(), selectedIcon);

    if (success) {
      alert('Success', 'Category created successfully', [{ text: 'OK', onPress: () => router.back() }]);
      return;
    }

    if (error) {
      alert('Error', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.mainScrollView} showsVerticalScrollIndicator={false}>
        <GradientHeader
          title="Create Category"
          subtitle="Set up custom income and expense groups"
          onBackPress={() => router.back()}
          showCalendar={false}
          showNotification={false}
        />

        <View style={styles.content}>
          <LinearGradient
            colors={['#033327', COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewCard}
          >
            <View style={styles.previewIconWrap}>
              <MaterialIcons name={selectedIcon as any} size={26} color={COLORS.white} />
            </View>
            <View style={styles.previewTextWrap}>
              <Text style={styles.previewLabel}>Preview</Text>
              <Text style={styles.previewName}>{name.trim() || 'New Category'}</Text>
              <Text style={styles.previewSubtext}>This icon will appear in transaction forms</Text>
            </View>
          </LinearGradient>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category Name</Text>
            <TextInput
              style={[styles.input, nameError ? styles.inputError : null]}
              placeholder="e.g. Side Hustle, Utilities"
              placeholderTextColor={COLORS.textTertiary}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError('');
              }}
              autoCapitalize="words"
              maxLength={40}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Find Icon</Text>
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color={COLORS.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search icon name"
                placeholderTextColor={COLORS.textTertiary}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Icon Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupRow}>
              {(['All', ...ICON_GROUPS.map((group) => group.title)] as IconGroup[]).map((group) => {
                const selected = group === activeGroup;
                return (
                  <TouchableOpacity
                    key={group}
                    style={[styles.groupPill, selected && styles.groupPillActive]}
                    onPress={() => setActiveGroup(group)}
                  >
                    <Text style={[styles.groupPillText, selected && styles.groupPillTextActive]}>{group}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Select Icon ({filteredIcons.length})</Text>
            <View style={styles.iconGrid}>
              {filteredIcons.map((iconName) => {
                const selected = selectedIcon === iconName;
                return (
                  <TouchableOpacity
                    key={iconName}
                    style={[styles.iconButton, selected && styles.iconButtonSelected]}
                    onPress={() => setSelectedIcon(iconName)}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons
                      name={iconName as any}
                      size={24}
                      color={selected ? COLORS.white : COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            {filteredIcons.length === 0 ? <Text style={styles.helperText}>No icons match your search.</Text> : null}
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={18} color={COLORS.error} />
              <Text style={styles.errorTextInline}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, (isLoading || !name.trim() || !userId) && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading || !name.trim() || !userId}
            >
              <Text style={styles.primaryButtonText}>{isLoading ? 'Creating...' : 'Create Category'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => router.back()} disabled={isLoading}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      <CustomAlert {...alertProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BUDGET.gradientColors.start,
  },
  mainScrollView: {
    flex: 1,
  },
  content: {
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    flex: 1,
  },
  previewCard: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.lg,
  },
  previewIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  previewTextWrap: {
    flex: 1,
  },
  previewLabel: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    opacity: 0.9,
  },
  previewName: {
    marginTop: 3,
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  previewSubtext: {
    marginTop: 2,
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.sm,
    opacity: 0.92,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    marginTop: 6,
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  groupRow: {
    gap: SPACING.sm,
    paddingRight: SPACING.xl,
  },
  groupPill: {
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  groupPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  groupPillText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  groupPillTextActive: {
    color: COLORS.white,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  iconButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  helperText: {
    marginTop: SPACING.sm,
    color: COLORS.textTertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  errorContainer: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  errorTextInline: {
    marginLeft: SPACING.sm,
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    flex: 1,
  },
  buttonContainer: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  button: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.md,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.gray100,
    backgroundColor: COLORS.white,
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  bottomSpacing: {
    height: 130,
  },
});
