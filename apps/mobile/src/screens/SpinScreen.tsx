import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Target, Trophy, Zap } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useApp, type Task } from '../context/AppContext';
import { SpinningWheel } from '../components/SpinningWheel';
import { TOKENS } from '../theme/tokens';

export function SpinScreen() {
  const { tasks, startPomodoro, completedTasks, dailyGoal } = useApp();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayDone = useMemo(() =>
    completedTasks.filter((t) => {
      const d = new Date(t.completedAt); d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).length,
  [completedTasks, today]);

  // M T W T F S S bubbles for current week (Mon–Sun)
  const weekActivity = useMemo(() => {
    const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const weekStart = new Date(today);
    const daysFromMonday = today.getDay() === 0 ? 6 : today.getDay() - 1;
    weekStart.setDate(today.getDate() - daysFromMonday); // back to Monday
    return DAY_LABELS.map((label, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      const active = completedTasks.some((t) => {
        const d = new Date(t.completedAt);
        return d >= day && d < next;
      });
      const isToday = day.getTime() === today.getTime();
      const isFuture = day > today;
      return { label, active, isToday, isFuture };
    });
  }, [completedTasks, today]);

  // Consecutive-day streak count
  const streak = useMemo(() => {
    if (completedTasks.length === 0) return 0;
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      if (completedTasks.some((t) => { const d = new Date(t.completedAt); return d >= day && d < next; })) {
        count++;
      } else { break; }
    }
    return count;
  }, [completedTasks, today]);

  const badges: { icon: LucideIcon; label: string; sub: string; unlocked: boolean }[] = [
    {
      icon: Target,
      label: 'Daily Goal',
      sub: `${dailyGoal} tasks/day`,
      unlocked: todayDone >= dailyGoal,
    },
    {
      icon: Flame,
      label: 'On Fire',
      sub: `${streak} day streak`,
      unlocked: streak >= 3,
    },
    {
      icon: Trophy,
      label: 'Achiever',
      sub: '10 tasks done',
      unlocked: completedTasks.length >= 10,
    },
    {
      icon: Zap,
      label: 'Speed Run',
      sub: 'Beat the clock',
      unlocked: completedTasks.some((t) => t.minutesActual < t.minutesEstimated),
    },
  ];

  const [picked, setPicked] = useState<Task | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  const sheetY = useRef(new Animated.Value(500)).current;

  function showSheet() {
    Animated.spring(sheetY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }

  function hideSheet() {
    Animated.timing(sheetY, {
      toValue: 500,
      duration: 260,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setPicked(null);
      setResultOpen(false);
    });
  }

  function handleTaskSelected(task: Task) {
    setPicked(task);
    setResultOpen(true);
    showSheet();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Spin</Text>
          <Text style={styles.subtitle}>Spin to pick your next task</Text>
          {/* M T W T F S S + streak count */}
          <View style={styles.weekRow}>
            <View style={styles.bubblesRow}>
              {weekActivity.map((day, i) => (
                <View
                  key={i}
                  style={[
                    styles.dayBubble,
                    day.isToday
                      ? styles.dayBubbleToday
                      : day.active
                      ? styles.dayBubbleActive
                      : day.isFuture
                      ? styles.dayBubbleFuture
                      : styles.dayBubbleInactive,
                  ]}
                >
                  <Text style={[
                    styles.dayLabel,
                    (day.active || day.isToday) && styles.dayLabelLight,
                    !day.active && !day.isToday && styles.dayLabelFaded,
                  ]}>
                    {day.label}
                  </Text>
                </View>
              ))}
            </View>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Flame size={18} color={TOKENS.colors.action.streak} strokeWidth={2} />
                <Text style={styles.streakCount}>{streak}</Text>
              </View>
            )}
          </View>
        </View>

        <SpinningWheel
          tasks={tasks}
          onTaskSelected={handleTaskSelected}
          onSliceClick={handleTaskSelected}
          dailyGoal={dailyGoal}
          todayDone={todayDone}
          style={styles.wheel}
        />

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionLabel}>Achievements</Text>
          <View style={styles.badgeGrid}>
            {badges.map((b) => {
              const Icon = b.icon;
              return (
                <View key={b.label} style={[styles.badge, !b.unlocked && styles.badgeLocked]}>
                  <Icon
                    size={22}
                    color={b.unlocked ? TOKENS.colors.action.streak : TOKENS.colors.text.muted}
                    strokeWidth={2}
                  />
                  <Text style={[styles.badgeLabel, !b.unlocked && styles.badgeLabelLocked]}>
                    {b.label}
                  </Text>
                  <Text style={styles.badgeSub}>{b.sub}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {resultOpen && picked && (
        <View style={styles.sheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={hideSheet} />
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
            <View style={styles.sheetHandle} />
            <View style={[styles.taskDot, { backgroundColor: picked.color }]} />
            <Text style={styles.sheetLabel}>You got</Text>
            <Text style={styles.sheetTask}>{picked.name}</Text>
            <Text style={styles.sheetMeta}>{picked.minutes}-minute focus session</Text>

            <Pressable
              onPress={() => {
                startPomodoro(picked);
                hideSheet();
              }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Start Focus</Text>
            </Pressable>

            <Pressable onPress={hideSheet} style={styles.dismissBtn}>
              <Text style={styles.dismissBtnText}>Dismiss</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.colors.bg.screen },
  scroll: { paddingBottom: 32 },
  header: { paddingHorizontal: TOKENS.spacing.screenPad, paddingTop: 12, paddingBottom: 8 },
  wheel: { flex: undefined, height: 420 },
  achievementsSection: {
    paddingHorizontal: TOKENS.spacing.screenPad,
    paddingTop: 8,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TOKENS.colors.text.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  badgeGrid: { flexDirection: 'row', gap: 8 },
  badge: {
    flex: 1,
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.row,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  badgeLocked: { opacity: 0.45 },
  badgeLabel: { fontSize: 11, fontWeight: '600', color: TOKENS.colors.text.primary, textAlign: 'center' },
  badgeLabelLocked: { color: TOKENS.colors.text.muted },
  badgeSub: { fontSize: 10, color: TOKENS.colors.text.muted, textAlign: 'center' },
  title: { fontSize: 34, fontWeight: '700', color: TOKENS.colors.text.primary, letterSpacing: 0.37 },
  subtitle: { marginTop: 4, fontSize: 15, color: TOKENS.colors.text.secondary },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  bubblesRow: {
    flexDirection: 'row',
    gap: 5,
  },
  dayBubble: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubbleActive: {
    backgroundColor: TOKENS.colors.action.primary,
  },
  dayBubbleToday: {
    backgroundColor: TOKENS.colors.action.streak,
  },
  dayBubbleInactive: {
    backgroundColor: '#E0DDD8',
  },
  dayBubbleFuture: {
    backgroundColor: '#EEEBE6',
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: TOKENS.colors.text.secondary,
  },
  dayLabelLight: {
    color: '#ffffff',
  },
  dayLabelFaded: {
    color: '#BCBAB6',
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakCount: {
    fontSize: 20,
    fontWeight: '700',
    color: TOKENS.colors.text.primary,
  },

  // Bottom sheet
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: TOKENS.radius.sheet,
    borderTopRightRadius: TOKENS.radius.sheet,
    padding: 28,
    paddingBottom: 48,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
    marginBottom: 24,
  },
  taskDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 16,
  },
  sheetLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: TOKENS.colors.text.secondary,
  },
  sheetTask: {
    marginTop: 8,
    fontSize: 26,
    fontWeight: '700',
    color: TOKENS.colors.text.primary,
    textAlign: 'center',
  },
  sheetMeta: {
    marginTop: 6,
    fontSize: 15,
    color: TOKENS.colors.text.secondary,
    marginBottom: 28,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    backgroundColor: TOKENS.colors.action.primary,
    borderRadius: TOKENS.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '600' },
  dismissBtn: {
    width: '100%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: { color: TOKENS.colors.text.secondary, fontSize: 17 },
});
