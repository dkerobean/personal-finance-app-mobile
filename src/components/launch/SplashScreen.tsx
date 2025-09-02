import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Text } from '@gluestack-ui/themed';

export default function SplashScreen(): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* Using a colored circle as placeholder since SVG may have compatibility issues */}
        <View style={styles.logoPlaceholder} />
      </View>
      <Text style={styles.brandText}>kippo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00D09E',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 109,
    height: 115,
    backgroundColor: '#ffffff',
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#0E3E3E',
  },
  brandText: {
    fontSize: 52,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});