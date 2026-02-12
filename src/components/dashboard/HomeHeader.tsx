import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { Bell, UserRound } from 'lucide-react-native';
import { Image } from 'expo-image';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/design';

interface HomeHeaderProps {
  onNotificationPress: () => void;
  onProfilePress: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ onNotificationPress, onProfilePress }) => {
  const { user } = useUser();
  const avatarUrl = user?.imageUrl;
  const firstName = user?.firstName || 'there';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onProfilePress} activeOpacity={0.75} style={styles.avatarButton}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" transition={200} />
        ) : (
          <View style={styles.avatarFallback}>
            <UserRound size={20} color={COLORS.primary} />
          </View>
        )}
      </TouchableOpacity>
      
      <View style={styles.titleContainer}>
        <Text style={styles.greeting}>{getGreeting()}, {firstName}</Text>
        <Text style={styles.title}>Financial Home · {todayLabel}</Text>
      </View>

      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={onNotificationPress}
        activeOpacity={0.7}
      >
        <Bell size={24} color={COLORS.textPrimary} />
        {/* Optional valid notification dot */}
        <View style={styles.badge} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundContent,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.md,
  },
  greeting: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontWeight: '500',
    marginBottom: 2,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  iconButton: {
    padding: SPACING.sm,
    position: 'relative',
    backgroundColor: COLORS.gray50,
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 1.5,
    borderColor: COLORS.gray50,
  }
});

export default HomeHeader;
