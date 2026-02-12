import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Grid3x3, Smartphone, Bell, LogOut, ChevronRight, UserRound } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import GradientHeader from '@/components/budgets/GradientHeader';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';

interface SettingsOption {
  id: string;
  title: string;
  description: string;
  iconComponent: React.ComponentType<{ size: number; color: string }>;
  iconBgColor: string;
  route: string;
  section: 'connected' | 'preferences';
}

const settingsOptions: SettingsOption[] = [
  {
    id: 'momo',
    title: 'MTN MoMo Integration',
    description: 'Connect and sync your MTN MoMo account',
    iconComponent: Smartphone,
    iconBgColor: COLORS.lightBlue,
    route: '/settings/momo',
    section: 'connected',
  },
  {
    id: 'categories',
    title: 'Categories',
    description: 'Manage transaction categories',
    iconComponent: Grid3x3,
    iconBgColor: COLORS.primaryLight,
    route: '/settings/categories',
    section: 'preferences',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Manage budget alerts and notification preferences',
    iconComponent: Bell,
    iconBgColor: '#FEF9C3',
    route: '/settings/notifications',
    section: 'preferences',
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();

  const connectedOptions = settingsOptions.filter((option) => option.section === 'connected');
  const preferenceOptions = settingsOptions.filter((option) => option.section === 'preferences');

  const handleOptionPress = (route: string) => {
    router.push(route as any);
  };

  const handleGoBack = (): void => {
    router.back();
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Account Owner';
  const email = user?.primaryEmailAddress?.emailAddress || 'No email available';

  const renderOption = (option: SettingsOption, delay: number) => {
    const IconComponent = option.iconComponent;
    return (
      <Animated.View key={option.id} entering={FadeInDown.delay(delay).duration(520)}>
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => handleOptionPress(option.route)}
          activeOpacity={0.86}
        >
          <View style={styles.optionContent}>
            <View style={[styles.iconContainer, { backgroundColor: option.iconBgColor }]}>
              <IconComponent size={22} color={COLORS.primary} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
          </View>
          <ChevronRight size={20} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.mainScrollView} showsVerticalScrollIndicator={false}>
        <GradientHeader
          title="Settings"
          subtitle="Personalize app experience and integrations"
          onBackPress={handleGoBack}
          showCalendar={false}
          showNotification={false}
        />

        <View style={styles.contentCard}>
          <Animated.View entering={FadeInDown.duration(450)} style={styles.profileWrap}>
            <LinearGradient
              colors={['#033327', COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileCard}
            >
              <View style={styles.profileGlow} />
              <View style={styles.profileRow}>
                <View style={styles.avatarWrap}>
                  {user?.imageUrl ? (
                    <Image source={{ uri: user.imageUrl }} style={styles.avatarImage} contentFit="cover" transition={180} />
                  ) : (
                    <UserRound size={24} color={COLORS.primary} />
                  )}
                </View>
                <View style={styles.profileTextWrap}>
                  <Text style={styles.profileName}>{fullName}</Text>
                  <Text style={styles.profileEmail}>{email}</Text>
                </View>
              </View>
              <Text style={styles.profileHint}>Manage your preferences and connected services</Text>
            </LinearGradient>
          </Animated.View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Connected Accounts</Text>
            <View style={styles.sectionCard}>
              {connectedOptions.map((option, index) => renderOption(option, 80 + index * 70))}
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.sectionCard}>
              {preferenceOptions.map((option, index) => renderOption(option, 220 + index * 70))}
            </View>
          </View>

          <Animated.View entering={FadeInDown.delay(380).duration(520)} style={styles.logoutSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.86}>
              <LogOut size={20} color={COLORS.error} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
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
  contentCard: {
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    minHeight: '100%',
  },
  profileWrap: {
    marginBottom: SPACING.lg,
  },
  profileCard: {
    borderRadius: 24,
    padding: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  profileGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
    right: -20,
    top: -45,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  profileTextWrap: {
    flex: 1,
  },
  profileName: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  profileEmail: {
    marginTop: 2,
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    opacity: 0.95,
  },
  profileHint: {
    marginTop: SPACING.md,
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    opacity: 0.92,
  },
  sectionBlock: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.sm,
  },
  sectionCard: {
    borderRadius: 22,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: SPACING.sm,
    ...SHADOWS.sm,
  },
  optionItem: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  optionDescription: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    lineHeight: 16,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  logoutSection: {
    marginTop: SPACING.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: '#FEF2F2',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.2,
    borderColor: '#FCA5A5',
    gap: SPACING.sm,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  bottomSpacing: {
    height: 120,
  },
});
