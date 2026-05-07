# Screens Reference

Layout and component inventory for every screen in WheelTodo.

---

## Table of Contents

- [Login Screen](#login-screen)
- [Persistent Header](#persistent-header)
- [Spin Screen](#spin-screen)
- [Tasks Screen](#tasks-screen)
- [Rest Screen](#rest-screen)
- [History Screen](#history-screen)
- [Profile Screen](#profile-screen)
- [Edit Profile Screen](#edit-profile-screen)

---

## Login Screen

**File:** `src/screens/LoginScreen.tsx`  
**Route:** Shown when `user === null` in context

```
┌─────────────────────────┐
│                         │
│       ◎                │  ← Logo circle
│    Wheel Todo           │  ← App name
│  Spin. Focus. Done.     │  ← Tagline
│                         │
│  ┌───────────────────┐  │
│  │  Email            │  │  ← email-address keyboard
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │  Password         │  │  ← secureTextEntry
│  └───────────────────┘  │
│                         │
│  [ Sign in ]            │  ← primary button
│                         │
│  ── or ──               │
│                         │
│  [ Continue with Apple ]│  ← iOS only
│  [ Continue with Google]│
│                         │
│  No account? Sign up    │  ← link text
│                         │
└─────────────────────────┘
```

**State:** `email`, `password` (local)  
**Actions:** `login(email, password)` → `onLogin()` callback

---

## Persistent Header

**File:** `src/navigation/AppNavigator.tsx` — `MainTabsWithHeader`  
**Renders above:** All four main tabs

```
┌───────────────────────────────┐
│  🔥 12          (●)           │
│  streak badge   avatar button │
└───────────────────────────────┘
```

| Element | Tap destination |
|---------|----------------|
| Streak badge (flame + number) | History tab |
| Avatar button | Profile screen |

---

## Spin Screen

**File:** `src/screens/SpinScreen.tsx`  
**Tab:** Spin (RotateCcw icon)

```
┌─────────────────────────┐
│  Not sure where         │  ← title line 1 (primary)
│  to start?              │
│  Spin the wheel.        │  ← title line 2 (accent colour)
│                         │
│  ╔═══════════════════╗  │
│  ║  How do I use     ║  │  ← FAQ accordion (collapsed)
│  ╚═══════════════════╝  │
│                         │
│  M  T  W  T  F  S  S   │  ← weekly activity bubbles
│  ●  ○  ●  ●  ○  ○  ○   │
│                         │
│  ┌─────────────────┐    │
│  │                 │    │
│  │   [ WHEEL ]     │    │  ← spinning wheel (canvas)
│  │                 │    │
│  └─────────────────┘    │
│                         │
│  ╔═══════════════════╗  │
│  ║  Next: Blazing    ║  │  ← next achievement card
│  ╚═══════════════════╝  │
└─────────────────────────┘
```

**Result Bottom Sheet** (slides up after spin/tap):

```
┌─────────────────────────┐
│   ● You got             │
│   Write blog post       │
│   25-minute focus       │
│                         │
│   [ Start Focus ]       │
│   [ Dismiss ]           │
└─────────────────────────┘
```

---

## Tasks Screen

**File:** `src/screens/TasksScreen.tsx`  
**Tab:** Tasks (ListTodo icon)

```
┌─────────────────────────┐
│  ╔═══════════════════╗  │
│  ║  How do tasks     ║  │  ← FAQ accordion
│  ╚═══════════════════╝  │
│                         │
│  ┌──────┬───────┬─────┐ │
│  │ 45m  │ 2/5   │ 40% │ │  ← stats bar (shown if done > 0)
│  │ Done │ Tasks │ Goal│ │
│  └──────┴───────┴─────┘ │
│                         │
│  ╔═══════════════════╗  │
│  ║  ● Write blog…    ║  │  ← Focus card (when Pomodoro active)
│  ║  [====    ] 18:42 ║  │
│  ║  [ Pause ] [ Done]║  │
│  ╚═══════════════════╝  │
│                         │
│  TODAY'S TASKS     [+]  │  ← section label + FAB
│                         │
│  ← ● Write blog 25m ⏱ →│  ← swipeable task row
│  ← ● Review code  15m ⏱→│
│  ← ● Design mocks 30m ⏱→│
│                         │
└─────────────────────────┘
```

**Swipe interactions:**

```
Swipe right >80px:  ┌─────────────────┐
                    │ ✓ Done          │  ← green background
                    └─────────────────┘

Swipe left >80px:   ┌─────────────────┐
                    │         Delete ×│  ← red background
                    └─────────────────┘
```

**Add/Edit Task Sheet:**

```
┌─────────────────────────┐
│  ▬▬▬  (drag handle)    │
│                         │
│  Add task               │
│  What needs doing?      │
│                         │
│  ┌───────────────────┐  │
│  │ Task name         │  │
│  └───────────────────┘  │
│                         │
│  COLOUR                 │
│  ● ● ● ● ● ●           │
│                         │
│  DURATION               │
│  [ 0 ]h  [ 25 ]m       │
│                         │
│  CATEGORY               │
│  [Work] [Personal] [+]  │
│                         │
│  [ Add task ]           │
└─────────────────────────┘
```

---

## Rest Screen

**File:** `src/screens/RestScreen.tsx`  
**Tab:** Rest (Moon icon)

```
┌─────────────────────────┐
│  Need a day off?        │  ← title
│  Take it easy today.    │  ← subtitle (accent; "Streak at risk!" if at risk)
│                         │
│  ╔═══════════════════╗  │
│  ║  How does Rest    ║  │  ← FAQ accordion
│  ╚═══════════════════╝  │
│                         │
│  ┌───────────────────┐  │
│  │ Rest Meter    20/30m │  ← rest meter card
│  │ [████░░░░░░░░░░░] │  │
│  │ 10m more to protect  │
│  └───────────────────┘  │
│                         │
│  🌙 3-day rest streak   │  ← badge (if restStreak > 0)
│                         │
│  ┌───────────────────┐  │
│  │ How are you       │  │  ← energy check-in (if mood not set)
│  │ feeling?          │  │
│  │ [Drained][Okay][Restless]│
│  └───────────────────┘  │
│                         │
│  ┌── Physical ─── 0/4 ┐ │  ← category section (collapsible)
│  │ ○ Go for a walk 20m⏱│ │
│  │ ○ Stretch      10m⏱│ │
│  │ ○ Take a nap   30m⏱│ │
│  │ ○ Go for a run 30m⏱│ │
│  └───────────────────┘  │
│                         │
│  MY TASKS               │
│  ┌───────────────────┐  │
│  │ Add your own…  [+]│  │  ← custom task input
│  └───────────────────┘  │
└─────────────────────────┘
```

**Task row states:**

```
Normal:    ○ Go for a walk    20m  ⏱

Active:    ⏱ Go for a walk  14:23  ×
           [████████░░░░░░░░░░]

Done:      ✓ ~~Go for a walk~~ 20m
```

**Celebration modal:**

```
┌─────────────────────────┐
│  🌿                     │
│  Rest complete!         │
│  Streak protected.      │
│                         │
│  [ Close ]              │
└─────────────────────────┘
```

---

## History Screen

**File:** `src/screens/HistoryScreen.tsx`  
**Tab:** History (Clock icon)

```
┌─────────────────────────┐
│  Your progress.         │  ← title
│  Look how far           │
│  you've come.           │  ← subtitle (accent)
│                         │
│  ╔═══════════════════╗  │
│  ║  How do streaks   ║  │  ← streak explanation accordion
│  ╚═══════════════════╝  │
│                         │
│  ┌──────┬───────┬──────┐│
│  │  47  │ 🔥 12 │  ○ 3 ││  ← stats card
│  │Tasks │Streak │Rest  ││
│  │ Done │       │Streak││
│  └──────┴───────┴──────┘│
│                         │
│  < This Week >          │  ← week selector
│  ┌───────────────────┐  │
│  │ M  T  W  T  F  S  S │  ← 7-day grid
│  │ ● ○ ● ● ○ ○ ○      │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ 🎯 2 more days to │  │  ← milestone card
│  │    7-day streak   │  │
│  └───────────────────┘  │
│                         │
│  TODAY                  │
│  ✓ Write blog post  25m │  ← task history
│  ✓ Review code      15m │
│                         │
│  YESTERDAY              │
│  ✓ Design mockups   30m │
└─────────────────────────┘
```

**Week bubble colour key:**

```
●  Black fill   = task completed this day
●  Orange fill  = today (active)
◎  Orange ring  = today (no activity)
●  Purple fill  = rest day (no tasks)
●  Light grey   = partial rest / inactive
·  Very light   = future
```

---

## Profile Screen

**File:** `src/screens/ProfileScreen.tsx`  
**Route:** Stack screen (push from header avatar)

```
┌─────────────────────────┐
│  ← (back)               │
│                         │
│  ┌──────────────────────│  ← avatar row (pressable → Edit Profile)
│  │  (●) Alex Chen  >   ││
│  │      alex@...        ││
│  └──────────────────────│
│                         │
│  ┌──────┬───────┬──────┐│
│  │  47  │  1.2h │  89% ││  ← stats card
│  │Tasks │ Hours │On Time││
│  └──────┴───────┴──────┘│
│                         │
│  ACHIEVEMENTS           │
│  ┌───────────────────┐  │
│  │ 🔥 On Fire   7/30 │  │  ← achievement card (× 6)
│  │  ●  ●  ○  ○       │  │  ← tier dots
│  └───────────────────┘  │
│                         │
│  SETTINGS               │
│  Default timer  − 25m + │
│  Daily goal     − 5  +  │
│  Notifications  ○──     │
│  Wheel sound    ○──     │
│                         │
│  REST GOAL              │
│  [Easy] [Standard] [Dedicated]│
│                         │
│  TASK LABELS            │
│  [Work×] [Personal×] [+]│
│                         │
│  Create an account →    │  ← coming soon CTA
│                         │
│  × Sign Out             │
└─────────────────────────┘
```

---

## Edit Profile Screen

**File:** `src/screens/EditProfileScreen.tsx`  
**Route:** Stack screen (push from Profile avatar row)

```
┌─────────────────────────┐
│  Cancel   Edit Profile  │  ← header
│                         │
│          (●)            │  ← avatar preview (72×72)
│       Pick an avatar    │
│                         │
│  ┌─────────────────────┐│
│  │ 🍒 🍎 🐱 🐶 🐰    ││  ← avatar grid row 1 (red)
│  │ 🐟 🐿 🐌 🐀 🐛    ││  ← row 2 (black)
│  │ 🐦 🐢 🌸 🍃 🐾    ││  ← row 3 (beige)
│  │ 🦐 🪱 🍕 ☕ 🌈   ││  ← row 4 (beige cont.)
│  └─────────────────────┘│
│                         │
│  NAME                   │
│  ┌───────────────────┐  │
│  │ Alex Chen         │  │
│  └───────────────────┘  │
│                         │
│  EMAIL                  │
│  ┌───────────────────┐  │
│  │ alex@example.com  │ ✓│  ← "Verified" badge if unchanged
│  └───────────────────┘  │
│                         │
│  [ Save Changes ]       │  ← turns green "Saved!" on success
└─────────────────────────┘
```

**Validation states:**

```
Empty name:   ┌────────────────┐
              │                │  ← red border
              └────────────────┘
              Name is required.

Invalid email:┌────────────────┐
              │                │  ← red border
              └────────────────┘
              Enter a valid email address.

Changed email:            ← no "Verified" badge
              You will need to verify your new email after saving.
```
