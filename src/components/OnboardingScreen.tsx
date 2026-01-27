import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { router } from 'expo-router';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '@/constants/design';

const { width, height } = Dimensions.get('window');

// Kippo K Logo SVG - Primary Color
const KIPPO_LOGO = `<svg width="32" height="32" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
  <path d="M17.5 65 L37.5 15 L57.5 15 L37.5 65 Z" fill="${COLORS.primary}"/>
  <path d="M62.5 15 L82.5 15 L70.5 40 L60.5 65 L40.5 65 L50.5 40 Z" fill="${COLORS.primary}"/>
</svg>`;

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: any;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Unite your\nfinances',
    description: 'The only personal finance app you need.',
    image: require('../../assets/onboarding_graphic.png'),
  },
  {
    id: '2',
    title: 'Track every\ntransaction',
    description: 'Automatic categorization for clear insights.',
    image: require('../../assets/onboarding_graphic_2.png'),
  },
  {
    id: '3',
    title: 'Build wealth\nconfidently',
    description: 'Smarter budgeting for a simpler life.',
    image: require('../../assets/onboarding_graphic_3.png'),
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      {/* Title & Description moved to top to match reference */}
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>

      {/* Image in middle/bottom */}
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.image} resizeMode="contain" />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Logo */}
      <View style={styles.header}>
        <SvgXml xml={KIPPO_LOGO} width={40} height={40} />
        <Text style={styles.logoText}>kippo</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      {/* Footer Section */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.signInButtonText}>SIGN IN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.signUpButtonText}>SIGN UP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60, // Safe Area padding
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xl,
  },
  title: {
    fontSize: 42,
    fontWeight: '700', // serif font style if available, otherwise generic bold
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 48,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.gray600,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 24,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: SPACING.xl,
  },
  image: {
    width: width * 0.9,
    height: width * 0.9, // Square aspect for 3D graphic
    maxHeight: 400,
  },
  footer: {
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.huge,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING.xxxl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: COLORS.gray600, // Matches dark dots in image 2
  },
  dotInactive: {
    backgroundColor: COLORS.gray100,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  signInButton: {
    flex: 1,
    height: 56,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.gray900, // Thin dark border like Image 2
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  signInButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
  },
  signUpButton: {
    flex: 1,
    height: 56,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary, // Using primary brand color for main action
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  signUpButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
});
