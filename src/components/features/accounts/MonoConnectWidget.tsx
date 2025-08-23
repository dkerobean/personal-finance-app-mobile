import React from 'react';
import { Alert, Platform } from 'react-native';
import { VStack, HStack, Text, Button, ButtonText, Box, Spinner, Heading } from '@gluestack-ui/themed';
import { useMonoConnect } from '@mono.co/connect-react-native';
import { monoService } from '@/services/monoService';
import { MonoConnectResponse, MonoLinkingResult } from '@/types/models';

interface MonoConnectWidgetProps {
  onSuccess: (result: MonoLinkingResult) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

export const MonoConnectWidget: React.FC<MonoConnectWidgetProps> = ({
  onSuccess,
  onError,
  onCancel
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleMonoSuccess = async (response: MonoConnectResponse) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await monoService.handleMonoConnectSuccess(response);
      
      if (result.success) {
        onSuccess(result);
      } else {
        setError(result.error || 'Failed to link bank account');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonoError = (error: any) => {
    console.error('Mono Connect Error:', error);
    const errorMessage = error?.message || 'Failed to connect to bank account';
    setError(errorMessage);
    onError(errorMessage);
  };

  const handleMonoClose = () => {
    console.log('Mono Connect Widget closed by user');
    if (onCancel) {
      onCancel();
    }
  };

  const { init } = useMonoConnect({
    publicKey: monoService.getPublicKey(),
    onSuccess: handleMonoSuccess,
    onError: handleMonoError,
    onClose: handleMonoClose
  });

  const handleLinkBankAccount = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if Mono is configured
      if (!monoService.isConfigured()) {
        throw new Error('Mono API is not properly configured. Please contact support.');
      }

      // Launch Mono Connect Widget
      await init();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize bank linking';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleLinkBankAccount();
  };

  if (isLoading) {
    return (
      <VStack space="lg" padding="$4" alignItems="center">
        <Box padding="$8">
          <Spinner size="large" color="$primary600" />
        </Box>
        <VStack space="sm" alignItems="center">
          <Heading size="lg">Connecting to Bank</Heading>
          <Text size="md" textAlign="center" color="$textLight600">
            Please wait while we establish a secure connection to your bank account...
          </Text>
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack space="lg" padding="$4">
      <VStack space="sm" alignItems="center">
        <Heading size="xl" textAlign="center">
          Link Bank Account
        </Heading>
        <Text size="md" textAlign="center" color="$textLight600">
          Connect your bank account securely via Mono
        </Text>
      </VStack>

      {error && (
        <Box
          backgroundColor="$error50"
          borderColor="$error500"
          borderWidth="$1"
          borderRadius="$md"
          padding="$3"
        >
          <Text size="sm" color="$error700" textAlign="center">
            {error}
          </Text>
        </Box>
      )}

      <VStack space="md">
        <Text size="sm" color="$textLight600" textAlign="center">
          Supported Banks in Ghana:
        </Text>
        <Text size="xs" color="$textLight500" textAlign="center">
          GCB Bank • Access Bank • Fidelity Bank • Zenith Bank • 
          Standard Chartered • Absa Bank • UMB • And 15+ more
        </Text>
      </VStack>

      <VStack space="md">
        {error ? (
          <Button
            size="lg"
            action="primary"
            onPress={handleRetry}
            disabled={isLoading}
          >
            <ButtonText>Try Again</ButtonText>
          </Button>
        ) : (
          <Button
            size="lg"
            action="primary"
            onPress={handleLinkBankAccount}
            disabled={isLoading}
          >
            <ButtonText>Connect Bank Account</ButtonText>
          </Button>
        )}

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

      <VStack space="xs">
        <Text size="xs" color="$textLight500" textAlign="center">
          🔒 Bank-grade security • 256-bit SSL encryption
        </Text>
        <Text size="xs" color="$textLight500" textAlign="center">
          We never store your banking credentials
        </Text>
      </VStack>
    </VStack>
  );
};