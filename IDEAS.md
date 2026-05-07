# WheelTodo — Ideas & Improvements

A running list of ideas discovered while working through the codebase. Capture everything, filter nothing.

---

## UI / Design

- **Dark mode support** — TOKENS already uses semantic names, dark mode would mainly need a second token set and a theme context.
- **Haptic feedback on rest task completion** — currently only fires on Pomodoro complete; fire `Haptics.impactAsync` when a rest timer finishes.
- **Animated rest meter fill** — the progress bar jumps instantly; add `Animated.timing` for a smooth fill on task completion.
- **Task colour indicator in week dots** — when multiple colours exist for a day, show a small multi-colour arc inside the dot.
- **Wheel slice labels** — long task names get clipped; consider a radial truncation or an outer ring label.
- **Confetti density control** — currently a fixed 50 particles; lower for low-end devices (check `Platform.isTV` or `PixelRatio`).
- **Task card swipe-peek affordance** — show a very slight edge on mount to teach users that rows are swipeable.
- **Pull-to-refresh on HistoryScreen** — easier than a reload button for surfacing newly completed tasks.
- **Section header sticky positioning** — use `SectionList` for TasksScreen so section headers stay visible while scrolling long lists.
- **Skeleton loading state** — AppProvider renders `null` while loading; a skeleton screen would be less jarring than a blank flash.
- **Improved empty state illustration** — SpinScreen empty state is text-only; a simple SVG wheel outline would add personality.
- **Rest category collapse animation** — currently instant show/hide; add `LayoutAnimation.easeInEaseOut` for a polished collapse.
- **Achievement unlocked animation on ProfileScreen** — newly unlocked tier dots could pulse or shimmer on first visit.

---

## Features

- **Recurring tasks** — let a task auto-re-add itself daily or weekly (stored as a "template" in AppContext).
- **Task scheduling / due dates** — attach an optional "due today/tomorrow/this week" tag to tasks; show an overdue badge.
- **Pomodoro history** — store per-session timestamps so users can see focus time by task over time.
- **Focus music / ambient sound** — integrate with `expo-av` (already in doctor exclusion list) for lofi/rain/white noise playback during Pomodoro.
- **Task templates** — preset task bundles (e.g., "Morning routine", "Deep work block") a user can one-tap add to the wheel.
- **Rest journal** — a text note field per rest day to capture what they did, how they felt.
- **Mood trend chart** — track `todayMood` over time and render a simple bar chart on HistoryScreen.
- **Custom rest durations** — let users edit per-task duration from a long-press on the rest task row.
- **Rest activity streak heatmap** — GitHub-style contribution grid showing rest + work activity over the past year.
- **Smart notifications** — "Your streak is at risk! You haven't logged anything today." fire at user-configurable time (e.g. 8 PM).
- **Pomodoro break timer** — after a Pomodoro completes, offer a short break countdown (5 min default) before the next one.
- **Offline sync queue** — once Supabase auth lands, buffer completed tasks locally and flush on connectivity restore.
- **Shareable streak card** — generate a share image ("I'm on a 14-day streak 🔥") using React Native's Skia or a WebView snapshot.
- **Focus goals** — let users set a daily focus-time target (e.g. 2h) alongside the task count goal.
- **Wheel bias** — let users pin tasks to appear more frequently (weighted random selection).
- **Widget support** — iOS/Android home screen widget showing streak + today's task count (via `expo-widgets` or native modules).

---

## Performance

- **Memoize `weekActivity` computation** — SpinScreen and HistoryScreen both compute week activity on every render; extract into a shared `useMemo` or utility.
- **Virtualize long task lists** — if users have 30+ tasks, a flat `ScrollView` will drop frames; switch to `FlatList` with `getItemLayout`.
- **Debounce `AsyncStorage` writes** — high-frequency `tickPomodoro` calls could trigger excessive writes; batch saves every 10 seconds.
- **Move `particles` array out of module scope** — currently generates random values at module load, which is fine, but could be seeded for determinism in tests.
- **`useCallback` on all context methods that are passed as props** — several context methods like `addTask`, `deleteTask` are recreated every render; wrapping in `useCallback` prevents unnecessary child re-renders.
- **Reduce re-renders from `activeRestTimer`** — `tickRestTimer` updates the entire context every second while a rest timer runs; consider a local timer component that owns the countdown state.
- **Split AppContext into domain slices** — single large context means all consumers re-render on any state change; split into `TaskContext`, `RestContext`, `UserContext`.

---

## Code Quality / Architecture

- **Type the `navigation` prop in ProfileScreen** — currently typed as `any`; add proper `NativeStackNavigationProp`.
- **Extract `formatDuration` utility** — several places format minutes-to-hours-minutes (`${h}h ${m}m`) independently; centralise.
- **Write unit tests for streak calculation** — streak logic is pure and complex enough to warrant a test suite (Jest, no React dependency).
- **Add `eslint-plugin-react-hooks`** — several `useEffect` dependency arrays have `// eslint-disable-next-line` comments; proper lint config would catch future regressions.
- **Centralise `today.setHours(0,0,0,0)` pattern** — used in at least 6 places; extract a `startOfDay(date?: Date): Date` util.
- **Error boundary** — no error boundary wraps the app; a crash in any screen would unmount the entire tree silently.
- **LoginScreen `onLogin` prop is always `() => {}`** — the callback is never used because `user` state drives navigation; the prop can be removed.
- **`restTasksDate` storage key stores `toDateString()`** — timezone edge case around midnight; store ISO date substring (`new Date().toISOString().slice(0, 10)`) for consistency.
- **`DEFAULT_CATEGORIES` constant lives in AppContext** — better home is a separate `constants.ts` file alongside TOKENS.

---

## Accessibility

- **`accessibilityLabel` on all interactive elements** — Pressable components have no labels; VoiceOver/TalkBack users get no context.
- **`accessibilityRole="button"` on custom Pressables** — helps screen readers announce intent.
- **Sufficient colour contrast** — TOKENS.colors.text.muted (`#bbbbbb`) on white fails WCAG AA; bump to `#909090` or darker.
- **Minimum touch targets** — several remove/dismiss buttons are < 44px even with `hitSlop`; audit all small icon buttons.
- **`reduceMotion` support** — Animated sequences should check `AccessibilityInfo.isReduceMotionEnabled()` and skip animations.

---

## Monetisation / Growth (Future)

- **Premium tier** — lock advanced features (custom rest categories, unlimited tasks, mood trends) behind a RevenueCat subscription.
- **Referral link** — "Invite a friend" with a deep link; both parties get a 7-day streak shield.
- **Team/family mode** — shared wheel where multiple users add tasks and compete on streaks.
- **Coach mode** — weekly summary email/notification ("Last week you focused for 4h 30m — here's what you crushed").
