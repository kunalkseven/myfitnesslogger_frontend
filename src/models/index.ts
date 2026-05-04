/**
 * MuscleMemory — Domain Models
 * 
 * All TypeScript interfaces for the workout tracking domain.
 * These map to SQLite tables in the database layer.
 */

// ── Enums / Union Types ──

export type AuthProvider = 'email' | 'google' | 'apple' | 'guest';
export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced';
export type PrimaryGoal = 'build_muscle' | 'get_stronger' | 'lose_fat' | 'stay_fit';
export type UnitSystem = 'metric' | 'imperial';
export type ThemeMode = 'dark' | 'light' | 'system';

export type MuscleGroup = 
  | 'chest' | 'back' | 'quadriceps' | 'hamstrings' | 'glutes'
  | 'shoulders' | 'biceps' | 'triceps' | 'forearms' | 'calves'
  | 'core' | 'traps' | 'lats' | 'full_body';

export type EquipmentType = 
  | 'bodyweight' | 'barbell' | 'dumbbell' | 'machine' 
  | 'cable' | 'kettlebell' | 'band' | 'other';

export type MovementPattern = 
  | 'push' | 'pull' | 'hinge' | 'squat' 
  | 'carry' | 'isolation' | 'rotation';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type SplitType = 
  | 'one_muscle_per_day' | 'ppl' | 'ppl_upper_lower' 
  | 'full_body' | 'upper_lower' | 'custom';

export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type SetSide = 'left' | 'right' | 'both';
export type NotificationType = 'training_reminder' | 'streak_reminder' | 'other';

// ── User ──

export interface UserPreferences {
  units: UnitSystem;
  theme: ThemeMode;
  restTimerDefaultSeconds: number;
  notificationsEnabled: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  authProvider: AuthProvider;
  gender: string | null;
  dateOfBirth: string | null; // ISO date string
  height: number | null;     // cm or inches based on units
  weight: number | null;     // kg or lbs based on units
  trainingExperience: TrainingExperience;
  primaryGoal: PrimaryGoal;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

// ── Exercise ──

export interface Exercise {
  id: string;
  name: string;
  primaryMuscleGroup: MuscleGroup;
  secondaryMuscleGroups: MuscleGroup[];
  equipmentType: EquipmentType;
  movementPattern: MovementPattern;
  difficultyLevel: DifficultyLevel;
  instructions: string;
  commonMistakes: string | null;
  mediaUrl: string | null;
  createdByUserId: string | null; // null = built-in
  isBuiltIn: boolean;
}

// ── Workout Plan ──

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  splitType: SplitType;
  trainingDaysPerWeek: number;
  isActive: boolean;
  createdByUserId: string | null; // null = built-in template
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutPlanDay {
  id: string;
  planId: string;
  name: string;                    // e.g., "Push A", "Legs Heavy"
  dayOfWeek: number | null;        // 0=Sun, 1=Mon, ... nullable for flexible
  targetMuscleGroups: MuscleGroup[];
  orderIndex: number;
}

export interface PlanExercise {
  id: string;
  planDayId: string;
  exerciseId: string;
  defaultSets: number;
  defaultReps: number;
  defaultRPE: number | null;       // 1–10 scale
  orderIndex: number;
}

// ── Workout Session ──

export interface WorkoutSession {
  id: string;
  userId: string;
  planId: string | null;           // null for ad-hoc workouts
  planDayId: string | null;
  date: string;                    // ISO date
  startTime: string;               // ISO datetime
  endTime: string | null;          // null while in progress
  status: SessionStatus;
  notes: string | null;
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  orderIndex: number;
  weight: number;
  reps: number;
  rpe: number | null;
  side: SetSide;
  isWarmup: boolean;
  isCompleted: boolean;
  timestamp: string;               // ISO datetime
}

// ── Notification Preference ──

export interface NotificationPreference {
  id: string;
  userId: string;
  type: NotificationType;
  enabled: boolean;
  scheduleRule: string;
}

// ── Helpers ──

export interface ExerciseWithDetails extends Exercise {
  // For plan views - includes default sets/reps
  defaultSets?: number;
  defaultReps?: number;
  defaultRPE?: number | null;
  planExerciseId?: string;
  orderIndex?: number;
}

export interface WorkoutPlanWithDays extends WorkoutPlan {
  days: (WorkoutPlanDay & { exercises: ExerciseWithDetails[] })[];
}

export interface WorkoutSessionWithSets extends WorkoutSession {
  sets: (WorkoutSet & { exerciseName?: string })[];
  totalVolume?: number;
  exerciseCount?: number;
}
