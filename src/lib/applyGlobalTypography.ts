import { Text, TextInput } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/constants/design';

let typographyApplied = false;

type DefaultPropsComponent = {
  defaultProps?: {
    style?: unknown;
  };
};

export function applyGlobalTypography(): void {
  if (typographyApplied) {
    return;
  }

  const textComponent = Text as typeof Text & DefaultPropsComponent;
  const textInputComponent = TextInput as typeof TextInput & DefaultPropsComponent;

  textComponent.defaultProps = textComponent.defaultProps || {};
  textInputComponent.defaultProps = textInputComponent.defaultProps || {};

  textComponent.defaultProps.style = [
    { fontFamily: TYPOGRAPHY.fonts.regular, color: COLORS.textPrimary },
    textComponent.defaultProps.style,
  ];

  textInputComponent.defaultProps.style = [
    { fontFamily: TYPOGRAPHY.fonts.regular, color: COLORS.textPrimary },
    textInputComponent.defaultProps.style,
  ];

  typographyApplied = true;
}
