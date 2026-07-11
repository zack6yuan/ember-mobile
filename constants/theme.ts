/**
 * Ember — "Hearth" design tokens.
 * Calm and literary: one warm ember accent, a soft serif for headlines,
 * a dark background with an ember-orange glow. Values are taken directly
 * from the design handoff and are meant to be used verbatim for fidelity.
 */

import { Theme } from '@react-navigation/native';
import { Platform } from 'react-native';

export const Ember = {
  // Backgrounds
  bg: '#100b08', // default screen background
  bgDeep: '#0d0805', // welcome base (under glow)
  bgDeepest: '#050403', // device bezel / darkest tile
  // Surfaces
  surface: '#181009', // cards, list rows
  surface2: '#1c130d', // input fields, reply composer
  surface3: '#241914', // chips, pills, secondary buttons
  surfaceSelected: '#2a1c13', // selected segmented-control segment
  // Borders
  border: 'rgba(255,255,255,0.05)',
  borderStrong: 'rgba(255,255,255,0.10)',
  // Accent
  ember: '#f0824a', // links, active tags, accent text
  emberLight: '#ffb073', // italic headline accent, glow highlights
  // Text
  textPrimary: '#fff6ef', // headlines
  textBody: '#d8c8bd', // post body text
  textSecondary: '#c3b1a5', // subtitles, supportive copy
  textSecondaryAlt: '#c9b7ab',
  textMuted: '#8f8078', // timestamps, labels, placeholders
  textMutedDeep: '#7d6f66',
  // Misc
  reactionWarm: '#f0c9b3', // reaction pill text
  avatarAnon: '#3a271c', // anonymous avatar tile
  disabled: '#4a3d34', // disabled "Post" label
  onGradient: '#1a0d06', // text/icon color on top of the ember gradient
} as const;

/** Primary ember gradient (linear, ~160deg). Used on logo, CTAs, avatars, FAB. */
export const EmberGradient = ['#ffa04d', '#e85a2a'] as const;
/** Slightly cooler variant seen on smaller tiles / chips. */
export const EmberGradientAlt = ['#ff8a3d', '#e85a2a'] as const;
/** Progress bar gradient (horizontal). */
export const EmberGradientBar = ['#ff8a3d', '#e85a2a'] as const;

export const Radius = {
  card: 20,
  cardSmall: 18,
  chip: 20,
  button: 18,
  buttonLg: 19,
  tile: 22,
  tileLg: 26,
  fab: 20,
  input: 16,
  segment: 14,
} as const;

export const Spacing = {
  screenX: 20,
  cardPad: 16,
  cardGap: 12,
} as const;

/** Font family names as registered with expo-font (see app/_layout.tsx). */
export const Fonts = {
  serif: 'Newsreader_500Medium',
  serifItalic: 'Newsreader_500Medium_Italic',
  serifRegular: 'Newsreader_400Regular',
  sans: 'HankenGrotesk_400Regular',
  sansMedium: 'HankenGrotesk_500Medium',
  sansSemiBold: 'HankenGrotesk_600SemiBold',
  sansBold: 'HankenGrotesk_700Bold',
} as const;

/** React Navigation theme so the root background + any residual `useTheme()` reads are on-brand. */
export const EmberNavTheme: Theme = {
  dark: true,
  colors: {
    primary: Ember.ember,
    background: Ember.bg,
    card: Ember.surface,
    text: Ember.textPrimary,
    border: Ember.border,
    notification: Ember.ember,
  },
  fonts: {
    regular: { fontFamily: Fonts.sans, fontWeight: '400' },
    medium: { fontFamily: Fonts.sansMedium, fontWeight: '500' },
    bold: { fontFamily: Fonts.sansBold, fontWeight: '700' },
    heavy: { fontFamily: Fonts.sansBold, fontWeight: '800' },
  },
};

// --- Legacy exports kept so the original Expo scaffold files still compile ---
const tintColorDark = Ember.ember;
export const Colors = {
  light: {
    text: Ember.textPrimary,
    background: Ember.bg,
    tint: tintColorDark,
    icon: Ember.textMuted,
    tabIconDefault: Ember.textMuted,
    tabIconSelected: tintColorDark,
  },
  dark: {
    text: Ember.textPrimary,
    background: Ember.bg,
    tint: tintColorDark,
    icon: Ember.textMuted,
    tabIconDefault: Ember.textMuted,
    tabIconSelected: tintColorDark,
  },
};

export const LegacyFonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
});
