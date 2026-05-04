/**
 * MuscleMemory — RestTimer Component
 * A floating/sticky countdown timer for resting between sets.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

interface RestTimerProps {
  initialSeconds: number;
  onFinish: () => void;
  onSkip: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({ 
  initialSeconds, 
  onFinish, 
  onSkip 
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // Reset timer when initialSeconds prop changes (i.e. new set completed)
    setTimeLeft(initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      onFinish();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, onFinish]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const addTime = () => setTimeLeft(t => t + 30);
  const togglePause = () => setIsActive(!isActive);

  // Don't render if not active and no time left
  if (timeLeft === 0 && !isActive) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="timer-outline" size={24} color={Colors.primary} />
        
        <View style={styles.timeContainer}>
          <Text style={styles.label}>Rest Timer</Text>
          <Text style={styles.time}>{formatTime(timeLeft)}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.button} onPress={addTime}>
            <Text style={styles.buttonText}>+30s</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.iconButton} onPress={togglePause}>
            <Ionicons name={isActive ? "pause" : "play"} size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.iconButton} onPress={onSkip}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.md,
    // Add shadow for depth if it's floating above content
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timeContainer: {
    flex: 1,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  time: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  button: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.sm,
  },
  buttonText: {
    ...Typography.labelSmall,
    color: Colors.textPrimary,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
