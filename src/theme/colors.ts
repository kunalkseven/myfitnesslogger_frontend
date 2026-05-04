/**
 * MuscleMemory Design System — Color Palette
 * 
 * Dark theme optimized for gym environments (low-light).
 * Primary accent: Electric Blue (#3B82F6 family)
 * Background: Deep dark greys with subtle depth layers.
 */

export const Colors = {
  // ── Primary Brand ──
  primary: '#3B82F6',        // Electric blue - main accent
  primaryLight: '#60A5FA',   // Lighter blue for hover/active states
  primaryDark: '#2563EB',    // Darker blue for pressed states
  primaryMuted: '#1E3A5F',   // Very muted blue for subtle backgrounds
  primaryGlow: 'rgba(59, 130, 246, 0.15)', // Glow effect

  // ── Backgrounds ──
  background: '#0A0A0F',     // Deepest background
  surface: '#12121A',        // Card/surface level 1
  surfaceElevated: '#1A1A25', // Card/surface level 2 (elevated)
  surfaceHighlight: '#22222F', // Highlighted/selected surface

  // ── Text ──
  textPrimary: '#F8FAFC',    // Main text - near white
  textSecondary: '#94A3B8',  // Secondary text - muted
  textTertiary: '#64748B',   // Tertiary/placeholder text
  textInverse: '#0A0A0F',    // For text on light backgrounds

  // ── Semantic ──
  success: '#22C55E',        // Green - progress, completed
  successMuted: 'rgba(34, 197, 94, 0.15)',
  error: '#EF4444',          // Red - errors, delete
  errorMuted: 'rgba(239, 68, 68, 0.15)',
  warning: '#F59E0B',        // Amber - warnings, caution
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  info: '#06B6D4',           // Cyan - informational

  // ── Muscle Group Colors (consistent across charts) ──
  muscleChest: '#EF4444',
  muscleBack: '#3B82F6',
  muscleLegs: '#22C55E',
  muscleShoulders: '#F59E0B',
  muscleArms: '#8B5CF6',
  muscleCore: '#06B6D4',

  // ── UI Elements ──
  border: '#1E293B',         // Subtle borders
  borderLight: '#334155',    // More visible borders
  divider: '#1E293B',
  tabBarBackground: '#0D0D14',
  tabBarBorder: '#1A1A25',
  inputBackground: '#12121A',
  inputBorder: '#1E293B',
  
  // ── Overlays ──
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  shimmer: 'rgba(255, 255, 255, 0.03)',

  // ── Gradients (start, end) ──
  gradientPrimary: ['#3B82F6', '#8B5CF6'] as const,
  gradientSuccess: ['#22C55E', '#06B6D4'] as const,
  gradientWarm: ['#F59E0B', '#EF4444'] as const,
  gradientDark: ['#12121A', '#0A0A0F'] as const,
} as const;

export type ColorKey = keyof typeof Colors;
