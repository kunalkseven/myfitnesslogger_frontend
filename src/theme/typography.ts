/**
 * MuscleMemory Design System — Typography
 * 
 * Clean sans-serif hierarchy. Uses system font (San Francisco on iOS,
 * Roboto on Android) for maximum legibility.
 * Key numbers (weight, reps, volume) use large, bold styles for at-a-glance readability.
 */

import { TextStyle } from 'react-native';

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const Typography: Record<string, TextStyle> = {
  // ── Display — Hero numbers, big stats ──
  displayLarge: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: FontWeights.heavy,
    letterSpacing: -1.5,
  },
  displayMedium: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: FontWeights.bold,
    letterSpacing: -1,
  },

  // ── Headings ──
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: FontWeights.bold,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: FontWeights.semibold,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: FontWeights.semibold,
    letterSpacing: -0.2,
  },

  // ── Body ──
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: FontWeights.regular,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: FontWeights.regular,
    letterSpacing: 0.1,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: FontWeights.regular,
    letterSpacing: 0.2,
  },

  // ── Labels & Buttons ──
  labelLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: FontWeights.semibold,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: FontWeights.medium,
    letterSpacing: 0.1,
  },
  labelSmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: FontWeights.medium,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // ── Caption ──
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: FontWeights.regular,
    letterSpacing: 0.3,
  },

  // ── Specialty — For workout logging ──
  statNumber: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: FontWeights.heavy,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  setNumber: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: FontWeights.bold,
    fontVariant: ['tabular-nums'],
  },
};
