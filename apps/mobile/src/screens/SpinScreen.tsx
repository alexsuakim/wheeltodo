import React, { useCallback, useRef, useState } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Clock, Flame, Moon, RotateCcw, Trophy, Zap } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useApp, type Task } from '../context/AppContext';
import { SpinningWheel } from '../components/SpinningWheel';
import { TOKENS } from '../theme/tokens';
import { getNextAchievement } from '../utils/achievements';

const ICON_MAP: Record<string, LucideIcon> = {
  Flame, Trophy, Clock, Zap, Moon, RotateCcw,
};

type TabNav = BottomTabNavigationProp<{ Spin: undefined; Tasks: undefined; Rest: undefined; History: undefined }>;

export function SpinScreen() {
  const { tasks, startPomodoro, completedTasks, completedRestDays, dailyGoal, achievementValues, incrementSpinCount } = useApp();
  const navigation = useNavigation<TabNav>();

  // Recalculate today whenever the screen comes into focus so the date never goes stale
  const [today, setToday] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useFocusEffect(useCallback(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setToday(d);
  }, []));

  const todayTasks = completedTasks.filter((t) => {
    const d = new Date(t.completedAt); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const todayDone = todayTasks.length;
  const todayMinutes = todayTasks.reduce((sum, t) => sum + t.minutesActual, 0);

  // M T W T F S S bubbles for current week (Mon–Sun)
  const weekActivity = (() => {
    const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const weekStart = new Date(today);
    const daysFromMonday = today.getDay() === 0 ? 6 : today.getDay() - 1;
    weekStart.setDate(today.getDate() - daysFromMonday);
    return DAY_LABELS.map((label, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      const active =
        completedTasks.some((t) => { const d = new Date(t.completedAt); return d >= day && d < next; }) ||
        completedRestDays.some((d) => d >= day && d < next);
      const isToday = day.getTime() === today.getTime();
      const isFuture = day > today;
      return { label, active, isToday, isFuture };
    });
  })();

  const nextAchievement = getNextAchievement(achievementValues);

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

  // Called after the wheel animation completes — counts as a real spin
  function handleTaskSelected(task: Task) {
    setPicked(task);
    setResultOpen(true);
    showSheet();
    incrementSpinCount();
  }

  // Called when the user taps a slice directly — does NOT count as a spin
  function handleSliceClick(task: Task) {
    setPicked(task);
    setResultOpen(true);
    showSheet();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Not sure where to start?</Text>
          <Text style={[styles.title, { color: TOKENS.colors.action.streak }]}>Spin the wheel.</Text>
          {/* M T W T F S S bubbles — streak count lives in the header badge */}
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
          </View>
        </View>

        <SpinningWheel
          tasks={tasks}
          onTaskSelected={handleTaskSelected}
          onSliceClick={handleSliceClick}
          dailyGoal={dailyGoal}
          todayDone={todayDone}
          style={styles.wheel}
        />

        {/* Productivity */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionLabel}>Productivity</Text>
          {todayMinutes > 0 ? (
            <View style={styles.focusSummary}>
              <View style={styles.focusSummaryLeft}>
                <Text style={styles.focusSummaryEyebrow}>Today you have focused for</Text>
                <Text style={styles.focusSummaryValue}>
                  {todayMinutes >= 60
                    ? `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60 > 0 ? `${todayMinutes % 60}m` : ''}`.trim()
                    : `${todayMinutes}m`}
                </Text>
              </View>
              <View style={styles.focusSummaryRight}>
                <View style={styles.focusSummaryBubble}>
                  <Text style={styles.focusSummaryTaskCount}>{todayDone}</Text>
                </View>
                <Text style={styles.focusSummaryTaskLabel}>{todayDone === 1 ? 'task' : 'tasks'} done</Text>
              </View>
            </View>
          ) : (
            <View style={styles.focusSummaryEmpty}>
              <Text style={styles.focusSummaryEmptyText}>Start your first focus session today!</Text>
            </View>
          )}
        </View>

        {/* Next milestone */}
        {nextAchievement && (() => {
          const { def, tier, current, pct } = nextAchievement;
          const Icon = ICON_MAP[def.iconName] ?? Flame;
          const barPct = Math.min(pct, 1);
          return (
            <View style={styles.achievementsSection}>
              <Text style={styles.sectionLabel}>Next milestone</Text>
              <View style={styles.milestoneCard}>
                <View style={styles.milestoneTop}>
                  <View style={[styles.milestoneIconWrap, { backgroundColor: def.color + '22' }]}>
                    <Icon size={16} color={def.color} strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.milestoneName}>{tier.badge}</Text>
                    <Text style={styles.milestoneSub}>{def.description(tier.target)}</Text>
                  </View>
                  <Text style={styles.milestoneProgress}>
                    {current} / {tier.target}
                  </Text>
                </View>
                <View style={styles.milestoneBarBg}>
                  <View style={[styles.milestoneBarFill, { width: `${barPct * 100}%` as any, backgroundColor: def.color }]} />
                </View>
                <Text style={styles.milestoneEarn}>Collect: {tier.badge}</Text>
              </View>
            </View>
          );
        })()}
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
                navigation.navigate('Tasks');
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
  focusSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
  },
  focusSummaryLeft: {
    gap: 4,
  },
  focusSummaryEyebrow: {
    fontSize: 12,
    color: TOKENS.colors.text.secondary,
    fontWeight: '500',
  },
  focusSummaryValue: {
    fontSize: 40,
    fontWeight: '800',
    color: TOKENS.colors.text.primary,
    letterSpacing: -1,
    lineHeight: 44,
  },
  focusSummaryRight: {
    alignItems: 'center',
    gap: 6,
  },
  focusSummaryBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF5C4D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusSummaryTaskCount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  focusSummaryTaskLabel: {
    fontSize: 12,
    color: TOKENS.colors.text.secondary,
    textAlign: 'center',
  },
  focusSummaryEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
  },
  focusSummaryEmptyText: {
    fontSize: 14,
    color: TOKENS.colors.text.secondary,
    fontWeight: '500',
  },
  wheel: { flex: undefined, height: 340, marginTop: 24 },
  achievementsSection: {
    paddingHorizontal: TOKENS.spacing.screenPad,
    paddingTop: 24,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TOKENS.colors.text.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  milestoneCard: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    padding: 14,
    gap: 10,
  },
  milestoneTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  milestoneIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  milestoneName: { fontSize: 14, fontWeight: '700', color: TOKENS.colors.text.primary },
  milestoneSub: { fontSize: 12, color: TOKENS.colors.text.secondary, marginTop: 1 },
  milestoneProgress: { fontSize: 12, fontWeight: '600', color: TOKENS.colors.text.secondary },
  milestoneBarBg: { height: 6, backgroundColor: '#ebebeb', borderRadius: 3, overflow: 'hidden' },
  milestoneBarFill: { height: 6, borderRadius: 3 },
  milestoneEarn: { fontSize: 11, color: TOKENS.colors.text.muted },
  title: { fontSize: 26, fontWeight: '700', color: TOKENS.colors.text.primary, letterSpacing: 0.1 },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  bubblesRow: {
    flexDirection: 'row',
    flex: 1,
    gap: 5,
  },
  dayBubble: {
    flex: 1,
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
