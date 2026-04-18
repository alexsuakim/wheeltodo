import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2 } from 'lucide-react-native';
import { useApp, type CompletedTask } from '../context/AppContext';
import { TOKENS } from '../theme/tokens';

function TaskCard({ task, onUntick }: { task: CompletedTask; onUntick: () => void }) {
  const actualH = (task.minutesActual / 60).toFixed(1);
  return (
    <View style={styles.taskCard}>
      <Pressable onPress={onUntick} hitSlop={8}>
        <CheckCircle2 size={20} color={TOKENS.colors.action.success} strokeWidth={2.5} />
      </Pressable>
      <Text style={styles.taskName} numberOfLines={1}>{task.taskName}</Text>
      <Text style={styles.taskMeta}>{task.minutesEstimated}m</Text>
      <Text style={styles.taskActual}>{actualH}h</Text>
      <View style={[styles.dot, { backgroundColor: task.color }]} />
    </View>
  );
}

export function HistoryScreen() {
  const { completedTasks, uncompleteTask } = useApp();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
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

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const weekTaskCounts = weekDays.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    return completedTasks.filter((t) => {
      const d = new Date(t.completedAt);
      return d >= day && d < next;
    }).length;
  });
  const maxWeekCount = Math.max(...weekTaskCounts, 1);

  const totalMinutes = completedTasks.reduce((s, t) => s + t.minutesActual, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const completionRate = completedTasks.length > 0
    ? Math.round(
        (completedTasks.filter((t) => t.minutesActual <= t.minutesEstimated).length /
          completedTasks.length) * 100
      )
    : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Your focus log</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedTasks.length}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalHours}</Text>
            <Text style={styles.statLabel}>Hours Focused</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completionRate}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>

        {/* This Week */}
        <View>
          <Text style={styles.sectionLabel}>This Week</Text>
          <View style={styles.weekChart}>
            {weekDays.map((day, i) => {
              const count = weekTaskCounts[i];
              const barH = count > 0 ? Math.max((count / maxWeekCount) * 56, 8) : 0;
              const isToday = day.getTime() === today.getTime();
              const dayName = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][day.getDay()];
              return (
                <View key={i} style={styles.weekColumn}>
                  <View style={styles.weekBarTrack}>
                    {count > 0 && (
                      <View
                        style={[
                          styles.weekBarFill,
                          { height: barH },
                          isToday && styles.weekBarToday,
                        ]}
                      />
                    )}
                  </View>
                  {count > 0 && (
                    <Text style={styles.weekBarCount}>{count}</Text>
                  )}
                  <Text style={[styles.weekBarLabel, isToday && styles.weekBarLabelToday]}>
                    {dayName}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {todayTasks.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>Today</Text>
            {todayTasks.map((t) => <TaskCard key={t.id} task={t} onUntick={() => uncompleteTask(t.id)} />)}
          </View>
        )}

        {yesterdayTasks.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>Yesterday</Text>
            {yesterdayTasks.map((t) => <TaskCard key={t.id} task={t} onUntick={() => uncompleteTask(t.id)} />)}
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
  title: { fontSize: 34, fontWeight: '700', color: TOKENS.colors.text.primary, letterSpacing: 0.37 },
  subtitle: { fontSize: 15, color: TOKENS.colors.text.secondary, marginTop: 2 },
  content: {
    paddingHorizontal: TOKENS.spacing.screenPad,
    paddingBottom: 40,
    gap: TOKENS.spacing.rowGap,
  },
  statCard: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    flexDirection: 'row',
    paddingVertical: 20,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 26, fontWeight: '700', color: TOKENS.colors.text.primary },
  statLabel: { fontSize: 12, color: TOKENS.colors.text.secondary, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: '#e8e8e8' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TOKENS.colors.text.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingVertical: 6,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 6,
    gap: 10,
  },
  taskName: { flex: 1, fontSize: 16, color: TOKENS.colors.text.primary, fontWeight: '500' },
  taskMeta: { fontSize: 13, color: TOKENS.colors.text.secondary },
  taskActual: { fontSize: 13, color: TOKENS.colors.text.muted },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  weekChart: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  weekColumn: { flex: 1, alignItems: 'center', gap: 4 },
  weekBarTrack: { height: 60, justifyContent: 'flex-end', alignItems: 'center' },
  weekBarFill: {
    width: 18,
    borderRadius: 4,
    backgroundColor: TOKENS.colors.action.primary,
  },
  weekBarToday: { backgroundColor: TOKENS.colors.action.streak },
  weekBarCount: { fontSize: 11, color: TOKENS.colors.text.secondary, fontWeight: '600' },
  weekBarLabel: { fontSize: 11, color: TOKENS.colors.text.muted },
  weekBarLabelToday: { color: TOKENS.colors.action.streak, fontWeight: '600' },
  empty: {
    textAlign: 'center',
    color: TOKENS.colors.text.secondary,
    fontSize: 15,
    marginTop: 32,
    lineHeight: 24,
  },
});
