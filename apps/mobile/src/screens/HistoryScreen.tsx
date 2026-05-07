import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleCheck, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Flame, Info, Moon, Target } from 'lucide-react-native';
import { useApp, type CompletedTask } from '../context/AppContext';
import { TOKENS } from '../theme/tokens';

const MILESTONES = [7, 14, 21, 30, 60, 90, 100, 180, 365];

function TaskCard({ task, onUntick }: { task: CompletedTask; onUntick: () => void }) {
  return (
    <View style={styles.taskCard}>
      <Pressable onPress={onUntick} hitSlop={8}>
        <CircleCheck size={20} color={TOKENS.colors.action.success} strokeWidth={2.5} />
      </Pressable>
      <Text style={styles.taskName} numberOfLines={1}>{task.taskName}</Text>
      <Text style={styles.taskMeta}>{task.minutesEstimated}m</Text>
      <View style={[styles.dot, { backgroundColor: task.color }]} />
    </View>
  );
}

// ─── Streak Explanation Card ───────────────────────────────────────────────────

function StreakExplanationCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.explanationCard}>
      <Pressable style={styles.explanationHeader} onPress={() => setExpanded((v) => !v)}>
        <Info size={15} color={TOKENS.colors.accent.heading} strokeWidth={2} />
        <Text style={[styles.explanationTitle, { flex: 1 }]}>How do streaks work?</Text>
        {expanded
          ? <ChevronUp size={16} color={TOKENS.colors.text.secondary} strokeWidth={2} />
          : <ChevronDown size={16} color={TOKENS.colors.text.secondary} strokeWidth={2} />
        }
      </Pressable>
      {expanded && (
        <View style={styles.explanationBody}>
          <Text style={styles.explanationText}>
            Your streak counts consecutive days where you either completed a task <Text style={styles.explanationBold}>or</Text> hit your Rest Mode goal.
          </Text>
          <Text style={styles.explanationText}>
            Rest days protect your streak — so taking a break never breaks your momentum.
          </Text>
        </View>
      )}
    </View>
  );
}

