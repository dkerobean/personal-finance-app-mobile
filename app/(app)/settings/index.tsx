import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>
              Manage your app preferences and data
            </Text>
          </View>

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
                      color="#007bff"
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
                  color="#9ca3af"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
});