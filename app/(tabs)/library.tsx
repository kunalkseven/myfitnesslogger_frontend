/**
 * MuscleMemory — Exercise Library Screen
 * Searchable, filterable exercise database.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '../../src/theme';
import { SearchBar, FilterChipGroup, Card, Button } from '../../src/components';
import { useDatabase } from '../../src/database/DatabaseProvider';
import { ExerciseRepository } from '../../src/database/repositories';
import { Exercise, MuscleGroup } from '../../src/models';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'quadriceps', 'hamstrings', 'glutes',
  'shoulders', 'biceps', 'triceps', 'calves', 'core',
];

const EQUIPMENT_ICONS: Record<string, string> = {
  barbell: '🏋️', dumbbell: '💪', machine: '⚙️', cable: '🔗',
  bodyweight: '🤸', kettlebell: '🔔', band: '🎗️', other: '📦',
};

const MUSCLE_COLORS: Record<string, string> = {
  chest: Colors.muscleChest, back: Colors.muscleBack, quadriceps: Colors.muscleLegs,
  hamstrings: Colors.muscleLegs, glutes: Colors.muscleLegs, shoulders: Colors.muscleShoulders,
  biceps: Colors.muscleArms, triceps: Colors.muscleArms, forearms: Colors.muscleArms,
  calves: Colors.muscleLegs, core: Colors.muscleCore, traps: Colors.muscleBack,
  lats: Colors.muscleBack,
};

export default function LibraryScreen() {
  const router = useRouter();
  const { db, isReady } = useDatabase();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadExercises = useCallback(async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    const repo = new ExerciseRepository(db);
    const all = await repo.getAll();
    setExercises(all);
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      if (isReady) loadExercises();
    }, [isReady, loadExercises])
  );

  const filtered = useMemo(() => {
    let result = exercises;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(q));
    }
    if (muscleFilter) {
      result = result.filter(e => e.primaryMuscleGroup === muscleFilter);
    }
    return result;
  }, [exercises, searchQuery, muscleFilter]);

  if (!isReady || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.headerArea}>
          <View style={styles.header}>
            <Text style={styles.title}>Exercise Library</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/exercise/create')}
            >
              <Ionicons name="add" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>{exercises.length} exercises available</Text>

          {/* Search */}
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search exercises..."
          />

          {/* Muscle group filter chips */}
          <FilterChipGroup
            options={MUSCLE_GROUPS}
            selected={muscleFilter}
            onSelect={setMuscleFilter}
          />
        </View>

        {/* ── Exercise List ── */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptySearch}>
              <Ionicons name="search-outline" size={40} color={Colors.textTertiary} />
              <Text style={styles.emptySearchText}>No exercises found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isExpanded = selectedExercise === item.id;
            const muscleColor = MUSCLE_COLORS[item.primaryMuscleGroup] || Colors.primary;

            return (
              <TouchableOpacity
                style={[styles.exerciseItem, isExpanded && styles.exerciseItemExpanded]}
                onPress={() => setSelectedExercise(isExpanded ? null : item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.exerciseRow}>
                  <View style={[styles.muscleIndicator, { backgroundColor: muscleColor }]} />
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <View style={styles.exerciseTags}>
                      <View style={[styles.tag, { backgroundColor: `${muscleColor}20` }]}>
                        <Text style={[styles.tagText, { color: muscleColor }]}>
                          {item.primaryMuscleGroup.charAt(0).toUpperCase() + item.primaryMuscleGroup.slice(1)}
                        </Text>
                      </View>
                      <Text style={styles.equipmentEmoji}>
                        {EQUIPMENT_ICONS[item.equipmentType] || '📦'} {item.equipmentType}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-forward'}
                    size={18}
                    color={Colors.textTertiary}
                  />
                </View>

                {isExpanded && (
                  <View style={styles.exerciseDetail}>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Instructions</Text>
                      <Text style={styles.detailText}>{item.instructions}</Text>
                    </View>
                    {item.commonMistakes && (
                      <View style={styles.detailSection}>
                        <Text style={[styles.detailLabel, { color: Colors.warning }]}>Common Mistakes</Text>
                        <Text style={styles.detailText}>{item.commonMistakes}</Text>
                      </View>
                    )}
                    {item.secondaryMuscleGroups.length > 0 && (
                      <View style={styles.secondaryMuscles}>
                        <Text style={styles.detailLabel}>Also targets:</Text>
                        <View style={styles.secondaryTags}>
                          {item.secondaryMuscleGroups.map(m => (
                            <View key={m} style={styles.secondaryTag}>
                              <Text style={styles.secondaryTagText}>
                                {m.charAt(0).toUpperCase() + m.slice(1)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  headerArea: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...Typography.h1, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textTertiary, marginTop: -Spacing.sm },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingBottom: 40 },
  exerciseItem: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm, overflow: 'hidden' },
  exerciseItemExpanded: { borderColor: Colors.primaryMuted },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  muscleIndicator: { width: 4, height: 36, borderRadius: 2, marginRight: Spacing.md },
  exerciseInfo: { flex: 1 },
  exerciseName: { ...Typography.labelMedium, color: Colors.textPrimary },
  exerciseTags: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  tag: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.xs },
  tagText: { ...Typography.caption, fontWeight: '600', fontSize: 10 },
  equipmentEmoji: { ...Typography.caption, color: Colors.textTertiary },
  exerciseDetail: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md, gap: Spacing.md },
  detailSection: { gap: 4 },
  detailLabel: { ...Typography.labelSmall, color: Colors.textSecondary, fontSize: 11 },
  detailText: { ...Typography.bodySmall, color: Colors.textPrimary, lineHeight: 18 },
  secondaryMuscles: { gap: Spacing.xs },
  secondaryTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  secondaryTag: { backgroundColor: Colors.surfaceHighlight, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.xs },
  secondaryTagText: { ...Typography.caption, color: Colors.textSecondary, fontSize: 10 },
  emptySearch: { alignItems: 'center', paddingVertical: Spacing.huge, gap: Spacing.md },
  emptySearchText: { ...Typography.bodyMedium, color: Colors.textTertiary },
});
