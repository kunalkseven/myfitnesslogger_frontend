/**
 * MuscleMemory — Seed Data
 * Built-in exercise library and default workout plan templates.
 */

import { type SQLiteDatabase } from 'expo-sqlite';

const uid = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  // We use INSERT OR IGNORE in sub-functions to ensure we don't duplicate
  // but also don't skip new data.
  await seedExercises(db);
  await seedPlans(db);
}

async function seedExercises(db: SQLiteDatabase) {
  const exercises = [
    // ── Chest ──
    { id: 'ex_bench_press', name: 'Barbell Bench Press', muscle: 'chest', secondary: '["triceps","shoulders"]', equip: 'barbell', pattern: 'push', diff: 'intermediate', instructions: 'Lie flat on bench. Grip bar slightly wider than shoulders. Lower to mid-chest, press up.', mistakes: 'Flaring elbows too wide. Bouncing bar off chest.' },
    { id: 'ex_db_bench_press', name: 'Dumbbell Bench Press', muscle: 'chest', secondary: '["triceps","shoulders"]', equip: 'dumbbell', pattern: 'push', diff: 'intermediate', instructions: 'Lie flat on bench. Press dumbbells from chest to lockout.', mistakes: 'Clanging dumbbells at top. Not full range.' },
    { id: 'ex_incline_bench', name: 'Incline Barbell Bench Press', muscle: 'chest', secondary: '["triceps","shoulders"]', equip: 'barbell', pattern: 'push', diff: 'intermediate', instructions: 'Set bench to 30-45 degrees. Press bar from upper chest to lockout.', mistakes: 'Bench angle too steep. Not touching chest.' },
    { id: 'ex_incline_db_press', name: 'Incline Dumbbell Press', muscle: 'chest', secondary: '["triceps","shoulders"]', equip: 'dumbbell', pattern: 'push', diff: 'intermediate', instructions: 'Press dumbbells from upper chest on an incline bench.', mistakes: 'Going too vertical.' },
    { id: 'ex_machine_chest_press', name: 'Machine Chest Press', muscle: 'chest', secondary: '["triceps"]', equip: 'machine', pattern: 'push', diff: 'beginner', instructions: 'Sit and press handles forward.', mistakes: 'Incorrect seat height.' },
    { id: 'ex_db_fly', name: 'Dumbbell Fly', muscle: 'chest', secondary: '["shoulders"]', equip: 'dumbbell', pattern: 'isolation', diff: 'beginner', instructions: 'Lie flat, arms extended above chest. Lower dumbbells in arc to sides, squeeze back up.', mistakes: 'Going too heavy. Bending arms too much.' },
    { id: 'ex_cable_crossover', name: 'Cable Crossover', muscle: 'chest', secondary: '["shoulders"]', equip: 'cable', pattern: 'isolation', diff: 'intermediate', instructions: 'Set cables high. Step forward, bring hands together in arc motion.', mistakes: 'Using momentum. Not squeezing at bottom.' },
    { id: 'ex_machine_fly', name: 'Machine Flyes', muscle: 'chest', secondary: '["shoulders"]', equip: 'machine', pattern: 'isolation', diff: 'beginner', instructions: 'Sit and bring machine pads together in front of chest.', mistakes: 'Rounding shoulders.' },
    { id: 'ex_pushup', name: 'Push-Up', muscle: 'chest', secondary: '["triceps","shoulders","core"]', equip: 'bodyweight', pattern: 'push', diff: 'beginner', instructions: 'Hands shoulder-width apart. Lower chest to floor, push back up.', mistakes: 'Sagging hips. Flaring elbows too wide.' },
    // ── Back ──
    { id: 'ex_deadlift', name: 'Barbell Deadlift', muscle: 'back', secondary: '["hamstrings","glutes","core"]', equip: 'barbell', pattern: 'hinge', diff: 'advanced', instructions: 'Stand with feet hip-width. Grip bar, push floor away while keeping back flat.', mistakes: 'Rounding lower back. Pulling with arms.' },
    { id: 'ex_barbell_row', name: 'Barbell Row', muscle: 'back', secondary: '["biceps","core"]', equip: 'barbell', pattern: 'pull', diff: 'intermediate', instructions: 'Hinge at hips, pull bar to lower chest. Squeeze shoulder blades.', mistakes: 'Using too much momentum. Not full range of motion.' },
    { id: 'ex_db_row', name: 'Dumbbell Row', muscle: 'back', secondary: '["biceps"]', equip: 'dumbbell', pattern: 'pull', diff: 'beginner', instructions: 'One hand on bench, pull dumbbell to hip with other.', mistakes: 'Rotating torso too much.' },
    { id: 'ex_pullup', name: 'Pull-Up', muscle: 'back', secondary: '["biceps","forearms"]', equip: 'bodyweight', pattern: 'pull', diff: 'intermediate', instructions: 'Hang from bar with overhand grip. Pull chin above bar.', mistakes: 'Kipping. Not going to full extension.' },
    { id: 'ex_lat_pulldown', name: 'Lat Pulldown', muscle: 'back', secondary: '["biceps"]', equip: 'cable', pattern: 'pull', diff: 'beginner', instructions: 'Grip wide bar, pull to upper chest. Control the return.', mistakes: 'Leaning too far back. Pulling behind neck.' },
    { id: 'ex_seated_row', name: 'Seated Cable Row', muscle: 'back', secondary: '["biceps","traps"]', equip: 'cable', pattern: 'pull', diff: 'beginner', instructions: 'Sit upright, pull handle to stomach. Squeeze shoulder blades together.', mistakes: 'Rounding back. Using momentum.' },
    { id: 'ex_back_extension', name: 'Back Extension', muscle: 'back', secondary: '["hamstrings","glutes"]', equip: 'machine', pattern: 'hinge', diff: 'beginner', instructions: 'Lower torso and raise until body is in line.', mistakes: 'Hyperextending.' },
    // ── Legs ──
    { id: 'ex_squat', name: 'Barbell Back Squat', muscle: 'quadriceps', secondary: '["glutes","hamstrings","core"]', equip: 'barbell', pattern: 'squat', diff: 'intermediate', instructions: 'Bar on upper back, feet shoulder-width. Squat to parallel or below, drive up.', mistakes: 'Knees caving in. Not reaching depth.' },
    { id: 'ex_front_squat', name: 'Front Squat', muscle: 'quadriceps', secondary: '["glutes","core"]', equip: 'barbell', pattern: 'squat', diff: 'advanced', instructions: 'Bar on front delts, elbows high. Squat keeping torso upright.', mistakes: 'Elbows dropping. Leaning forward.' },
    { id: 'ex_leg_press', name: 'Leg Press', muscle: 'quadriceps', secondary: '["glutes","hamstrings"]', equip: 'machine', pattern: 'squat', diff: 'beginner', instructions: 'Feet shoulder-width on platform. Lower sled by bending knees, press back up.', mistakes: 'Locking knees at top. Too narrow foot placement.' },
    { id: 'ex_rdl', name: 'Romanian Deadlift', muscle: 'hamstrings', secondary: '["glutes","back"]', equip: 'barbell', pattern: 'hinge', diff: 'intermediate', instructions: 'Slight knee bend, hinge at hips lowering bar along legs. Feel hamstring stretch.', mistakes: 'Rounding back. Bending knees too much.' },
    { id: 'ex_leg_curl', name: 'Lying Leg Curl', muscle: 'hamstrings', secondary: '["calves"]', equip: 'machine', pattern: 'isolation', diff: 'beginner', instructions: 'Lie face down, curl pad toward glutes. Control the negative.', mistakes: 'Lifting hips. Using momentum.' },
    { id: 'ex_leg_extension', name: 'Leg Extension', muscle: 'quadriceps', secondary: '[]', equip: 'machine', pattern: 'isolation', diff: 'beginner', instructions: 'Sit upright, extend legs to full lockout. Squeeze quads at top.', mistakes: 'Using momentum. Not full extension.' },
    { id: 'ex_calf_raise', name: 'Standing Calf Raise', muscle: 'calves', secondary: '[]', equip: 'machine', pattern: 'isolation', diff: 'beginner', instructions: 'Rise onto toes, hold briefly, lower with control.', mistakes: 'Bouncing. Not full range of motion.' },
    { id: 'ex_lunge', name: 'Walking Lunge', muscle: 'quadriceps', secondary: '["glutes","hamstrings"]', equip: 'dumbbell', pattern: 'squat', diff: 'beginner', instructions: 'Step forward and lower hips.', mistakes: 'Knee hitting floor hard.' },
    // ── Shoulders ──
    { id: 'ex_ohp', name: 'Overhead Press', muscle: 'shoulders', secondary: '["triceps","core"]', equip: 'barbell', pattern: 'push', diff: 'intermediate', instructions: 'Press bar from shoulders to overhead lockout. Keep core tight.', mistakes: 'Excessive back arch. Not locking out.' },
    { id: 'ex_db_shoulder_press', name: 'Dumbbell Shoulder Press', muscle: 'shoulders', secondary: '["triceps"]', equip: 'dumbbell', pattern: 'push', diff: 'beginner', instructions: 'Press dumbbells from shoulder level to overhead.', mistakes: 'Arching back.' },
    { id: 'ex_lateral_raise', name: 'Lateral Raise', muscle: 'shoulders', secondary: '[]', equip: 'dumbbell', pattern: 'isolation', diff: 'beginner', instructions: 'Raise dumbbells to sides until arms parallel to floor.', mistakes: 'Shrugging traps. Swinging weight.' },
    { id: 'ex_cable_lateral_raise', name: 'Cable Lateral Raise', muscle: 'shoulders', secondary: '[]', equip: 'cable', pattern: 'isolation', diff: 'intermediate', instructions: 'Raise cable handle to the side.', mistakes: 'Using too much weight.' },
    { id: 'ex_face_pull', name: 'Face Pull', muscle: 'shoulders', secondary: '["traps"]', equip: 'cable', pattern: 'pull', diff: 'beginner', instructions: 'Set cable high. Pull rope to face, externally rotating shoulders.', mistakes: 'Using too much weight. Not pulling to face level.' },
    { id: 'ex_rear_delt_fly', name: 'Rear Delt Fly', muscle: 'shoulders', secondary: '["traps"]', equip: 'dumbbell', pattern: 'isolation', diff: 'beginner', instructions: 'Bend forward, raise dumbbells to sides squeezing rear delts.', mistakes: 'Using too much weight. Not enough squeeze.' },
    { id: 'ex_shrug', name: 'Dumbbell Shrug', muscle: 'traps', secondary: '[]', equip: 'dumbbell', pattern: 'isolation', diff: 'beginner', instructions: 'Shrug shoulders toward ears.', mistakes: 'Rolling shoulders.' },
    // ── Arms ──
    { id: 'ex_barbell_curl', name: 'Barbell Curl', muscle: 'biceps', secondary: '["forearms"]', equip: 'barbell', pattern: 'isolation', diff: 'beginner', instructions: 'Stand tall, curl bar to shoulders. Keep elbows pinned to sides.', mistakes: 'Swinging body. Moving elbows forward.' },
    { id: 'ex_incline_db_curl', name: 'Incline Dumbbell Curl', muscle: 'biceps', secondary: '[]', equip: 'dumbbell', pattern: 'isolation', diff: 'intermediate', instructions: 'Sit on incline bench, curl dumbbells.', mistakes: 'Swinging.' },
    { id: 'ex_hammer_curl', name: 'Hammer Curl', muscle: 'biceps', secondary: '["forearms"]', equip: 'dumbbell', pattern: 'isolation', diff: 'beginner', instructions: 'Curl with neutral (palms facing) grip. Control the movement.', mistakes: 'Swinging. Not full range of motion.' },
    { id: 'ex_preacher_curl', name: 'Preacher Curl', muscle: 'biceps', secondary: '[]', equip: 'barbell', pattern: 'isolation', diff: 'beginner', instructions: 'Curl bar while arms rest on preacher bench.', mistakes: 'Leaning back.' },
    { id: 'ex_tricep_pushdown', name: 'Tricep Pushdown', muscle: 'triceps', secondary: '[]', equip: 'cable', pattern: 'isolation', diff: 'beginner', instructions: 'Push cable attachment down to full arm extension. Keep elbows tucked.', mistakes: 'Flaring elbows. Leaning too far forward.' },
    { id: 'ex_skull_crusher', name: 'Skull Crusher', muscle: 'triceps', secondary: '[]', equip: 'barbell', pattern: 'isolation', diff: 'intermediate', instructions: 'Lie flat, lower bar to forehead by bending elbows. Press back up.', mistakes: 'Flaring elbows. Going too heavy.' },
    { id: 'ex_close_grip_bench', name: 'Close-Grip Bench Press', muscle: 'triceps', secondary: '["chest"]', equip: 'barbell', pattern: 'push', diff: 'intermediate', instructions: 'Bench press with narrow grip.', mistakes: 'Grip too narrow.' },
    { id: 'ex_dips', name: 'Dips', muscle: 'triceps', secondary: '["chest","shoulders"]', equip: 'bodyweight', pattern: 'push', diff: 'intermediate', instructions: 'Lower body by bending arms. Press back to lockout.', mistakes: 'Going too deep. Swinging body.' },
    // ── Core ──
    { id: 'ex_plank', name: 'Plank', muscle: 'core', secondary: '["shoulders"]', equip: 'bodyweight', pattern: 'isolation', diff: 'beginner', instructions: 'Hold push-up position on forearms. Keep body straight.', mistakes: 'Sagging hips. Holding breath.' },
    { id: 'ex_cable_crunch', name: 'Cable Crunch', muscle: 'core', secondary: '[]', equip: 'cable', pattern: 'isolation', diff: 'beginner', instructions: 'Kneel at cable, crunch down bringing elbows toward knees.', mistakes: 'Using hip flexors. Not enough contraction.' },
    { id: 'ex_hanging_leg_raise', name: 'Hanging Leg Raise', muscle: 'core', secondary: '["forearms"]', equip: 'bodyweight', pattern: 'isolation', diff: 'intermediate', instructions: 'Hang from bar, raise legs to parallel or higher.', mistakes: 'Swinging. Not controlling negative.' },
    { id: 'ex_woodchopper', name: 'Cable Woodchopper', muscle: 'core', secondary: '[]', equip: 'cable', pattern: 'rotation', diff: 'intermediate', instructions: 'Pull cable across body in diagonal motion.', mistakes: 'Moving hips too much.' },
  ];

  for (const ex of exercises) {
    await db.runAsync(
      `INSERT OR IGNORE INTO exercises (id, name, primary_muscle_group, secondary_muscle_groups, equipment_type, movement_pattern, difficulty_level, instructions, common_mistakes, is_built_in) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [ex.id, ex.name, ex.muscle, ex.secondary, ex.equip, ex.pattern, ex.diff, ex.instructions, ex.mistakes]
    );
  }
}

async function seedPlans(db: SQLiteDatabase) {
  // ── Plan 1: Bro Split (One Muscle Per Day) ──
  const broId = 'plan_bro_5';
  const existingBro = await db.getFirstAsync('SELECT id FROM workout_plans WHERE id = ?', [broId]);
  if (!existingBro) {
    await db.runAsync(
      `INSERT INTO workout_plans (id, name, description, split_type, training_days_per_week, is_active, is_built_in) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [broId, 'Bro Split (5-Day)', 'Classic hypertrophy program hitting one major muscle group per session.', 'one_muscle_per_day', 5, 0]
    );

    const broDays = [
      { id: 'bro_chest', name: 'Chest', muscles: '["chest"]', order: 0, exercises: [
        { exId: 'ex_bench_press', sets: 3, reps: 8 },
        { exId: 'ex_incline_db_press', sets: 3, reps: 10 },
        { exId: 'ex_machine_chest_press', sets: 3, reps: 12 },
        { exId: 'ex_cable_crossover', sets: 3, reps: 15 },
      ]},
      { id: 'bro_back', name: 'Back', muscles: '["back"]', order: 1, exercises: [
        { exId: 'ex_pullup', sets: 3, reps: 10 },
        { exId: 'ex_barbell_row', sets: 3, reps: 8 },
        { exId: 'ex_lat_pulldown', sets: 3, reps: 12 },
        { exId: 'ex_seated_row', sets: 3, reps: 12 },
        { exId: 'ex_back_extension', sets: 3, reps: 15 },
      ]},
      { id: 'bro_shoulders', name: 'Shoulders', muscles: '["shoulders"]', order: 2, exercises: [
        { exId: 'ex_ohp', sets: 3, reps: 8 },
        { exId: 'ex_lateral_raise', sets: 3, reps: 15 },
        { exId: 'ex_face_pull', sets: 3, reps: 15 },
        { exId: 'ex_cable_lateral_raise', sets: 2, reps: 15 },
        { exId: 'ex_shrug', sets: 3, reps: 12 },
      ]},
      { id: 'bro_legs', name: 'Legs', muscles: '["quadriceps","hamstrings","calves"]', order: 3, exercises: [
        { exId: 'ex_squat', sets: 4, reps: 8 },
        { exId: 'ex_leg_press', sets: 3, reps: 12 },
        { exId: 'ex_rdl', sets: 3, reps: 10 },
        { exId: 'ex_leg_curl', sets: 3, reps: 12 },
        { exId: 'ex_calf_raise', sets: 4, reps: 15 },
      ]},
      { id: 'bro_arms_abs', name: 'Arms & Abs', muscles: '["biceps","triceps","core"]', order: 4, exercises: [
        { exId: 'ex_barbell_curl', sets: 3, reps: 12 },
        { exId: 'ex_incline_db_curl', sets: 3, reps: 12 },
        { exId: 'ex_close_grip_bench', sets: 3, reps: 8 },
        { exId: 'ex_tricep_pushdown', sets: 3, reps: 12 },
        { exId: 'ex_hanging_leg_raise', sets: 3, reps: 15 },
        { exId: 'ex_cable_crunch', sets: 3, reps: 20 },
      ]},
    ];

    for (const day of broDays) {
      await db.runAsync(
        `INSERT INTO workout_plan_days (id, plan_id, name, target_muscle_groups, order_index) VALUES (?, ?, ?, ?, ?)`,
        [day.id, broId, day.name, day.muscles, day.order]
      );
      for (let i = 0; i < day.exercises.length; i++) {
        const ex = day.exercises[i];
        await db.runAsync(
          `INSERT INTO plan_exercises (id, plan_day_id, exercise_id, default_sets, default_reps, order_index) VALUES (?, ?, ?, ?, ?, ?)`,
          [uid(), day.id, ex.exId, ex.sets, ex.reps, i]
        );
      }
    }
  }

  // ── Plan 2: Push Pull Legs (PPL) 3-Day ──
  const pplId = 'plan_ppl_3';
  const existingPpl = await db.getFirstAsync('SELECT id FROM workout_plans WHERE id = ?', [pplId]);
  if (!existingPpl) {
    await db.runAsync(
      `INSERT INTO workout_plans (id, name, description, split_type, training_days_per_week, is_active, is_built_in) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [pplId, 'PPL (3-Day)', 'Standard Push/Pull/Legs split for efficient total body coverage.', 'ppl', 3, 0]
    );

    const pplDays = [
      { id: 'ppl_push', name: 'Push', muscles: '["chest","shoulders","triceps"]', order: 0, exercises: [
        { exId: 'ex_bench_press', sets: 3, reps: 8 },
        { exId: 'ex_incline_db_press', sets: 2, reps: 10 },
        { exId: 'ex_machine_fly', sets: 2, reps: 15 },
        { exId: 'ex_lateral_raise', sets: 3, reps: 12 },
        { exId: 'ex_dips', sets: 2, reps: 10 },
        { exId: 'ex_tricep_pushdown', sets: 3, reps: 12 },
        { exId: 'ex_cable_crunch', sets: 3, reps: 20 },
      ]},
      { id: 'ppl_pull', name: 'Pull', muscles: '["back","biceps","core"]', order: 1, exercises: [
        { exId: 'ex_pullup', sets: 3, reps: 10 },
        { exId: 'ex_barbell_row', sets: 3, reps: 8 },
        { exId: 'ex_seated_row', sets: 2, reps: 12 },
        { exId: 'ex_face_pull', sets: 3, reps: 15 },
        { exId: 'ex_shrug', sets: 3, reps: 12 },
        { exId: 'ex_barbell_curl', sets: 2, reps: 12 },
        { exId: 'ex_hammer_curl', sets: 2, reps: 12 },
        { exId: 'ex_plank', sets: 3, reps: 60 },
      ]},
      { id: 'ppl_legs', name: 'Legs', muscles: '["quadriceps","hamstrings","glutes","calves"]', order: 2, exercises: [
        { exId: 'ex_squat', sets: 3, reps: 8 },
        { exId: 'ex_leg_press', sets: 3, reps: 12 },
        { exId: 'ex_rdl', sets: 3, reps: 10 },
        { exId: 'ex_leg_curl', sets: 2, reps: 12 },
        { exId: 'ex_calf_raise', sets: 4, reps: 15 },
        { exId: 'ex_hanging_leg_raise', sets: 3, reps: 15 },
      ]},
    ];

    for (const day of pplDays) {
      await db.runAsync(
        `INSERT INTO workout_plan_days (id, plan_id, name, target_muscle_groups, order_index) VALUES (?, ?, ?, ?, ?)`,
        [day.id, pplId, day.name, day.muscles, day.order]
      );
      for (let i = 0; i < day.exercises.length; i++) {
        const ex = day.exercises[i];
        await db.runAsync(
          `INSERT INTO plan_exercises (id, plan_day_id, exercise_id, default_sets, default_reps, order_index) VALUES (?, ?, ?, ?, ?, ?)`,
          [uid(), day.id, ex.exId, ex.sets, ex.reps, i]
        );
      }
    }
  }

  // ── Plan 3: 4-Day PPL + Upper/Lower Hybrid ──
  const hybridId = 'plan_hybrid_4';
  const existingHybrid = await db.getFirstAsync('SELECT id FROM workout_plans WHERE id = ?', [hybridId]);
  if (!existingHybrid) {
    await db.runAsync(
      `INSERT INTO workout_plans (id, name, description, split_type, training_days_per_week, is_active, is_built_in) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [hybridId, 'PPL Hybrid (4-Day)', 'Combines PPL strength days with Upper/Lower volume days.', 'ppl_upper_lower', 4, 0]
    );

    const hybridDays = [
      { id: 'hybrid_push', name: 'Push (Strength)', muscles: '["chest","shoulders","triceps"]', order: 0, exercises: [
        { exId: 'ex_bench_press', sets: 3, reps: 8 },
        { exId: 'ex_incline_db_press', sets: 3, reps: 10 },
        { exId: 'ex_ohp', sets: 3, reps: 8 },
        { exId: 'ex_lateral_raise', sets: 3, reps: 15 },
        { exId: 'ex_skull_crusher', sets: 3, reps: 12 },
        { exId: 'ex_tricep_pushdown', sets: 2, reps: 15 },
      ]},
      { id: 'hybrid_pull', name: 'Pull (Strength)', muscles: '["back","biceps"]', order: 1, exercises: [
        { exId: 'ex_pullup', sets: 3, reps: 8 },
        { exId: 'ex_barbell_row', sets: 3, reps: 8 },
        { exId: 'ex_db_row', sets: 2, reps: 10 },
        { exId: 'ex_face_pull', sets: 3, reps: 15 },
        { exId: 'ex_barbell_curl', sets: 3, reps: 12 },
        { exId: 'ex_incline_db_curl', sets: 2, reps: 12 },
      ]},
      { id: 'hybrid_upper', name: 'Upper (Volume)', muscles: '["chest","back","shoulders","arms"]', order: 2, exercises: [
        { exId: 'ex_lat_pulldown', sets: 3, reps: 12 },
        { exId: 'ex_db_row', sets: 3, reps: 12 },
        { exId: 'ex_incline_db_press', sets: 4, reps: 10 },
        { exId: 'ex_cable_crossover', sets: 3, reps: 15 },
        { exId: 'ex_db_shoulder_press', sets: 2, reps: 12 },
        { exId: 'ex_preacher_curl', sets: 3, reps: 12 },
        { exId: 'ex_tricep_pushdown', sets: 3, reps: 12 },
      ]},
      { id: 'hybrid_lower', name: 'Lower (Volume)', muscles: '["quadriceps","hamstrings","glutes","calves","core"]', order: 3, exercises: [
        { exId: 'ex_rdl', sets: 4, reps: 8 },
        { exId: 'ex_leg_curl', sets: 3, reps: 12 },
        { exId: 'ex_front_squat', sets: 3, reps: 10 },
        { exId: 'ex_lunge', sets: 3, reps: 12 },
        { exId: 'ex_calf_raise', sets: 4, reps: 15 },
        { exId: 'ex_hanging_leg_raise', sets: 3, reps: 15 },
        { exId: 'ex_woodchopper', sets: 3, reps: 20 },
      ]},
    ];

    for (const day of hybridDays) {
      await db.runAsync(
        `INSERT INTO workout_plan_days (id, plan_id, name, target_muscle_groups, order_index) VALUES (?, ?, ?, ?, ?)`,
        [day.id, hybridId, day.name, day.muscles, day.order]
      );
      for (let i = 0; i < day.exercises.length; i++) {
        const ex = day.exercises[i];
        await db.runAsync(
          `INSERT INTO plan_exercises (id, plan_day_id, exercise_id, default_sets, default_reps, order_index) VALUES (?, ?, ?, ?, ?, ?)`,
          [uid(), day.id, ex.exId, ex.sets, ex.reps, i]
        );
      }
    }
  }
}
