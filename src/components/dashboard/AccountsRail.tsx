import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Building2, Plus, Smartphone } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '@/constants/design';
import { router } from 'expo-router';
import { Account } from '@/types/models';

interface AccountsRailProps {
  accounts: Account[];
}

const CARD_WIDTH = 220;

const formatCurrency = (amount: number): string =>
  `GH¢${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AccountsRail: React.FC<AccountsRailProps> = ({ accounts }) => {
  const getAccountId = (account: Account): string => account.id || (account as any)._id || '';

  const getAccountType = (account: Account): 'bank' | 'mobile_money' =>
    ((account.account_type || (account as any).accountType || 'bank') as 'bank' | 'mobile_money');

  const getAccountName = (account: Account): string =>
    account.account_name || (account as any).accountName || 'Account';

  const getInstitutionName = (account: Account): string =>
    account.institution_name || (account as any).institutionName || 'Financial Account';

  const getLastSynced = (account: Account): string => {
    const raw = account.last_synced_at || (account as any).lastSyncedAt;
    if (!raw) return 'Sync pending';

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return 'Sync pending';

    return `Synced ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  };

  const renderItem = ({ item }: { item: Account }) => {
    const accountId = getAccountId(item);
    const accountType = getAccountType(item);
    const isMomo = accountType === 'mobile_money';
    const balance = Number(item.balance || 0);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push(accountId ? `/accounts/${accountId}` : '/accounts')}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.logoPlaceholder, { backgroundColor: isMomo ? '#FEF3C7' : '#DCFCE7' }]}>
            {isMomo ? <Smartphone size={18} color={COLORS.warning} /> : <Building2 size={18} color={COLORS.primary} />}
          </View>

          <View style={[styles.typeChip, isMomo && styles.typeChipMomo]}>
            <Text style={[styles.typeChipText, isMomo && styles.typeChipTextMomo]}>
              {isMomo ? 'MoMo' : 'Bank'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.accountName} numberOfLines={1}>
            {getAccountName(item)}
          </Text>
          <Text style={styles.institutionName} numberOfLines={1}>
            {getInstitutionName(item)}
          </Text>
          <Text style={styles.balance}>{formatCurrency(balance)}</Text>
          <Text style={styles.syncText}>{getLastSynced(item)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAddCard = () => (
    <TouchableOpacity 
        style={[styles.card, styles.addCard]}
        onPress={() => router.push('/add-account')}
        activeOpacity={0.85}
    >
        <View style={styles.addIconContainer}>
            <Plus size={24} color={COLORS.primary} />
        </View>
        <Text style={styles.addText}>Add Account</Text>
        <Text style={styles.addSubText}>Link bank or MoMo</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Accounts</Text>
        <TouchableOpacity onPress={() => router.push('/accounts')}>
             <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={accounts}
        renderItem={renderItem}
        keyExtractor={(item, index) => getAccountId(item) || `account-${index}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={renderAddCard}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  seeAll: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  card: {
    width: CARD_WIDTH,
    minHeight: 156,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChip: {
    backgroundColor: COLORS.gray50,
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  typeChipMomo: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  typeChipText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  typeChipTextMomo: {
    color: '#92400E',
  },
  cardBody: {
    marginTop: SPACING.md,
  },
  accountName: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  institutionName: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  balance: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  syncText: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  addCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderColor: COLORS.gray400,
    backgroundColor: COLORS.gray50,
  },
  addIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  addText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  addSubText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    fontWeight: '500',
  }
});

export default AccountsRail;
