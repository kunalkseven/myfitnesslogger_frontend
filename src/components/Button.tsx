/**
 * MuscleMemory — Shared Button Component
 * 
 * Premium button with primary, secondary, ghost, and danger variants.
 * Supports loading state and icon placement.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  StyleProp,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}) => {
  const isDisabled = disabled || loading;

  const containerStyles = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    isDisabled && styles.textDisabled,
  ];

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;
  const iconColor = variant === 'primary' || variant === 'danger' || variant === 'success'
    ? Colors.textPrimary
    : Colors.primary;

  const handlePress = () => {
    if (!isDisabled) {
      if (variant === 'danger') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.selectionAsync();
      }
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.textPrimary : Colors.primary}
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={isDisabled ? Colors.textTertiary : iconColor}
              style={title ? styles.iconLeft : null}
            />
          )}
          {title && <Text style={textStyles}>{title}</Text>}
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={isDisabled ? Colors.textTertiary : iconColor}
              style={title ? styles.iconRight : null}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // ── Variants ──
  variant_primary: {
    backgroundColor: Colors.primary,
  },
  variant_secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_danger: {
    backgroundColor: Colors.error,
  },
  variant_success: {
    backgroundColor: Colors.success,
  },

  // ── Sizes ──
  size_sm: {
    height: 36,
    paddingHorizontal: Spacing.md,
  },
  size_md: {
    height: 48,
    paddingHorizontal: Spacing.xl,
  },
  size_lg: {
    height: 56,
    paddingHorizontal: Spacing.xxl,
  },

  // ── Text ──
  text: {
    ...Typography.labelMedium,
    textAlign: 'center',
  },
  text_primary: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  text_secondary: {
    color: Colors.primary,
    fontWeight: '600',
  },
  text_ghost: {
    color: Colors.primary,
  },
  text_danger: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  text_success: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  textSize_sm: {
    fontSize: 13,
  },
  textSize_md: {
    fontSize: 15,
  },
  textSize_lg: {
    fontSize: 17,
    fontWeight: '700',
  },

  textDisabled: {
    color: Colors.textTertiary,
  },

  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});
