/**
 * MuscleMemory — SetRow Component
 * Row for logging a single set of an exercise.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring } from 'react-native-reanimated';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

interface SetRowProps {
  setNumber: number;
  initialWeight?: number;
  initialReps?: number;
  isWarmup?: boolean;
  isCompleted?: boolean;
  onToggleComplete: (weight: number, reps: number, isCompleted: boolean) => void;
  onRemove?: () => void;
  previousWeight?: number;
  previousReps?: number;
}

export const SetRow: React.FC<SetRowProps> = ({
  setNumber,
  initialWeight = 0,
  initialReps = 0,
  isWarmup = false,
  isCompleted = false,
  onToggleComplete,
  onRemove,
  previousWeight,
  previousReps,
}) => {
  // Always use strings for text inputs to avoid leading zero issues
  const [weight, setWeight] = useState(initialWeight ? initialWeight.toString() : '');
  const [reps, setReps] = useState(initialReps ? initialReps.toString() : '');
  
  const scale = useSharedValue(1);

  // Use previous values as placeholders if no initial values exist
  const weightPlaceholder = previousWeight ? previousWeight.toString() : '-';
  const repsPlaceholder = previousReps ? previousReps.toString() : '-';

  const handleToggle = () => {
    // If turning on completion and we have empty fields but previous values, autofill them
    let finalWeight = weight;
    let finalReps = reps;
    
    if (!isCompleted) {
      if (!finalWeight && previousWeight) {
        finalWeight = previousWeight.toString();
        setWeight(finalWeight);
      }
      if (!finalReps && previousReps) {
        finalReps = previousReps.toString();
        setReps(finalReps);
      }
      // Haptics and animation on complete
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withSequence(
        withSpring(1.3, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 400 })
      );
    } else {
      // Light haptic when unchecking
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const w = parseFloat(finalWeight) || 0;
    const r = parseInt(finalReps, 10) || 0;
    
    onToggleComplete(w, r, !isCompleted);
  };

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.container, isCompleted && styles.containerCompleted]}>
      {/* Set Number / Warmup Badge */}
      <View style={styles.numberContainer}>
        {isWarmup ? (
          <Text style={styles.warmupText}>W</Text>
        ) : (
          <Text style={styles.numberText}>{setNumber}</Text>
        )}
      </View>

      {/* Previous Data (Read Only) */}
      <View style={styles.previousContainer}>
        <Text style={styles.previousText}>
          {previousWeight && previousReps ? `${previousWeight}lbs × ${previousReps}` : '-'}
        </Text>
      </View>

      {/* Weight Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, isCompleted && styles.inputCompleted]}
          value={weight}
          onChangeText={(val) => {
            setWeight(val);
            if (isCompleted) onToggleComplete(parseFloat(val) || 0, parseInt(reps) || 0, true);
          }}
          keyboardType="numeric"
          placeholder={weightPlaceholder}
          placeholderTextColor={Colors.textTertiary}
          editable={!isCompleted} // Optional: allow edit while completed, or require uncheck first
        />
      </View>

      {/* Reps Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, isCompleted && styles.inputCompleted]}
          value={reps}
          onChangeText={(val) => {
            setReps(val);
            if (isCompleted) onToggleComplete(parseFloat(weight) || 0, parseInt(val) || 0, true);
          }}
          keyboardType="number-pad"
          placeholder={repsPlaceholder}
          placeholderTextColor={Colors.textTertiary}
          editable={!isCompleted}
        />
      </View>

      {/* Complete Checkbox */}
      <TouchableOpacity 
        style={[styles.checkbox, isCompleted && styles.checkboxCompleted]} 
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <Animated.View style={animatedCheckStyle}>
          <Ionicons name="checkmark" size={18} color={isCompleted ? Colors.background : 'transparent'} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'transparent',
    gap: Spacing.sm,
  },
  containerCompleted: {
    backgroundColor: `${Colors.success}10`,
  },
  numberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  warmupText: {
    ...Typography.labelMedium,
    color: Colors.warning,
    fontSize: 12,
  },
  previousContainer: {
    flex: 1,
    alignItems: 'center',
  },
  previousText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  inputContainer: {
    width: 60,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingVertical: 8,
    height: 36,
    fontVariant: ['tabular-nums'],
  },
  inputCompleted: {
    color: Colors.success,
    fontWeight: '700',
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  checkboxCompleted: {
    backgroundColor: Colors.success,
  },
});
