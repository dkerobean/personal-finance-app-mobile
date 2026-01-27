import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Wallet, Smartphone, Plus } from 'lucide-react-native'; // Icons for Fallback
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '@/constants/design';
import { router } from 'expo-router';
import { Account } from '@/types/models';

interface AccountsRailProps {
  accounts: Account[];
}

const CARD_WIDTH = 180;

const AccountsRail: React.FC<AccountsRailProps> = ({ accounts }) => {
  const renderItem = ({ item }: { item: Account }) => {
    const isMomo = item.account_type === 'mobile_money';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {/* We don't have institutionLogo in Account model yet, fallback to icon */}
          <View style={[styles.logoPlaceholder, { backgroundColor: isMomo ? '#FEF3C7' : '#DCFCE7' }]}>
              {isMomo ? <Smartphone size={20} color={COLORS.warning} /> : <Wallet size={20} color={COLORS.primary} />}
          </View>
          <Text style={styles.maskedNum}>**** 1234</Text> 
        </View>

        <View style={styles.cardBody}>
            <Text style={styles.accountName} numberOfLines={1}>{item.institution_name}</Text>
            <Text style={styles.balance}>
               GHS {Number(item.balance).toLocaleString()}
            </Text>
        </View>
      </View>
    );
  };

  const renderAddCard = () => (
    <TouchableOpacity 
        style={[styles.card, styles.addCard]} 
        onPress={() => router.push('/add-account')}
    >
        <View style={styles.addIconContainer}>
            <Plus size={24} color={COLORS.primary} />
        </View>
        <Text style={styles.addText}>Add Account</Text>
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
        keyExtractor={(item) => item.id}
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
    height: 120, // Initial guess based on image, looks rectangular
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.gray100,
    // Add subtle shadow only
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  logoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskedNum: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  cardBody: {
    marginTop: 8,
  },
  accountName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  balance: {
    fontSize: 20, // Large enough to pop
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  
  // Add Card Styles
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
    backgroundColor: COLORS.lightBlue, // Or primaryLight
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.primary,
  }
});

export default AccountsRail;
