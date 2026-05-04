/**
 * MuscleMemory — Exercise Repository
 */

import { type SQLiteDatabase } from 'expo-sqlite';
import { Exercise, MuscleGroup, EquipmentType } from '../../models';

export class ExerciseRepository {
  constructor(private db: SQLiteDatabase) {}

  async getAll(): Promise<Exercise[]> {
    const rows = await this.db.getAllAsync<any>('SELECT * FROM exercises ORDER BY name');
    return rows.map(this.mapRow);
  }

  async getByMuscleGroup(group: MuscleGroup): Promise<Exercise[]> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM exercises WHERE primary_muscle_group = ? ORDER BY name',
      [group]
    );
    return rows.map(this.mapRow);
  }

  async search(query: string): Promise<Exercise[]> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM exercises WHERE name LIKE ? ORDER BY name',
      [`%${query}%`]
    );
    return rows.map(this.mapRow);
  }

  async getById(id: string): Promise<Exercise | null> {
    const row = await this.db.getFirstAsync<any>('SELECT * FROM exercises WHERE id = ?', [id]);
    return row ? this.mapRow(row) : null;
  }

  async create(exercise: Omit<Exercise, 'isBuiltIn'>): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO exercises (id, name, primary_muscle_group, secondary_muscle_groups, equipment_type, movement_pattern, difficulty_level, instructions, common_mistakes, created_by_user_id, is_built_in)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [exercise.id, exercise.name, exercise.primaryMuscleGroup, JSON.stringify(exercise.secondaryMuscleGroups),
       exercise.equipmentType, exercise.movementPattern, exercise.difficultyLevel, exercise.instructions,
       exercise.commonMistakes, exercise.createdByUserId]
    );
  }

  private mapRow(row: any): Exercise {
    return {
      id: row.id,
      name: row.name,
      primaryMuscleGroup: row.primary_muscle_group as MuscleGroup,
      secondaryMuscleGroups: JSON.parse(row.secondary_muscle_groups || '[]'),
      equipmentType: row.equipment_type as EquipmentType,
      movementPattern: row.movement_pattern,
      difficultyLevel: row.difficulty_level,
      instructions: row.instructions,
      commonMistakes: row.common_mistakes,
      mediaUrl: row.media_url,
      createdByUserId: row.created_by_user_id,
      isBuiltIn: Boolean(row.is_built_in),
    };
  }
}
