/**
 * SmartEducate Canonical Design Tokens & Design System
 * Single source of truth for visual identity, typography, spacing, colors, and layout rules.
 * Locked Educate-inspired design system.
 */

export const DESIGN_TOKENS = {
  colors: {
    // Primary Purple Action Palette
    primary: {
      DEFAULT: '#7C3AED', // Vibrant violet purple for primary CTAs & emphasis
      hover: '#6D28D9',   // Deep purple on hover
      active: '#5B21B6',  // Pressed state
      light: '#8B5CF6',   // Medium-light accent
      subtle: '#EDE9FE',  // Light icon containers & badges
      tint: '#FAF8FE',    // Subtle selected card background tint
    },
    // Content & Page Backgrounds
    background: {
      page: '#F8F6FD',     // Soft lavender/pale purple page background
      card: '#FFFFFF',     // Crisp white card surface
      subtle: '#F5F2FA',   // Slightly elevated neutral container
      hover: '#FCFAFE',    // Card hover state
      modalBackdrop: 'rgba(15, 23, 42, 0.45)',
    },
    // High-Contrast Typography
    text: {
      primary: '#1E1B4B',   // Deep slate indigo for headings & main titles (>= 12:1 contrast)
      secondary: '#64748B', // Medium slate for descriptions & labels
      muted: '#94A3B8',     // Muted slate for non-critical metadata
      inverse: '#FFFFFF',   // Pure white on primary purple buttons
      disabled: '#CBD5E1',  // Disabled text
    },
    // Soft Neutral & Lavender Borders
    border: {
      subtle: '#EDE8F5',    // Subtle soft border for unselected cards
      card: '#EAE6F8',      // Standard card outline
      hover: '#DDD6FE',     // Light purple hover border
      active: '#7C3AED',    // Active/selected border
      divider: '#F1ECF8',   // Inner card dividers
    },
    // Semantic States
    state: {
      success: {
        text: '#065F46',
        bg: '#ECFDF5',
        border: '#A7F3D0',
        solid: '#059669',
      },
      warning: {
        text: '#92400E',
        bg: '#FFFBEB',
        border: '#FDE68A',
        solid: '#D97706',
      },
      error: {
        text: '#991B1B',
        bg: '#FEF2F2',
        border: '#FECACA',
        solid: '#DC2626',
      },
      info: {
        text: '#5B21B6',
        bg: '#F5F3FF',
        border: '#DDD6FE',
        solid: '#7C3AED',
      },
    },
  },

  // Typography System
  typography: {
    fontFamilies: {
      latin: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      arabic: "'Cairo', 'Noto Sans Arabic', system-ui, -apple-system, sans-serif",
      mono: "'JetBrains Mono', 'IBM Plex Mono', monospace",
    },
    fontSizes: {
      xs: '0.75rem',     // 12px (strictly metadata only)
      sm: '0.875rem',    // 14px (secondary labels & descriptions)
      base: '1rem',      // 16px (standard body text)
      lg: '1.125rem',    // 18px (card titles)
      xl: '1.25rem',     // 20px (prominent headings)
      '2xl': '1.5rem',   // 24px (section headers)
      '3xl': '1.875rem', // 30px (screen headers)
      '4xl': '2.25rem',  // 36px (prominent hero titles)
    },
    fontWeights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeights: {
      tight: '1.2',
      normal: '1.4',
      relaxed: '1.6',
      arabic: '1.7', // Arabic vertical breathing room
    },
  },

  // Spacing System (in rem & px)
  spacing: {
    0: '0px',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px (inner card padding standard)
    5: '1.25rem',  // 20px (generous mobile padding)
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
  },

  // Border Radius Scale (Smooth, generously rounded)
  radius: {
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px (small buttons & inputs)
    lg: '1rem',      // 16px (standard cards)
    xl: '1.25rem',   // 20px (prominent cards)
    '2xl': '1.5rem', // 24px (large cards & modal dialogs)
    full: '9999px',  // Pills & badges
  },

  // Shadow / Elevation Scale (Soft purple-tinted ambient glow)
  shadows: {
    card: '0 2px 8px rgba(20, 10, 50, 0.03)',
    cardHover: '0 6px 20px rgba(124, 58, 237, 0.08)',
    buttonPrimary: '0 8px 24px rgba(124, 58, 237, 0.28)',
    buttonHover: '0 10px 28px rgba(124, 58, 237, 0.35)',
    elevated: '0 12px 32px rgba(20, 10, 50, 0.08)',
    modal: '0 20px 40px rgba(15, 23, 42, 0.16)',
    focus: '0 0 0 3px rgba(124, 58, 237, 0.3)',
  },

  // Component Sizes & Touch Targets
  sizes: {
    buttonSm: '2.5rem',   // 40px
    buttonMd: '3rem',     // 48px (minimum mobile touch target)
    buttonLg: '3.5rem',   // 56px (prominent primary action)
    inputHeight: '3rem',  // 48px
    iconBoxSm: '2.5rem',  // 40px
    iconBoxMd: '3rem',    // 48px
    iconBoxLg: '3.5rem',  // 56px
    iconBoxXl: '4rem',    // 64px
  },

  // Layout & Container Constraints
  layout: {
    mobileMax: '480px',
    contentMax: '640px',
    desktopMax: '1024px',
    minTouchTarget: '48px', // 48px minimum touch target for mobile compliance
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
