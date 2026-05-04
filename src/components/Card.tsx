/**
 * MuscleMemory — Card Component
 * 
 * Dark elevated card with optional glow effect.
 * Used for workout cards, stat cards, plan cards, etc.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'highlighted' | 'outlined';
  onPress?: () => void;
  style?: ViewStyle;
  glowColor?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  style,
  glowColor,
}) => {
  const cardStyles: ViewStyle[] = [
    styles.base,
    styles[variant],
    glowColor ? Shadows.glow(glowColor) : undefined,
    style,
  ].filter(Boolean) as ViewStyle[];

  const handlePress = () => {
    if (onPress) {
      Haptics.selectionAsync();
      onPress();
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  elevated: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.medium,
  },
  highlighted: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
});
