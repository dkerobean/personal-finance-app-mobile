import React from 'react';
import { StyleSheet, Image } from 'react-native';
import { Text, Button, ButtonText, Box, VStack, HStack } from '@gluestack-ui/themed';

interface OnboardingData {
  title: string;
  subtitle: string;
  description: string;
  illustration: any;
}

interface EnhancedOnboardingScreenProps {
  currentIndex: number;
  totalScreens: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  data: OnboardingData;
}

export default function EnhancedOnboardingScreen({
  currentIndex,
  totalScreens,
  onNext,
  onPrevious,
  onSkip,
  data
}: EnhancedOnboardingScreenProps): React.ReactElement {
  const isFirstScreen = currentIndex === 0;
  const isLastScreen = currentIndex === totalScreens - 1;

  return (
    <Box style={styles.container}>
      {/* Header with Skip button */}
      <HStack style={styles.header}>
        <Box style={styles.headerLeft} />
        <Text style={styles.screenCounter}>{currentIndex + 1}/{totalScreens}</Text>
        <Button onPress={onSkip} style={styles.skipButton} variant="ghost">
          <ButtonText style={styles.skipText}>Skip</ButtonText>
        </Button>
      </HStack>
      
      {/* Main Content */}
      <VStack style={styles.content}>
        <Text style={styles.heading}>{data.title}</Text>
        <Text style={styles.subtitle}>{data.subtitle}</Text>
        
        <VStack style={styles.curvedBackground}>
          <VStack style={styles.illustrationContainer}>
            <Box style={styles.backgroundCircle} />
            <Image
              source={data.illustration}
              style={styles.illustration}
              resizeMode="contain"
            />
          </VStack>
          
          <Text style={styles.description}>{data.description}</Text>
          
          <VStack style={styles.bottomSection}>
            {/* Navigation Controls */}
            <HStack style={styles.navigationContainer}>
              <Button 
                style={[styles.navButton, isFirstScreen && styles.navButtonDisabled]}
                onPress={onPrevious}
                isDisabled={isFirstScreen}
                variant="outline"
              >
                <ButtonText style={[styles.navButtonText, isFirstScreen && styles.navButtonTextDisabled]}>
                  Previous
                </ButtonText>
              </Button>
              
              <Button 
                style={styles.nextButton} 
                onPress={onNext}
                variant="solid"
              >
                <ButtonText style={styles.nextButtonText}>
                  {isLastScreen ? 'Get Started' : 'Next'}
                </ButtonText>
              </Button>
            </HStack>
            
            {/* Pagination Dots */}
            <HStack style={styles.pagination}>
              {Array.from({ length: totalScreens }, (_, index) => (
                <Box 
                  key={index}
                  style={[
                    styles.dot, 
                    index === currentIndex ? styles.activeDot : styles.inactiveDot
                  ]} 
                />
              ))}
            </HStack>
          </VStack>
        </VStack>
      </VStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00D09E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  headerLeft: {
    width: 60,
  },
  screenCounter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0E3E3E',
    fontFamily: 'Poppins',
    textAlign: 'center',
    lineHeight: 36,
    paddingHorizontal: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0E3E3E',
    fontFamily: 'League Spartan',
    textAlign: 'center',
    paddingHorizontal: 50,
    marginBottom: 40,
    opacity: 0.8,
  },
  curvedBackground: {
    flex: 1,
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 70,
    borderTopRightRadius: 70,
    paddingTop: 40,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    marginBottom: 30,
  },
  backgroundCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#DFF7E2',
  },
  illustration: {
    width: 240,
    height: 200,
    zIndex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    color: '#4B4544',
    fontFamily: 'League Spartan',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 50,
    marginBottom: 40,
  },
  bottomSection: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#00D09E',
    backgroundColor: 'transparent',
    minWidth: 100,
  },
  navButtonDisabled: {
    borderColor: '#DDD',
    backgroundColor: '#F5F5F5',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D09E',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  navButtonTextDisabled: {
    color: '#AAA',
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    backgroundColor: '#00D09E',
    minWidth: 120,
    elevation: 3,
    shadowColor: '#00D09E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  activeDot: {
    backgroundColor: '#00D09E',
    width: 24,
  },
  inactiveDot: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0E3E3E',
  },
});