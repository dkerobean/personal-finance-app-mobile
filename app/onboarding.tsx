import React from 'react';
import { View, StyleSheet } from 'react-native';
import OnboardingScreen from '@/components/OnboardingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'kippo_onboarding_completed';

export default function Onboarding() {
  return (
    <View style={styles.container}>
      <OnboardingScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
