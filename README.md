# WheelTodo

**Spin. Focus. Done.**

A React Native productivity app that turns your task list into a spinning wheel — so you stop overthinking and start doing. Built with Expo for iOS and Android.

---

## Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Features at a Glance](#features-at-a-glance)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Development](#development)
- [Documentation](#documentation)
- [Platform Notes](#platform-notes)

---

## Overview

WheelTodo solves decision paralysis. Instead of staring at a long task list, you add your tasks to a wheel, give it a spin, and let it decide. The selected task immediately launches into a Pomodoro-style focus timer so you get straight to work.

On days when you need to rest, **Rest Mode** lets you log recovery activities (stretching, reading, napping) that count towards your streak — so a rest day never breaks your momentum.

---

## Screenshots

> *Coming soon — add device screenshots or a GIF of the wheel spinning here*

---

## Features at a Glance

| Feature | Description |
|---------|-------------|
| **Task Wheel** | Visual spinning wheel of your active tasks — spin to randomise or tap a slice to choose |
| **Pomodoro Timer** | Focus sessions with configurable duration, pause/resume, live progress bar and push notifications |
| **Streak System** | Consecutive daily activity tracked across task completions and rest days |
| **Rest Mode** | 10 preset rest activities across 5 categories, plus custom tasks; mood-based suggestions |
| **Achievement System** | 6 achievement tracks (streak, tasks, focus, speed, rest, spins) with unlockable badge tiers |
| **Custom Avatars** | 20 icon-based avatars in brand colour groups (red, black, beige) |
| **Task Categories** | User-defined labels to organise tasks, filterable in the wheel |
| **Weekly Activity Grid** | 7-day bubble grid showing task and rest activity at a glance |
| **Daily Goal** | Configurable target task count per day |
| **History** | Completed task log, week-by-week navigation, next streak milestone card |
| **Onboarding** | 3-step walkthrough on first launch |
| **Offline First** | All data stored locally via AsyncStorage — no account required |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo](https://expo.dev) (SDK 52+) |
| Language | TypeScript |
| Navigation | React Navigation v6 (Native Stack + Bottom Tabs) |
| State | React Context + `useReducer`-style hooks |
| Persistence | AsyncStorage |
| Icons | [lucide-react-native](https://lucide.dev) |
| Notifications | expo-notifications |
| Safe Area | react-native-safe-area-context |

---

## Project Structure

```
wheeltodo/
├── apps/
│   └── mobile/                   # Expo React Native app
│       ├── src/
│       │   ├── context/
│       │   │   └── AppContext.tsx # Global state + all business logic
│       │   ├── navigation/
│       │   │   └── AppNavigator.tsx
│       │   ├── screens/
│       │   │   ├── LoginScreen.tsx
│       │   │   ├── SpinScreen.tsx
│       │   │   ├── TasksScreen.tsx
│       │   │   ├── RestScreen.tsx
│       │   │   ├── HistoryScreen.tsx
│       │   │   ├── ProfileScreen.tsx
│       │   │   └── EditProfileScreen.tsx
│       │   ├── theme/
│       │   │   └── tokens.ts     # Design tokens (colours, spacing, radii)
│       │   └── utils/
│       │       ├── task.ts
│       │       ├── achievements.ts
│       │       └── notifications.ts
│       └── App.tsx
├── apps/web/                     # Next.js web app (separate)
├── packages/shared/              # Shared TypeScript types
└── docs/                         # Full documentation
    ├── FEATURES.md
    ├── ARCHITECTURE.md
    ├── SCREENS.md
    └── DATA_MODEL.md
```

---

## Quick Start

**Prerequisites:** Node 20+, Expo CLI, iOS Simulator or Android Emulator (or the Expo Go app)

```bash
# Clone and install
git clone https://github.com/your-username/wheeltodo.git
cd wheeltodo
npm install

# Start the mobile app
npm run dev:mobile
```

Then scan the QR code with Expo Go, or press `i` for iOS simulator / `a` for Android emulator.

---

## Development

```bash
# Run mobile app (Expo dev server)
npm run dev:mobile

# Run web app
npm run dev:web

# TypeScript check (from apps/mobile)
cd apps/mobile && npx tsc --noEmit
```

**Node version:** This repo includes `.nvmrc`. Run `nvm use` from the root before starting.

**Push notifications:** Expo Notifications is wired up. For standalone builds you'll need APNs credentials (iOS) and a Firebase project + `google-services.json` (Android). See [push notification setup](https://docs.expo.dev/push-notifications/overview/).

---

## Documentation

Full product and technical documentation lives in [`/docs`](./docs):

| Document | Contents |
|----------|---------|
| [FEATURES.md](./docs/FEATURES.md) | Complete feature reference — every interaction, every screen, iOS vs Android notes |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Navigation structure, data flow, streak logic — with Mermaid diagrams |
| [SCREENS.md](./docs/SCREENS.md) | Screen-by-screen breakdown with component inventory and state |
| [DATA_MODEL.md](./docs/DATA_MODEL.md) | TypeScript types, AsyncStorage keys, context API reference |

---

## Platform Notes

WheelTodo targets iOS 15+ and Android 10+. The codebase is a single React Native / Expo project — feature parity is 100% across platforms with the following minor notes:

| Area | iOS | Android |
|------|-----|---------|
| Safe area handling | `useSafeAreaInsets` (dynamic island / notch aware) | Status bar height via same API |
| Sign-in buttons | Apple Sign In button shown | Apple button hidden; Google shown |
| Notifications | APNs via Expo | FCM via Expo |
| Bottom nav | iOS tab bar styling | Android-style bottom nav |
| Haptics | Not currently used | Not currently used |

---

## License

MIT