export function HistoryScreen() {
  const {
    completedTasks, completedRestDays, partialRestDays, uncompleteTask,
    streak, bestStreak, restStreak, bestRestStreak,
  } = useApp();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Week offset — 0 = current week, -1 = last week, etc.
  const [weekOffset, setWeekOffset] = useState(0);

  const baseWeekStart = (() => {
    const daysFromMonday = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const d = new Date(today);
    d.setDate(today.getDate() - daysFromMonday);
    return d;
  })();

  const weekStart = new Date(baseWeekStart);
  weekStart.setDate(baseWeekStart.getDate() + weekOffset * 7);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const weekActivity = weekDays.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const hasTask = completedTasks.some((t) => {
      const d = new Date(t.completedAt);
      return d >= day && d < next;
    });
    const hasRest = completedRestDays.some((d) => {
      const rd = new Date(d);
      return rd >= day && rd < next;
    });
    const partial = partialRestDays.find((d) => {
      const rd = new Date(d.date);
      return rd >= day && rd < next;
    });
    return { hasTask, hasRest, partialPct: partial?.pct ?? null };
  });

  const nextMilestone = MILESTONES.find((m) => m > streak) ?? null;
  const daysToMilestone = nextMilestone !== null ? nextMilestone - streak : null;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayTasks = completedTasks.filter((t) => {
    const d = new Date(t.completedAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const yesterdayTasks = completedTasks.filter((t) => {
    const d = new Date(t.completedAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === yesterday.getTime();
  });

  const weekLabelStr = weekOffset === 0
    ? 'This Week'
    : weekOffset === -1
    ? 'Last Week'
    : `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your progress.</Text>
        <Text style={[styles.title, { color: TOKENS.colors.accent.heading }]}>
          Look how far you've come.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Streak explanation accordion */}
        <StreakExplanationCard />

        {/* Lifetime stats */}
        <View style={styles.statCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedTasks.length}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: TOKENS.colors.action.streak }]}>{streak}</Text>
            <View style={styles.statLabelRow}>
              <Flame size={11} color={TOKENS.colors.action.streak} strokeWidth={2} />
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{restStreak}</Text>
            <View style={styles.statLabelRow}>
              <Moon size={11} color={TOKENS.colors.text.secondary} strokeWidth={2} />
              <Text style={styles.statLabel}>Rest Streak</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{bestStreak}</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
        </View>

        {/* Week selector + dots */}
        <View>
          <View style={styles.weekSelectorRow}>
            <Pressable
              onPress={() => setWeekOffset((o) => o - 1)}
              style={styles.weekNavBtn}
              hitSlop={8}
            >
              <ChevronLeft size={18} color={TOKENS.colors.text.secondary} strokeWidth={2} />
            </Pressable>
            <Text style={styles.sectionLabel}>{weekLabelStr}</Text>
            <Pressable
              onPress={() => setWeekOffset((o) => Math.min(o + 1, 0))}
              style={[styles.weekNavBtn, weekOffset >= 0 && styles.weekNavBtnDisabled]}
              hitSlop={8}
              disabled={weekOffset >= 0}
            >
              <ChevronRight
                size={18}
                color={weekOffset >= 0 ? TOKENS.colors.text.muted : TOKENS.colors.text.secondary}
                strokeWidth={2}
              />
            </Pressable>
          </View>
          <View style={styles.weekCard}>
            {weekDays.map((day, i) => {
              const isToday = day.getTime() === today.getTime();
              const isFuture = day > today;
              const { hasTask, hasRest, partialPct } = weekActivity[i];
              const active = hasTask || hasRest;
              const dayName = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i];
              const isRestOnly = !hasTask && hasRest;
              const isPartial = !active && partialPct !== null;
              return (
                <View key={i} style={styles.weekCol}>
                  <View
                    style={[
                      styles.weekDot,
                      active && (isRestOnly ? styles.weekDotRest : styles.weekDotActive),
                      isToday && active && styles.weekDotToday,
                      isToday && !active && styles.weekDotTodayRing,
                      isPartial && styles.weekDotPartial,
                      isFuture && styles.weekDotFuture,
                    ]}
                  >
                    {isRestOnly && !isToday && (
                      <Moon size={12} color="#ffffff" strokeWidth={2} />
                    )}
                    {isPartial && partialPct !== null && (
                      <Moon size={12} color={TOKENS.colors.text.muted} strokeWidth={2} />
                    )}
                  </View>
                  <Text style={[styles.weekLabel, isToday && styles.weekLabelToday]}>
                    {dayName}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Next milestone */}
        <View style={styles.milestoneCard}>
          <Target size={28} color={TOKENS.colors.accent.heading} strokeWidth={1.8} />
          <View style={styles.milestoneText}>
            {streak === 0 ? (
              <>
                <Text style={styles.milestoneTitle}>Start your streak</Text>
                <Text style={styles.milestoneSub}>Complete a task today to begin!</Text>
              </>
            ) : daysToMilestone !== null ? (
              <>
                <Text style={styles.milestoneTitle}>
                  {daysToMilestone} more day{daysToMilestone !== 1 ? 's' : ''} to {nextMilestone}
                </Text>
                <Text style={styles.milestoneSub}>Keep going — you're on a roll</Text>
              </>
            ) : (
              <>
                <Text style={styles.milestoneTitle}>365 days — legendary!</Text>
                <Text style={styles.milestoneSub}>You've hit every milestone. Incredible.</Text>
              </>
            )}
          </View>
        </View>

        {todayTasks.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>Today</Text>
            {todayTasks.map((t) => (
              <TaskCard key={t.id} task={t} onUntick={() => uncompleteTask(t.id)} />
            ))}
          </View>
        )}

        {yesterdayTasks.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>Yesterday</Text>
            {yesterdayTasks.map((t) => (
              <TaskCard key={t.id} task={t} onUntick={() => uncompleteTask(t.id)} />
            ))}
          </View>
        )}

        {completedTasks.length === 0 && (
          <Text style={styles.empty}>
            No completed tasks yet.{'\n'}Spin the wheel to get started!
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.colors.bg.screen },
  header: { paddingHorizontal: TOKENS.spacing.screenPad, paddingTop: 12, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: '700', color: TOKENS.colors.text.primary, letterSpacing: 0.1 },
  content: {
    paddingHorizontal: TOKENS.spacing.screenPad,
    paddingBottom: 40,
    gap: TOKENS.spacing.rowGap,
  },

  // Streak explanation
  explanationCard: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    overflow: 'hidden',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 8,
  },
  explanationTitle: { fontSize: 14, fontWeight: '700', color: TOKENS.colors.text.primary },
  explanationBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  explanationText: { fontSize: 13, color: TOKENS.colors.text.secondary, lineHeight: 20 },
  explanationBold: { fontWeight: '700', color: TOKENS.colors.text.primary },
  // Stats
  statCard: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    flexDirection: 'row',
    paddingVertical: 20,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 22, fontWeight: '700', color: TOKENS.colors.text.primary },
  statLabel: { fontSize: 11, color: TOKENS.colors.text.secondary, textAlign: 'center' },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statDivider: { width: 1, backgroundColor: '#e8e8e8' },

  // Week selector
  weekSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 4,
  },
  weekNavBtn: { padding: 6 },
  weekNavBtnDisabled: { opacity: 0.3 },

  // Week dots
  weekCard: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    paddingVertical: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekCol: { flex: 1, alignItems: 'center', gap: 8 },
  weekDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDotActive: { backgroundColor: TOKENS.colors.action.primary },
  weekDotRest: { backgroundColor: '#A78BFA' },
  weekDotToday: { backgroundColor: TOKENS.colors.action.streak },
  weekDotTodayRing: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: TOKENS.colors.action.streak,
  },
  weekDotPartial: { backgroundColor: '#e8e8e8' },
  weekDotFuture: { backgroundColor: '#f5f5f5' },
  weekLabel: { fontSize: 11, color: TOKENS.colors.text.muted },
  weekLabelToday: { color: TOKENS.colors.action.streak, fontWeight: '600' },

  // Milestone
  milestoneCard: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  milestoneText: { flex: 1 },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TOKENS.colors.text.primary,
    marginBottom: 2,
  },
  milestoneSub: { fontSize: 13, color: TOKENS.colors.text.secondary },

  // Section label
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TOKENS.colors.text.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingVertical: 6,
  },

  // Task cards
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.row,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 6,
    gap: 10,
  },
  taskName: { flex: 1, fontSize: 16, color: TOKENS.colors.text.primary, fontWeight: '500' },
  taskMeta: { fontSize: 13, color: TOKENS.colors.text.secondary },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },

  empty: {
    textAlign: 'center',
    color: TOKENS.colors.text.secondary,
    fontSize: 15,
    marginTop: 32,
    lineHeight: 24,
  },
});
