import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/design';

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
    // Handle home route specifically
    if (route === '/') {
      return pathname === '/' || pathname === '/index' || pathname === '/(app)' || pathname === '/(app)/index';
    }
    
    // Handle nested routes more precisely
    if (route === '/settings/categories') {
      return pathname.includes('/categories');
    }
    
    if (route === '/settings') {
      return pathname === '/settings' || (pathname.includes('/settings') && !pathname.includes('/categories'));
    }
    
    // For other routes, check if pathname starts with the route
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
    <View style={[styles.floatingContainer, { bottom: 0 }]}>
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
                  size={35}
                  color={COLORS.textPrimary}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 108,
    backgroundColor: COLORS.backgroundInput,
    borderTopLeftRadius: 70,
    borderTopRightRadius: 70,
    ...SHADOWS.lg,
    elevation: 8,
  },
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  activeTabContent: {
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    width: 65,
    height: 61,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: COLORS.textPrimary,
    marginTop: 4,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: COLORS.white,
    fontWeight: '600',
  },
});