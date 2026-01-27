import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Grid3x3, Smartphone, Bell, LogOut, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@clerk/clerk-expo';
import GradientHeader from '@/components/budgets/GradientHeader';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';

interface SettingsOption {
  id: string;
  title: string;
  description: string;
  iconComponent: React.ComponentType<{ size: number; color: string }>;
  iconBgColor: string;
  route: string;
}

const settingsOptions: SettingsOption[] = [
  {
    id: 'categories',
    title: 'Categories',
    description: 'Manage transaction categories',
    iconComponent: Grid3x3,
    iconBgColor: COLORS.primaryLight,
    route: '/settings/categories',
  },
  {
    id: 'momo',
    title: 'MTN MoMo Integration',
    description: 'Connect and sync your MTN MoMo account',
    iconComponent: Smartphone,
    iconBgColor: COLORS.lightBlue,
    route: '/settings/momo',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Manage budget alerts and notification preferences',
    iconComponent: Bell,
    iconBgColor: '#FEF9C3',
    route: '/settings/notifications',
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleOptionPress = (route: string) => {
    router.push(route as any);
  };

  const handleGoBack = (): void => {
    router.back();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={false} 
            onRefresh={() => {}}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Gradient Header Section */}
        <GradientHeader
          title="Settings"
          subtitle="Manage your app preferences and data"
          onBackPress={handleGoBack}
          onCalendarPress={() => {}}
          onNotificationPress={() => {}}
          showCalendar={false}
        />

        {/* Content Card */}
        <View style={styles.contentCard}>
          <View style={styles.optionsList}>
            {settingsOptions.map((option, index) => {
              const IconComponent = option.iconComponent;
              return (
                <Animated.View
                  key={option.id}
                  entering={FadeInDown.delay(index * 100).duration(600)}
                >
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => handleOptionPress(option.route)}
                  >
                    <View style={styles.optionContent}>
                      <View style={[styles.iconContainer, { backgroundColor: option.iconBgColor }]}>
                        <IconComponent
                          size={24}
                          color={COLORS.primary}
                        />
                      </View>
                      <View style={styles.optionText}>
                        <Text style={styles.optionTitle}>{option.title}</Text>
                        <Text style={styles.optionDescription}>
                          {option.description}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight
                      size={24}
                      color={COLORS.textTertiary}
                    />
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Logout Button */}
          <Animated.View 
            entering={FadeInDown.delay(300).duration(600)}
            style={styles.logoutSection}
          >
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={22} color={COLORS.error} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Bottom spacing for navigation */}
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
    paddingTop: 20,
    flex: 1,
  },
  optionsList: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  optionItem: {
    backgroundColor: COLORS.backgroundCard,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
  },
  bottomSpacing: {
    height: 150,
  },
  logoutSection: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xxl,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.error,
    gap: SPACING.sm,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
  },
});