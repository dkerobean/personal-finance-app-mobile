import React from 'react';
import { Alert } from 'react-native';
import {
  VStack,
  HStack,
  Text,
  Button,
  ButtonText,
  Card,
  Heading,
  Box,
  Icon,
  Pressable
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { accountAggregator } from '@/services/accountAggregator';

interface AccountTypeSelectionScreenProps {
  onBankAccountSelected: () => void;
  onMTNMoMoSelected: () => void;
  onCancel?: () => void;
}

export const AccountTypeSelectionScreen: React.FC<AccountTypeSelectionScreenProps> = ({
  onBankAccountSelected,
  onMTNMoMoSelected,
  onCancel
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    // Check configuration on mount
    const config = accountAggregator.checkConfiguration();
    
    if (!config.bothConfigured) {
      const missingServices = [];
      if (!config.mono) missingServices.push('Mono API');
      if (!config.mtnMomo) missingServices.push('MTN MoMo API');
      
      Alert.alert(
        'Configuration Incomplete',
        `${missingServices.join(' and ')} not properly configured. Please check environment variables.`,
        [{ text: 'OK', onPress: onCancel }]
      );
    }
  }, [onCancel]);

  const handleBankAccountPress = () => {
    const config = accountAggregator.checkConfiguration();
    
    if (!config.mono) {
      Alert.alert(
        'Bank Linking Unavailable',
        'Mono API is not configured. Please contact support.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    try {
      onBankAccountSelected();
    } finally {
      setIsLoading(false);
    }
  };

  const handleMTNMoMoPress = () => {
    const config = accountAggregator.checkConfiguration();
    
    if (!config.mtnMomo) {
      Alert.alert(
        'MTN MoMo Linking Unavailable',
        'MTN MoMo API is not configured. Please contact support.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    try {
      onMTNMoMoSelected();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VStack space="lg" padding="$4">
      <VStack space="sm" alignItems="center">
        <Heading size="xl" textAlign="center">
          Add Account
        </Heading>
        <Text size="md" textAlign="center" color="$textLight600">
          Choose the type of account you'd like to link
        </Text>
      </VStack>

      <VStack space="md">
        {/* Bank Account Option */}
        <Pressable onPress={handleBankAccountPress} disabled={isLoading}>
          <Card size="md" variant="elevated" borderWidth="$1" borderColor="$primary500">
            <VStack space="md" padding="$4">
              <HStack space="md" alignItems="center">
                <Box
                  backgroundColor="$primary100"
                  padding="$3"
                  borderRadius="$full"
                >
                  <Icon as={Ionicons} name="card-outline" size={24} color="$primary600" />
                </Box>
                <VStack flex={1} space="xs">
                  <Heading size="md">Link Bank Account</Heading>
                  <Text size="sm" color="$textLight600">
                    Connect your bank account via Mono for automatic transaction syncing
                  </Text>
                </VStack>
                <Icon as={Ionicons} name="chevron-forward" size={20} color="$textLight400" />
              </HStack>
              
              <VStack space="xs">
                <Text size="xs" color="$textLight500">
                  Supported Banks:
                </Text>
                <Text size="xs" color="$textLight400">
                  GCB Bank, Access Bank, Fidelity Bank, and 20+ more
                </Text>
              </VStack>
            </VStack>
          </Card>
        </Pressable>

        {/* MTN MoMo Account Option */}
        <Pressable onPress={handleMTNMoMoPress} disabled={isLoading}>
          <Card size="md" variant="elevated" borderWidth="$1" borderColor="$warning500">
            <VStack space="md" padding="$4">
              <HStack space="md" alignItems="center">
                <Box
                  backgroundColor="$warning100"
                  padding="$3"
                  borderRadius="$full"
                >
                  <Icon as={Ionicons} name="phone-portrait-outline" size={24} color="$warning600" />
                </Box>
                <VStack flex={1} space="xs">
                  <Heading size="md">Link MTN MoMo Account</Heading>
                  <Text size="sm" color="$textLight600">
                    Connect your MTN Mobile Money account for seamless mobile money tracking
                  </Text>
                </VStack>
                <Icon as={Ionicons} name="chevron-forward" size={20} color="$textLight400" />
              </HStack>
              
              <VStack space="xs">
                <Text size="xs" color="$textLight500">
                  Features:
                </Text>
                <Text size="xs" color="$textLight400">
                  Automatic transaction sync, balance updates, payment history
                </Text>
              </VStack>
            </VStack>
          </Card>
        </Pressable>
      </VStack>

      {/* Security Notice */}
      <Card size="sm" variant="outline" borderColor="$info500" backgroundColor="$info50">
        <HStack space="sm" padding="$3" alignItems="flex-start">
          <Icon as={Ionicons} name="shield-checkmark" size={20} color="$info600" />
          <VStack flex={1} space="xs">
            <Text size="sm" fontWeight="$semibold" color="$info700">
              Your Data is Secure
            </Text>
            <Text size="xs" color="$info600">
              We use bank-grade security to protect your financial information. 
              Your credentials are encrypted and never stored on our servers.
            </Text>
          </VStack>
        </HStack>
      </Card>

      {/* Cancel Button */}
      {onCancel && (
        <Button
          variant="outline"
          action="secondary"
          onPress={onCancel}
          disabled={isLoading}
        >
          <ButtonText>Cancel</ButtonText>
        </Button>
      )}
    </VStack>
  );
};