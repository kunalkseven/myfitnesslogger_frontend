/**
 * MuscleMemory — StatCard Component
 * 
 * Compact stat display for numbers and labels.
 * Used in Home screen, Progress, and workout summaries.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  compact?: boolean;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon,
  iconColor = Colors.primary,
  trend,
  trendValue,
  compact = false,
  style,
}) => {
  const trendColor = trend === 'up' ? Colors.success : trend === 'down' ? Colors.error : Colors.textTertiary;
  const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove';

  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={icon} size={compact ? 18 : 22} color={iconColor} />
        </View>
      )}
      <Text style={[styles.value, compact && styles.valueCompact]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {trend && trendValue && (
        <View style={styles.trendContainer}>
          <Ionicons name={trendIcon} size={12} color={trendColor} />
          <Text style={[styles.trendText, { color: trendColor }]}>
            {trendValue}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    flex: 1,
  },
  compact: {
    padding: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    ...Typography.statNumber,
    color: Colors.textPrimary,
  },
  valueCompact: {
    ...Typography.h2,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
    textAlign: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 2,
  },
  trendText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
