/**
 * MuscleMemory — Plan Editor Screen
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, TextInput, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../../src/theme';
import { Card, Button, ExercisePicker } from '../../../src/components';
import { useDatabase } from '../../../src/database/DatabaseProvider';
import { PlanRepository } from '../../../src/database/repositories';
import { WorkoutPlanWithDays, WorkoutPlanDay, ExerciseWithDetails, Exercise } from '../../../src/models';

export default function PlanEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { db, isReady } = useDatabase();
  
  const [plan, setPlan] = useState<WorkoutPlanWithDays | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [targetDayId, setTargetDayId] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    if (!db || !id) return;
    try {
      const repo = new PlanRepository(db);
      const planData = await repo.getWithDays(id);
      if (planData) {
        if (planData.isBuiltIn) {
          Alert.alert('Error', 'Cannot edit built-in templates directly. Please duplicate it first.');
          router.back();
          return;
        }
        setPlan(planData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [db, id, router]);

  useEffect(() => {
    if (isReady) loadPlan();
  }, [isReady, loadPlan]);

  const handleSave = async () => {
    if (!db || !plan) return;
    setSaving(true);
    try {
      const repo = new PlanRepository(db);
      // Update plan details
      await repo.updatePlan(plan.id, {
        name: plan.name,
        description: plan.description,
        trainingDaysPerWeek: plan.trainingDaysPerWeek,
        splitType: plan.splitType,
      });

      // Update days and exercises
      for (const day of plan.days) {
        let actualDayId = day.id;
        
        // If it's a temporary ID (newly added day), create it in DB first
        if (day.id.length < 20) { 
          actualDayId = await repo.addDayToPlan(plan.id, day.name, day.orderIndex);
        } else {
          await repo.updatePlanDay(day.id, day.name);
        }

        await repo.setExercisesForDay(actualDayId, day.exercises.map((ex, idx) => ({
          exerciseId: ex.id,
          sets: ex.defaultSets ?? 0,
          reps: ex.defaultReps ?? 0,
          orderIndex: idx,
        })));
      }

      Alert.alert('Success', 'Plan saved successfully');
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const addDay = async () => {
    if (!plan) return;
    const newDayName = `Day ${plan.days.length + 1}`;
    const newDay: WorkoutPlanDay & { exercises: ExerciseWithDetails[] } = {
      id: Math.random().toString(36).substr(2, 9), // Temporary ID until save
      planId: plan.id,
      name: newDayName,
      dayOfWeek: 0,
      targetMuscleGroups: [],
      orderIndex: plan.days.length,
      exercises: [],
    };
    setPlan({ ...plan, days: [...plan.days, newDay] });
  };

  const removeDay = (dayId: string) => {
    if (!plan) return;
    setPlan({ ...plan, days: plan.days.filter(d => d.id !== dayId) });
  };

  const handleAddExercise = (dayId: string) => {
    setTargetDayId(dayId);
    setPickerVisible(true);
  };

  const handleSelectExercise = (exercise: Exercise) => {
    if (!plan || !targetDayId) return;
    
    const newDays = plan.days.map(day => {
      if (day.id === targetDayId) {
        // Avoid duplicates if desired, or just add
        const newEx: ExerciseWithDetails = {
          ...exercise,
          defaultSets: 3,
          defaultReps: 10,
          orderIndex: day.exercises.length,
          planExerciseId: Math.random().toString(36).substr(2, 9),
        };
        return { ...day, exercises: [...day.exercises, newEx] };
      }
      return day;
    });

    setPlan({ ...plan, days: newDays });
    setPickerVisible(false);
  };

  const removeExercise = (dayId: string, exerciseId: string) => {
    if (!plan) return;
    const newDays = plan.days.map(day => {
      if (day.id === dayId) {
        return { ...day, exercises: day.exercises.filter(ex => ex.id !== exerciseId) };
      }
      return day;
    });
    setPlan({ ...plan, days: newDays });
  };

  if (!isReady || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!plan) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Plan</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.headerBtn}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={[styles.headerBtnText, { color: Colors.primary, fontWeight: '700' }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={styles.label}>Plan Name</Text>
          <TextInput
            style={styles.input}
            value={plan.name}
            onChangeText={(text) => setPlan({ ...plan, name: text })}
            placeholder="e.g. My 4-Day Split"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80, paddingTop: 12 }]}
            value={plan.description}
            onChangeText={(text) => setPlan({ ...plan, description: text })}
            placeholder="What is this plan about?"
            placeholderTextColor={Colors.textTertiary}
            multiline
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.daysHeader}>
          <Text style={styles.sectionTitle}>Workout Days</Text>
          <Button
            title="Add Day"
            variant="ghost"
            icon="add-circle-outline"
            onPress={addDay}
            size="sm"
          />
        </View>

        {plan.days.map((day, dayIdx) => (
          <View key={day.id} style={styles.dayBlock}>
            <View style={styles.dayHeaderRow}>
              <TextInput
                style={styles.dayNameInput}
                value={day.name}
                onChangeText={(text) => {
                  const newDays = [...plan.days];
                  newDays[dayIdx].name = text;
                  setPlan({ ...plan, days: newDays });
                }}
              />
              <TouchableOpacity onPress={() => removeDay(day.id)}>
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>

            <View style={styles.exerciseList}>
              {day.exercises.map((ex) => (
                <View key={ex.id} style={styles.exerciseItem}>
                  <View style={styles.exInfo}>
                    <Text style={styles.exName}>{ex.name}</Text>
                    <View style={styles.exMeta}>
                      <View style={styles.setRepInput}>
                        <TextInput
                          style={styles.miniInput}
                          value={String(ex.defaultSets)}
                          keyboardType="numeric"
                          onChangeText={(v) => {
                            const newDays = [...plan.days];
                            newDays[dayIdx].exercises = day.exercises.map(e => e.id === ex.id ? { ...e, defaultSets: parseInt(v) || 0 } : e);
                            setPlan({ ...plan, days: newDays });
                          }}
                        />
                        <Text style={styles.miniLabel}>sets</Text>
                      </View>
                      <View style={styles.setRepInput}>
                        <TextInput
                          style={styles.miniInput}
                          value={String(ex.defaultReps)}
                          keyboardType="numeric"
                          onChangeText={(v) => {
                            const newDays = [...plan.days];
                            newDays[dayIdx].exercises = day.exercises.map(e => e.id === ex.id ? { ...e, defaultReps: parseInt(v) || 0 } : e);
                            setPlan({ ...plan, days: newDays });
                          }}
                        />
                        <Text style={styles.miniLabel}>reps</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeExercise(day.id, ex.id)}>
                    <Ionicons name="close-circle-outline" size={22} color={Colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
              
              <Button
                title="Add Exercise"
                variant="secondary"
                icon="add"
                onPress={() => handleAddExercise(day.id)}
                size="sm"
                style={{ marginTop: Spacing.sm }}
              />
            </View>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      <ExercisePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleSelectExercise}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: Layout.screenPaddingHorizontal, 
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  headerBtn: { padding: Spacing.xs, minWidth: 60 },
  headerBtnText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  content: { padding: Layout.screenPaddingHorizontal },
  
  section: { marginBottom: Spacing.lg },
  label: { ...Typography.labelSmall, color: Colors.textTertiary, marginBottom: Spacing.xs },
  input: { 
    backgroundColor: Colors.surface, 
    borderRadius: BorderRadius.md, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    paddingHorizontal: Spacing.md, 
    paddingVertical: Spacing.sm,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xl },
  daysHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary },
  
  dayBlock: { 
    backgroundColor: Colors.surfaceHighlight, 
    borderRadius: BorderRadius.lg, 
    padding: Spacing.md, 
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  dayNameInput: { ...Typography.h3, color: Colors.textPrimary, flex: 1 },
  
  exerciseList: { gap: Spacing.sm },
  exerciseItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.surface, 
    padding: Spacing.sm, 
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exInfo: { flex: 1 },
  exName: { ...Typography.labelMedium, color: Colors.textPrimary },
  exMeta: { flexDirection: 'row', gap: Spacing.md, marginTop: 4 },
  setRepInput: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniInput: { 
    backgroundColor: Colors.surfaceHighlight, 
    width: 40, 
    textAlign: 'center', 
    borderRadius: 4, 
    paddingVertical: 2,
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  miniLabel: { ...Typography.caption, color: Colors.textTertiary },
});
