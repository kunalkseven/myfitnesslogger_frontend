/**
 * MuscleMemory — Home Screen
 * Today's workout, streak, quick stats, and recent workouts.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme';
import { Card, StatCard, Button, EmptyState } from '../../src/components';
import { useDatabase } from '../../src/database/DatabaseProvider';
import { PlanRepository, WorkoutRepository } from '../../src/database/repositories';
import { WorkoutPlan, WorkoutPlanDay } from '../../src/models';
import { useUser } from '@clerk/clerk-expo';

const GUEST_USER = { id: 'guest_user', firstName: 'Guest' };

export default function HomeScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const currentUser = clerkUser || GUEST_USER;
  const { db, isReady } = useDatabase();
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [todayDay, setTodayDay] = useState<WorkoutPlanDay | null>(null);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [adherence, setAdherence] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!db || !currentUser || !currentUser.id) return;
    const planRepo = new PlanRepository(db);
    const workoutRepo = new WorkoutRepository(db);

    const plan = await planRepo.getActive();
    setActivePlan(plan);

    if (plan) {
      const days = await planRepo.getDaysForPlan(plan.id);
      const dayIndex = new Date().getDay(); // 0=Sun
      // Cycle through plan days based on current day
      const todayIdx = dayIndex % days.length;
      const day = days[todayIdx] || days[0];
      setTodayDay(day);
      const count = await planRepo.getExerciseCountForDay(day.id);
      setExerciseCount(count);
    }

    setWeeklyCount(await workoutRepo.getWeeklyCount());
    const stats = await workoutRepo.getStreakAndAdherence(currentUser.id);
    setStreak(stats.streak);
    setAdherence(stats.adherence);
  }, [db, currentUser]);

  useEffect(() => {
    if (isReady) loadData();
  }, [isReady, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Setting up your gym...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()} 💪
            </Text>
            <Text style={styles.subtitle}>Ready to crush it today?</Text>
          </View>
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.push('/schedule')}>
            <Ionicons name="calendar-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Today's Workout Card ── */}
        <Card variant="highlighted" glowColor={Colors.primary} style={styles.todayCard}>
          {todayDay ? (
            <>
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>TODAY'S WORKOUT</Text>
              </View>
              <Text style={styles.todayTitle}>{todayDay.name}</Text>
              <View style={styles.todayMeta}>
                <View style={styles.todayMetaItem}>
                  <Ionicons name="body" size={16} color={Colors.primary} />
                  <Text style={styles.todayMetaText}>
                    {todayDay.targetMuscleGroups.map(m => 
                      m.charAt(0).toUpperCase() + m.slice(1)
                    ).join(', ')}
                  </Text>
                </View>
                <View style={styles.todayMetaItem}>
                  <Ionicons name="barbell-outline" size={16} color={Colors.primary} />
                  <Text style={styles.todayMetaText}>{exerciseCount} exercises</Text>
                </View>
              </View>
              <Button
                title="Start Workout"
                onPress={() => router.push({ pathname: '/workout/active', params: { planDayId: todayDay.id } })}
                variant="primary"
                size="lg"
                icon="play"
                fullWidth
                style={styles.startButton}
              />
            </>
          ) : (
            <>
              <View style={styles.restDayIcon}>
                <Ionicons name="moon" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.restDayTitle}>Rest Day</Text>
              <Text style={styles.restDaySubtitle}>
                Recovery is part of the process. Come back stronger tomorrow!
              </Text>
              <Button
                title="Start Ad-hoc Workout"
                onPress={() => router.push('/workout/active')}
                variant="secondary"
                size="md"
                icon="add"
                style={styles.adhocButton}
              />
            </>
          )}
        </Card>

        {/* ── Quick Stats ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <TouchableOpacity onPress={() => router.push('/schedule')}>
            <Text style={{ ...Typography.labelMedium, color: Colors.primary }}>View Schedule</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsRow}>
          <StatCard
            value={streak}
            label="Day Streak"
            icon="flame"
            iconColor={Colors.warning}
          />
          <View style={{ width: Spacing.md }} />
          <StatCard
            value={weeklyCount}
            label="Workouts"
            icon="fitness"
            iconColor={Colors.success}
          />
          <View style={{ width: Spacing.md }} />
          <StatCard
            value={`${adherence}%`}
            label="Adherence"
            icon="checkmark-circle"
            iconColor={Colors.info}
          />
        </View>

        {/* ── Active Plan Info ── */}
        {activePlan && (
          <>
            <Text style={styles.sectionTitle}>Active Plan</Text>
            <Card variant="default" style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{activePlan.name}</Text>
                  <Text style={styles.planMeta}>
                    {activePlan.trainingDaysPerWeek} days/week • {formatSplitType(activePlan.splitType)}
                  </Text>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              </View>
            </Card>
          </>
        )}

        {/* ── Recent Workouts Placeholder ── */}
        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        <EmptyState
          icon="barbell-outline"
          title="No workouts yet"
          subtitle="Start your first workout to see your history here. Every rep counts!"
          actionTitle="Start Training"
          onAction={() => {}}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function formatSplitType(type: string): string {
  const map: Record<string, string> = {
    ppl: 'Push Pull Legs',
    full_body: 'Full Body',
    upper_lower: 'Upper Lower',
    one_muscle_per_day: 'One Muscle/Day',
    ppl_upper_lower: 'PPL + Upper/Lower',
    custom: 'Custom',
  };
  return map[type] || type;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingTop: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.lg,
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  greeting: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Today's Workout
  todayCard: {
    marginBottom: Spacing.xxl,
    paddingVertical: Spacing.xl,
  },
  todayBadge: {
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  todayBadgeText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  todayTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  todayMeta: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  todayMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  todayMetaText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  startButton: {
    marginTop: Spacing.sm,
  },

  // Rest Day
  restDayIcon: {
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  restDayTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  restDaySubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  adhocButton: {
    alignSelf: 'center',
  },

  // Stats
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xxl,
  },

  // Plan
  planCard: {
    marginBottom: Spacing.xxl,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  planMeta: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  activeBadge: {
    backgroundColor: Colors.successMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  activeBadgeText: {
    ...Typography.labelSmall,
    color: Colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
});
