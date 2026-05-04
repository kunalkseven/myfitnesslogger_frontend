/**
 * MuscleMemory — Exercise Picker Component
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import { SearchBar } from './SearchBar';
import { FilterChip } from './FilterChip';
import { Exercise } from '../models';
import { useDatabase } from '../database/DatabaseProvider';

interface ExercisePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export const ExercisePicker: React.FC<ExercisePickerProps> = ({ visible, onClose, onSelect }) => {
  const { db, isReady } = useDatabase();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  useEffect(() => {
    if (visible && isReady && db) {
      loadExercises();
    }
  }, [visible, isReady, db]);

  const loadExercises = async () => {
    try {
      const rows = await (db as any).getAllAsync('SELECT * FROM exercises ORDER BY name');
      setExercises(rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        primaryMuscleGroup: r.primary_muscle_group,
        secondaryMuscleGroups: JSON.parse(r.secondary_muscle_groups || '[]'),
        equipmentType: r.equipment_type,
        movementPattern: r.movement_pattern,
        difficultyLevel: r.difficulty_level,
        instructions: r.instructions,
        commonMistakes: r.common_mistakes,
        mediaUrl: r.media_url,
        createdByUserId: r.created_by_user_id,
        isBuiltIn: Boolean(r.is_built_in),
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const matchesMuscle = !selectedMuscle || ex.primaryMuscleGroup === selectedMuscle;
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, search, selectedMuscle]);

  const muscles = ['chest', 'back', 'quadriceps', 'hamstrings', 'shoulders', 'biceps', 'triceps', 'core', 'calves'];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Exercise</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.filtersContainer}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search exercises..."
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.muscleFilters}>
              <FilterChip
                label="All"
                selected={selectedMuscle === null}
                onPress={() => setSelectedMuscle(null)}
              />
              {muscles.map(m => (
                <FilterChip
                  key={m}
                  label={m.charAt(0).toUpperCase() + m.slice(1)}
                  selected={selectedMuscle === m}
                  onPress={() => setSelectedMuscle(m)}
                />
              ))}
            </ScrollView>
          </View>

          {loading ? (
            <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.exerciseItem} onPress={() => onSelect(item)}>
                  <View style={styles.exInfo}>
                    <Text style={styles.exName}>{item.name}</Text>
                    <Text style={styles.exSub}>{item.primaryMuscleGroup.toUpperCase()} • {item.equipmentType}</Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={Colors.primary} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, height: '90%', borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { ...Typography.h2, color: Colors.textPrimary },
  filtersContainer: { padding: Spacing.md, gap: Spacing.sm },
  muscleFilters: { flexDirection: 'row', marginTop: Spacing.xs },
  listContent: { padding: Spacing.md },
  exerciseItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: Spacing.md, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border,
  },
  exInfo: { flex: 1 },
  exName: { ...Typography.labelMedium, color: Colors.textPrimary },
  exSub: { ...Typography.caption, color: Colors.textTertiary, marginTop: 2 },
});

