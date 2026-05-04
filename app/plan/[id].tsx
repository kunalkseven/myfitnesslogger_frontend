/**
 * MuscleMemory — Plan Detail Screen
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme';
import { Card, Button } from '../../src/components';
import { useDatabase } from '../../src/database/DatabaseProvider';
import { PlanRepository, WorkoutRepository } from '../../src/database/repositories';
import { WorkoutPlanWithDays, WorkoutPlanDay } from '../../src/models';
import { useUser } from '@clerk/clerk-expo';

const GUEST_USER = { id: 'guest_user', firstName: 'Guest' };

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const currentUser = clerkUser || GUEST_USER;
  const { db, isReady } = useDatabase();
  
  const [plan, setPlan] = useState<WorkoutPlanWithDays | null>(null);
  const [planDaysWithCount, setPlanDaysWithCount] = useState<(WorkoutPlanDay & { exerciseCount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlan = useCallback(async () => {
    if (!db || !id) return;
    try {
      const repo = new PlanRepository(db);
      const planData = await repo.getWithDays(id);
      
      if (planData) {
        setPlan(planData);
        // Get exercise counts
        const days = await Promise.all(
          planData.days.map(async (day) => ({
            ...day,
            exerciseCount: await repo.getExerciseCountForDay(day.id),
          }))
        );
        setPlanDaysWithCount(days);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useEffect(() => {
    if (isReady) loadPlan();
  }, [isReady, loadPlan]);

  const handleSetActive = async () => {
    if (!db || !plan || !currentUser) return;
    try {
      const planRepo = new PlanRepository(db);
      await planRepo.setActive(plan.id);

      // Generate schedule from today for the next 4 weeks
      const workoutRepo = new WorkoutRepository(db);
      await workoutRepo.generateSchedule(currentUser.id, plan.id, new Date(), 4);

      Alert.alert('Success', `${plan.name} is now your active plan. Schedule has been updated.`);
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to set active plan');
    }
  };

  const handleDuplicate = async () => {
    if (!db || !plan || !currentUser) return;
    try {
      const repo = new PlanRepository(db);
      const newPlanId = await repo.duplicatePlan(plan.id, currentUser.id);
      Alert.alert('Success', 'Plan duplicated successfully.');
      router.replace({ pathname: '/plan/[id]', params: { id: newPlanId } });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to duplicate plan');
    }
  };

  const handleDelete = async () => {
    if (!db || !plan) return;
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete "${plan.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const repo = new PlanRepository(db);
              await repo.deletePlan(plan.id);
              router.back();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete plan');
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    if (!plan) return;
    router.push({ pathname: '/plan/edit/[id]', params: { id: plan.id } });
  };

  if (!isReady || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: Colors.textSecondary }}>Plan not found.</Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Button
          variant="ghost"
          icon="arrow-back"
          onPress={() => router.back()}
          style={{ width: 44 }}
        />
        <Text style={styles.headerTitle} numberOfLines={1}>Plan Details</Text>
        <View style={{ width: 44 }}>
          {!plan.isBuiltIn && (
            <Button
              variant="ghost"
              icon="trash-outline"
              onPress={handleDelete}
              style={{ width: 44 }}
            />
          )}
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Plan Header Info */}
        <View style={styles.planHeader}>
          <View style={styles.planIconWrapper}>
            <Ionicons 
              name={plan.isBuiltIn ? "star" : "document-text"} 
              size={32} 
              color={Colors.primary} 
            />
          </View>
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.badgeRow}>
            {plan.isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ACTIVE PLAN</Text>
              </View>
            )}
            {plan.isBuiltIn && (
              <View style={[styles.activeBadge, { backgroundColor: Colors.primaryMuted }]}>
                <Text style={[styles.activeBadgeText, { color: Colors.primary }]}>TEMPLATE</Text>
              </View>
            )}
          </View>
          <Text style={styles.planDescription}>{plan.description}</Text>
          
          <View style={styles.planMeta}>
            <View style={styles.metaChip}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{plan.trainingDaysPerWeek} days/week</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="layers-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{formatSplit(plan.splitType)}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {!plan.isActive && (
            <Button
              title="Set as Active Plan"
              onPress={handleSetActive}
              variant="primary"
              icon="checkmark-circle"
              style={styles.actionButton}
            />
          )}
          
          <View style={styles.rowActions}>
            <Button
              title={plan.isBuiltIn ? "Customize Plan" : "Duplicate"}
              onPress={handleDuplicate}
              variant={plan.isBuiltIn ? "primary" : "secondary"}
              icon="copy-outline"
              style={[styles.actionButton, { flex: 1, marginRight: plan.isBuiltIn ? 0 : Spacing.sm }]}
            />
            {!plan.isBuiltIn && (
              <Button
                title="Edit Plan"
                onPress={handleEdit}
                variant="secondary"
                icon="create-outline"
                style={[styles.actionButton, { flex: 1 }]}
              />
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Workout Days</Text>
        {planDaysWithCount.map((day, idx) => (
          <Card key={day.id} variant="default" style={styles.dayCard}>
            <View style={styles.dayRow}>
              <View style={styles.dayNumber}>
                <Text style={styles.dayNumberText}>{idx + 1}</Text>
              </View>
              <View style={styles.dayInfo}>
                <Text style={styles.dayName}>{day.name}</Text>
                <Text style={styles.dayMuscles}>
                  {day.targetMuscleGroups.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}
                </Text>
              </View>
              <Text style={styles.dayExCount}>{day.exerciseCount} exercises</Text>
            </View>
          </Card>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatSplit(type: string): string {
  const map: Record<string, string> = {
    ppl: 'PPL', full_body: 'Full Body', upper_lower: 'Upper/Lower',
    one_muscle_per_day: 'Bro Split', ppl_upper_lower: 'PPL Hybrid', custom: 'Custom',
  };
  return map[type] || type;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  content: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingBottom: Spacing.xxl },
  
  planHeader: { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.md },
  planIconWrapper: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryGlow, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  planName: { ...Typography.h1, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.xs },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  activeBadge: { backgroundColor: Colors.successMuted, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  activeBadgeText: { ...Typography.caption, color: Colors.success, fontWeight: '700', fontSize: 10, letterSpacing: 0.5 },
  planDescription: { ...Typography.bodyMedium, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md, paddingHorizontal: Spacing.lg },
  planMeta: { flexDirection: 'row', gap: Spacing.md },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border },
  metaText: { ...Typography.bodySmall, color: Colors.textPrimary },
  
  actionsContainer: { gap: Spacing.sm },
  rowActions: { flexDirection: 'row' },
  actionButton: { width: '100%' },
  
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xl },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.md },
  
  dayCard: { marginBottom: Spacing.sm, padding: Spacing.md },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dayNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' },
  dayNumberText: { ...Typography.h3, color: Colors.textPrimary },
  dayInfo: { flex: 1 },
  dayName: { ...Typography.h3, color: Colors.textPrimary },
  dayMuscles: { ...Typography.bodySmall, color: Colors.textTertiary, marginTop: 2 },
  dayExCount: { ...Typography.caption, color: Colors.textSecondary },
});
