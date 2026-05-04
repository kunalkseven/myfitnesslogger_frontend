/**
 * MuscleMemory — History Session Detail Screen
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme';
import { Button } from '../../src/components';
import { useDatabase } from '../../src/database/DatabaseProvider';
import { WorkoutRepository, PlanRepository } from '../../src/database/repositories';
import { WorkoutSessionWithSets, Exercise } from '../../src/models';

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { db, isReady } = useDatabase();
  
  const [session, setSession] = useState<WorkoutSessionWithSets | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const [dayName, setDayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    if (!db || !id) return;
    try {
      const workoutRepo = new WorkoutRepository(db);
      const planRepo = new PlanRepository(db);
      
      const sessionData = await workoutRepo.getSessionWithSets(id);
      setSession(sessionData);

      if (sessionData && sessionData.planId && sessionData.planDayId) {
        const plans = await planRepo.getAll();
        const plan = plans.find(p => p.id === sessionData.planId);
        if (plan) setPlanName(plan.name);
        
        const days = await planRepo.getDaysForPlan(sessionData.planId);
        const day = days.find(d => d.id === sessionData.planDayId);
        if (day) setDayName(day.name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useEffect(() => {
    if (isReady) loadSession();
  }, [isReady, loadSession]);

  if (!isReady || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: Colors.textSecondary }}>Session not found.</Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Calculate volume
  const totalVolume = (session as any).exercises.reduce((sum: number, ex: any) => {
    return sum + ex.sets.reduce((sSum: number, set: any) => set.isCompleted && !set.isWarmup ? sSum + (set.weight * set.reps) : sSum, 0);
  }, 0);

  const completedSetsCount = (session as any).exercises.reduce((sum: number, ex: any) => sum + ex.sets.filter((s: any) => s.isCompleted && !s.isWarmup).length, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Button variant="ghost" icon="arrow-back" onPress={() => router.back()} />
        <Text style={styles.headerTitle} numberOfLines={1}>Workout Summary</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.dateText}>{formatDate(session.date)}</Text>
          <Text style={styles.planTitle}>{planName ? `${planName}: ${dayName}` : 'Ad-hoc Workout'}</Text>
          
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.timeText}>{formatTime(session.startTime)} - {formatTime(session.endTime)}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{(session as any).exercises.length}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{completedSetsCount}</Text>
              <Text style={styles.statLabel}>Sets</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalVolume} <Text style={{ fontSize: 10, color: Colors.textTertiary }}>lbs</Text></Text>
              <Text style={styles.statLabel}>Volume</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Exercises</Text>

        {(session as any).exercises.map((ex: any, exIdx: number) => (
          <View key={ex.exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseNumber}>
                <Text style={styles.exerciseNumberText}>{exIdx + 1}</Text>
              </View>
              <View style={styles.exerciseTitleBox}>
                <Text style={styles.exerciseName}>{ex.exercise.name}</Text>
                <Text style={styles.exerciseMuscles}>{ex.exercise.primaryMuscleGroup}</Text>
              </View>
            </View>

            <View style={styles.setsHeader}>
              <Text style={styles.setColHeader}>SET</Text>
              <Text style={styles.setColHeader}>LBS</Text>
              <Text style={styles.setColHeader}>REPS</Text>
              <View style={{ width: 24 }} />
            </View>

            {ex.sets.map((set: any, setIdx: number) => (
              <View 
                key={set.id} 
                style={[
                  styles.setRow, 
                  !set.isCompleted && { opacity: 0.5 },
                  set.isWarmup && { backgroundColor: Colors.surface }
                ]}
              >
                <Text style={styles.setText}>
                  {set.isWarmup ? 'W' : setIdx + 1}
                </Text>
                <Text style={styles.setText}>{set.weight}</Text>
                <Text style={styles.setText}>{set.reps}</Text>
                <Ionicons 
                  name={set.isCompleted ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={20} 
                  color={set.isCompleted ? Colors.success : Colors.textTertiary} 
                />
              </View>
            ))}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  content: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingBottom: Spacing.xxl },
  
  summaryBox: { alignItems: 'center', marginVertical: Spacing.lg },
  dateText: { ...Typography.labelMedium, color: Colors.primary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  planTitle: { ...Typography.h1, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xl },
  timeText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  
  statsContainer: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  statBox: { flex: 1, backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statValue: { ...Typography.h2, color: Colors.textPrimary, marginBottom: 2 },
  statLabel: { ...Typography.caption, color: Colors.textSecondary },

  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.lg },
  
  exerciseCard: { backgroundColor: Colors.surfaceHighlight, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  exerciseNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryGlow, alignItems: 'center', justifyContent: 'center' },
  exerciseNumberText: { ...Typography.labelMedium, color: Colors.primary, fontSize: 12 },
  exerciseTitleBox: { flex: 1 },
  exerciseName: { ...Typography.h3, color: Colors.textPrimary },
  exerciseMuscles: { ...Typography.caption, color: Colors.textTertiary, textTransform: 'capitalize', marginTop: 2 },

  setsHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.md, marginBottom: Spacing.xs },
  setColHeader: { ...Typography.caption, color: Colors.textSecondary, width: 40, textAlign: 'center' },
  
  setRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.background, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm, marginBottom: 4 },
  setText: { ...Typography.bodyMedium, color: Colors.textPrimary, width: 40, textAlign: 'center' },
});
