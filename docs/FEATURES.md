# Feature Reference

Complete feature inventory for WheelTodo on iOS and Android. Features are identical across platforms unless noted otherwise.

---

## Table of Contents

- [Authentication](#authentication)
- [Onboarding](#onboarding)
- [Persistent Header](#persistent-header)
- [Spin Screen (Task Wheel)](#spin-screen)
- [Tasks Screen](#tasks-screen)
- [Rest Screen](#rest-screen)
- [History Screen](#history-screen)
- [Profile Screen](#profile-screen)
- [Edit Profile Screen](#edit-profile-screen)
- [Streak System](#streak-system)
- [Achievement System](#achievement-system)
- [Settings](#settings)
- [Notifications](#notifications)
- [Platform Differences](#platform-differences)

---

## Authentication

| Feature | Detail |
|---------|--------|
| Email + password sign in | No server validation in current build — any non-empty email works |
| Apple Sign In button | **iOS only** — currently simulates login with a hardcoded email |
| Google Sign In button | Both platforms — currently simulates login |
| Sign out | Clears user from AsyncStorage and stops any active Pomodoro |
| Persistent session | User object persisted to AsyncStorage; no re-login required on relaunch |

---

## Onboarding

| Feature | Detail |
|---------|--------|
| 3-step modal | Shown once on first launch after login |
| Steps | (1) Add tasks to your wheel · (2) Spin to pick · (3) Rest days count too |
| Skip button | Available on steps 1 and 2 |
| Progress dots | Animated indicator showing current step |
| Persistence | `hasSeenOnboarding` stored in AsyncStorage; never shown again after dismissal |

---

## Persistent Header

Rendered above all four tabs. Always visible when logged in.

| Element | Behaviour |
|---------|-----------|
| Streak badge (left) | Shows flame icon + current streak count |
| Flame icon colour | Orange when streak is active; grey when streak = 0 |
| Flame fill | Solid when streak is active and protected today; outlined when at risk |
| Streak badge tap | Navigates to History tab |
| Avatar button (right) | 42 × 42 circle; shows selected avatar icon or user initials |
| Avatar tap | Navigates to Profile screen |

---

## Spin Screen

The default landing tab. Shows the wheel of active tasks.

### Wheel

| Feature | Detail |
|---------|--------|
| Visual wheel | Circular canvas-based rendering; each task = one coloured slice |
| Slice label | Task name rendered inside the slice |
| Spin gesture | Swipe/spin gesture rotates the wheel with deceleration easing |
| Random stop | Wheel decelerates and lands on a randomly weighted task |
| Spin count | Spinning (not direct tap) increments `spinCount` for the Spin Doctor achievement |
| Tap slice | Instantly selects that task without incrementing spin count |
| Centre hub | Tappable; triggers a spin |
| Empty state | Shows placeholder with arrow pointing to Tasks tab when no tasks exist |

### Result Bottom Sheet

Slides up after a spin or slice tap.

| Feature | Detail |
|---------|--------|
| Task preview | Colour dot + task name + estimated duration |
| Start Focus button | Calls `startPomodoro(task)` and navigates to Tasks tab |
| Dismiss button | Closes sheet without starting |

### How-To Accordion

| Feature | Detail |
|---------|--------|
| Collapsible info card | "How do I use the wheel?" with usage explanation |
| Info icon | Visible in header of accordion |

### Weekly Activity Indicator

| Feature | Detail |
|---------|--------|
| 7-day bubble row | Mon–Sun; shows this week's activity |
| Active day (task) | Primary colour (black) fill |
| Active day (rest only) | Purple fill |
| Today (active) | Streak-orange fill |
| Today (inactive) | Streak-orange ring outline |
| Future days | Very light grey |
| Day labels | M T W T F S S below each bubble |

### Next Achievement Card

| Feature | Detail |
|---------|--------|
| Shown when | There is at least one locked tier remaining |
| Contents | Achievement icon + badge name + description + progress bar |

---

## Tasks Screen

Task management, Pomodoro timer, and task editing.

### Task List

| Feature | Detail |
|---------|--------|
| Today's task list | Vertically scrollable list of active tasks |
| Task row | Colour dot · task name · category (if set) · time display · timer button |
| Time display | Shows `MM:SS` of remaining focus time if session exists for this task; otherwise shows estimated `{n}m` |
| Swipe right | Green "Done ✓" background; releasing completes and removes the task |
| Swipe left | Red "Delete ×" background; releasing deletes without completing |
| Tap timer button | Starts a Pomodoro session for that task (or shows alert if another is active) |
| Tap task name | Opens edit sheet pre-filled with task data |
| Empty state | Prompt to add tasks via the FAB |

### Add Task FAB

| Feature | Detail |
|---------|--------|
| Location | Top right of task list header |
| Behaviour | Opens Add Task bottom sheet |

### Add / Edit Task Sheet

| Feature | Detail |
|---------|--------|
| Task name input | Auto-focuses; returnKeyType done |
| Colour picker | 6 brand colour swatches; tap to select |
| Duration picker | Hours and minutes number inputs |
| Duration validation | Must be ≥ 1 minute; shows error if not |
| Category picker | Chip row of existing categories; tap to select/deselect |
| Add new category | Inline text input appears when "+ Add" is tapped |
| Save button | "Add task" (new) or "Save changes" (edit) |
| Drag to dismiss | Drag handle or drag sheet down > 80 px or fast flick |

### Stats Bar

| Feature | Detail |
|---------|--------|
| Shown when | At least one task completed today |
| Columns | Minutes done · Tasks (done/goal) · Goal % |

### Pomodoro Focus Card

| Feature | Detail |
|---------|--------|
| Shown when | A Pomodoro session is active |
| Task info | Colour dot + task name + category badge |
| Timer display | Large `MM:SS` countdown |
| Progress bar | Fills left-to-right as time passes |
| Pause / Resume | Toggle; changes label and animation state |
| Done early | "Done ✓" button — completes the task immediately |
| Auto-complete | When timer reaches 0, task is completed automatically |
| Session continuity | If you leave the screen and come back, remaining time is preserved |

### Confetti

| Feature | Detail |
|---------|--------|
| Trigger | Task completed (by timer or swipe) |
| Animation | 50 coloured particles falling from top; auto-clears after 1.6 s |

### Achievement Toast

| Feature | Detail |
|---------|--------|
| Trigger | New achievement tier unlocked |
| Animation | Spring animation from bottom |
| Content | Achievement icon + badge name |
| Duration | Auto-dismisses after 3 s |
| De-duplication | Badge name stored in `seenAchievements`; never shown twice |

### FAQ Accordion

| Feature | Detail |
|---------|--------|
| Question | "How do tasks work?" |
| Body | Explains swipe gestures, timer, editing |

---

## Rest Screen

Guilt-free rest day management that protects your streak.

### Header

| Feature | Detail |
|---------|--------|
| Subtitle | "Take it easy today." normally; "Streak at risk!" if streak > 0 and no activity today |

### Rest FAQ Accordion

| Feature | Detail |
|---------|--------|
| Question | "How does Rest Mode protect my streak?" |
| Body | Explains rest goal and streak continuity |

### Rest Meter

| Feature | Detail |
|---------|--------|
| Progress bar | Shows `{done}m / {goal}m` |
| Bar colour | Teal while filling; green when goal met |
| Status text | "{n}m more to protect your streak" → "🌿 Streak protected!" |

### Rest Streak Badge

| Feature | Detail |
|---------|--------|
| Shown when | `restStreak > 0` |
| Content | "🌙 {n}-day rest streak" |

### Energy Check-In

| Feature | Detail |
|---------|--------|
| Shown when | `todayMood` not yet set |
| Options | Drained · Okay · Restless |
| Effect | Reorders task suggestions based on mood (see mood map below) |
| Persistence | Mood stored with date; resets the next day |

**Mood → suggested tasks:**

| Mood | Suggested order |
|------|----------------|
| Drained | Take a nap · Stretch · Get a coffee |
| Okay | Read · Journal · Cook something |
| Restless | Go for a run · Go for a walk · Call a friend |

### Category Sections

Five collapsible sections: Physical · Mental · Social · Nourishment · My Tasks.

| Feature | Detail |
|---------|--------|
| Header | Category icon + coloured name + `{done}/{total}` progress + chevron |
| Collapse / expand | Tap header to toggle |
| Category colours | Physical: orange · Mental: purple · Social: teal · Nourishment: yellow · My Tasks: blue |

### Rest Task Rows

| State | UI | Interaction |
|-------|----|-------------|
| Normal | Empty circle · task name · duration · timer icon · remove (×) | Tap circle → complete; tap timer → start countdown; tap × → delete (custom only) |
| Timer active | Timer icon in circle · task name · `MM:SS` countdown · progress bar · cancel (×) | Tap × → cancel timer |
| Completed | Green check circle · strikethrough name · duration | Tap circle → uncomplete |

### Preset Tasks (10)

| Task | Duration | Category |
|------|----------|----------|
| Get a coffee | 5 min | Nourishment |
| Go for a walk | 20 min | Physical |
| Read | 10 min | Mental |
| Stretch | 10 min | Physical |
| Call a friend | 15 min | Social |
| Take a nap | 30 min | Physical |
| Cook something | 20 min | Nourishment |
| Go for a run | 30 min | Physical |
| Journal | 10 min | Mental |
| Watch something you enjoy | 30 min | Mental |

### Custom Task Input

| Feature | Detail |
|---------|--------|
| Input | "Add your own rest activity…" placeholder |
| Add button | Disabled when input empty; submits on press or keyboard return |
| Default duration | 10 minutes |
| Category | My Tasks |
| Persistence | Custom tasks survive daily reset; only checked state resets |

### Celebration Modal

| Feature | Detail |
|---------|--------|
| Trigger | `restMinutesToday` crosses `restGoalMinutes` |
| Content | 🌿 emoji · "Rest complete!" · "Streak protected" message |
| Confetti | 40 particles, 1.8 s animation |
| Dismiss | Close button |

---

## History Screen

Progress overview: streaks, weekly activity, and completed task log.

### Stats Card

| Column | Value |
|--------|-------|
| Tasks Done | All-time completed task count |
| Streak | Current streak (orange) |
| Rest Streak | Current consecutive rest days (moon icon) |
| Best | Best streak ever |

### Streak Explanation Accordion

| Feature | Detail |
|---------|--------|
| Question | "How do streaks work?" |
| Body | Explains task + rest day combined counting |

### Weekly Activity Grid

| Feature | Detail |
|---------|--------|
| Week selector | Left / right chevron navigation; disables forward at current week |
| Week label | "This Week" · "Last Week" · "Week of {date}" |
| Day bubbles | 7 columns (Mon–Sun), one per day |

**Bubble colour key:**

| State | Colour |
|-------|--------|
| Active (task completed) | Black |
| Active today | Streak orange |
| Rest-only day | Purple (#A78BFA) |
| Today (no activity) | Orange ring outline |
| Partial rest (< goal) | Light grey + moon icon |
| Future | Very light grey |
| Past inactive | Light grey |

### Next Milestone Card

| State | Message |
|-------|---------|
| streak = 0 | "Start your streak" — complete a task today |
| streak > 0, < max | "{n} more day(s) to {next milestone}" |
| streak = 365 | "365 days — legendary!" |

**Milestone targets:** 7 · 14 · 21 · 30 · 60 · 90 · 100 · 180 · 365

### Task History Lists

| Feature | Detail |
|---------|--------|
| Today section | Tasks completed today |
| Yesterday section | Tasks completed yesterday |
| Task card | Green check icon · task name · estimated duration · colour dot |
| Tap check icon | Calls `uncompleteTask()` — moves task back to active list |

---

## Profile Screen

User stats, achievements, and settings.

### Avatar Row

| Feature | Detail |
|---------|--------|
| Avatar | 60 × 60 circle; shows selected icon or user initials |
| Name | Bold, 18 pt |
| Email | Muted, 14 pt |
| Chevron | Right arrow indicating it's tappable |
| Tap | Opens Edit Profile screen |

### Stats Card

| Stat | Calculation |
|------|-------------|
| Tasks Done | `completedTasks.length` |
| Hours Focused | `totalMinutesFromPomodoros / 60`, 1 decimal |
| On Time % | Percentage of tasks completed within their estimated time |

### Achievements

Six achievement cards, each showing:
- Coloured icon in rounded square
- Achievement name + current progress value
- Tier row: dot (coloured if unlocked) + badge name + target

### Settings

| Setting | Type | Default | Range |
|---------|------|---------|-------|
| Default timer | Stepper | 25 min | 5–120 min (5-min steps) |
| Daily goal | Stepper | 5 tasks | 1–20 tasks |
| Notifications | Toggle | Off | On / Off |
| Wheel sound | Toggle | Off | On / Off |

### Rest Goal

| Tier | Minutes |
|------|---------|
| Easy | 15 |
| Standard | 30 (default) |
| Dedicated | 45 |

### Task Labels

| Feature | Detail |
|---------|--------|
| Default categories | Work · Personal · Learning · Health |
| Remove category | Tap × on any category chip |
| Add category | Tap "+ Add"; inline text input appears |
| Save | Submit on keyboard return or blur |

### Sign Up CTA

| Feature | Detail |
|---------|--------|
| Button | "Create an account to sync across devices →" |
| Action | Opens "Coming Soon" modal |

### Sign Out

| Feature | Detail |
|---------|--------|
| Button | Red × icon + "Sign Out" text |
| Action | Clears user from context + AsyncStorage; stops active Pomodoro |

---

## Edit Profile Screen

Edit name, email, and avatar.

| Feature | Detail |
|---------|--------|
| Avatar grid | 20 icons, 5 per row; grouped by colour (red, black, beige) |
| Avatar selection | Tap to select; tap again to deselect (reverts to initials) |
| Preview | Live 72 × 72 preview above the grid |
| Name input | Required; shows "Name is required." error if empty |
| Email input | Validated with regex; shows error for invalid format |
| Verified badge | Shows "Verified" pill if email is unchanged from stored value |
| Changed email hint | "You will need to verify your new email after saving." |
| Save | Validates; persists via `updateUser()`; shows "Saved!" then navigates back |
| Cancel | Returns to Profile without saving |

**Avatar catalogue (20 icons):**

| Group | Avatars |
|-------|---------|
| Red (#FF5C4D) | Cherry · Apple · Cat · Dog · Rabbit |
| Black (#111111) | Fish · Squirrel · Snail · Rat · Bug |
| Beige (#E8E0D5) | Bird · Turtle · Flower · Leaf · Paw Print · Shrimp · Worm · Pizza · Coffee · Rainbow |

---

## Streak System

| Rule | Detail |
|------|--------|
| A streak day counts if | At least one task completed, **or** rest goal met |
| Streak breaks | When a day passes with no task completions and no rest goal met |
| Best streak | Highest consecutive day count ever recorded |
| Rest streak | Consecutive days where rest goal was met specifically |
| Best rest streak | Highest rest streak ever recorded |
| Partial rest days | Days where rest was started but goal not met; shown as grey dot with moon |

---

## Achievement System

| Track | Icon | Metric | Tiers |
|-------|------|--------|-------|
| On Fire | Flame | Streak days | Spark (3) · Blazing (7) · Inferno (30) · Eternal (100) |
| Achiever | Trophy | Tasks completed | First Step (1) · Momentum (10) · Achiever (50) · Century (100) |
| Deep Work | Clock | Focus minutes | Focused (60) · In The Zone (300) · Deep Work (600) · Flow State (3 000) |
| Speed Run | Zap | Tasks finished ≤ estimate | Quick Fix (1) · Sprinter (5) · Road Runner (20) |
| Rest Champion | Moon | Rest days completed | Day Off (1) · Balanced (7) · Zen Master (30) |
| Spin Doctor | RotateCcw | Wheel spins | First Spin (1) · Spin Doctor (10) · Wheel of Fortune (50) |

---

## Settings

| Key | Default | Notes |
|-----|---------|-------|
| `defaultTimerMinutes` | 25 | Used when adding tasks via FAB if no duration specified |
| `dailyGoal` | 5 | Shown as denominator in stats bar |
| `notificationsEnabled` | false | Enables live Pomodoro notification updates |
| `wheelSoundEnabled` | false | Audio feedback on wheel spin (not yet implemented) |
| `restGoalTier` | standard | Controls rest goal minutes |

---

## Notifications

| Feature | Platform | Detail |
|---------|----------|--------|
| Permission request | iOS + Android | Requested when notifications toggled on |
| Live Pomodoro notification | iOS + Android | Shows task name + remaining time; updates every minute |
| Notification dismiss | iOS + Android | Cleared when Pomodoro ends or is cancelled |
| Notification channel | Android | `pomodoro-timer` channel, importance: max |

---

## Platform Differences

| Feature | iOS | Android |
|---------|-----|---------|
| Apple Sign In | Button shown (simulated) | Button hidden |
| Google Sign In | Shown (simulated) | Shown (simulated) |
| Safe area | Dynamic island / notch via `useSafeAreaInsets` | Status bar height via same API |
| Bottom tab bar | iOS-native appearance | Android-native appearance |
| Navigation animations | iOS slide-from-right | Android slide-up |
| Notification channel | APNs | FCM via `pomodoro-timer` channel |
| Haptics | Not used | Not used |
| Back gesture | iOS swipe-from-left edge | Android system back button |
