import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import GradientHeader from '@/components/budgets/GradientHeader';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';

interface SettingsOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
}

const settingsOptions: SettingsOption[] = [
  {
    id: 'categories',
    title: 'Categories',
    description: 'Manage transaction categories',
    icon: 'category',
    route: '/settings/categories',
  },
  {
    id: 'momo',
    title: 'MTN MoMo Integration',
    description: 'Connect and sync your MTN MoMo account',
    icon: 'phone-android',
    route: '/settings/momo',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Manage budget alerts and notification preferences',
    icon: 'notifications',
    route: '/settings/notifications',
  },
  // Add more settings options here as the app grows
  // {
  //   id: 'profile',
  //   title: 'Profile',
  //   description: 'Update your profile information',
  //   icon: 'person',
  //   route: '/settings/profile',
  // },
];

export default function SettingsScreen() {
  const router = useRouter();

  const handleOptionPress = (route: string) => {
    router.push(route as any);
  };

  const handleGoBack = (): void => {
    router.back();
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
          onCalendarPress={() => {
            // Handle calendar press
          }}
          onNotificationPress={() => {
            // Handle notification press
          }}
          showCalendar={false}
        />

        {/* Content Card */}
        <View style={styles.contentCard}>
          <View style={styles.optionsList}>
            {settingsOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionItem}
                onPress={() => handleOptionPress(option.route)}
              >
                <View style={styles.optionContent}>
                  <View style={styles.iconContainer}>
                    <MaterialIcons
                      name={option.icon}
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
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={COLORS.textTertiary}
                />
              </TouchableOpacity>
            ))}
          </View>

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
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
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
});