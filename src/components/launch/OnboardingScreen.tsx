import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image, StatusBar } from 'react-native';
import { Text } from '@gluestack-ui/themed';

interface OnboardingScreenProps {
  onNext: () => void;
}

export default function OnboardingScreen({ onNext }: OnboardingScreenProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#7C57FF" barStyle="light-content" />
      
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.timeText}>16:04</Text>
        <View style={styles.statusIcons}>
          <View style={styles.signalIcon} />
          <View style={styles.wifiIcon} />
          <View style={styles.batteryIcon} />
        </View>
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.heading}>Welcome to Expense Manager</Text>
        
        <View style={styles.curvedBackground}>
          <View style={styles.illustrationContainer}>
            <View style={styles.backgroundCircle} />
            <Image
              source={require('../../assets/images/hand-money-3d.png')}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.bottomSection}>
            <TouchableOpacity style={styles.nextButton} onPress={onNext}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
            
            <View style={styles.pagination}>
              <View style={[styles.dot, styles.activeDot]} />
              <View style={[styles.dot, styles.inactiveDot]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00D09E',
  },
  statusBar: {
    height: 32,
    backgroundColor: '#7C57FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 37,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'League Spartan',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  signalIcon: {
    width: 13,
    height: 11,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  wifiIcon: {
    width: 15,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 58,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  batteryIcon: {
    width: 17,
    height: 9,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingTop: 60,
  },
  heading: {
    fontSize: 30,
    fontWeight: '600',
    color: '#0E3E3E',
    fontFamily: 'Poppins',
    textAlign: 'center',
    lineHeight: 39,
    paddingHorizontal: 70,
    marginBottom: 60,
  },
  curvedBackground: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 70,
    borderTopRightRadius: 70,
    position: 'relative',
    paddingTop: 50,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 40,
  },
  backgroundCircle: {
    position: 'absolute',
    width: 248,
    height: 248,
    borderRadius: 124,
    backgroundColor: '#DFF7E2',
    top: 40,
  },
  illustration: {
    width: 287,
    height: 287,
    zIndex: 1,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 60,
    paddingTop: 20,
  },
  nextButton: {
    marginBottom: 30,
  },
  nextButtonText: {
    fontSize: 30,
    fontWeight: '600',
    color: '#0E3E3E',
    fontFamily: 'Poppins',
    lineHeight: 22,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
  },
  activeDot: {
    backgroundColor: '#00D09E',
  },
  inactiveDot: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0E3E3E',
  },
});