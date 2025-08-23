# Typography System - Kippo Design System

## Overview
Directly inspired by HillFusion's actual typography system, our approach emphasizes clean hierarchy, generous spacing, and professional readability. Following their minimal aesthetic, we prioritize clear content presentation over decorative elements, ensuring financial information is presented with maximum clarity and trust.

## Typography Philosophy

### Minimal & Clean
Following HillFusion's approach, we use typography as the primary means of creating hierarchy and visual interest, rather than relying on color or complex visual effects.

### Generous Spacing
Ample white space and proper line heights create a breathing, professional feel that reduces cognitive load when reviewing financial data.

### Professional Hierarchy
Clear heading structure (H1-H6) with meaningful size relationships ensures users can quickly scan and understand financial information architecture.

## Font Stack

### Primary Font - System Sans-Serif
**Purpose**: Clean, native, highly performant
- **Weights Available**: 300 (Light), 400 (Normal), 500 (Medium), 600 (Semibold), 700 (Bold), 800 (Xbold)
- **Usage**: All headings, body text, UI elements
- **Rationale**: Matches HillFusion's clean system font approach for optimal performance and native feel
- **HillFusion Alignment**: Uses system defaults for professional, minimal aesthetic

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

### Financial Data Font - System Monospace
**Purpose**: Numerical data, amounts, account numbers
- **Weights Available**: 400 (Normal), 500 (Medium), 600 (Semibold)
- **Usage**: Currency amounts, account balances, transaction data
- **Rationale**: Ensures consistent alignment of financial figures while maintaining system integration
- **Clean Approach**: Uses system monospace fonts for consistency

```css
font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace;
```

### System-Native Approach
Following HillFusion's philosophy:
- **iOS**: SF Pro Display, SF Pro Text (system defaults)
- **Android**: Roboto (system default)
- **Web**: System UI fonts for native feel
- **Performance**: No custom font loading for optimal speed

## Type Scale & Hierarchy

### HillFusion-Inspired Scale
Based on HillFusion's actual heading hierarchy with generous spacing and clear distinctions:

| Level | Size (px) | Size (rem) | Line Height | Weight | Usage |
|-------|-----------|------------|-------------|--------|-------|
| **H1** | 56px | 3.5rem | 1.1 | 800 (Xbold) | Main page titles, hero headings |
| **H2** | 48px | 3.0rem | 1.15 | 700 (Bold) | Major section headers |
| **H3** | 36px | 2.25rem | 1.2 | 700 (Bold) | Subsection headers |
| **H4** | 30px | 1.875rem | 1.25 | 600 (Semibold) | Component titles |
| **H5** | 24px | 1.5rem | 1.3 | 600 (Semibold) | Card headers |
| **H6** | 20px | 1.25rem | 1.35 | 500 (Medium) | Small section headers |
| **Text Large** | 18px | 1.125rem | 1.6 | 400 (Normal) | Important body content |
| **Text Medium** | 16px | 1.0rem | 1.6 | 400 (Normal) | Default body text |
| **Text Regular** | 16px | 1.0rem | 1.5 | 400 (Normal) | Standard body text |
| **Text Small** | 14px | 0.875rem | 1.5 | 400 (Normal) | Secondary information |

### Weight System (HillFusion Style)
- **Light (300)**: Minimal usage, special cases
- **Normal (400)**: Body text, standard content
- **Medium (500)**: Slight emphasis, labels
- **Semibold (600)**: Important text, card titles
- **Bold (700)**: Major headings, strong emphasis
- **Xbold (800)**: Hero text, primary headings

### Financial Amount Typography

#### Large Amounts (Primary Balances)
- **Size**: 48px (3.0rem)
- **Weight**: 700 (Bold)
- **Font**: System Monospace
- **Line Height**: 1.1
- **Usage**: Main account balance, total portfolio value
- **Style**: Clean, minimal presentation with high contrast

#### Medium Amounts (Transaction Data)
- **Size**: 20px (1.25rem)
- **Weight**: 600 (Semibold)
- **Font**: System Monospace
- **Line Height**: 1.3
- **Usage**: Individual transaction amounts, category subtotals
- **Approach**: Clear, scannable financial data

#### Small Amounts (Supporting Data)
- **Size**: 16px (1.0rem)
- **Weight**: 500 (Medium)
- **Font**: System Monospace
- **Line Height**: 1.4
- **Usage**: Fees, change amounts, minor details
- **Integration**: Seamless with minimal design approach

## Color & Typography Combinations

### Primary Text Colors (Minimal Palette)
```css
.text-primary {
  color: #000000; /* Pure Black */
  font-weight: 400;
}

.text-secondary {
  color: #4b5563; /* Professional Gray */
  font-weight: 400;
}

.text-muted {
  color: #9ca3af; /* Subtle Gray */
  font-weight: 400;
}
```

### Financial Text Colors (Restrained)
```css
.text-income {
  color: #16a34a; /* Clean Green */
  font-weight: 600;
  font-family: system-monospace;
}

.text-expense {
  color: #dc2626; /* Minimal Red */
  font-weight: 600;
  font-family: system-monospace;
}

.text-neutral {
  color: #000000; /* Primary Black */
  font-weight: 500;
  font-family: system-monospace;
}
```

### Emphasis & States (Minimal)
```css
.text-emphasis {
  color: #000000; /* Primary Black */
  font-weight: 700;
}

.text-success {
  color: #16a34a; /* Clean Green */
  font-weight: 500;
}

.text-warning {
  color: #d97706; /* Professional Amber */
  font-weight: 500;
}

.text-error {
  color: #dc2626; /* Minimal Red */
  font-weight: 500;
}
```

