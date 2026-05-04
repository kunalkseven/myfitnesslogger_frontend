/**
 * MuscleMemory — Workout Repository
 */

import { type SQLiteDatabase } from 'expo-sqlite';
import * as crypto from 'expo-crypto';
import { WorkoutSession, WorkoutSet, WorkoutSessionWithSets } from '../../models';

export class WorkoutRepository {
  constructor(private db: SQLiteDatabase) {}

  async startSession(userId: string, planDayId: string | null = null, planId: string | null = null): Promise<string> {
    const id = crypto.randomUUID();
    const date = new Date().toISOString().split('T')[0];
    const startTime = new Date().toISOString();
    
    await this.db.runAsync(
      `INSERT INTO workout_sessions (id, user_id, plan_id, plan_day_id, date, start_time, status)
       VALUES (?, ?, ?, ?, ?, ?, 'in_progress')`,
      [id, userId, planId, planDayId, date, startTime]
    );
    
    return id;
  }

  async finishSession(sessionId: string, notes: string | null = null): Promise<void> {
    const endTime = new Date().toISOString();
    
    // 1. Update session locally
    await this.db.runAsync(
      `UPDATE workout_sessions SET status = 'completed', end_time = ?, notes = ? WHERE id = ?`,
      [endTime, notes, sessionId]
    );

    // 2. Fetch full session data to enqueue
    const session = await this.db.getFirstAsync<any>('SELECT * FROM workout_sessions WHERE id = ?', [sessionId]);
    const sets = await this.db.getAllAsync<any>('SELECT * FROM workout_sets WHERE session_id = ?', [sessionId]);

    if (session) {
      // Enqueue session
      await this.db.runAsync(
        `INSERT INTO sync_queue (entity_type, entity_id, operation, payload, status) 
         VALUES (?, ?, ?, ?, 'pending')`,
        ['session', session.id, 'CREATE', JSON.stringify(session)]
      );

      // Enqueue all sets
      for (const set of sets) {
        await this.db.runAsync(
          `INSERT INTO sync_queue (entity_type, entity_id, operation, payload, status) 
           VALUES (?, ?, ?, ?, 'pending')`,
          ['set', set.id, 'CREATE', JSON.stringify(set)]
        );
      }
    }
  }

  async cancelSession(sessionId: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE workout_sessions SET status = 'cancelled' WHERE id = ?`,
      [sessionId]
    );
  }

  async logSet(
    sessionId: string, exerciseId: string, orderIndex: number, 
    weight: number, reps: number, isWarmup: boolean = false, rpe: number | null = null
  ): Promise<string> {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    await this.db.runAsync(
      `INSERT INTO workout_sets (id, session_id, exercise_id, order_index, weight, reps, rpe, is_warmup, is_completed, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [id, sessionId, exerciseId, orderIndex, weight, reps, rpe, isWarmup ? 1 : 0, timestamp]
    );
    
    return id;
  }

  async updateSetComplete(setId: string, isCompleted: boolean, weight: number, reps: number): Promise<void> {
    await this.db.runAsync(
      `UPDATE workout_sets SET is_completed = ?, weight = ?, reps = ?, timestamp = ? WHERE id = ?`,
      [isCompleted ? 1 : 0, weight, reps, new Date().toISOString(), setId]
    );
  }

  async removeSet(setId: string): Promise<void> {
    await this.db.runAsync(`DELETE FROM workout_sets WHERE id = ?`, [setId]);
  }

  async getPreviousExercisePerformance(userId: string, exerciseId: string): Promise<{weight: number, reps: number} | null> {
    const result = await this.db.getFirstAsync<any>(
      `SELECT ws.weight, ws.reps 
       FROM workout_sets ws
       JOIN workout_sessions sess ON ws.session_id = sess.id
       WHERE sess.user_id = ? AND ws.exercise_id = ? AND ws.is_completed = 1 AND ws.is_warmup = 0
       ORDER BY sess.date DESC, ws.order_index DESC LIMIT 1`,
      [userId, exerciseId]
    );
    
    if (!result) return null;
    return { weight: result.weight, reps: result.reps };
  }

