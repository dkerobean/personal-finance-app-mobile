import React from 'react';
import { render } from '@testing-library/react-native';
import InstitutionBadge from '@/components/InstitutionBadge';

describe('InstitutionBadge', () => {
  describe('Bank Account Type', () => {
    it('should render bank institution name with bank styling', () => {
      const { getByText } = render(
        <InstitutionBadge 
          institutionName="GCB Bank"
          accountType="bank"
        />
      );

      expect(getByText('GCB Bank')).toBeTruthy();
    });

    it('should render with bank icon for bank account type', () => {
      const { UNSAFE_getByType } = render(
        <InstitutionBadge 
          institutionName="Access Bank"
          accountType="bank"
        />
      );

      // Check for MaterialIcons component
      const iconComponents = UNSAFE_getByType(require('@expo/vector-icons').MaterialIcons);
      expect(iconComponents.props.name).toBe('account-balance');
    });
  });

  describe('Mobile Money Account Type', () => {
    it('should render MTN Mobile Money with mobile money styling', () => {
      const { getByText } = render(
        <InstitutionBadge 
          institutionName="MTN Mobile Money"
          accountType="mobile_money"
        />
      );

      expect(getByText('MTN Mobile Money')).toBeTruthy();
    });

    it('should render with smartphone icon for mobile money account type', () => {
      const { UNSAFE_getByType } = render(
        <InstitutionBadge 
          institutionName="MTN Mobile Money"
          accountType="mobile_money"
        />
      );

      // Check for MaterialIcons component
      const iconComponents = UNSAFE_getByType(require('@expo/vector-icons').MaterialIcons);
      expect(iconComponents.props.name).toBe('smartphone');
    });
  });

  describe('Manual Account Type', () => {
    it('should render Manual Entry for manual account type', () => {
      const { getByText } = render(
        <InstitutionBadge 
          institutionName="Some Name"
          accountType="manual"
        />
      );

      expect(getByText('Manual Entry')).toBeTruthy();
    });

    it('should render with person icon for manual account type', () => {
      const { UNSAFE_getByType } = render(
        <InstitutionBadge 
          institutionName="Test"
          accountType="manual"
        />
      );

      // Check for MaterialIcons component
      const iconComponents = UNSAFE_getByType(require('@expo/vector-icons').MaterialIcons);
      expect(iconComponents.props.name).toBe('person');
    });
  });

  describe('Size Variations', () => {
    it('should render with medium size by default', () => {
      const { UNSAFE_getByType } = render(
        <InstitutionBadge 
          institutionName="Test Bank"
          accountType="bank"
        />
      );

      const iconComponents = UNSAFE_getByType(require('@expo/vector-icons').MaterialIcons);
      expect(iconComponents.props.size).toBe(14);
    });

    it('should render with small size when specified', () => {
      const { UNSAFE_getByType } = render(
        <InstitutionBadge 
          institutionName="Test Bank"
          accountType="bank"
          size="small"
        />
      );

      const iconComponents = UNSAFE_getByType(require('@expo/vector-icons').MaterialIcons);
      expect(iconComponents.props.size).toBe(12);
    });
  });

  describe('Visual Differentiation', () => {
    it('should apply different colors for different account types', () => {
      const { UNSAFE_getByType: getBankIcon } = render(
        <InstitutionBadge 
          institutionName="Test Bank"
          accountType="bank"
        />
      );

      const bankIcon = getBankIcon(require('@expo/vector-icons').MaterialIcons);
      expect(bankIcon.props.color).toBe('#1976d2'); // Bank blue

      const { UNSAFE_getByType: getMobileIcon } = render(
        <InstitutionBadge 
          institutionName="MTN Mobile Money"
          accountType="mobile_money"
        />
      );

      const mobileIcon = getMobileIcon(require('@expo/vector-icons').MaterialIcons);
      expect(mobileIcon.props.color).toBe('#ff6b00'); // MTN orange

      const { UNSAFE_getByType: getManualIcon } = render(
        <InstitutionBadge 
          institutionName="Manual"
          accountType="manual"
        />
      );

      const manualIcon = getManualIcon(require('@expo/vector-icons').MaterialIcons);
      expect(manualIcon.props.color).toBe('#6b7280'); // Gray
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty institution names', () => {
      const { getByText } = render(
        <InstitutionBadge 
          institutionName=""
          accountType="bank"
        />
      );

      // Should not crash and render empty text
      expect(() => getByText('')).toBeTruthy();
    });

    it('should handle very long institution names', () => {
      const longName = 'This is a very long institution name that might cause layout issues';
      const { getByText } = render(
        <InstitutionBadge 
          institutionName={longName}
          accountType="bank"
        />
      );

      expect(getByText(longName)).toBeTruthy();
    });
  });
});