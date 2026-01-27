import React from 'react';
import { StyleSheet, View, Image, Dimensions, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen(): React.ReactElement {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <Image 
        source={require('../../../assets/splash.png')}
        style={styles.image}
        resizeMode="contain" // or "cover" depending on the image design, "contain" usually safer for splash
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Match the splash background color
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height,
  },
});