/**
 * Preset avatars (Phase 1 — no photo uploads). Each preset is a gradient tile
 * with an optional cozy glyph; the `initial` preset falls back to the handle's
 * first letter, preserving the original look for accounts that never pick one.
 */
import { EmberGradientAlt } from '@/constants/theme';

export type AvatarPreset = {
  id: string;
  colors: readonly [string, string]; // linear-gradient stops (top-left → bottom-right)
  glyph?: string; // emoji shown on the tile; when absent, the handle initial is used
};

export const AVATAR_PRESETS: readonly AvatarPreset[] = [
  { id: 'initial', colors: EmberGradientAlt }, // default — handle initial on ember gradient
  { id: 'flame', colors: ['#ffa04d', '#e85a2a'], glyph: '🔥' },
  { id: 'candle', colors: ['#ffcf70', '#e8973a'], glyph: '🕯️' },
  { id: 'spark', colors: ['#ffe08a', '#f0a838'], glyph: '✨' },
  { id: 'moon', colors: ['#7d6bb0', '#3a2c5e'], glyph: '🌙' },
  { id: 'star', colors: ['#8aa8ff', '#4a5bd0'], glyph: '⭐' },
  { id: 'leaf', colors: ['#8fce7e', '#3f8f5c'], glyph: '🌿' },
  { id: 'bloom', colors: ['#ff9a8b', '#e5566d'], glyph: '🌸' },
  { id: 'wave', colors: ['#6fd3c8', '#2f8f96'], glyph: '🌊' },
] as const;

export const DEFAULT_AVATAR = 'initial';

/** Resolve a preset id to its definition, falling back to the default. */
export function avatarPreset(id?: string | null): AvatarPreset {
  return AVATAR_PRESETS.find((p) => p.id === id) ?? AVATAR_PRESETS[0];
}