## Typography Patterns

### Financial Dashboard Headers (HillFusion Style)
```css
.dashboard-title {
  font-size: 48px;
  font-weight: 700;
  color: #000000;
  line-height: 1.15;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.dashboard-subtitle {
  font-size: 18px;
  font-weight: 400;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 32px;
}
```

### Transaction List Items (Clean Approach)
```css
.transaction-description {
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  line-height: 1.5;
}

.transaction-category {
  font-size: 14px;
  font-weight: 400;
  color: #4b5563;
  line-height: 1.5;
}

.transaction-amount {
  font-family: system-monospace;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}

.transaction-date {
  font-size: 14px;
  font-weight: 400;
  color: #9ca3af;
  line-height: 1.5;
}
```

### Form Elements (Clean Design)
```css
.form-label {
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  line-height: 1.5;
  margin-bottom: 8px;
}

.form-input {
  font-size: 16px;
  font-weight: 400;
  color: #000000;
  line-height: 1.5;
}

.form-helper {
  font-size: 14px;
  font-weight: 400;
  color: #4b5563;
  line-height: 1.5;
}

.form-error {
  font-size: 14px;
  font-weight: 500;
  color: #dc2626;
  line-height: 1.5;
}
```

### Card Components (HillFusion Minimal)
```css
.card-title {
  font-size: 24px;
  font-weight: 600;
  color: #000000;
  line-height: 1.3;
  margin-bottom: 12px;
}

.card-subtitle {
  font-size: 16px;
  font-weight: 400;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 20px;
}

.card-body {
  font-size: 16px;
  font-weight: 400;
  color: #000000;
  line-height: 1.6;
}
```

## Responsive Typography

### Mobile-First Approach
Our typography scales appropriately across different screen sizes:

#### Mobile (320px - 768px)
- Maintain readability with slightly smaller base sizes
- Ensure touch targets are accessible (minimum 44px)
- Optimize line lengths for narrow screens

```css
@media (max-width: 768px) {
  .display-large { font-size: 40px; }
  .display-medium { font-size: 32px; }
  .display-small { font-size: 24px; }
}
```

#### Tablet (768px - 1024px)
- Leverage increased screen real estate
- Maintain comfortable reading distances

#### Desktop (1024px+)
- Full scale implementation
- Optimal line lengths and spacing

### Dynamic Type Support
Support for user accessibility preferences:

```css
.text-scalable {
  font-size: clamp(14px, 2.5vw, 18px);
  line-height: 1.5;
}
```

## Accessibility Guidelines

### WCAG Compliance

#### Text Size Requirements
- **Minimum Size**: 16px for body text (mobile)
- **Line Height**: Minimum 1.5 for body text
- **Line Length**: 45-75 characters per line optimal
- **Spacing**: Minimum 0.12em letter-spacing for body text

#### Contrast Requirements
- **Normal Text**: 4.5:1 minimum contrast ratio
- **Large Text**: 3:1 minimum contrast ratio
- **Text on Images**: Additional background overlays

### Inclusive Design

#### Dyslexia-Friendly Principles
- Generous line spacing (1.5 minimum)
- Clear font choice (Inter's open letterforms)
- Avoid justified text
- Provide spacing between letters and words

#### Low Vision Support
- Scalable text implementation
- High contrast color combinations
- Clear visual hierarchy

## Animation & Motion

### Text Animations
Subtle animations enhance the professional feel:

```css
.text-fade-in {
  animation: fadeIn 0.3s ease-out;
  opacity: 1;
}

.text-slide-up {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  transform: translateY(0);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(16px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Performance Considerations
- Use `transform` instead of changing layout properties
- Implement `will-change` sparingly
- Prefer CSS transitions over JavaScript animations

## Implementation

### Theme Configuration
```typescript
export const typography = {
  // Font Families (System-Native)
  fontFamily: {
    primary: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['SF Mono', 'Monaco', 'Roboto Mono', 'monospace'],
  },
  
  // Font Sizes (HillFusion Scale)
  fontSize: {
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
    '6xl': '56px',
  },
  
  // Font Weights (HillFusion Range)
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    xbold: 800,
  },
  
  // Line Heights (Generous Spacing)
  lineHeight: {
    tight: 1.1,
    snug: 1.15,
    base: 1.5,
    relaxed: 1.6,
    loose: 1.8,
  },
};
```

### React Native Implementation
```typescript
import { StyleSheet } from 'react-native';

export const textStyles = StyleSheet.create({
  h1: {
    fontSize: 56,
    fontWeight: '800',
    lineHeight: 61.6,
    color: '#000000',
    letterSpacing: -0.02,
  },
  
  h2: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 55.2,
    color: '#000000',
  },
  
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28.8,
    color: '#000000',
  },
  
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 25.6,
    color: '#000000',
  },
  
  financialAmount: {
    fontFamily: 'SF Mono',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    color: '#000000',
  },
  
  secondary: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    color: '#4b5563',
  },
});
```

## Testing & Quality Assurance

### Typography Checklist
- [ ] All text meets minimum contrast requirements
- [ ] Font sizes are appropriate for mobile devices
- [ ] Line lengths are optimized for readability
- [ ] Text scales properly with device settings
- [ ] Monospace fonts are used for financial data
- [ ] Hierarchy is clear and consistent
- [ ] Loading states don't cause text flash

### Regular Reviews
- Monthly accessibility audits
- User testing with diverse audiences
- Performance impact assessment
- Cross-platform consistency checks

---

*This typography system directly reflects HillFusion's actual heading hierarchy and clean aesthetic, ensuring financial information is presented with maximum clarity and professional credibility through strategic use of system fonts and generous spacing.*