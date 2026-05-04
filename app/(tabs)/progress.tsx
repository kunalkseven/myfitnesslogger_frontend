/**
 * MuscleMemory — Progress Screen
 * Real analytics including volume distribution, 1RM trends, and summary stats.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme';
import { Card, StatCard, Button } from '../../src/components';
import { useDatabase } from '../../src/database/DatabaseProvider';
import { WorkoutRepository, ExerciseRepository } from '../../src/database/repositories';
import { useUser } from '@clerk/clerk-expo';

const GUEST_USER = { id: 'guest_user' };

export default function ProgressScreen() {
  const router = useRouter();
  const { db, isReady } = useDatabase();
  const { user: clerkUser } = useUser();
  const currentUser = clerkUser || GUEST_USER;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [weeklyCount, setWeeklyCount] = useState(0);
  
  // 1RM Trends State
  const [keyLifts, setKeyLifts] = useState<{ id: string, name: string }[]>([]);
  const [selectedLiftId, setSelectedLiftId] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<{ date: string, estimated1RM: number }[]>([]);

  const loadData = useCallback(async () => {
    if (!db || !currentUser) {
      setLoading(false);
      return;
    }
    try {
      const workoutRepo = new WorkoutRepository(db);
      const exRepo = new ExerciseRepository(db);

      const [summaryData, weekCount] = await Promise.all([
        workoutRepo.getAnalyticsSummary(currentUser.id),
        workoutRepo.getWeeklyCount(),
      ]);

      setSummary(summaryData);
      setWeeklyCount(weekCount);

      // Fetch potential key lifts (Squat, Bench Press, Deadlift, Overhead Press)
      const allEx = await exRepo.getAll();
      const bigLifts = allEx.filter(e => 
        e.name.toLowerCase().includes('bench press') ||
        e.name.toLowerCase().includes('squat') ||
        e.name.toLowerCase().includes('deadlift') ||
        e.name.toLowerCase().includes('overhead press')
      );
      
      if (bigLifts.length > 0) {
        setKeyLifts(bigLifts);
        setSelectedLiftId(bigLifts[0].id);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [db, currentUser]);

  useEffect(() => {
    if (isReady) loadData();
  }, [isReady, loadData]);

  // Load trend data when selected lift changes
  useEffect(() => {
    const loadTrend = async () => {
      if (!db || !currentUser || !selectedLiftId) return;
      const workoutRepo = new WorkoutRepository(db);
      const trends = await workoutRepo.getExercise1RMTrends(currentUser.id, selectedLiftId);
      setTrendData(trends);
    };
    if (isReady) loadTrend();
  }, [db, currentUser, selectedLiftId, isReady]);

  if (!isReady || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Calculate max volume for relative bar scaling
  const maxVolume = summary?.muscleDistribution?.length 
    ? Math.max(...summary.muscleDistribution.map((m: any) => m.volume)) 
    : 1;

  // Calculate max 1RM for relative chart scaling
  const max1RM = trendData.length 
    ? Math.max(...trendData.map(t => t.estimated1RM))
    : 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenTitle}>Progress</Text>
            <Text style={styles.screenSubtitle}>Track your strength journey</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/history')} style={styles.historyBtn}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
            <Text style={styles.historyBtnText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* ── Summary Stats ── */}
        <View style={styles.statsRow}>
          <StatCard value={summary?.totalWorkouts || 0} label="Total Workouts" icon="fitness" iconColor={Colors.primary} compact />
          <View style={{ width: Spacing.md }} />
          <StatCard value={weeklyCount} label="This Week" icon="calendar" iconColor={Colors.success} compact />
        </View>

        {/* ── Top Exercises ── */}
        {summary?.topExercises?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Performed Exercises</Text>
            <View style={styles.topExercisesWrapper}>
              {summary.topExercises.map((ex: any, idx: number) => (
                <View key={ex.name} style={styles.topExRow}>
                  <Text style={styles.topExRank}>{idx + 1}</Text>
                  <Text style={styles.topExName}>{ex.name}</Text>
                  <Text style={styles.topExCount}>{ex.count} sessions</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Muscle Distribution ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Volume by Muscle Group</Text>
          <Card variant="default" style={styles.chartCard}>
            {summary?.muscleDistribution?.length > 0 ? (
              summary.muscleDistribution.map((item: any) => {
                const percentage = Math.max((item.volume / maxVolume) * 100, 2); // At least 2% so it's visible
                return (
                  <View key={item.muscle} style={styles.distRow}>
                    <Text style={styles.distLabel} numberOfLines={1}>
                      {item.muscle.charAt(0).toUpperCase() + item.muscle.slice(1)}
                    </Text>
                    <View style={styles.distBarTrack}>
                      <View style={[styles.distBarFill, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.distValue}>{Math.round(item.volume)} lbs</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No volume data yet.</Text>
            )}
          </Card>
        </View>

        {/* ── 1RM Trends ── */}
        {keyLifts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estimated 1RM Trends</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.liftTabs}>
              {keyLifts.map(lift => (
                <TouchableOpacity 
                  key={lift.id} 
                  style={[styles.liftTab, selectedLiftId === lift.id && styles.liftTabActive]}
                  onPress={() => setSelectedLiftId(lift.id)}
                >
                  <Text style={[styles.liftTabText, selectedLiftId === lift.id && styles.liftTabTextActive]}>
                    {lift.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Card variant="default" style={styles.chartCard}>
              {trendData.length > 0 ? (
                <View style={styles.trendChart}>
                  {trendData.map((point, idx) => {
                    const heightPercent = Math.max((point.estimated1RM / max1RM) * 100, 5);
                    return (
                      <View key={`${point.date}-${idx}`} style={styles.trendCol}>
                        <Text style={styles.trendValue}>{Math.round(point.estimated1RM)}</Text>
                        <View style={styles.trendBarTrack}>
                          <View style={[styles.trendBarFill, { height: `${heightPercent}%` }]} />
                        </View>
                        <Text style={styles.trendDate}>
                          {new Date(point.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyText}>No 1RM data for this lift yet.</Text>
              )}
            </Card>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  content: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: Spacing.lg },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  screenTitle: { ...Typography.h1, color: Colors.textPrimary },
  screenSubtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, marginTop: Spacing.xxs },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceHighlight, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  historyBtnText: { ...Typography.labelMedium, color: Colors.primary },
  
  statsRow: { flexDirection: 'row', marginBottom: Spacing.xl },
  
  section: { marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.md },
  
  topExercisesWrapper: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  topExRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceHighlight },
  topExRank: { ...Typography.labelMedium, color: Colors.primary, width: 24 },
  topExName: { flex: 1, ...Typography.bodyMedium, color: Colors.textPrimary },
  topExCount: { ...Typography.caption, color: Colors.textSecondary },
  
  chartCard: { padding: Spacing.lg },
  emptyText: { ...Typography.bodyMedium, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.xl },
  
  distRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  distLabel: { width: 80, ...Typography.caption, color: Colors.textSecondary },
  distBarTrack: { flex: 1, height: 12, backgroundColor: Colors.surfaceHighlight, borderRadius: 6, marginHorizontal: Spacing.sm, overflow: 'hidden' },
  distBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 6 },
  distValue: { width: 50, ...Typography.caption, color: Colors.textPrimary, textAlign: 'right' },
  
  liftTabs: { flexDirection: 'row', marginBottom: Spacing.md },
  liftTab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  liftTabActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  liftTabText: { ...Typography.labelMedium, color: Colors.textSecondary },
  liftTabTextActive: { color: Colors.primary },
  
  trendChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 160, paddingTop: 20 },
  trendCol: { alignItems: 'center', flex: 1 },
  trendBarTrack: { width: 16, height: 100, backgroundColor: Colors.surfaceHighlight, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end', marginVertical: 8 },
  trendBarFill: { width: '100%', backgroundColor: Colors.success, borderRadius: 8 },
  trendValue: { ...Typography.caption, color: Colors.textPrimary, fontSize: 10, fontWeight: '700' },
  trendDate: { ...Typography.caption, color: Colors.textTertiary, fontSize: 9 },
});
