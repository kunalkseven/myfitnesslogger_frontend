/**
 * MuscleMemory — Workout Summary Screen
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme';
import { useDatabase } from '../../src/database/DatabaseProvider';
import { WorkoutRepository } from '../../src/database/repositories';
import { WorkoutSessionWithSets } from '../../src/models';
import { Button, StatCard } from '../../src/components';

export default function WorkoutSummaryScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { db, isReady } = useDatabase();
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<WorkoutSessionWithSets | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isReady || !sessionId) return;
    
    const loadSession = async () => {
      if (!db) {
        // Web fallback: mock data
        setSession({
          id: 'mock-session', userId: 'user', planId: null, planDayId: null,
          date: new Date().toISOString(), startTime: new Date(Date.now() - 3600000).toISOString(),
          endTime: new Date().toISOString(), status: 'completed', notes: '', createdAt: new Date().toISOString(),
          sets: [
            { id: '1', sessionId: 'mock-session', exerciseId: 'ex1', orderIndex: 0, weight: 50, reps: 10, rpe: null, side: 'both', isWarmup: false, isCompleted: true, timestamp: new Date().toISOString(), exerciseName: 'Bench Press' }
          ],
          totalVolume: 500,
          exerciseCount: 1,
        });
        setLoading(false);
        return;
      }

      const repo = new WorkoutRepository(db);
      const data = await repo.getSessionWithSets(sessionId);
      if (data) {
        setSession(data);
        setNotes(data.notes || '');
      }
      setLoading(false);
    };
    
    loadSession();
  }, [isReady, db, sessionId]);

  useEffect(() => {
    if (!loading && session) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [loading, session]);

  const handleSave = async () => {
    if (db && session && notes !== session.notes) {
      const repo = new WorkoutRepository(db);
      await repo.finishSession(session.id, notes);
    }
    // Return to root layout to unmount workout stack
    router.dismissAll();
    router.replace('/(tabs)');
  };

  const getDurationString = () => {
    if (!session || !session.endTime) return '0m';
    const start = new Date(session.startTime).getTime();
    const end = new Date(session.endTime).getTime();
    const mins = Math.round((end - start) / 60000);
    return `${mins}m`;
  };

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
        <Text style={{ color: Colors.textSecondary }}>Workout not found.</Text>
        <Button title="Go Home" onPress={() => router.replace('/(tabs)')} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const completedSets = session.sets.filter(s => s.isCompleted).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        
        {/* Header Illustration / Icon */}
        <Animated.View entering={ZoomIn.duration(600).springify()} style={styles.headerIconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="trophy" size={48} color={Colors.success} />
          </View>
          <Text style={styles.title}>Workout Complete!</Text>
          <Text style={styles.subtitle}>{new Date(session.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.statsGrid}>
          <StatCard 
            label="Volume" 
            value={`${session.totalVolume || 0} lbs`} 
            icon="barbell-outline"
            style={{ flex: 1 }}
          />
          <StatCard 
            label="Time" 
            value={getDurationString()} 
            icon="time-outline"
            style={{ flex: 1 }}
          />
        </Animated.View>
        
        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.statsGrid}>
          <StatCard 
            label="Exercises" 
            value={session.exerciseCount?.toString() || '0'} 
            icon="list-outline"
            style={{ flex: 1 }}
          />
          <StatCard 
            label="Sets" 
            value={completedSets.toString()} 
            icon="checkmark-done-outline"
            style={{ flex: 1 }}
          />
        </Animated.View>

        {/* Notes Input */}
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Session Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="How did it feel? Any PRs?"
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <Button 
          title="Save & Return Home" 
          onPress={handleSave} 
          style={styles.saveButton} 
        />
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { padding: Layout.screenPaddingHorizontal, gap: Spacing.lg, paddingBottom: 60 },
  headerIconContainer: { alignItems: 'center', marginVertical: Spacing.lg },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${Colors.success}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: { ...Typography.h1, color: Colors.textPrimary },
  subtitle: { ...Typography.bodyMedium, color: Colors.textTertiary, marginTop: Spacing.xs },
  statsGrid: { flexDirection: 'row', gap: Spacing.md },
  notesContainer: { marginTop: Spacing.md },
  notesLabel: { ...Typography.labelMedium, color: Colors.textPrimary, marginBottom: Spacing.sm },
  notesInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    ...Typography.bodyMedium,
    minHeight: 120,
  },
  saveButton: { marginTop: Spacing.xl },
});
