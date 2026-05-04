/**
 * MuscleMemory — Plans Screen
 * Active plan, plan library, and plan detail views.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme';
import { Card, Button, EmptyState } from '../../src/components';
import { useDatabase } from '../../src/database/DatabaseProvider';
import { PlanRepository } from '../../src/database/repositories';
import { WorkoutPlan } from '../../src/models';

const GUEST_USER = { id: 'guest_user', firstName: 'Guest' };

export default function PlansScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const currentUser = clerkUser || GUEST_USER;
  const { db, isReady } = useDatabase();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlans = useCallback(async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    const repo = new PlanRepository(db);
    const allPlans = await repo.getAll();
    setPlans(allPlans);
    setLoading(false);
  }, [db]);

  useEffect(() => {
    if (isReady) loadPlans();
  }, [isReady, loadPlans]);

  const handleSelectPlan = (planId: string) => {
    router.push({ pathname: '/plan/[id]', params: { id: planId } });
  };

  if (!isReady || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const activePlan = plans.find(p => p.isActive);
  const customPlans = plans.filter(p => !p.isActive && !p.isBuiltIn);
  const templates = plans.filter(p => !p.isActive && p.isBuiltIn);

  const handleAddPlan = () => {
    Alert.alert(
      'New Workout Plan',
      'Choose how you want to start',
      [
        { text: 'Create from Scratch', onPress: () => handleCreateNew() },
        { text: 'Choose from Templates', onPress: () => {} }, // They are already listed
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleCreateNew = async () => {
    if (!db || !currentUser) return;
    try {
      const repo = new PlanRepository(db);
      const newId = await repo.createNewPlan(currentUser.id, 'My New Plan');
      router.push({ pathname: '/plan/edit/[id]', params: { id: newId } });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create plan');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Plans</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddPlan}>
            <Ionicons name="add" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Active Plan ── */}
        {activePlan && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACTIVE PLAN</Text>
            <Card
              variant="highlighted"
              glowColor={Colors.primary}
              onPress={() => handleSelectPlan(activePlan.id)}
              style={styles.planCard}
            >
              <View style={styles.planRow}>
                <View style={styles.planIcon}>
                  <Ionicons name="trophy" size={24} color={Colors.primary} />
                </View>
                <View style={styles.planInfo}>
                  <View style={styles.planNameRow}>
                    <Text style={styles.planName}>{activePlan.name}</Text>
                  </View>
                  <Text style={styles.planDescription} numberOfLines={2}>
                    {activePlan.description}
                  </Text>
                  <View style={styles.planMeta}>
                    <View style={styles.metaChip}>
                      <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>{activePlan.trainingDaysPerWeek} days/week</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Ionicons name="layers-outline" size={12} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>{formatSplit(activePlan.splitType)}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
              </View>
            </Card>
          </View>
        )}

        {/* ── My Custom Plans ── */}
        {(customPlans.length > 0 || !activePlan) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MY CUSTOM PLANS</Text>
            {customPlans.length === 0 ? (
              <EmptyState
                icon="documents-outline"
                title="No custom plans"
                subtitle="Duplicate a template or create one from scratch."
                style={{ paddingVertical: Spacing.xl }}
              />
            ) : (
              customPlans.map(plan => (
                <Card
                  key={plan.id}
                  variant="default"
                  onPress={() => handleSelectPlan(plan.id)}
                  style={styles.planCard}
                >
                  <View style={styles.planRow}>
                    <View style={[styles.planIcon, { backgroundColor: Colors.surfaceHighlight }]}>
                      <Ionicons name="create-outline" size={22} color={Colors.textSecondary} />
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planDescription} numberOfLines={1}>
                        {plan.description || 'No description'}
                      </Text>
                      <View style={styles.planMeta}>
                        <View style={styles.metaChip}>
                          <Text style={styles.metaText}>{plan.trainingDaysPerWeek} days/week</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* ── Templates ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DEFAULT TEMPLATES</Text>
          {templates.map(plan => (
            <Card
              key={plan.id}
              variant="default"
              onPress={() => handleSelectPlan(plan.id)}
              style={styles.planCard}
            >
              <View style={styles.planRow}>
                <View style={[styles.planIcon, { backgroundColor: Colors.primaryMuted }]}>
                  <Ionicons name="star" size={22} color={Colors.primary} />
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDescription} numberOfLines={1}>
                    {plan.description}
                  </Text>
                  <View style={styles.planMeta}>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaText}>{plan.trainingDaysPerWeek} days/week</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaText}>{formatSplit(plan.splitType)}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
              </View>
            </Card>
          ))}
        </View>

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
  content: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: Spacing.lg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xxl },
  title: { ...Typography.h1, color: Colors.textPrimary },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...Typography.labelSmall, color: Colors.textTertiary, marginBottom: Spacing.md, fontSize: 11, letterSpacing: 1 },
  section: { marginBottom: Spacing.xl },
  planCard: { marginBottom: Spacing.md },
  planRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  planIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryGlow, alignItems: 'center', justifyContent: 'center' },
  planInfo: { flex: 1 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  planName: { ...Typography.h3, color: Colors.textPrimary },
  planDescription: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing.xxs },
  planMeta: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceHighlight, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.xs },
  metaText: { ...Typography.caption, color: Colors.textSecondary },
  activeBadge: { backgroundColor: Colors.successMuted, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  activeBadgeText: { ...Typography.caption, color: Colors.success, fontWeight: '700', fontSize: 9 },
  daysContainer: { marginTop: Spacing.lg, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  dayRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  dayNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryGlow, alignItems: 'center', justifyContent: 'center' },
  dayNumberText: { ...Typography.labelMedium, color: Colors.primary, fontSize: 12 },
  dayInfo: { flex: 1 },
  dayName: { ...Typography.labelMedium, color: Colors.textPrimary },
  dayMuscles: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2 },
  dayExCount: { ...Typography.caption, color: Colors.textSecondary },
  activateButton: { marginTop: Spacing.md, alignSelf: 'flex-start' },
});
