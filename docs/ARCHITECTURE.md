# Architecture

Technical overview of WheelTodo's structure, navigation, data flow, and key logic paths.

---

## Table of Contents

- [Navigation Structure](#navigation-structure)
- [Screen Flow](#screen-flow)
- [State Architecture](#state-architecture)
- [Task Lifecycle](#task-lifecycle)
- [Streak Logic](#streak-logic)
- [Rest Mode Flow](#rest-mode-flow)
- [Achievement System](#achievement-system)
- [Data Persistence](#data-persistence)

---

## Navigation Structure

WheelTodo uses two nested navigators from React Navigation v6.

```
Root (Native Stack)
├── MainTabs  ← default
│   ├── Spin       (RotateCcw icon)
│   ├── Tasks      (ListTodo icon)
│   ├── Rest       (Moon icon)
│   └── History    (Clock icon)
├── Profile   (push, headerShown: false)
└── EditProfile (push, headerShown: false)
```

The header bar (streak badge + avatar button) is rendered **outside** the native stack header in a custom `MainTabsWithHeader` component. This avoids iOS `UIBarButtonItem` styling constraints.

```
LoginScreen          (shown when user === null)
     │
     ▼ login()
MainTabsWithHeader   (always mounted while user !== null)
├── Custom header bar  ←  streak badge + avatar press → Profile
└── MainTabs (bottom tabs)
```

---

## Screen Flow

```mermaid
flowchart TD
    A([App Start]) --> B{user in\nAsyncStorage?}
    B -- No --> C[LoginScreen]
    B -- Yes --> D[MainTabsWithHeader]
    C -- login / sign up --> D

    D --> E[Spin Tab]
    D --> F[Tasks Tab]
    D --> G[Rest Tab]
    D --> H[History Tab]
    D -- avatar button --> I[ProfileScreen]

    E -- Start Focus --> F
    I -- edit row press --> J[EditProfileScreen]
    J -- Save / Cancel --> I
    I -- Sign Out --> C
```

---

## State Architecture

All app state lives in a single `AppContext` (React Context + `useState`). There is no Redux, Zustand, or external store. The context is provided at the root in `App.tsx` and consumed in every screen.

```mermaid
graph TD
    AppContext["AppContext\n(single source of truth)"]

    AppContext --> Tasks["Tasks\n(active task list)"]
    AppContext --> Completed["CompletedTasks\n(history)"]
    AppContext --> Pomodoro["PomodoroSession\n(active timer)"]
    AppContext --> RestTasks["RestTasks\n(preset + custom)"]
    AppContext --> RestTimer["ActiveRestTimer"]
    AppContext --> User["User\n(profile + avatar)"]
    AppContext --> Settings["Settings\n(timer, goal, notifications)"]
    AppContext --> Achievements["Achievements\n(unlocked tiers + toast)"]
    AppContext --> Streaks["Streaks\n(computed from dates)"]

    Tasks --> SpinScreen
    Tasks --> TasksScreen
    Completed --> HistoryScreen
    Pomodoro --> TasksScreen
    RestTasks --> RestScreen
    RestTimer --> RestScreen
    User --> ProfileScreen
    User --> AppNavigator
    Settings --> ProfileScreen
    Achievements --> ProfileScreen
    Achievements --> SpinScreen
    Streaks --> HistoryScreen
    Streaks --> AppNavigator
```

**Key design decisions:**
- Streaks are **computed** from raw date arrays (`completedTasks` and `completedRestDays`) — never stored as a number, so they can never go stale.
- Achievements are **computed** from `achievementValues` (a derived object of counts) — unlocking is automatic and idempotent.
- The Pomodoro timer is driven by a `setInterval` in `TasksScreen` that calls `tickPomodoro()` every 1 000 ms. The timer state itself lives in context.

---

## Task Lifecycle

```mermaid
flowchart LR
    A([Add Task\nTasksScreen FAB]) --> B[tasks array\nin context]
    B --> C{User picks\ntask}
    C -- Spins wheel --> D[SpinScreen result\nsheet]
    C -- Taps timer icon --> E[Pomodoro starts\ndirectly]
    D -- Start Focus --> E
    E --> F{Timer\nfinishes?}
    F -- Yes: auto-complete --> G[completeTask called]
    F -- No: taps Done early --> G
    G --> H[Task removed\nfrom active list]
    G --> I[CompletedTask entry\nadded to history]
    I --> J[Streak recalculated]
    I --> K[Achievements checked]
    H --> L{Undo?}
    L -- uncompleteTask --> B
```

---

## Streak Logic

A streak day is any calendar day where the user either:
- Completed at least one task (`completedTasks`), **or**
- Hit their rest goal (`completedRestDays`)

```mermaid
flowchart TD
    A([Calculate streak\nfor today]) --> B[Get sorted unique\nactivity dates]
    B --> C{Is today\nan activity day?}
    C -- No --> D[streak = 0]
    C -- Yes --> E[Count = 1\ncheck yesterday]
    E --> F{Is previous day\nan activity day?}
    F -- Yes --> G[Count + 1\ncheck day before]
    G --> F
    F -- No --> H[streak = Count]

    I([Rest goal check]) --> J{restMinutesToday\n>= restGoalMinutes?}
    J -- Yes --> K[Add today to\ncompletedRestDays]
    J -- No --> L[Add today to\npartialRestDays with %]
    K --> B
```

**Rest goal tiers:**

| Tier | Minutes |
|------|---------|
| Easy | 15 |
| Standard | 30 (default) |
| Dedicated | 45 |

---

## Rest Mode Flow

```mermaid
flowchart TD
    A([Open Rest tab]) --> B{todayMood\nset?}
    B -- No --> C[Show Energy Check-in\nDrained / Okay / Restless]
    C --> D[Set mood → sort\nsuggested tasks first]
    B -- Yes --> E[Show tasks in\ncategory sections]
    D --> E

    E --> F{User action}
    F -- Tap checkbox --> G[toggleRestTask\ncompletedToday flips]
    F -- Tap timer icon --> H[startRestTimer\ncountdown begins]
    H --> I{Timer hits 0}
    I --> J[Task auto-marked\ncompletedToday = true]
    G --> K[restMinutesToday\nrecalculated]
    J --> K
    K --> L{>= restGoalMinutes?}
    L -- Yes --> M[Today added to\ncompletedRestDays]
    M --> N[Show celebration\nmodal + confetti]
    M --> O[Streak updated]
    L -- No --> P[partialRestDays\nupdated with %]
```

**Daily reset:** On app launch, if the stored `restTasksDate` differs from today, all `completedToday` flags are reset to `false`. Custom tasks are preserved; preset tasks reload from `PRESET_REST_TASKS`.

---

## Achievement System

Six achievement tracks, each with 3–4 tiers. Tiers unlock automatically when the threshold is crossed and fire a toast notification once.

```mermaid
graph LR
    subgraph Inputs
        S[streak count]
        T[tasks completed]
        F[focus minutes]
        SP[speed tasks]
        R[rest days]
        W[wheel spins]
    end

    subgraph Tracks
        A1[On Fire\nstreak milestones]
        A2[Achiever\ntask milestones]
        A3[Deep Work\nfocus milestones]
        A4[Speed Run\nunder-time completions]
        A5[Rest Champion\nrest day milestones]
        A6[Spin Doctor\nwheel spin milestones]
    end

    S --> A1
    T --> A2
    F --> A3
    SP --> A4
    R --> A5
    W --> A6

    A1 --> Toast([Achievement toast\nfloats from bottom])
    A2 --> Toast
    A3 --> Toast
    A4 --> Toast
    A5 --> Toast
    A6 --> Toast
```

| Track | Tiers |
|-------|-------|
| On Fire (streak) | Spark (3) · Blazing (7) · Inferno (30) · Eternal (100) |
| Achiever (tasks) | First Step (1) · Momentum (10) · Achiever (50) · Century (100) |
| Deep Work (focus min) | Focused (60) · In The Zone (300) · Deep Work (600) · Flow State (3 000) |
| Speed Run (on-time) | Quick Fix (1) · Sprinter (5) · Road Runner (20) |
| Rest Champion (rest days) | Day Off (1) · Balanced (7) · Zen Master (30) |
| Spin Doctor (spins) | First Spin (1) · Spin Doctor (10) · Wheel of Fortune (50) |

---

## Data Persistence

Everything is stored locally in AsyncStorage. There is no backend or cloud sync in the current version.

```mermaid
graph TD
    Context["AppContext\n(in-memory state)"] -- on state change --> AS["AsyncStorage\n(on-device)"]
    AS -- on app launch --> Context

    subgraph Stored Keys
        K1[wheelTodo.tasks]
        K2[wheelTodo.completedTasks]
        K3[wheelTodo.user]
        K4[wheelTodo.restTasks]
        K5[wheelTodo.restTasksDate]
        K6[wheelTodo.completedRestDays]
        K7[wheelTodo.partialRestDays]
        K8[wheelTodo.todayMood + date]
        K9[wheelTodo.spinCount]
        K10[wheelTodo.seenAchievements]
        K11[wheelTodo.categories]
        K12[wheelTodo.settings.*]
        K13[wheelTodo.hasSeenOnboarding]
    end
```

**Write strategy:** State is persisted in `useEffect` hooks that watch each slice of state. There is no debouncing — writes are immediate on every state change.

**Read strategy:** All keys are loaded in a single `AsyncStorage.multiGet` call on app boot. The app shows a loading state until this resolves.
