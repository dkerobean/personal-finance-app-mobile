import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { Home, BarChart2, ArrowRightLeft, Wallet, User } from 'lucide-react-native';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '@/constants/design';

interface TabItem {
  key: string;
  label: string;
  icon: React.ElementType;
  route: string;
}

const tabs: TabItem[] = [
  {
    key: 'home',
    label: 'Home',
    icon: Home,
    route: '/',
  },
  {
    key: 'analytics',
    label: 'Reports',
    icon: BarChart2,
    route: '/reports',
  },
  {
    key: 'transactions',
    label: 'Activity',
    icon: ArrowRightLeft,
    route: '/transactions',
  },
  {
    key: 'networth',
    label: 'Net Worth',
    icon: Wallet,
    route: '/networth',
  },
  {
    key: 'profile',
    label: 'Settings',
    icon: User,
    route: '/settings',
  },
];

const { width } = Dimensions.get('window');
const FLOATING_MARGIN = 20;

export default function BottomNavigation(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const isActiveTab = (route: string): boolean => {
    // Handle home route specifically
    if (route === '/') {
      return pathname === '/' || pathname === '/index' || pathname === '/(app)' || pathname === '/(app)/index';
    }
    
    // Handle networth route
    if (route === '/networth') {
      return pathname.includes('/networth');
    }
    
    // Handle settings route
    if (route === '/settings') {
      return pathname === '/settings' || pathname.includes('/settings');
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
    <View style={styles.container}>
      <View style={styles.dockedBar}>
        {tabs.map((tab) => {
          const isActive = isActiveTab(tab.route);
          const Icon = tab.icon;
          
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                <Icon
                  size={24}
                  color={isActive ? COLORS.primary : COLORS.textTertiary}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </View>
              {isActive && (
                 <Text style={[styles.tabLabel, { fontFamily: TYPOGRAPHY.fonts.bold }]}>
                    {tab.label}
                 </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
  },
  dockedBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    width: '100%',
    height: 70,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    ...SHADOWS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  activeIconContainer: {
    backgroundColor: COLORS.primaryLight,
  },
  tabLabel: {
    display: 'none', 
  }
});