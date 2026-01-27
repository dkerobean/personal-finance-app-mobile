import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';

interface DashboardHeaderProps {
  totalBalance: number;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export default function DashboardHeader({ totalBalance, onNotificationPress, onProfilePress }: DashboardHeaderProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const userName = user?.firstName || 'User';

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundMain} />
      
      {/* Top Bar: Profile & Actions */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onProfilePress} style={styles.profileContainer}>
          <View style={styles.avatarPlaceholder}>
             <Text style={styles.avatarText}>{userName[0]}</Text>
          </View>
          <View>
            <Text style={styles.greetingText}>Hi, {userName}</Text>
            <Text style={styles.welcomeText}>Welcome back</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton}>
            <MaterialIcons name="notifications-none" size={24} color={COLORS.white} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <MaterialIcons name="logout" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Balance Section */}
      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60, // Increased for safe area / status bar spacing
    paddingBottom: 40, // Extra space for the overlap
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.backgroundMain,
    borderBottomLeftRadius: 0, // In user design, this is continuous green
    borderBottomRightRadius: 0,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  greetingText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceSection: {
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: TYPOGRAPHY.sizes.md,
    marginBottom: SPACING.xs,
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 42, // Massive
    fontWeight: 'bold',
    letterSpacing: -1,
  },
});