  async getRecentSessions(limit: number = 5): Promise<WorkoutSession[]> {
    const rows = await this.db.getAllAsync<any>(
      `SELECT ws.*, wp.name as plan_name, wpd.name as day_name 
       FROM workout_sessions ws
       LEFT JOIN workout_plans wp ON ws.plan_id = wp.id
       LEFT JOIN workout_plan_days wpd ON ws.plan_day_id = wpd.id
       WHERE ws.status = 'completed'
       ORDER BY ws.date DESC LIMIT ?`,
      [limit]
    );
    return rows.map(this.mapSessionRow);
  }

  async getSessionWithSets(sessionId: string): Promise<WorkoutSessionWithSets | null> {
    const session = await this.db.getFirstAsync<any>(
      'SELECT * FROM workout_sessions WHERE id = ?', [sessionId]
    );
    if (!session) return null;

    const sets = await this.db.getAllAsync<any>(
      `SELECT ws.*, e.name as exercise_name
       FROM workout_sets ws
       JOIN exercises e ON ws.exercise_id = e.id
       WHERE ws.session_id = ?
       ORDER BY ws.order_index`,
      [sessionId]
    );

    const mappedSets = sets.map((s: any) => ({
      id: s.id,
      sessionId: s.session_id,
      exerciseId: s.exercise_id,
      orderIndex: s.order_index,
      weight: s.weight,
      reps: s.reps,
      rpe: s.rpe,
      side: s.side,
      isWarmup: Boolean(s.is_warmup),
      isCompleted: Boolean(s.is_completed),
      timestamp: s.timestamp,
      exerciseName: s.exercise_name,
    }));

    const exerciseGroups: Record<string, any> = {};
    for (const s of mappedSets) {
      if (!exerciseGroups[s.exerciseId]) {
        // Fetch exercise details (could be optimized with a JOIN earlier)
        const ex = await this.db.getFirstAsync<any>('SELECT * FROM exercises WHERE id = ?', [s.exerciseId]);
        exerciseGroups[s.exerciseId] = {
          exercise: {
            id: ex.id,
            name: ex.name,
            primaryMuscleGroup: ex.primary_muscle_group,
            equipmentType: ex.equipment_type,
            // ... add other fields if needed, or cast
          },
          sets: [],
        };
      }
      exerciseGroups[s.exerciseId].sets.push(s);
    }

    const totalVolume = mappedSets
      .filter((s: any) => s.isCompleted && !s.isWarmup)
      .reduce((sum: number, s: any) => sum + (s.weight * s.reps), 0);

    const exerciseCount = Object.keys(exerciseGroups).length;

    return {
      ...this.mapSessionRow(session),
      sets: mappedSets,
      exercises: Object.values(exerciseGroups),
      totalVolume,
      exerciseCount,
    } as any;
  }

