/**
 * MuscleMemory — FilterChip Component
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ScrollView, View } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, selected, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

interface FilterChipGroupProps {
  options: string[];
  selected: string | null;
  onSelect: (option: string | null) => void;
  showAll?: boolean;
}

export const FilterChipGroup: React.FC<FilterChipGroupProps> = ({
  options,
  selected,
  onSelect,
  showAll = true,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipGroup}
    >
      {showAll && (
        <FilterChip
          label="All"
          selected={selected === null}
          onPress={() => onSelect(null)}
        />
      )}
      {options.map((option) => (
        <FilterChip
          key={option}
          label={option.charAt(0).toUpperCase() + option.slice(1).replace(/_/g, ' ')}
          selected={selected === option}
          onPress={() => onSelect(selected === option ? null : option)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  chipText: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
    fontSize: 12,
  },
  chipTextSelected: {
    color: Colors.primary,
  },
  chipGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
});
