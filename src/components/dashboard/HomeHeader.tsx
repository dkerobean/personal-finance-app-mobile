import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Bell } from 'lucide-react-native';
import { Image } from 'expo-image';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/design';

interface HomeHeaderProps {
  onNotificationPress: () => void;
  onProfilePress: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ onNotificationPress, onProfilePress }) => {
  const { user } = useUser();
  const avatarUrl = user?.imageUrl;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onProfilePress} activeOpacity={0.7}>
        <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
        />
      </TouchableOpacity>
      
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Financial Home</Text>
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
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundContent,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  iconButton: {
    padding: SPACING.xs,
    position: 'relative',
    backgroundColor: COLORS.gray50,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 1.5,
    borderColor: COLORS.gray50,
  }
});

export default HomeHeader;
