# Data Model

TypeScript types, AsyncStorage schema, and the full AppContext API.

---

## Table of Contents

- [Core Types](#core-types)
- [AsyncStorage Keys](#asyncstorage-keys)
- [AppContext API](#appcontext-api)
- [Constants](#constants)
- [Theme Tokens](#theme-tokens)

---

## Core Types

```typescript
// ─── User ─────────────────────────────────────────────────────────────────────

interface User {
  name: string;
  email: string;
  initials: string;  // first 2 chars of name, uppercased
  avatarId?: string; // key into AVATAR_ICON_MAP (e.g. "cherry", "rabbit")
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

interface Task {
  id: string;          // Date.now().toString() at creation
  name: string;
  minutes: number;     // estimated focus duration
  color: string;       // hex from COLORS array
  icon: string;        // lucide icon name (legacy; not used in rendering)
  category?: string;   // user-defined label
}

interface CompletedTask {
  id: string;
  taskId: string;
  taskName: string;
  color: string;
  icon: string;
  category?: string;
  minutesEstimated: number;
  minutesActual: number;  // actual Pomodoro seconds / 60 at completion
  completedAt: Date;      // ISO string in storage, parsed to Date on load
}

// ─── Pomodoro ─────────────────────────────────────────────────────────────────

interface PomodoroSession {
  taskId: string;
  taskName: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

// ─── Rest Mode ────────────────────────────────────────────────────────────────

type RestCategory = 'Physical' | 'Mental' | 'Social' | 'Nourishment' | 'My Tasks';
type DailyMood    = 'drained' | 'okay' | 'restless' | null;
type RestGoalTier = 'easy' | 'standard' | 'dedicated';

interface RestTask {
  id: string;
  name: string;
  isPreset: boolean;
  completedToday: boolean;
  durationMinutes: number;
  category: RestCategory;
  skippedToday?: boolean;  // legacy field; no longer set by UI
}

interface ActiveRestTimer {
  taskId: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

// ─── Achievements ─────────────────────────────────────────────────────────────

interface AchievementValues {
  streak: number;   // current streak count
  tasks: number;    // total tasks completed ever
  focus: number;    // total focus minutes from Pomodoro sessions
  speed: number;    // tasks completed within their estimated time
  rest: number;     // total rest days completed (goal met)
  spin: number;     // total wheel spins
}
```

---

## AsyncStorage Keys

All keys are namespaced under `wheelTodo.*`.

| Key | Value Type | Description | Resets? |
|-----|-----------|-------------|---------|
| `wheelTodo.tasks` | `Task[]` | Active (uncompleted) tasks | Manual delete only |
| `wheelTodo.completedTasks` | `CompletedTask[]` | All-time task history | Manual delete only |
| `wheelTodo.user` | `User \| null` | User profile | On sign out |
| `wheelTodo.categories` | `string[]` | User-defined task labels | Manual delete only |
| `wheelTodo.seenAchievements` | `string[]` | Badge names already toasted | Manual delete only |
| `wheelTodo.spinCount` | `number` | Cumulative wheel spins | Manual delete only |
| `wheelTodo.restTasks` | `RestTask[]` | Preset + custom rest tasks | Daily reset of `completedToday` |
| `wheelTodo.restTasksDate` | `string` (toDateString) | Date rest tasks were last saved | Updated each save |
| `wheelTodo.completedRestDays` | `string[]` (ISO) | Days where rest goal was met | Manual delete only |
| `wheelTodo.partialRestDays` | `{date: string; pct: number}[]` | Incomplete rest days | Manual delete only |
| `wheelTodo.todayMood` | `DailyMood` | Today's energy check-in | Next day (checked against `todayMoodDate`) |
| `wheelTodo.todayMoodDate` | `string` (toDateString) | Date mood was set | Updated each save |
| `wheelTodo.restGoalTier` | `RestGoalTier` | Selected rest goal | Manual change only |
| `wheelTodo.hasSeenOnboarding` | `boolean` | Whether to skip 3-step modal | Never |
| `wheelTodo.hasSeenSpinHint` | `boolean` | Whether to skip spin tooltip | Never |
| `wheelTodo.hasSeenRestTooltip` | `boolean` | Whether to skip rest tooltip | Never |
| `wheelTodo.hasSeenStreakExplanation` | `boolean` | Whether to skip streak explainer | Never |
| `wheelTodo.settings.defaultTimer` | `number` | Default Pomodoro minutes (5–120) | Manual change only |
| `wheelTodo.settings.dailyGoal` | `number` | Target tasks per day (1–20) | Manual change only |
| `wheelTodo.settings.notifications` | `boolean` | Push notification toggle | Manual change only |
| `wheelTodo.settings.wheelSound` | `boolean` | Wheel spin sound toggle | Manual change only |

**Load strategy:** All keys are loaded in a single `AsyncStorage.multiGet` call on app boot. The context exposes a `loaded` boolean; screens do not render until `loaded === true`.

**Write strategy:** Each slice of state has a `useEffect` that persists to AsyncStorage on every change. No debouncing.

---

## AppContext API

The full interface exposed by `useApp()`.

### State (read-only)

```typescript
// User
user: User | null
loaded: boolean

// Tasks
tasks: Task[]
completedTasks: CompletedTask[]
taskProgress: Record<string, number>  // taskId → remaining seconds

// Pomodoro
pomodoroSession: PomodoroSession | null

// Settings
defaultTimerMinutes: number
dailyGoal: number
notificationsEnabled: boolean
wheelSoundEnabled: boolean
categories: string[]

// Rest Mode
restTasks: RestTask[]
completedRestDays: Date[]
partialRestDays: { date: Date; pct: number }[]
activeRestTimer: ActiveRestTimer | null
todayMood: DailyMood
restGoalTier: RestGoalTier
restGoalMinutes: number        // derived: 15 | 30 | 45
restMinutesToday: number       // derived: sum of completed rest task durations

// Streaks (all computed, never stored directly)
streak: number
bestStreak: number
hasActivityToday: boolean
restStreak: number
bestRestStreak: number

// Achievements
achievementValues: AchievementValues
unlockedTierIds: string[]
spinCount: number
seenAchievements: string[]
pendingAchievementToast: string | null  // badge name, if any

// Onboarding
hasSeenOnboarding: boolean
```

### Methods

```typescript
// ─── User ─────────────────────────────────────────────────────────────────────
login(email: string, password: string): void
logout(): void
updateUser(name: string, email: string, avatarId?: string): void

// ─── Tasks ────────────────────────────────────────────────────────────────────
addTask(task: Omit<Task, 'id'>): void
updateTask(id: string, updates: Partial<Task>): void
deleteTask(id: string): void
completeTask(taskId: string, minutesActual: number): void
uncompleteTask(completedTaskId: string): void  // moves back to active

// ─── Pomodoro ─────────────────────────────────────────────────────────────────
startPomodoro(task: Task): void
pausePomodoro(): void
resumePomodoro(): void
completePomodoro(): void
tickPomodoro(): void  // called every 1 000 ms from TasksScreen effect

// ─── Settings ─────────────────────────────────────────────────────────────────
setDefaultTimerMinutes(minutes: number): void  // clamped to 5–120
setDailyGoal(goal: number): void               // clamped to 1–20
setNotificationsEnabled(enabled: boolean): void
setWheelSoundEnabled(enabled: boolean): void

// ─── Categories ───────────────────────────────────────────────────────────────
addCategory(cat: string): void
removeCategory(cat: string): void

// ─── Rest Mode ────────────────────────────────────────────────────────────────
toggleRestTask(id: string): void            // flips completedToday
addRestTask(name: string, durationMinutes?: number): void
removeRestTask(id: string): void            // custom tasks only
startRestTimer(taskId: string): void
cancelRestTimer(): void
tickRestTimer(): void                       // called every 1 000 ms from RestScreen effect
setTodayMood(mood: DailyMood): void
setRestGoalTier(tier: RestGoalTier): void

// ─── Achievements ─────────────────────────────────────────────────────────────
incrementSpinCount(): void
markAchievementSeen(label: string): void
clearAchievementToast(): void

// ─── Onboarding ───────────────────────────────────────────────────────────────
markOnboardingSeen(): void
markSpinHintSeen(): void
markRestTooltipSeen(): void
markStreakExplanationSeen(): void
```

---

## Constants

### Task Colours

```typescript
const COLORS = [
  '#FF5C4D',  // red-orange
  '#FF9B50',  // orange
  '#4ECDC4',  // teal
  '#FFE66D',  // yellow
  '#A78BFA',  // purple
  '#F9A8D4',  // pink
];
```

### Rest Goal Minutes

```typescript
const REST_GOAL_MINUTES: Record<RestGoalTier, number> = {
  easy:      15,
  standard:  30,
  dedicated: 45,
};
```

### Preset Rest Tasks

```typescript
const PRESET_REST_TASKS: RestTask[] = [
  { id: 'preset_1',  name: 'Get a coffee',             durationMinutes: 5,  category: 'Nourishment' },
  { id: 'preset_2',  name: 'Go for a walk',            durationMinutes: 20, category: 'Physical'    },
  { id: 'preset_3',  name: 'Read',                     durationMinutes: 10, category: 'Mental'      },
  { id: 'preset_4',  name: 'Stretch',                  durationMinutes: 10, category: 'Physical'    },
  { id: 'preset_5',  name: 'Call a friend',            durationMinutes: 15, category: 'Social'      },
  { id: 'preset_6',  name: 'Take a nap',               durationMinutes: 30, category: 'Physical'    },
  { id: 'preset_7',  name: 'Cook something',           durationMinutes: 20, category: 'Nourishment' },
  { id: 'preset_8',  name: 'Go for a run',             durationMinutes: 30, category: 'Physical'    },
  { id: 'preset_9',  name: 'Journal',                  durationMinutes: 10, category: 'Mental'      },
  { id: 'preset_10', name: 'Watch something you enjoy',durationMinutes: 30, category: 'Mental'      },
];
```

### Achievement Definitions

```typescript
const ACHIEVEMENT_DEFS = [
  {
    id: 'streak',
    name: 'On Fire',
    icon: Flame,
    color: '#FF5C4D',
    tiers: [
      { id: 'streak_1', badge: 'Spark',   target: 3   },
      { id: 'streak_2', badge: 'Blazing', target: 7   },
      { id: 'streak_3', badge: 'Inferno', target: 30  },
      { id: 'streak_4', badge: 'Eternal', target: 100 },
    ],
  },
  {
    id: 'tasks',
    name: 'Achiever',
    icon: Trophy,
    color: '#A78BFA',
    tiers: [
      { id: 'tasks_1', badge: 'First Step', target: 1   },
      { id: 'tasks_2', badge: 'Momentum',   target: 10  },
      { id: 'tasks_3', badge: 'Achiever',   target: 50  },
      { id: 'tasks_4', badge: 'Century',    target: 100 },
    ],
  },
  {
    id: 'focus',
    name: 'Deep Work',
    icon: Clock,
    color: '#4ECDC4',
    tiers: [
      { id: 'focus_1', badge: 'Focused',    target: 60   },
      { id: 'focus_2', badge: 'In The Zone',target: 300  },
      { id: 'focus_3', badge: 'Deep Work',  target: 600  },
      { id: 'focus_4', badge: 'Flow State', target: 3000 },
    ],
  },
  {
    id: 'speed',
    name: 'Speed Run',
    icon: Zap,
    color: '#FFE66D',
    tiers: [
      { id: 'speed_1', badge: 'Quick Fix',  target: 1  },
      { id: 'speed_2', badge: 'Sprinter',   target: 5  },
      { id: 'speed_3', badge: 'Road Runner',target: 20 },
    ],
  },
  {
    id: 'rest',
    name: 'Rest Champion',
    icon: Moon,
    color: '#93C5FD',
    tiers: [
      { id: 'rest_1', badge: 'Day Off',   target: 1  },
      { id: 'rest_2', badge: 'Balanced',  target: 7  },
      { id: 'rest_3', badge: 'Zen Master',target: 30 },
    ],
  },
  {
    id: 'spin',
    name: 'Spin Doctor',
    icon: RotateCcw,
    color: '#F9A8D4',
    tiers: [
      { id: 'spin_1', badge: 'First Spin',       target: 1  },
      { id: 'spin_2', badge: 'Spin Doctor',       target: 10 },
      { id: 'spin_3', badge: 'Wheel of Fortune',  target: 50 },
    ],
  },
];
```

---

## Theme Tokens

```typescript
// src/theme/tokens.ts

export const TOKENS = {
  colors: {
    bg: {
      screen: '#f2f0eb',   // warm off-white (app background)
      card:   '#ffffff',   // white cards
      input:  '#f7f6f3',   // slightly warm input fields
    },
    text: {
      primary:   '#111111',  // near-black
      secondary: '#aaaaaa',  // medium grey
      muted:     '#bbbbbb',  // light grey
    },
    action: {
      primary: '#111111',   // black (buttons, active states)
      streak:  '#FF5C4D',   // streak orange / danger
      success: '#22a722',   // green (completion states)
      danger:  '#FF5C4D',   // same as streak (validation errors)
    },
    accent: {
      heading: '#FF5C4D',   // accent titles (second title line)
    },
    rest: {
      physical:    '#FF9B50',  // orange
      mental:      '#A78BFA',  // purple
      social:      '#4ECDC4',  // teal
      nourishment: '#FFE66D',  // yellow
      custom:      '#93C5FD',  // blue
    },
    wheel: ['#FF5C4D','#FF9B50','#4ECDC4','#FFE66D','#A78BFA','#F9A8D4'],
    wheelLight: ['#FFE8E6','#FFF0E8','#E8FAFA','#FFFAE8','#F0EEFF','#FEF0F8'],
  },
  radius: {
    card:  20,
    row:   16,
    pill:  100,
    sheet: 28,
    tag:   100,
  },
  spacing: {
    screenPad: 18,
    cardPad:   14,
    rowGap:    8,
  },
};
```
