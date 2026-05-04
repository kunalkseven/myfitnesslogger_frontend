import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import * as crypto from 'expo-crypto';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme';
import { Button } from '../../src/components';
import { MuscleGroup, EquipmentType } from '../../src/models';
import { useDatabase } from '../../src/database/DatabaseProvider';
import { ExerciseRepository } from '../../src/database/repositories';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'quadriceps', 'hamstrings', 'glutes',
  'shoulders', 'biceps', 'triceps', 'calves', 'core',
];

const EQUIPMENT_TYPES: EquipmentType[] = [
  'bodyweight', 'barbell', 'dumbbell', 'machine', 'cable', 'kettlebell', 'band', 'other'
];

export default function CreateExerciseScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { db } = useDatabase();
  
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<EquipmentType>('other');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter an exercise name.');
      return;
    }
    if (!muscleGroup) {
      Alert.alert('Required', 'Please select a primary muscle group.');
      return;
    }
    if (!db) return;

    setSaving(true);
    try {
      const repo = new ExerciseRepository(db);
      await repo.create({
        id: crypto.randomUUID(),
        name: name.trim(),
        primaryMuscleGroup: muscleGroup,
        secondaryMuscleGroups: [],
        equipmentType: equipment,
        movementPattern: 'push', // Defaulting for custom
        difficultyLevel: 'intermediate',
        instructions: instructions.trim(),
        commonMistakes: null,
        mediaUrl: null,
        createdByUserId: clerkUser?.id || 'guest_user'
      });

      router.back();
    } catch (error) {
      console.error('Failed to save exercise:', error);
      Alert.alert('Error', 'Could not save exercise.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Exercise</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Exercise Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Bulgarian Split Squat"
            placeholderTextColor={Colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.inputLabel}>Primary Muscle Group</Text>
          <View style={styles.pillContainer}>
            {MUSCLE_GROUPS.map((mg) => {
              const isSelected = muscleGroup === mg;
              return (
                <TouchableOpacity
                  key={mg}
                  style={[styles.pill, isSelected && styles.pillSelected]}
                  onPress={() => setMuscleGroup(mg)}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                    {mg.charAt(0).toUpperCase() + mg.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.inputLabel}>Equipment</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hPillContainer}>
            {EQUIPMENT_TYPES.map((eq) => {
              const isSelected = equipment === eq;
              return (
                <TouchableOpacity
                  key={eq}
                  style={[styles.pill, isSelected && styles.pillSelected]}
                  onPress={() => setEquipment(eq)}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                    {eq.charAt(0).toUpperCase() + eq.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.inputLabel}>Instructions (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Step-by-step guide..."
            placeholderTextColor={Colors.textTertiary}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      
      <View style={styles.footer}>
        <Button 
          title={saving ? "Saving..." : "Save Exercise"} 
          onPress={handleSave} 
          disabled={saving || !name.trim() || !muscleGroup}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingHorizontal, 
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  backButton: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  headerRight: { width: 44 },
  container: { flex: 1, paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: Spacing.lg },
  section: { marginBottom: Spacing.xl },
  inputLabel: { ...Typography.labelSmall, color: Colors.textSecondary, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    ...Typography.bodyLarge,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: { minHeight: 100 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  hPillContainer: { gap: Spacing.sm, paddingRight: Spacing.xl },
  pill: {
    paddingHorizontal: Spacing.md,
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