  async getCompletedCount(): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM workout_sessions WHERE status = 'completed'`
    );
    return result?.count ?? 0;
  }

  async getWeeklyCount(): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM workout_sessions 
       WHERE status = 'completed' AND date >= date('now', '-7 days')`
    );
    return result?.count ?? 0;
  }

  async getStreak(): Promise<number> {
    const sessions = await this.db.getAllAsync<{ date: string }>(
      `SELECT DISTINCT date FROM workout_sessions 
       WHERE status = 'completed' ORDER BY date DESC`
    );
    
    if (sessions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sessions.length; i++) {
      const sessionDate = new Date(sessions[i].date);
      sessionDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (sessionDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else if (i === 0) {
        // Check if yesterday
        expectedDate.setDate(expectedDate.getDate() - 1);
        if (sessionDate.getTime() === expectedDate.getTime()) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return streak;
  }

  private mapSessionRow(row: any): WorkoutSession {
    return {
      id: row.id,
      userId: row.user_id,
      planId: row.plan_id,
      planDayId: row.plan_day_id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }

  async generateSchedule(userId: string, planId: string, fromDate: Date, weeksCount: number = 4): Promise<void> {
    // 1. Fetch days for plan
    const days = await this.db.getAllAsync<any>(
      'SELECT id, day_of_week FROM workout_plan_days WHERE plan_id = ? ORDER BY order_index',
      [planId]
    );

    if (days.length === 0) return;

    // 2. Clear existing future planned sessions for this user
    const fromStr = fromDate.toISOString().split('T')[0];
    await this.db.runAsync(
      `DELETE FROM workout_sessions WHERE user_id = ? AND status = 'planned' AND date >= ?`,
      [userId, fromStr]
    );

    // 3. Generate dates
    let currentDate = new Date(fromDate);
    currentDate.setHours(0,0,0,0);
    
    // Quick lookup: JS Date getDay() returns 0 (Sun) to 6 (Sat)
    // Map our DB days (if any)
    const mapDayToNum = (dayStr: string | null) => {
      if (!dayStr) return null;
      const m: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
      return m[dayStr.toLowerCase()] ?? null;
    };

    let dayIndex = 0; // For sequential plans without strict days
    
    for (let i = 0; i < weeksCount * 7; i++) {
      const targetDateStr = currentDate.toISOString().split('T')[0];
      const jsDayNum = currentDate.getDay();
      
      let dayToSchedule = null;

      // Try to find a day with strict dayOfWeek
      const strictDay = days.find(d => mapDayToNum(d.day_of_week) === jsDayNum);
      if (strictDay) {
        dayToSchedule = strictDay;
      } else {
        // If the plan has no strict days, we just schedule them sequentially?
        // Let's do a simple approach: if none of the days have dayOfWeek set, 
        // schedule them on Mon, Wed, Fri, etc based on count.
        // Actually, for simplicity, if a day has dayOfWeek = null, we just use orderIndex and map to MWF if possible, or just sequential.
        // Let's rely on dayOfWeek for now. If null, we'll skip or we could do sequential.
      }

      if (dayToSchedule) {
        await this.db.runAsync(
          `INSERT INTO workout_sessions (id, user_id, plan_id, plan_day_id, date, status)
           VALUES (?, ?, ?, ?, ?, 'planned')`,
          [crypto.randomUUID(), userId, planId, dayToSchedule.id, targetDateStr]
        );
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  async getUpcomingSchedule(userId: string, startDate: string, endDate: string): Promise<(WorkoutSession & { planName?: string, dayName?: string })[]> {
    const rows = await this.db.getAllAsync<any>(
      `SELECT ws.*, p.name as plan_name, d.name as day_name
       FROM workout_sessions ws
       LEFT JOIN workout_plans p ON ws.plan_id = p.id
       LEFT JOIN workout_plan_days d ON ws.plan_day_id = d.id
       WHERE ws.user_id = ? AND ws.date >= ? AND ws.date <= ?
       ORDER BY ws.date ASC`,
      [userId, startDate, endDate]
    );

    return rows.map((r: any) => ({
      ...this.mapSessionRow(r),
      planName: r.plan_name,
      dayName: r.day_name,
    }));
  }

  async getStreakAndAdherence(userId: string): Promise<{ streak: number; adherence: number }> {
    const streak = await this.getStreak();
    
    // Adherence for the current week (e.g. past 7 days)
    const stats = await this.db.getFirstAsync<any>(
      `SELECT 
         COUNT(*) as total_planned,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as total_completed
       FROM workout_sessions 
       WHERE user_id = ? AND date >= date('now', '-7 days')`,
      [userId]
    );

    const totalPlanned = stats?.total_planned || 0;
    const totalCompleted = stats?.total_completed || 0;
    
    // Adherence is % of completed out of planned. If no planned, adherence is 100% if they completed any ad-hoc, or 0%
    let adherence = 0;
    if (totalPlanned > 0) {
      adherence = Math.round((totalCompleted / totalPlanned) * 100);
      if (adherence > 100) adherence = 100;
    } else if (totalCompleted > 0) {
      adherence = 100;
    }

    return { streak, adherence };
  }

  async getWorkoutHistory(userId: string, limit: number = 20, offset: number = 0) {
    return await this.db.getAllAsync<any>(
      `SELECT 
         ws.id, ws.date, ws.start_time as startTime, ws.end_time as endTime, ws.status,
         p.name as planName,
         d.name as dayName,
         COUNT(DISTINCT set_rows.exercise_id) as exerciseCount,
         SUM(set_rows.weight * set_rows.reps) as totalVolume,
         COUNT(set_rows.id) as setCount
       FROM workout_sessions ws
       LEFT JOIN workout_plans p ON ws.plan_id = p.id
       LEFT JOIN workout_plan_days d ON ws.plan_day_id = d.id
       LEFT JOIN workout_sets set_rows ON ws.id = set_rows.session_id AND set_rows.is_completed = 1 AND set_rows.is_warmup = 0
       WHERE ws.user_id = ? AND ws.status = 'completed'
       GROUP BY ws.id
       ORDER BY ws.date DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
  }

  async getAnalyticsSummary(userId: string) {
    const totalWorkoutsRow = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM workout_sessions WHERE user_id = ? AND status = 'completed'`,
      [userId]
    );

    const topExercises = await this.db.getAllAsync<{ name: string, count: number }>(
      `SELECT e.name, COUNT(DISTINCT ws.id) as count
       FROM exercises e
       JOIN workout_sets set_rows ON e.id = set_rows.exercise_id
       JOIN workout_sessions ws ON set_rows.session_id = ws.id
       WHERE ws.user_id = ? AND ws.status = 'completed'
       GROUP BY e.id
       ORDER BY count DESC
       LIMIT 5`,
      [userId]
    );

    const muscleDistribution = await this.db.getAllAsync<{ muscle: string, volume: number }>(
      `SELECT e.primary_muscle_group as muscle, SUM(set_rows.weight * set_rows.reps) as volume
       FROM exercises e
       JOIN workout_sets set_rows ON e.id = set_rows.exercise_id
       JOIN workout_sessions ws ON set_rows.session_id = ws.id
       WHERE ws.user_id = ? AND ws.status = 'completed' AND set_rows.is_completed = 1 AND set_rows.is_warmup = 0
       GROUP BY e.primary_muscle_group
       ORDER BY volume DESC`,
      [userId]
    );

    return {
      totalWorkouts: totalWorkoutsRow?.count || 0,
      topExercises,
      muscleDistribution,
    };
  }

  async getExercise1RMTrends(userId: string, exerciseId: string) {
    return await this.db.getAllAsync<{ date: string, estimated1RM: number }>(
      `SELECT ws.date, MAX(set_rows.weight * (1 + set_rows.reps / 30.0)) as estimated1RM
       FROM workout_sets set_rows
       JOIN workout_sessions ws ON set_rows.session_id = ws.id
       WHERE ws.user_id = ? AND set_rows.exercise_id = ? AND set_rows.is_completed = 1 AND ws.status = 'completed'
       GROUP BY ws.date
       ORDER BY ws.date ASC`,
      [userId, exerciseId]
    );
  }

  async getVolumeByMuscleGroup(userId: string) {
    // Returns recent workouts volume grouped by muscle, for a basic bar chart
    return await this.db.getAllAsync<{ muscle: string, weekStart: string, volume: number }>(
      `SELECT e.primary_muscle_group as muscle, date(ws.date, 'weekday 0', '-6 days') as weekStart, SUM(set_rows.weight * set_rows.reps) as volume
       FROM exercises e
       JOIN workout_sets set_rows ON e.id = set_rows.exercise_id
       JOIN workout_sessions ws ON set_rows.session_id = ws.id
       WHERE ws.user_id = ? AND ws.status = 'completed' AND set_rows.is_completed = 1 AND set_rows.is_warmup = 0
       GROUP BY e.primary_muscle_group, weekStart
       ORDER BY weekStart ASC`,
      [userId]
    );
  }

  async upsertSessionFull(session: any): Promise<void> {
    // Upsert session
    await this.db.runAsync(
      `INSERT INTO workout_sessions (id, user_id, plan_id, plan_day_id, date, start_time, end_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         user_id=excluded.user_id, plan_id=excluded.plan_id, plan_day_id=excluded.plan_day_id,
         date=excluded.date, start_time=excluded.start_time, end_time=excluded.end_time,
         status=excluded.status, notes=excluded.notes`,
      [
        session.id, session.userId, session.planId, session.planDayId,
        session.date, session.startTime, session.endTime, session.status, session.notes
      ]
    );

    // Upsert sets
    if (session.sets && session.sets.length > 0) {
      for (const set of session.sets) {
        await this.db.runAsync(
          `INSERT INTO workout_sets (id, session_id, exercise_id, order_index, weight, reps, rpe, side, is_warmup, is_completed, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             session_id=excluded.session_id, exercise_id=excluded.exercise_id, order_index=excluded.order_index,
             weight=excluded.weight, reps=excluded.reps, rpe=excluded.rpe, side=excluded.side,
             is_warmup=excluded.is_warmup, is_completed=excluded.is_completed, timestamp=excluded.timestamp`,
          [
            set.id, set.sessionId, set.exerciseId, set.orderIndex,
            set.weight, set.reps, set.rpe, set.side || 'both',
            set.isWarmup ? 1 : 0, set.isCompleted ? 1 : 0, set.timestamp || new Date().toISOString()
          ]
        );
      }
    }
  }
}
