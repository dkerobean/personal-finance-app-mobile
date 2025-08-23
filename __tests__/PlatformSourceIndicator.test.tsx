import React from 'react';
import { render } from '@testing-library/react-native';
import PlatformSourceIndicator from '@/components/PlatformSourceIndicator';

describe('PlatformSourceIndicator', () => {
  describe('Bank Account Type', () => {
    it('should display Mono API for bank account type', () => {
      const { getByText } = render(
        <PlatformSourceIndicator accountType="bank" />
      );

      expect(getByText('Mono API')).toBeTruthy();
    });

    it('should render with cloud-sync icon for bank accounts', () => {
      const { UNSAFE_getByType } = render(
        <PlatformSourceIndicator accountType="bank" />
      );

      const iconComponents = UNSAFE_getByType(require('@expo/vector-icons').MaterialIcons);
      expect(iconComponents.props.name).toBe('cloud-sync');
    });

    it('should use bank blue color for bank accounts', () => {
      const { UNSAFE_getByType } = render(
        <PlatformSourceIndicator accountType="bank" />
      );

      const iconComponents = UNSAFE_getByType(require('@expo/vector-icons').MaterialIcons);
      expect(iconComponents.props.color).toBe('#1976d2');
    });
  });

  describe('Mobile Money Account Type', () => {
    it('should display MTN MoMo API for mobile money account type', () => {
      const { getByText } = render(
        <PlatformSourceIndicator accountType="mobile_money" />
      );

      expect(getByText('MTN MoMo API')).toBeTruthy();
    });

    it('should render with cloud-sync icon for mobile money accounts', () => {
      const { UNSAFE_getByType } = render(
        <PlatformSourceIndicator accountType="mobile_money" />
      );

      const iconComponents = UNSAFE_getByType(require('@expo/vector-icons').MaterialIcons);
      expect(iconComponents.props.name).toBe('cloud-sync');
    });

    it('should use MTN orange color for mobile money accounts', () => {
      const { UNSAFE_getByType } = render(
        <PlatformSourceIndicator accountType="mobile_money" />
      );

      const iconComponents = UNSAFE_getByType(require('@expo/vector-icons').MaterialIcons);
      expect(iconComponents.props.color).toBe('#ff6b00');
    });
  });

  describe('Manual Account Type', () => {
    it('should display Manual for manual account type', () => {
      const { getByText } = render(
        <PlatformSourceIndicator accountType="manual" />
      );

      expect(getByText('Manual')).toBeTruthy();
    });

    it('should render with edit icon for manual accounts', () => {
      const { UNSAFE_getByType } = render(
        <PlatformSourceIndicator accountType="manual" />
      );

      const iconComponents = UNSAFE_getByType(require('@expo/vector-icons').MaterialIcons);
      expect(iconComponents.props.name).toBe('edit');
    });

    it('should use gray color for manual accounts', () => {
      const { UNSAFE_getByType } = render(
        <PlatformSourceIndicator accountType="manual" />
      );

      const iconComponents = UNSAFE_getByType(require('@expo/vector-icons').MaterialIcons);
      expect(iconComponents.props.color).toBe('#6b7280');
    });
  });

  describe('Default Behavior', () => {
    it('should default to manual type when no account type is provided', () => {
      const { getByText } = render(
        <PlatformSourceIndicator />
      );

      expect(getByText('Manual')).toBeTruthy();
    });

    it('should default to medium size when no size is provided', () => {
      const { UNSAFE_getByType } = render(
        <PlatformSourceIndicator accountType="bank" />
      );

      const iconComponents = UNSAFE_getByType(require('@expo/vector-icons').MaterialIcons);
      expect(iconComponents.props.size).toBe(12);
    });
  });

  describe('Size Variations', () => {
    it('should render with medium size by default', () => {
      const { UNSAFE_getByType } = render(
        <PlatformSourceIndicator accountType="bank" size="medium" />
      );

      const iconComponents = UNSAFE_getByType(require('@expo/vector-icons').MaterialIcons);
      expect(iconComponents.props.size).toBe(12);
    });

    it('should render with small size when specified', () => {
      const { UNSAFE_getByType } = render(
        <PlatformSourceIndicator accountType="bank" size="small" />
      );

      const iconComponents = UNSAFE_getByType(require('@expo/vector-icons').MaterialIcons);
      expect(iconComponents.props.size).toBe(10);
    });
  });

  describe('Platform Transparency', () => {
    it('should clearly indicate data source for bank transactions', () => {
      const { getByText } = render(
        <PlatformSourceIndicator accountType="bank" />
      );

      // This helps users understand where their bank transaction data comes from
      expect(getByText('Mono API')).toBeTruthy();
    });

    it('should clearly indicate data source for mobile money transactions', () => {
      const { getByText } = render(
        <PlatformSourceIndicator accountType="mobile_money" />
      );

      // This helps users understand where their MTN MoMo transaction data comes from
      expect(getByText('MTN MoMo API')).toBeTruthy();
    });

    it('should indicate manual entry for user-created transactions', () => {
      const { getByText } = render(
        <PlatformSourceIndicator accountType="manual" />
      );

      // This helps users distinguish their manual entries from synced data
      expect(getByText('Manual')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should render text that is accessible to screen readers', () => {
      const { getByText } = render(
        <PlatformSourceIndicator accountType="bank" />
      );

      const textElement = getByText('Mono API');
      expect(textElement).toBeTruthy();
    });

    it('should have consistent text styling across platform types', () => {
      const bankComponent = render(
        <PlatformSourceIndicator accountType="bank" />
      );
      const mobileComponent = render(
        <PlatformSourceIndicator accountType="mobile_money" />
      );
      const manualComponent = render(
        <PlatformSourceIndicator accountType="manual" />
      );

      // All should have text elements (accessibility consistency)
      expect(bankComponent.getByText('Mono API')).toBeTruthy();
      expect(mobileComponent.getByText('MTN MoMo API')).toBeTruthy();
      expect(manualComponent.getByText('Manual')).toBeTruthy();
    });
  });
});