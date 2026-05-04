import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme';
import { Button } from '../../src/components';
import { TrainingExperience } from '../../src/models';

const EXPERIENCES: { id: TrainingExperience; title: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'beginner', title: 'Beginner', desc: 'Just starting out or < 1 year experience', icon: 'walk-outline' },
  { id: 'intermediate', title: 'Intermediate', desc: 'Consistent training for 1-3 years', icon: 'bicycle-outline' },
  { id: 'advanced', title: 'Advanced', desc: 'Serious training for 3+ years', icon: 'rocket-outline' },
];

export default function OnboardingExperienceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ goal: string }>();
  const [selectedExp, setSelectedExp] = useState<TrainingExperience | null>(null);

  const handleNext = () => {
    if (!selectedExp) return;
    router.push({
      pathname: '/onboarding/metrics',
      params: { ...params, experience: selectedExp }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Experience</Text>
          <Text style={styles.subtitle}>How long have you been lifting?</Text>
        </View>

        <View style={styles.content}>
          {EXPERIENCES.map((exp) => {
            const isSelected = selectedExp === exp.id;
            return (
              <TouchableOpacity
                key={exp.id}
                style={[styles.expCard, isSelected && styles.expCardSelected]}
                onPress={() => setSelectedExp(exp.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                  <Ionicons name={exp.icon} size={28} color={isSelected ? Colors.primary : Colors.textSecondary} />
                </View>
                <View style={styles.expText}>
                  <Text style={[styles.expTitle, isSelected && styles.expTitleSelected]}>{exp.title}</Text>
                  <Text style={styles.expDesc}>{exp.desc}</Text>
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
            disabled={!selectedExp} 
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  headerRow: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: Spacing.sm },
  backButton: { width: 44, height: 44, justifyContent: 'center' },
  container: { flex: 1, paddingHorizontal: Layout.screenPaddingHorizontal },
  header: { marginTop: Spacing.md, marginBottom: Spacing.xl },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.bodyLarge, color: Colors.textSecondary },
  content: { flex: 1, gap: Spacing.md },
  expCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  expCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.surfaceHighlight },
  iconContainer: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconContainerSelected: { backgroundColor: `${Colors.primary}20` },
  expText: { flex: 1 },
  expTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 4 },
  expTitleSelected: { color: Colors.primary },
  expDesc: { ...Typography.bodySmall, color: Colors.textSecondary },
  radio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  footer: { paddingBottom: Spacing.xxl, paddingTop: Spacing.md },
  button: { width: '100%' },
});
