import React from 'react';
import { Alert, RefreshControl } from 'react-native';
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
  Badge,
  BadgeText,
  ScrollView,
  Pressable,
  ActionsheetBackdrop,
  Actionsheet,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { Account } from '@/types/models';
import { accountAggregator } from '@/services/accountAggregator';
import { formatCurrency } from '@/lib/formatters';

interface LinkedAccountsListProps {
  onAddAccount: () => void;
  onAccountPress?: (account: Account) => void;
  showAddButton?: boolean;
}

export const LinkedAccountsList: React.FC<LinkedAccountsListProps> = ({
  onAddAccount,
  onAccountPress,
  showAddButton = true
}) => {
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [selectedAccount, setSelectedAccount] = React.useState<Account | null>(null);
  const [showActionsheet, setShowActionsheet] = React.useState(false);
  const [unlinkingAccountId, setUnlinkingAccountId] = React.useState<string | null>(null);

  const loadAccounts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const accountsData = await accountAggregator.getLinkedAccounts();
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading accounts:', error);
      Alert.alert('Error', 'Failed to load accounts. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadAccounts();
  }, []);

  const getAccountIcon = (account: Account) => {
    if (account.account_type === 'bank') {
      return 'card-outline';
    } else if (account.account_type === 'mobile_money') {
      return 'phone-portrait-outline';
    }
    return 'wallet-outline';
  };

  const getAccountColor = (account: Account) => {
    if (account.account_type === 'bank') {
      return 'primary';
    } else if (account.account_type === 'mobile_money') {
      return 'warning';
    }
    return 'secondary';
  };

  const getAccountBadgeText = (account: Account) => {
    if (account.account_type === 'bank') {
      return 'Bank Account';
    } else if (account.account_type === 'mobile_money') {
      return 'MTN Mobile Money';
    }
    return 'Unknown';
  };

  const handleAccountPress = (account: Account) => {
    if (onAccountPress) {
      onAccountPress(account);
    } else {
      // Show account options
      setSelectedAccount(account);
      setShowActionsheet(true);
    }
  };

  const handleUnlinkAccount = async (account: Account) => {
    Alert.alert(
      'Unlink Account',
      `Are you sure you want to unlink ${account.account_name}? This will remove all associated transaction data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            try {
              setUnlinkingAccountId(account.id);
              
              const result = await accountAggregator.unlinkAccount(account.id);
              
              if (result.success) {
                // Remove from local state
                setAccounts(prev => prev.filter(acc => acc.id !== account.id));
                Alert.alert('Success', 'Account unlinked successfully.');
              } else {
                Alert.alert('Error', result.error || 'Failed to unlink account.');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred.');
            } finally {
              setUnlinkingAccountId(null);
              setShowActionsheet(false);
            }
          }
        }
      ]
    );
  };

  const renderAccountCard = (account: Account) => (
    <Pressable
      key={account.id}
      onPress={() => handleAccountPress(account)}
      opacity={unlinkingAccountId === account.id ? 0.5 : 1}
    >
      <Card size="md" variant="elevated">
        <VStack space="md" padding="$4">
          <HStack space="md" alignItems="center" justifyContent="space-between">
            <HStack space="md" alignItems="center" flex={1}>
              <Box
                backgroundColor={`$${getAccountColor(account)}100`}
                padding="$3"
                borderRadius="$full"
              >
                <Icon
                  as={Ionicons}
                  name={getAccountIcon(account)}
                  size={24}
                  color={`$${getAccountColor(account)}600`}
                />
              </Box>
              
              <VStack flex={1} space="xs">
                <HStack alignItems="center" justifyContent="space-between">
                  <Heading size="md" numberOfLines={1}>
                    {account.account_name}
                  </Heading>
                  <Text size="lg" fontWeight="$semibold" color="$textLight900">
                    {formatCurrency(account.balance)}
                  </Text>
                </HStack>
                
                <HStack space="sm" alignItems="center">
                  <Badge
                    variant="solid"
                    action={getAccountColor(account)}
                    size="sm"
                  >
                    <BadgeText>{getAccountBadgeText(account)}</BadgeText>
                  </Badge>
                  
                  <Text size="xs" color="$textLight500">
                    {account.institution_name}
                  </Text>
                </HStack>
              </VStack>
            </HStack>
          </HStack>
          
          {account.last_synced_at && (
            <Text size="xs" color="$textLight400">
              Last synced: {new Date(account.last_synced_at).toLocaleDateString()}
            </Text>
          )}
        </VStack>
      </Card>
    </Pressable>
  );

  if (isLoading) {
    return (
      <VStack space="md" padding="$4">
        <Card size="md" variant="outline">
          <VStack space="md" padding="$4" alignItems="center">
            <Text size="md" color="$textLight600">
              Loading accounts...
            </Text>
          </VStack>
        </Card>
      </VStack>
    );
  }

  return (
    <>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadAccounts(true)}
          />
        }
      >
        <VStack space="md" padding="$4">
          <HStack alignItems="center" justifyContent="space-between">
            <Heading size="lg">Linked Accounts</Heading>
            {showAddButton && (
              <Button size="sm" variant="outline" onPress={onAddAccount}>
                <Icon as={Ionicons} name="add" size={16} />
                <ButtonText ml="$1">Add Account</ButtonText>
              </Button>
            )}
          </HStack>

          {accounts.length === 0 ? (
            <Card size="lg" variant="outline">
              <VStack space="md" padding="$6" alignItems="center">
                <Icon as={Ionicons} name="wallet-outline" size={48} color="$textLight400" />
                <VStack space="sm" alignItems="center">
                  <Heading size="md" color="$textLight600">
                    No Linked Accounts
                  </Heading>
                  <Text size="sm" textAlign="center" color="$textLight500">
                    Connect your bank account or MTN MoMo account to get started
                  </Text>
                </VStack>
                {showAddButton && (
                  <Button action="primary" onPress={onAddAccount}>
                    <ButtonText>Add Account</ButtonText>
                  </Button>
                )}
              </VStack>
            </Card>
          ) : (
            <VStack space="sm">
              {accounts.map(renderAccountCard)}
            </VStack>
          )}
        </VStack>
      </ScrollView>

      {/* Account Actions Actionsheet */}
      <Actionsheet isOpen={showActionsheet} onClose={() => setShowActionsheet(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          
          {selectedAccount && (
            <>
              <VStack space="sm" padding="$4" alignItems="center">
                <Text size="lg" fontWeight="$semibold">
                  {selectedAccount.account_name}
                </Text>
                <Text size="sm" color="$textLight600">
                  {selectedAccount.institution_name}
                </Text>
              </VStack>

              <ActionsheetItem onPress={() => {
                // Handle view transactions
                setShowActionsheet(false);
              }}>
                <Icon as={Ionicons} name="list-outline" size={20} />
                <ActionsheetItemText ml="$3">
                  View Transactions
                </ActionsheetItemText>
              </ActionsheetItem>

              <ActionsheetItem onPress={() => {
                // Handle sync account
                setShowActionsheet(false);
              }}>
                <Icon as={Ionicons} name="refresh-outline" size={20} />
                <ActionsheetItemText ml="$3">
                  Sync Now
                </ActionsheetItemText>
              </ActionsheetItem>

              <ActionsheetItem
                onPress={() => handleUnlinkAccount(selectedAccount)}
                isDisabled={unlinkingAccountId === selectedAccount.id}
              >
                <Icon as={Ionicons} name="unlink-outline" size={20} color="$error600" />
                <ActionsheetItemText ml="$3" color="$error600">
                  Unlink Account
                </ActionsheetItemText>
              </ActionsheetItem>
            </>
          )}
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
};