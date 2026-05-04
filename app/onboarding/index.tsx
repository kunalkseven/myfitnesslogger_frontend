import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme';
import { Button } from '../../src/components';
import { PrimaryGoal } from '../../src/models';

const GOALS: { id: PrimaryGoal; title: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'build_muscle', title: 'Build Muscle', desc: 'Hypertrophy and mass building', icon: 'barbell-outline' },
  { id: 'get_stronger', title: 'Get Stronger', desc: 'Strength and power lifting', icon: 'fitness-outline' },
  { id: 'lose_fat', title: 'Lose Fat', desc: 'Cutting and leaning out', icon: 'flame-outline' },
  { id: 'stay_fit', title: 'Stay Fit', desc: 'General health and maintenance', icon: 'heart-outline' },
];

export default function OnboardingGoalsScreen() {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<PrimaryGoal | null>(null);

  const handleNext = () => {
    if (!selectedGoal) return;
    router.push({
      pathname: '/onboarding/experience',
      params: { goal: selectedGoal }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to MuscleMemory</Text>
          <Text style={styles.subtitle}>What is your primary fitness goal?</Text>
        </View>

        <View style={styles.content}>
          {GOALS.map((goal) => {
            const isSelected = selectedGoal === goal.id;
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                onPress={() => setSelectedGoal(goal.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                  <Ionicons name={goal.icon} size={28} color={isSelected ? Colors.primary : Colors.textSecondary} />
                </View>
                <View style={styles.goalText}>
                  <Text style={[styles.goalTitle, isSelected && styles.goalTitleSelected]}>{goal.title}</Text>
                  <Text style={styles.goalDesc}>{goal.desc}</Text>
                </View>
                <View style={styles.radio}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Button 
            title="Continue" 
            onPress={handleNext} 
            disabled={!selectedGoal} 
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Layout.screenPaddingHorizontal },
  header: { marginTop: Spacing.xl, marginBottom: Spacing.xl },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.bodyLarge, color: Colors.textSecondary },
  content: { flex: 1, gap: Spacing.md },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.surfaceHighlight },
  iconContainer: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconContainerSelected: { backgroundColor: `${Colors.primary}20` },
  goalText: { flex: 1 },
  goalTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 4 },
  goalTitleSelected: { color: Colors.primary },
  goalDesc: { ...Typography.bodySmall, color: Colors.textSecondary },
  radio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  footer: { paddingBottom: Spacing.xxl, paddingTop: Spacing.md },
  button: { width: '100%' },
});
