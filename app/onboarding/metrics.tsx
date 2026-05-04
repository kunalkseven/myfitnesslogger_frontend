import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme';
import { Button } from '../../src/components';
import { UnitSystem } from '../../src/models';
import { useDatabase } from '../../src/database/DatabaseProvider';
import { UserRepository } from '../../src/database/repositories';

export default function OnboardingMetricsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ goal: string; experience: string }>();
  const { user: clerkUser } = useUser();
  const { db } = useDatabase();
  
  const [units, setUnits] = useState<UnitSystem>('metric');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState<string>('not_specified');
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    if (!db) return;
    setSaving(true);
    try {
      const repo = new UserRepository(db);
      const userId = clerkUser?.id || 'guest_user';
      const email = clerkUser?.primaryEmailAddress?.emailAddress || '';
      const name = clerkUser?.fullName || clerkUser?.firstName || 'Guest';

      await repo.upsertUser(userId, {
        name,
        email,
        authProvider: clerkUser ? 'email' : 'guest', // Simplified logic
        gender: gender !== 'not_specified' ? gender : null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        primaryGoal: params.goal as any,
        trainingExperience: params.experience as any,
        preferences: {
          units,
          theme: 'dark',
          restTimerDefaultSeconds: 90,
          notificationsEnabled: true
        }
      });

      // Navigate to tabs and reset stack
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to save user profile:', error);
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Your Body Metrics</Text>
          <Text style={styles.subtitle}>Help us personalize your experience.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Units</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segment, units === 'metric' && styles.segmentActive]}
              onPress={() => setUnits('metric')}
            >
              <Text style={[styles.segmentText, units === 'metric' && styles.segmentTextActive]}>Metric (kg/cm)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, units === 'imperial' && styles.segmentActive]}
              onPress={() => setUnits('imperial')}
            >
              <Text style={[styles.segmentText, units === 'imperial' && styles.segmentTextActive]}>Imperial (lb/in)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Height ({units === 'metric' ? 'cm' : 'in'})</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
              value={height}
              onChangeText={setHeight}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Weight ({units === 'metric' ? 'kg' : 'lbs'})</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
              value={weight}
              onChangeText={setWeight}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gender</Text>
          <View style={styles.pillContainer}>
            {['Male', 'Female', 'Other', 'Prefer not to say'].map((g) => {
              const value = g === 'Prefer not to say' ? 'not_specified' : g.toLowerCase();
              const isSelected = gender === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.pill, isSelected && styles.pillSelected]}
                  onPress={() => setGender(value)}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{g}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

      </ScrollView>
      
      <View style={styles.footer}>
        <Button 
          title={saving ? "Saving..." : "Finish Setup"} 
          onPress={handleComplete} 
          disabled={saving}
          style={styles.button}
        />
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
  section: { marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.sm },
  segmentedControl: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 4 },
  segment: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.sm },
  segmentActive: { backgroundColor: Colors.surfaceHighlight },
  segmentText: { ...Typography.labelMedium, color: Colors.textSecondary },
  segmentTextActive: { color: Colors.primary },
  sectionRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  inputContainer: { flex: 1, gap: Spacing.xs },
  inputLabel: { ...Typography.labelSmall, color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    ...Typography.bodyLarge,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillSelected: {
    backgroundColor: `${Colors.primary}20`,
    borderColor: Colors.primary,
  },
  pillText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  pillTextSelected: { color: Colors.primary, fontWeight: '600' },
  footer: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingBottom: Spacing.xxl, paddingTop: Spacing.md },
  button: { width: '100%' },
});
