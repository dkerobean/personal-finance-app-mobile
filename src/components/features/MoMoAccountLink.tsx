import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ScrollView 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMoMoStore, useMoMoAccountsData } from '@/stores/momoStore';

interface MoMoAccountLinkProps {
  onAccountLinked?: () => void;
}

export default function MoMoAccountLink({ onAccountLinked }: MoMoAccountLinkProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  
  const { linkAccount, deactivateAccount } = useMoMoStore();
  const { linkedAccounts, isLoadingAccounts } = useMoMoAccountsData();

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as Ghana phone number
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    } else if (cleaned.length <= 9) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    // Ghana phone numbers: 10 digits starting with 2 (for country code 233)
    // or 9 digits for local format
    return cleaned.length === 10 && cleaned.startsWith('2') || 
           cleaned.length === 9;
  };

  const handleLinkAccount = async () => {
    if (!phoneNumber.trim() || !accountName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    
    if (!validatePhoneNumber(cleanedPhone)) {
      Alert.alert(
        'Invalid Phone Number', 
        'Please enter a valid Ghana phone number (e.g., 024 123 4567)'
      );
      return;
    }

    // Format phone number with country code
    const formattedPhone = cleanedPhone.length === 9 
      ? `233${cleanedPhone}` 
      : cleanedPhone.startsWith('233') 
        ? cleanedPhone 
        : `233${cleanedPhone.slice(1)}`;

    setIsLinking(true);

    try {
      const success = await linkAccount({
        phone_number: formattedPhone,
        account_name: accountName.trim(),
      });

      if (success) {
        Alert.alert(
          'Success', 
          'MTN MoMo account linked successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setPhoneNumber('');
                setAccountName('');
                onAccountLinked?.();
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to link account. Please try again.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleDeactivateAccount = (accountId: string, accountName: string) => {
    Alert.alert(
      'Deactivate Account',
      `Are you sure you want to deactivate "${accountName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            const success = await deactivateAccount(accountId);
            if (success) {
              Alert.alert('Success', 'Account deactivated successfully');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Link New Account Section */}
      <View style={styles.card}>
        <View style={styles.header}>
          <MaterialIcons name="link" size={24} color="#2563eb" />
          <Text style={styles.title}>Link MTN MoMo Account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Name</Text>
            <TextInput
              style={styles.input}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="e.g., My Primary MoMo"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+233</Text>
              <TextInput
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                placeholder="24 123 4567"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                maxLength={12} // Formatted length
              />
            </View>
            <Text style={styles.helperText}>
              Enter your MTN mobile number without the country code
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.linkButton, isLinking && styles.linkButtonDisabled]}
            onPress={handleLinkAccount}
            disabled={isLinking}
          >
            {isLinking ? (
              <Text style={styles.linkButtonText}>Linking...</Text>
            ) : (
              <>
                <MaterialIcons name="add-link" size={20} color="#ffffff" />
                <Text style={styles.linkButtonText}>Link Account</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Linked Accounts Section */}
      <View style={styles.card}>
        <View style={styles.header}>
          <MaterialIcons name="account-balance-wallet" size={24} color="#059669" />
          <Text style={styles.title}>Linked Accounts</Text>
        </View>

        {isLoadingAccounts ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading accounts...</Text>
          </View>
        ) : linkedAccounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="account-balance-wallet" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Linked Accounts</Text>
            <Text style={styles.emptySubtitle}>
              Link your first MTN MoMo account to get started
            </Text>
          </View>
        ) : (
          <View style={styles.accountsList}>
            {linkedAccounts.map((account) => (
              <View key={account.id} style={styles.accountItem}>
                <View style={styles.accountLeft}>
                  <View style={[
                    styles.accountIcon,
                    account.is_active ? styles.activeAccountIcon : styles.inactiveAccountIcon
                  ]}>
                    <MaterialIcons 
                      name="phone-android" 
                      size={20} 
                      color="#ffffff" 
                    />
                  </View>
                  
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountName}>{account.account_name}</Text>
                    <Text style={styles.accountPhone}>
                      +{account.phone_number}
                    </Text>
                    <Text style={[
                      styles.accountStatus,
                      account.is_active ? styles.activeStatus : styles.inactiveStatus
                    ]}>
                      {account.is_active ? '● Active' : '● Inactive'}
                    </Text>
                    {account.last_sync_at && (
                      <Text style={styles.lastSync}>
                        Last sync: {new Date(account.last_sync_at).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>

                {account.is_active && (
                  <TouchableOpacity
                    style={styles.deactivateButton}
                    onPress={() => handleDeactivateAccount(account.id, account.account_name)}
                  >
                    <MaterialIcons name="link-off" size={16} color="#dc3545" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  form: {
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#ffffff',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  countryCode: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#6b7280',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#374151',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  linkButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  linkButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  accountsList: {
    marginTop: 8,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activeAccountIcon: {
    backgroundColor: '#059669',
  },
  inactiveAccountIcon: {
    backgroundColor: '#9ca3af',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  accountPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  accountStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  activeStatus: {
    color: '#059669',
  },
  inactiveStatus: {
    color: '#9ca3af',
  },
  lastSync: {
    fontSize: 11,
    color: '#9ca3af',
  },
  deactivateButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },
});