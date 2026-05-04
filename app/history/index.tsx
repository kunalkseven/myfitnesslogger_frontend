/**
 * MuscleMemory — Workout History Screen
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme';
import { Card, Button, EmptyState } from '../../src/components';
import { useDatabase } from '../../src/database/DatabaseProvider';
import { WorkoutRepository } from '../../src/database/repositories';
import { useUser } from '@clerk/clerk-expo';

const GUEST_USER = { id: 'guest_user' };

type HistorySession = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  planName: string | null;
  dayName: string | null;
  exerciseCount: number;
  totalVolume: number;
  setCount: number;
};

export default function HistoryScreen() {
  const router = useRouter();
  const { db, isReady } = useDatabase();
  const { user: clerkUser } = useUser();
  const currentUser = clerkUser || GUEST_USER;
  
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!db || !currentUser) {
      setLoading(false);
      return;
    }
    try {
      const repo = new WorkoutRepository(db);
      // Fetch the last 50 completed sessions
      const data = await repo.getWorkoutHistory(currentUser.id, 50, 0);
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [db, currentUser]);

  useEffect(() => {
    if (isReady) loadHistory();
  }, [isReady, loadHistory]);

  if (!isReady || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const formatDuration = (start: string, end: string) => {
    if (!start || !end) return '—';
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diffMins = Math.floor((e - s) / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return `${h}h ${m}m`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Button variant="ghost" icon="arrow-back" onPress={() => router.back()} />
        <Text style={styles.headerTitle} numberOfLines={1}>Workout History</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {sessions.length === 0 ? (
          <View style={{ marginTop: Spacing.xxl }}>
            <EmptyState
              icon="time-outline"
              title="No History Yet"
              subtitle="Complete your first workout to see your history here."
              actionTitle="Go to Schedule"
              onAction={() => router.push('/schedule')}
            />
          </View>
        ) : (
          sessions.map((session) => (
            <Card
              key={session.id}
              variant="default"
              style={styles.sessionCard}
              onPress={() => router.push({ pathname: '/history/[id]', params: { id: session.id } })}
            >
              <View style={styles.cardHeader}>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar" size={16} color={Colors.primary} />
                  <Text style={styles.dateText}>{formatDate(session.date)}</Text>
                </View>
                <View style={styles.durationContainer}>
                  <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
                  <Text style={styles.durationText}>{formatDuration(session.startTime, session.endTime)}</Text>
                </View>
              </View>

              <Text style={styles.planName}>
                {session.planName ? `${session.planName}: ${session.dayName}` : 'Ad-hoc Workout'}
              </Text>

              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{session.exerciseCount}</Text>
                  <Text style={styles.statLabel}>Exercises</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{session.setCount}</Text>
                  <Text style={styles.statLabel}>Sets</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{session.totalVolume || 0} <Text style={{ fontSize: 10, color: Colors.textTertiary }}>lbs</Text></Text>
                  <Text style={styles.statLabel}>Volume</Text>
                </View>
              </View>
            </Card>
          ))
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  content: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingBottom: Spacing.xxl, paddingTop: Spacing.md },
  
  sessionCard: { marginBottom: Spacing.md, padding: Spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  dateContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dateText: { ...Typography.labelMedium, color: Colors.textPrimary },
  durationContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  durationText: { ...Typography.caption, color: Colors.textTertiary },
  
  planName: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.lg },
  
  statsContainer: { flexDirection: 'row', gap: Spacing.sm },
  statBox: { flex: 1, backgroundColor: Colors.surfaceHighlight, padding: Spacing.sm, borderRadius: BorderRadius.sm, alignItems: 'center' },
  statValue: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 2 },
  statLabel: { ...Typography.caption, color: Colors.textSecondary },
});
