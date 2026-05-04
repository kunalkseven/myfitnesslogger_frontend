/**
 * MuscleMemory — Database Schema
 * SQLite table definitions for all domain entities.
 */

export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    auth_provider TEXT NOT NULL DEFAULT 'guest',
    gender TEXT,
    date_of_birth TEXT,
    height REAL,
    weight REAL,
    training_experience TEXT NOT NULL DEFAULT 'beginner',
    primary_goal TEXT NOT NULL DEFAULT 'build_muscle',
    pref_units TEXT NOT NULL DEFAULT 'metric',
    pref_theme TEXT NOT NULL DEFAULT 'dark',
    pref_rest_timer_seconds INTEGER NOT NULL DEFAULT 90,
    pref_notifications_enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    primary_muscle_group TEXT NOT NULL,
    secondary_muscle_groups TEXT NOT NULL DEFAULT '[]',
    equipment_type TEXT NOT NULL DEFAULT 'barbell',
    movement_pattern TEXT NOT NULL DEFAULT 'push',
    difficulty_level TEXT NOT NULL DEFAULT 'intermediate',
    instructions TEXT NOT NULL DEFAULT '',
    common_mistakes TEXT,
    media_url TEXT,
    created_by_user_id TEXT,
    is_built_in INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS workout_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    split_type TEXT NOT NULL,
    training_days_per_week INTEGER NOT NULL DEFAULT 3,
    is_active INTEGER NOT NULL DEFAULT 0,
    created_by_user_id TEXT,
    is_built_in INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workout_plan_days (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    name TEXT NOT NULL,
    day_of_week INTEGER,
    target_muscle_groups TEXT NOT NULL DEFAULT '[]',
    order_index INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS plan_exercises (
    id TEXT PRIMARY KEY,
    plan_day_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    default_sets INTEGER NOT NULL DEFAULT 3,
    default_reps INTEGER NOT NULL DEFAULT 10,
    default_rpe REAL,
    order_index INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (plan_day_id) REFERENCES workout_plan_days(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
  );

  CREATE TABLE IF NOT EXISTS workout_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_id TEXT,
    plan_day_id TEXT,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    status TEXT NOT NULL DEFAULT 'planned',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workout_sets (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    weight REAL NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    rpe REAL,
    side TEXT NOT NULL DEFAULT 'both',
    is_warmup INTEGER NOT NULL DEFAULT 0,
    is_completed INTEGER NOT NULL DEFAULT 0,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notification_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    schedule_rule TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_exercises_muscle ON exercises(primary_muscle_group);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON workout_sessions(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_sets_session ON workout_sets(session_id);
  CREATE INDEX IF NOT EXISTS idx_sets_exercise ON workout_sets(exercise_id);
  CREATE INDEX IF NOT EXISTS idx_plan_days_plan ON workout_plan_days(plan_id);
  CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
`;
