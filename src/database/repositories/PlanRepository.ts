/**
 * MuscleMemory — Plan Repository
 */

import { type SQLiteDatabase } from 'expo-sqlite';
import * as crypto from 'expo-crypto';
import { WorkoutPlan, WorkoutPlanDay, PlanExercise, WorkoutPlanWithDays, ExerciseWithDetails } from '../../models';

export class PlanRepository {
  constructor(private db: SQLiteDatabase) {}

  async getAll(): Promise<WorkoutPlan[]> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM workout_plans ORDER BY is_active DESC, name'
    );
    return rows.map(this.mapPlanRow);
  }

  async getActive(): Promise<WorkoutPlan | null> {
    const row = await this.db.getFirstAsync<any>(
      'SELECT * FROM workout_plans WHERE is_active = 1 LIMIT 1'
    );
    return row ? this.mapPlanRow(row) : null;
  }

  async getWithDays(planId: string): Promise<WorkoutPlanWithDays | null> {
    const plan = await this.db.getFirstAsync<any>(
      'SELECT * FROM workout_plans WHERE id = ?', [planId]
    );
    if (!plan) return null;

    const days = await this.db.getAllAsync<any>(
      'SELECT * FROM workout_plan_days WHERE plan_id = ? ORDER BY order_index', [planId]
    );

    const daysWithExercises = await Promise.all(
      days.map(async (day: any) => {
        const exercises = await this.db.getAllAsync<any>(
          `SELECT pe.*, e.name, e.primary_muscle_group, e.equipment_type, e.instructions, e.common_mistakes
           FROM plan_exercises pe
           JOIN exercises e ON pe.exercise_id = e.id
           WHERE pe.plan_day_id = ?
           ORDER BY pe.order_index`,
          [day.id]
        );
        return {
          id: day.id,
          planId: day.plan_id,
          name: day.name,
          dayOfWeek: day.day_of_week,
          targetMuscleGroups: JSON.parse(day.target_muscle_groups || '[]'),
          orderIndex: day.order_index,
          exercises: exercises.map((ex: any): ExerciseWithDetails => ({
            id: ex.exercise_id,
            name: ex.name,
            primaryMuscleGroup: ex.primary_muscle_group,
            secondaryMuscleGroups: [],
            equipmentType: ex.equipment_type,
            movementPattern: 'push',
            difficultyLevel: 'intermediate',
            instructions: ex.instructions || '',
            commonMistakes: ex.common_mistakes,
            mediaUrl: null,
            createdByUserId: null,
            isBuiltIn: true,
            defaultSets: ex.default_sets,
            defaultReps: ex.default_reps,
            defaultRPE: ex.default_rpe,
            planExerciseId: ex.id,
            orderIndex: ex.order_index,
          })),
        };
      })
    );

    return {
      ...this.mapPlanRow(plan),
      days: daysWithExercises,
    };
  }

  async setActive(planId: string): Promise<void> {
    await this.db.runAsync('UPDATE workout_plans SET is_active = 0');
    await this.db.runAsync('UPDATE workout_plans SET is_active = 1 WHERE id = ?', [planId]);
  }

  async getDaysForPlan(planId: string): Promise<WorkoutPlanDay[]> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM workout_plan_days WHERE plan_id = ? ORDER BY order_index', [planId]
    );
    return rows.map((row: any) => ({
      id: row.id,
      planId: row.plan_id,
      name: row.name,
      dayOfWeek: row.day_of_week,
      targetMuscleGroups: JSON.parse(row.target_muscle_groups || '[]'),
      orderIndex: row.order_index,
    }));
  }

  async getExerciseCountForDay(dayId: string): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM plan_exercises WHERE plan_day_id = ?', [dayId]
    );
    return result?.count ?? 0;
  }

  async getDayWithExercises(dayId: string): Promise<(WorkoutPlanDay & { exercises: ExerciseWithDetails[] }) | null> {
    const day = await this.db.getFirstAsync<any>(
      'SELECT * FROM workout_plan_days WHERE id = ?', [dayId]
    );
    if (!day) return null;

    const exercises = await this.db.getAllAsync<any>(
      `SELECT pe.*, e.name, e.primary_muscle_group, e.equipment_type, e.instructions, e.common_mistakes
       FROM plan_exercises pe
       JOIN exercises e ON pe.exercise_id = e.id
       WHERE pe.plan_day_id = ?
       ORDER BY pe.order_index`,
      [dayId]
    );

    return {
      id: day.id,
      planId: day.plan_id,
      name: day.name,
      dayOfWeek: day.day_of_week,
      targetMuscleGroups: JSON.parse(day.target_muscle_groups || '[]'),
      orderIndex: day.order_index,
      exercises: exercises.map((ex: any): ExerciseWithDetails => ({
        id: ex.exercise_id,
        name: ex.name,
        primaryMuscleGroup: ex.primary_muscle_group,
        secondaryMuscleGroups: [],
        equipmentType: ex.equipment_type,
        movementPattern: 'push', // default placeholder
        difficultyLevel: 'intermediate',
        instructions: ex.instructions || '',
        commonMistakes: ex.common_mistakes,
        mediaUrl: null,
        createdByUserId: null,
        isBuiltIn: true,
        defaultSets: ex.default_sets,
        defaultReps: ex.default_reps,
        defaultRPE: ex.default_rpe,
        planExerciseId: ex.id,
        orderIndex: ex.order_index,
      })),
    };
  }

  private mapPlanRow(row: any): WorkoutPlan {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      splitType: row.split_type,
      trainingDaysPerWeek: row.training_days_per_week,
      isActive: Boolean(row.is_active),
      createdByUserId: row.created_by_user_id,
      isBuiltIn: Boolean(row.is_built_in),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async duplicatePlan(planId: string, newUserId: string): Promise<string> {
    const originalPlan = await this.getWithDays(planId);
    if (!originalPlan) throw new Error('Plan not found');

    const newPlanId = crypto.randomUUID();
    const newName = `${originalPlan.name} (Copy)`;

    await this.db.runAsync(
      `INSERT INTO workout_plans (id, name, description, split_type, training_days_per_week, created_by_user_id, is_built_in, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        newPlanId, 
        newName, 
        originalPlan.description || '', 
        originalPlan.splitType,
        originalPlan.trainingDaysPerWeek || 3, 
        newUserId, 
        0
      ]
    );

    for (const day of originalPlan.days) {
      const newDayId = crypto.randomUUID();
      await this.db.runAsync(
        `INSERT INTO workout_plan_days (id, plan_id, name, day_of_week, target_muscle_groups, order_index)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newDayId, newPlanId, day.name, day.dayOfWeek,
          JSON.stringify(day.targetMuscleGroups), day.orderIndex
        ]
      );

      for (const ex of day.exercises) {
        const newExId = crypto.randomUUID();
        await this.db.runAsync(
          `INSERT INTO plan_exercises (id, plan_day_id, exercise_id, default_sets, default_reps, default_rpe, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            newExId, 
            newDayId, 
            ex.id, 
            ex.defaultSets ?? 0, 
            ex.defaultReps ?? 0, 
            ex.defaultRPE ?? null, 
            ex.orderIndex
          ] as any[]
        );
      }
    }

    return newPlanId;
  }

  async updatePlan(planId: string, updates: Partial<WorkoutPlan>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.splitType !== undefined) { fields.push('split_type = ?'); values.push(updates.splitType); }
    if (updates.trainingDaysPerWeek !== undefined) { fields.push('training_days_per_week = ?'); values.push(updates.trainingDaysPerWeek); }
    if (updates.isActive !== undefined) { fields.push('is_active = ?'); values.push(updates.isActive ? 1 : 0); }
    
    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(planId);

    await this.db.runAsync(
      `UPDATE workout_plans SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async updatePlanDay(dayId: string, name: string): Promise<void> {
    await this.db.runAsync(
      'UPDATE workout_plan_days SET name = ? WHERE id = ?',
      [name, dayId]
    );
  }

  async setExercisesForDay(dayId: string, exercises: { exerciseId: string; sets: number; reps: number; orderIndex: number }[]): Promise<void> {
    // Delete existing exercises
    await this.db.runAsync('DELETE FROM plan_exercises WHERE plan_day_id = ?', [dayId]);
    
    // Insert new exercises
    for (const ex of exercises) {
      await this.db.runAsync(
        `INSERT INTO plan_exercises (id, plan_day_id, exercise_id, default_sets, default_reps, order_index)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), dayId, ex.exerciseId, ex.sets ?? 0, ex.reps ?? 0, ex.orderIndex] as any[]
      );
    }
  }

  async deletePlan(planId: string): Promise<void> {
    const plan = await this.db.getFirstAsync<any>('SELECT is_built_in FROM workout_plans WHERE id = ?', [planId]);
    if (plan?.is_built_in) {
      throw new Error('Cannot delete built-in templates');
    }
    await this.db.runAsync('DELETE FROM workout_plans WHERE id = ?', [planId]);
  }

  async createNewPlan(userId: string, name: string, description: string = '', splitType: string = 'custom', trainingDays: number = 3): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.runAsync(
      `INSERT INTO workout_plans (id, name, description, split_type, training_days_per_week, created_by_user_id, is_built_in, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
      [id, name, description, splitType, trainingDays, userId]
    );
    return id;
  }

  async addDayToPlan(planId: string, name: string, orderIndex: number): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.runAsync(
      `INSERT INTO workout_plan_days (id, plan_id, name, order_index) VALUES (?, ?, ?, ?)`,
      [id, planId, name, orderIndex]
    );
    return id;
  }

  async deleteDay(dayId: string): Promise<void> {
    await this.db.runAsync('DELETE FROM workout_plan_days WHERE id = ?', [dayId]);
  }

  async upsertPlanFull(plan: any): Promise<void> {
    // Upsert Plan
    await this.db.runAsync(
      `INSERT INTO workout_plans (id, name, description, split_type, training_days_per_week, is_active, created_by_user_id, is_built_in, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name, description=excluded.description, split_type=excluded.split_type,
         training_days_per_week=excluded.training_days_per_week, is_active=excluded.is_active,
         is_built_in=excluded.is_built_in, updated_at=excluded.updated_at`,
      [
        plan.id, plan.name, plan.description || '', plan.splitType, plan.trainingDaysPerWeek || 3,
        plan.isActive ? 1 : 0, plan.createdByUserId, plan.isBuiltIn ? 1 : 0,
        plan.createdAt || new Date().toISOString(), plan.updatedAt || new Date().toISOString()
      ]
    );

    if (plan.days && plan.days.length > 0) {
      for (const day of plan.days) {
        // Upsert Plan Day
        await this.db.runAsync(
          `INSERT INTO workout_plan_days (id, plan_id, name, day_of_week, target_muscle_groups, order_index)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             plan_id=excluded.plan_id, name=excluded.name, day_of_week=excluded.day_of_week,
             target_muscle_groups=excluded.target_muscle_groups, order_index=excluded.order_index`,
          [
            day.id, day.planId, day.name, day.dayOfWeek,
            JSON.stringify(day.targetMuscleGroups || []), day.orderIndex || 0
          ]
        );

        if (day.exercises && day.exercises.length > 0) {
          for (const ex of day.exercises) {
            // Upsert Plan Exercise
            await this.db.runAsync(
              `INSERT INTO plan_exercises (id, plan_day_id, exercise_id, default_sets, default_reps, default_rpe, order_index)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET
                 plan_day_id=excluded.plan_day_id, exercise_id=excluded.exercise_id,
                 default_sets=excluded.default_sets, default_reps=excluded.default_reps,
                 default_rpe=excluded.default_rpe, order_index=excluded.order_index`,
              [
                ex.id, ex.planDayId, ex.exerciseId, ex.defaultSets || 3,
                ex.defaultReps || 10, ex.defaultRPE, ex.orderIndex || 0
              ]
            );
          }
        }
      }
    }
  }
}
