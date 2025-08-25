import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

interface TabItem {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
}

const tabs: TabItem[] = [
  {
    key: 'home',
    label: 'Home',
    icon: 'home',
    route: '/',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: 'analytics',
    route: '/reports',
  },
  {
    key: 'transactions',
    label: 'Transactions',
    icon: 'swap-horiz',
    route: '/transactions',
  },
  {
    key: 'categories',
    label: 'Categories',
    icon: 'category',
    route: '/settings/categories',
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: 'person',
    route: '/settings',
  },
];

export default function BottomNavigation(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const isActiveTab = (route: string): boolean => {
    if (route === '/') {
      return pathname === '/' || pathname === '/index';
    }
    return pathname.startsWith(route);
  };

  const handleTabPress = (route: string): void => {
    if (route === '/') {
      router.push('/');
    } else {
      router.push(route as any);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 10 }]}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = isActiveTab(tab.route);
          
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabContent, isActive && styles.activeTabContent]}>
                <MaterialIcons
                  name={tab.icon}
                  size={24}
                  color={isActive ? '#00D09E' : '#9CA3AF'}
                />
                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    minHeight: 56,
  },
  activeTabContent: {
    backgroundColor: '#F0FDF4',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: '#00D09E',
    fontWeight: '600',
  },
});