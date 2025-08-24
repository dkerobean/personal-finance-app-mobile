import React, { useState } from 'react';
import EnhancedOnboardingScreen from './EnhancedOnboardingScreen';

interface OnboardingContainerProps {
  onComplete: () => void;
}

const onboardingData = [
  {
    title: 'Welcome to FinWise',
    subtitle: 'Your Smart Finance Companion',
    description: 'Track your expenses effortlessly and take control of your financial future with our intuitive and powerful tools.',
    illustration: require('../../assets/images/hand-money-3d.png'),
  },
  {
    title: 'Smart Budgeting',
    subtitle: 'Plan & Achieve Your Goals',
    description: 'Set intelligent budgets, monitor your spending patterns, and achieve your financial goals with personalized insights.',
    illustration: require('../../assets/images/hand-money-3d.png'),
  },
  {
    title: 'Automated Sync',
    subtitle: 'Connect Your Accounts',
    description: 'Seamlessly connect your Ghana bank accounts and mobile money wallets for automatic transaction syncing.',
    illustration: require('../../assets/images/hand-money-3d.png'),
  },
];

export default function OnboardingContainer({ onComplete }: OnboardingContainerProps): React.ReactElement {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <EnhancedOnboardingScreen
      currentIndex={currentIndex}
      totalScreens={onboardingData.length}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onSkip={handleSkip}
      data={onboardingData[currentIndex]}
    />
  );
}