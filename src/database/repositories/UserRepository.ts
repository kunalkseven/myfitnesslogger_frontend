import { type SQLiteDatabase } from 'expo-sqlite';
import { User, UserPreferences, TrainingExperience, PrimaryGoal, UnitSystem, ThemeMode, AuthProvider } from '../../models';

export class UserRepository {
  constructor(private db: SQLiteDatabase) {}

  async getUser(id: string): Promise<User | null> {
    const row = await this.db.getFirstAsync<any>('SELECT * FROM users WHERE id = ?', [id]);
    if (!row) return null;
    return this.mapUserRow(row);
  }

  async upsertUser(id: string, updates: Partial<User>): Promise<void> {
    const existing = await this.getUser(id);
    
    if (!existing) {
      // Create new
      await this.db.runAsync(
        `INSERT INTO users (
          id, name, email, auth_provider, gender, date_of_birth, height, weight, 
          training_experience, primary_goal, pref_units, pref_theme, pref_rest_timer_seconds, pref_notifications_enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          updates.name || '',
          updates.email || '',
          updates.authProvider || 'guest',
          updates.gender || null,
          updates.dateOfBirth || null,
          updates.height || null,
          updates.weight || null,
          updates.trainingExperience || 'beginner',
          updates.primaryGoal || 'build_muscle',
          updates.preferences?.units || 'metric',
          updates.preferences?.theme || 'dark',
          updates.preferences?.restTimerDefaultSeconds || 90,
          updates.preferences?.notificationsEnabled !== false ? 1 : 0
        ]
      );
    } else {
      // Update existing
      const fields: string[] = [];
      const values: any[] = [];
      
      if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
      if (updates.email !== undefined) { fields.push('email = ?'); values.push(updates.email); }
      if (updates.authProvider !== undefined) { fields.push('auth_provider = ?'); values.push(updates.authProvider); }
      if (updates.gender !== undefined) { fields.push('gender = ?'); values.push(updates.gender); }
      if (updates.dateOfBirth !== undefined) { fields.push('date_of_birth = ?'); values.push(updates.dateOfBirth); }
      if (updates.height !== undefined) { fields.push('height = ?'); values.push(updates.height); }
      if (updates.weight !== undefined) { fields.push('weight = ?'); values.push(updates.weight); }
      if (updates.trainingExperience !== undefined) { fields.push('training_experience = ?'); values.push(updates.trainingExperience); }
      if (updates.primaryGoal !== undefined) { fields.push('primary_goal = ?'); values.push(updates.primaryGoal); }
      
      if (updates.preferences) {
        if (updates.preferences.units !== undefined) { fields.push('pref_units = ?'); values.push(updates.preferences.units); }
        if (updates.preferences.theme !== undefined) { fields.push('pref_theme = ?'); values.push(updates.preferences.theme); }
        if (updates.preferences.restTimerDefaultSeconds !== undefined) { fields.push('pref_rest_timer_seconds = ?'); values.push(updates.preferences.restTimerDefaultSeconds); }
        if (updates.preferences.notificationsEnabled !== undefined) { fields.push('pref_notifications_enabled = ?'); values.push(updates.preferences.notificationsEnabled ? 1 : 0); }
      }

      if (fields.length === 0) return;

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      await this.db.runAsync(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  private mapUserRow(row: any): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      authProvider: row.auth_provider as AuthProvider,
      gender: row.gender,
      dateOfBirth: row.date_of_birth,
      height: row.height,
      weight: row.weight,
      trainingExperience: row.training_experience as TrainingExperience,
      primaryGoal: row.primary_goal as PrimaryGoal,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      preferences: {
        units: row.pref_units as UnitSystem,
        theme: row.pref_theme as ThemeMode,
        restTimerDefaultSeconds: row.pref_rest_timer_seconds,
        notificationsEnabled: Boolean(row.pref_notifications_enabled)
      }
    };
  }
}
