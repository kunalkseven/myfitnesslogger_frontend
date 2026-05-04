/**
 * MuscleMemory — Active Workout Screen
 * The core logging experience.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme';
import { useDatabase } from '../../src/database/DatabaseProvider';
import { WorkoutRepository, PlanRepository } from '../../src/database/repositories';
import { ExerciseWithDetails, WorkoutPlanDay } from '../../src/models';
import { SetRow, RestTimer, Button } from '../../src/components';
import { useUser } from '@clerk/clerk-expo';

const GUEST_USER = { id: 'guest_user' };

// Local state representation of a set before it's saved to DB
interface LocalSet {
  id: string; // Temporary ID until saved, or DB ID if saved
  exerciseId: string;
  orderIndex: number;
  weight: number;
  reps: number;
  isCompleted: boolean;
  isWarmup: boolean;
  previousWeight?: number;
  previousReps?: number;
}

export default function ActiveWorkoutScreen() {
  const { planDayId } = useLocalSearchParams<{ planDayId: string }>();
  const router = useRouter();
  const { db, isReady } = useDatabase();
  const { user: clerkUser } = useUser();
  const currentUser = clerkUser || GUEST_USER;
  
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [planDay, setPlanDay] = useState<WorkoutPlanDay | null>(null);
  const [exercises, setExercises] = useState<ExerciseWithDetails[]>([]);
  const [sets, setSets] = useState<Record<string, LocalSet[]>>({});
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  
  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);

  useEffect(() => {
    // We only need to wait for the provider to be ready. 
    // We don't check !db here because we handle the null db case explicitly below for web.
    if (!isReady) return;
    
    let isMounted = true;
    let timer: NodeJS.Timeout;

    const initWorkout = async () => {
      try {
        if (!db) {
          // Web fallback: provide mock data
          setSessionId('mock-session');
          setPlanDay({
            id: 'mock-day', planId: 'mock-plan', name: 'Mock Workout', 
            dayOfWeek: null, targetMuscleGroups: ['chest', 'triceps'], orderIndex: 0
          });
          const mockEx: ExerciseWithDetails = {
            id: 'ex1', name: 'Bench Press', primaryMuscleGroup: 'chest', secondaryMuscleGroups: [],
            equipmentType: 'barbell', movementPattern: 'push', difficultyLevel: 'intermediate',
            instructions: '', commonMistakes: null, mediaUrl: null, createdByUserId: null, isBuiltIn: true,
            defaultSets: 3, defaultReps: 10, defaultRPE: null
          };
          setExercises([mockEx]);
          setExpandedExercise('ex1');
          setSets({
            'ex1': Array.from({length: 3}).map((_, i) => ({
              id: `temp-ex1-${i}`, exerciseId: 'ex1', orderIndex: i, weight: 0, reps: 10, isCompleted: false, isWarmup: false
            }))
          });
          setLoading(false);
          
          timer = setInterval(() => {
            setElapsedSeconds(s => s + 1);
          }, 1000);
          return;
        }

        const workoutRepo = new WorkoutRepository(db);
        const planRepo = new PlanRepository(db);
        
        let newSessionId = '';
        let fetchedExercises: ExerciseWithDetails[] = [];
        let dayInfo: WorkoutPlanDay | null = null;

        if (planDayId) {
          const dayWithExercises = await planRepo.getDayWithExercises(planDayId);
          if (dayWithExercises) {
            dayInfo = dayWithExercises;
            fetchedExercises = dayWithExercises.exercises;
            newSessionId = await workoutRepo.startSession(currentUser.id, planDayId, dayWithExercises.planId);
          }
        } else {
          // Ad-hoc workout
          newSessionId = await workoutRepo.startSession(currentUser.id);
        }

        if (!isMounted) return;

        setSessionId(newSessionId);
        setPlanDay(dayInfo);
        setExercises(fetchedExercises);
        
        if (fetchedExercises.length > 0) {
          setExpandedExercise(fetchedExercises[0].id);
        }

        // Initialize sets for each exercise
        const initialSets: Record<string, LocalSet[]> = {};
        for (const ex of fetchedExercises) {
          const defaultCount = ex.defaultSets || 3;
          
          // Try to get previous performance
          const prev = await workoutRepo.getPreviousExercisePerformance(currentUser.id, ex.id);
          
          initialSets[ex.id] = Array.from({ length: defaultCount }).map((_, i) => ({
            id: `temp-${ex.id}-${i}`,
            exerciseId: ex.id,
            orderIndex: i,
            weight: 0,
            reps: ex.defaultReps || 0,
            isCompleted: false,
            isWarmup: false,
            previousWeight: prev?.weight,
            previousReps: prev?.reps,
          }));
        }
        setSets(initialSets);
        setLoading(false);

        // Start elapsed timer
        timer = setInterval(() => {
          setElapsedSeconds(s => s + 1);
        }, 1000);

      } catch (err) {
        console.error('Failed to init workout:', err);
        setLoading(false);
      }
    };

    initWorkout();

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
    };
  }, [isReady, db, currentUser, planDayId]);

  const handleAddSet = (exerciseId: string) => {
    setSets(prev => {
      const exSets = prev[exerciseId] || [];
      const newIndex = exSets.length;
      
      // Copy weight/reps from last set if exists
      const lastSet = newIndex > 0 ? exSets[newIndex - 1] : null;
      
      const newSet: LocalSet = {
        id: `temp-${exerciseId}-${newIndex}`,
        exerciseId,
        orderIndex: newIndex,
        weight: lastSet ? lastSet.weight : 0,
        reps: lastSet ? lastSet.reps : 0,
        isCompleted: false,
        isWarmup: false,
        previousWeight: lastSet?.previousWeight,
        previousReps: lastSet?.previousReps,
      };
      
      return { ...prev, [exerciseId]: [...exSets, newSet] };
    });
  };

  const handleRemoveSet = (exerciseId: string, setId: string) => {
    // In a real app we'd call repo.removeSet if the ID isn't temp
    setSets(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].filter(s => s.id !== setId).map((s, idx) => ({ ...s, orderIndex: idx }))
    }));
  };

  const handleToggleSet = async (exerciseId: string, setId: string, weight: number, reps: number, isCompleted: boolean) => {
    if (!sessionId) return;
    
    setSets(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map(s => {
        if (s.id === setId) {
          return { ...s, weight, reps, isCompleted };
        }
        return s;
      })
    }));

    // If we're on the web with mock DB, just start the rest timer if completed and return
    if (!db) {
      if (isCompleted) {
        setRestTimerSeconds(90);
      }
      return;
    }

    try {
      const repo = new WorkoutRepository(db);
      const targetSet = sets[exerciseId].find(s => s.id === setId);
      if (!targetSet) return;

      if (isCompleted) {
        // If it's a temp ID, log a new set
        if (targetSet.id.startsWith('temp-')) {
          const dbId = await repo.logSet(sessionId, exerciseId, targetSet.orderIndex, weight, reps, targetSet.isWarmup);
          // Update temp ID to real DB ID
          setSets(prev => ({
            ...prev,
            [exerciseId]: prev[exerciseId].map(s => s.id === setId ? { ...s, id: dbId } : s)
          }));
        } else {
          // Update existing
          await repo.updateSetComplete(targetSet.id, true, weight, reps);
        }
        
        // Start rest timer (e.g. 90 seconds)
        setRestTimerSeconds(90);
      } else {
        if (!targetSet.id.startsWith('temp-')) {
          await repo.updateSetComplete(targetSet.id, false, weight, reps);
        }
      }
    } catch (err) {
      console.error('Failed to toggle set:', err);
    }
  };

  const handleCancel = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to cancel this workout?');
      if (confirmed && sessionId) {
        if (db) new WorkoutRepository(db).cancelSession(sessionId);
        router.back();
      }
    } else {
      Alert.alert('Cancel Workout', 'Are you sure you want to cancel this workout? Data will not be saved.', [
        { text: 'Keep Going', style: 'cancel' },
        { 
          text: 'Cancel Workout', 
          style: 'destructive',
          onPress: async () => {
            if (sessionId) {
              if (db) await new WorkoutRepository(db).cancelSession(sessionId);
              router.back();
            }
          }
        }
      ]);
    }
  };

  const handleFinish = async () => {
    if (!sessionId) return;
    try {
      if (db) {
        const repo = new WorkoutRepository(db);
        await repo.finishSession(sessionId);
      }
      router.replace({ pathname: '/workout/summary', params: { sessionId } });
    } catch (err) {
      console.error('Failed to finish session:', err);
    }
  };

  // Calculations
  const stats = useMemo(() => {
    let totalVolume = 0;
    let completedSets = 0;
    Object.values(sets).flat().forEach(s => {
      if (s.isCompleted) {
        completedSets++;
        totalVolume += (s.weight * s.reps);
      }
    });
    return { totalVolume, completedSets };
  }, [sets]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isReady || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const headerTitle = planDay ? planDay.name : 'Ad-hoc Workout';
  const targetMuscles = planDay && planDay.targetMuscleGroups.length > 0
    ? planDay.targetMuscleGroups.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')
    : 'Custom focus';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={handleCancel}>
          <Ionicons name="chevron-down" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Text style={styles.headerSubtitle}>{targetMuscles}</Text>
        </View>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="ellipsis-horizontal" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Exercise List ── */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {exercises.map((ex, exIdx) => {
          const exSets = sets[ex.id] || [];
          const isExpanded = expandedExercise === ex.id;
          
          return (
            <View key={ex.id} style={styles.exerciseCard}>
              {/* Exercise Header */}
              <TouchableOpacity 
                style={styles.exerciseHeader}
                onPress={() => setExpandedExercise(isExpanded ? null : ex.id)}
                activeOpacity={0.7}
              >
                <View style={styles.exerciseHeaderLeft}>
                  <Text style={styles.exerciseOrder}>{exIdx + 1}</Text>
                  <View>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseMuscle}>
                      {ex.primaryMuscleGroup.charAt(0).toUpperCase() + ex.primaryMuscleGroup.slice(1)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.infoButton}>
                  <Ionicons name="information-circle-outline" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Sets List */}
              {isExpanded && (
                <View style={styles.setsContainer}>
                  <View style={styles.setsHeaderRow}>
                    <Text style={styles.columnHeader}>Set</Text>
                    <Text style={[styles.columnHeader, { flex: 1, textAlign: 'center' }]}>Previous</Text>
                    <Text style={[styles.columnHeader, { width: 60, textAlign: 'center' }]}>kg</Text>
                    <Text style={[styles.columnHeader, { width: 60, textAlign: 'center' }]}>Reps</Text>
                    <View style={{ width: 32, marginLeft: Spacing.xs }} />
                  </View>

                  {exSets.map((s, i) => (
                    <SetRow
                      key={s.id}
                      setNumber={i + 1}
                      initialWeight={s.weight}
                      initialReps={s.reps}
                      isWarmup={s.isWarmup}
                      isCompleted={s.isCompleted}
                      previousWeight={s.previousWeight}
                      previousReps={s.previousReps}
                      onToggleComplete={(w, r, completed) => handleToggleSet(ex.id, s.id, w, r, completed)}
                      onRemove={() => handleRemoveSet(ex.id, s.id)}
                    />
                  ))}

                  <TouchableOpacity style={styles.addSetButton} onPress={() => handleAddSet(ex.id)}>
                    <Ionicons name="add" size={16} color={Colors.primary} />
                    <Text style={styles.addSetText}>Add Set</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {/* Add Exercise Placeholder */}
        <TouchableOpacity style={styles.addExerciseButton}>
          <Ionicons name="add" size={20} color={Colors.primary} />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>
        
        {/* Extra padding to prevent sticky footer from covering content */}
        <View style={{ height: 120 }} /> 
      </ScrollView>

      {/* ── Sticky Rest Timer ── */}
      {restTimerSeconds > 0 && (
        <RestTimer 
          initialSeconds={restTimerSeconds} 
          onFinish={() => setRestTimerSeconds(0)} 
          onSkip={() => setRestTimerSeconds(0)} 
        />
      )}

      {/* ── Sticky Footer ── */}
      <View style={styles.footer}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.statValue}>{formatTime(elapsedSeconds)}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="barbell-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.statValue}>{stats.totalVolume} kg</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="checkmark-done-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.statValue}>{stats.completedSets} Sets</Text>
          </View>
        </View>
        <Button 
          title="Finish Workout" 
          onPress={handleFinish} 
          disabled={stats.completedSets === 0}
          style={{ width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
}

// Ensure Platform is imported
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary },
  headerSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceHighlight,
  },
  exerciseHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  exerciseOrder: {
    ...Typography.h2,
    color: Colors.primaryMuted,
    width: 24,
    textAlign: 'center',
  },
  exerciseName: { ...Typography.labelMedium, color: Colors.textPrimary },
  exerciseMuscle: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2 },
  infoButton: { padding: Spacing.xs },
  setsContainer: { paddingVertical: Spacing.sm },
  setsHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  columnHeader: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  addSetText: { ...Typography.labelSmall, color: Colors.primary },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  addExerciseText: { ...Typography.labelMedium, color: Colors.primary },
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { ...Typography.labelMedium, color: Colors.textPrimary },
});
