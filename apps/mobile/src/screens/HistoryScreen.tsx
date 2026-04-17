import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp, type CompletedTask } from '../context/AppContext';

function TaskRow({ task }: { task: CompletedTask }) {
  return (
    <View style={styles.taskRow}>
      <View style={[styles.dot, { backgroundColor: task.color }]} />
      <Text style={styles.taskName} numberOfLines={1}>{task.taskName}</Text>
      <Text style={styles.taskMeta}>{task.minutesActual} min</Text>
    </View>
  );
}

export function HistoryScreen() {
  const { completedTasks } = useApp();

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

  const totalMinutes = completedTasks.reduce((sum, t) => sum + t.minutesActual, 0);
  const completionRate =
    completedTasks.length > 0
      ? Math.round(
          (completedTasks.filter((t) => t.minutesActual <= t.minutesEstimated).length /
            completedTasks.length) *
            100
        )
      : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedTasks.length}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(totalMinutes / 60).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Hours Focused</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completionRate}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>

        {todayTasks.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>Today</Text>
            <View style={styles.card}>
              {todayTasks.map((t, i) => (
                <View key={t.id}>
                  <TaskRow task={t} />
                  {i < todayTasks.length - 1 && <View style={styles.rowDivider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {yesterdayTasks.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>Yesterday</Text>
            <View style={styles.card}>
              {yesterdayTasks.map((t, i) => (
                <View key={t.id}>
                  <TaskRow task={t} />
                  {i < yesterdayTasks.length - 1 && <View style={styles.rowDivider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {completedTasks.length === 0 && (
          <Text style={styles.empty}>No completed tasks yet.{'\n'}Spin the wheel to get started!</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF9F7' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 34, fontWeight: '700', color: '#1C1C1E', letterSpacing: 0.37 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5E0',
    flexDirection: 'row',
    paddingVertical: 20,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 28, fontWeight: '600', color: '#1C1C1E' },
  statLabel: { fontSize: 13, color: '#8E8E93', textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: '#E8E5E0' },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5E0',
    overflow: 'hidden',
  },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  taskName: { flex: 1, fontSize: 17, color: '#1C1C1E' },
  taskMeta: { fontSize: 15, color: '#8E8E93' },
  rowDivider: { height: 1, backgroundColor: '#E8E5E0', marginLeft: 52 },
  empty: { textAlign: 'center', color: '#8E8E93', fontSize: 15, marginTop: 32, lineHeight: 24 },
});
