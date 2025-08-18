import React, { useState } from 'react';
import { Alert } from 'react-native';
import { 
  Button,
  ButtonText,
  ButtonIcon,
  Spinner,
  useToast,
  Toast,
  ToastTitle,
  ToastDescription,
  VStack
} from '@gluestack-ui/themed';
import { RefreshCw } from 'lucide-react-native';
import { mtnSyncService } from '@/services/mtnSyncService';

interface ManualSyncButtonProps {
  accountId: string;
  accountName: string;
  disabled?: boolean;
  variant?: 'solid' | 'outline' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onSyncStart?: () => void;
  onSyncComplete?: (result: any) => void;
  onSyncError?: (error: any) => void;
}

const ManualSyncButton: React.FC<ManualSyncButtonProps> = ({
  accountId,
  accountName,
  disabled = false,
  variant = 'outline',
  size = 'sm',
  onSyncStart,
  onSyncComplete,
  onSyncError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleManualSync = async () => {
    try {
      setIsLoading(true);
      onSyncStart?.();

      // Show confirmation dialog for manual sync
      Alert.alert(
        'Manual Sync',
        `Do you want to sync transactions for ${accountName}? This may take a few moments.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsLoading(false)
          },
          {
            text: 'Sync Now',
            style: 'default',
            onPress: async () => {
              try {
                // Call the sync service with progress tracking
                const result = await mtnSyncService.syncAccountWithProgress(
                  accountId,
                  (status) => {
                    // Show progress toast
                    let message = '';
                    switch (status) {
                      case 'fetching':
                        message = 'Fetching transactions from MTN MoMo...';
                        break;
                      case 'storing':
                        message = 'Storing transactions...';
                        break;
                      case 'completed':
                        message = 'Sync completed successfully!';
                        break;
                    }

                    if (message) {
                      toast.show({
                        placement: 'top',
                        render: ({ id }) => (
                          <Toast nativeID={`toast-${id}`} action="info" variant="accent">
                            <VStack space="xs">
                              <ToastTitle>Syncing {accountName}</ToastTitle>
                              <ToastDescription>{message}</ToastDescription>
                            </VStack>
                          </Toast>
                        ),
                      });
                    }
                  }
                );

                if (result.error) {
                  throw new Error(result.error.message);
                }

                // Show success toast
                toast.show({
                  placement: 'top',
                  render: ({ id }) => (
                    <Toast nativeID={`toast-${id}`} action="success" variant="accent">
                      <VStack space="xs">
                        <ToastTitle>Sync Successful</ToastTitle>
                        <ToastDescription>
                          {result.data?.newTransactions || 0} new transactions synced for {accountName}
                        </ToastDescription>
                      </VStack>
                    </Toast>
                  ),
                });

                onSyncComplete?.(result.data);

              } catch (error) {
                console.error('Manual sync failed:', error);
                
                // Show error toast
                toast.show({
                  placement: 'top',
                  render: ({ id }) => (
                    <Toast nativeID={`toast-${id}`} action="error" variant="accent">
                      <VStack space="xs">
                        <ToastTitle>Sync Failed</ToastTitle>
                        <ToastDescription>
                          {error instanceof Error ? error.message : 'Unknown error occurred during sync'}
                        </ToastDescription>
                      </VStack>
                    </Toast>
                  ),
                });

                onSyncError?.(error);
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to initiate manual sync:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || isLoading}
      onPress={handleManualSync}
      action="secondary"
    >
      {isLoading ? (
        <ButtonIcon as={Spinner} color="$textLight600" />
      ) : (
        <ButtonIcon as={RefreshCw} size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} />
      )}
      <ButtonText>
        {isLoading ? 'Syncing...' : 'Sync Now'}
      </ButtonText>
    </Button>
  );
};

export default ManualSyncButton;