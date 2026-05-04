# MuscleMemory 💪

A premium gym workout tracking app built with React Native (Expo).

## Features (Prompts 1 + 2)

- **5-tab navigation**: Home, Plans, Progress, Library, Settings
- **Dark theme**: Optimized for gym environments
- **SQLite database**: Local-first with 29 built-in exercises
- **3 workout plans**: Push-Pull-Legs, Full Body 3x, Upper-Lower 4-Day
- **Exercise library**: Searchable with muscle group filters
- **Onboarding flow**: Feature highlights with swipeable slides

## Project Structure

```
MuscleMemory/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (providers, theme)
│   ├── onboarding.tsx            # Onboarding flow
│   └── (tabs)/                   # Tab navigation
│       ├── _layout.tsx           # Tab bar configuration
│       ├── index.tsx             # Home screen
│       ├── plans.tsx             # Workout plans
│       ├── progress.tsx          # Analytics & progress
│       ├── library.tsx           # Exercise library
│       └── settings.tsx          # Profile & settings
├── src/
│   ├── theme/                    # Design system
│   │   ├── colors.ts             # Color palette
│   │   ├── typography.ts         # Typography scale
│   │   ├── spacing.ts            # Spacing & layout tokens
│   │   └── index.ts              # Barrel export
│   ├── components/               # Shared UI components
│   │   ├── Button.tsx            # Multi-variant button
│   │   ├── Card.tsx              # Dark elevated card
│   │   ├── StatCard.tsx          # Compact stat display
│   │   ├── EmptyState.tsx        # Empty state with CTA
│   │   ├── SearchBar.tsx         # Search input
│   │   ├── FilterChip.tsx        # Filter pills
│   │   └── index.ts              # Barrel export
│   ├── models/                   # TypeScript domain models
│   │   └── index.ts              # All entity interfaces
│   └── database/                 # SQLite persistence
│       ├── schema.ts             # Table definitions
│       ├── seed.ts               # Default data (exercises + plans)
│       ├── DatabaseProvider.tsx   # React context
│       └── repositories/         # Data access layer
│           ├── ExerciseRepository.ts
│           ├── PlanRepository.ts
│           └── WorkoutRepository.ts
└── assets/                       # App icons & images
```

## Future Prompts

The following prompts will extend this foundation:

- **Prompt 3**: Main screen layouts with real data
- **Prompt 4**: Workout session flow (core logging UX)
- **Prompt 5**: Plan management & schedule/calendar
- **Prompt 6**: Progress & analytics views
- **Prompt 7**: Pro-level UI/UX polish
- **Prompt 8**: Backend sync & extensibility

## Running

```bash
npm start        # Start Expo dev server
npm run ios      # Run on iOS simulator
npm run android  # Run on Android emulator
npm run web      # Run in browser
```
# myfitnesslogger_frontend
