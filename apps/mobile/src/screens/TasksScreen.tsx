import React, { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useApp, COLORS, type Task } from '../context/AppContext';
import { formatMmSs } from '../utils/task';

const ICON_NAMES = ['PenLine', 'Code', 'Palette', 'Users', 'Mail', 'BookOpen', 'Briefcase', 'Coffee'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function TasksScreen() {
  const {
    tasks, addTask, deleteTask, completeTask, startPomodoro,
    pomodoroSession, pausePomodoro, resumePomodoro, completePomodoro, tickPomodoro,
  } = useApp();

  const [name, setName] = useState('');
  const [mins, setMins] = useState('25');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!pomodoroSession?.isRunning) return;
    const id = setInterval(tickPomodoro, 1000);
    return () => clearInterval(id);
  }, [pomodoroSession?.isRunning, tickPomodoro]);

  const progress = pomodoroSession
    ? (pomodoroSession.totalSeconds - pomodoroSession.remainingSeconds) / pomodoroSession.totalSeconds
    : 0;

  function handleAdd() {
    const v = name.trim();
    if (!v) { setAdding(false); return; }
    addTask({
      name: v,
      minutes: Math.max(1, Math.min(480, parseInt(mins, 10) || 25)),
      color: randomFrom(COLORS),
      icon: randomFrom(ICON_NAMES),
    });
    setName('');
    setMins('25');
    setAdding(false);
  }

  function handleDone(task: Task) {
    completeTask(task.id, task.minutes);
    deleteTask(task.id);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <Text style={styles.navTitle}>Tasks</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {pomodoroSession && (
          <View style={styles.card}>
            <Text style={styles.focusingLabel}>FOCUSING NOW</Text>
            <Text style={styles.focusingTask}>{pomodoroSession.taskName}</Text>

            <Text style={styles.timerText}>
              {formatMmSs(pomodoroSession.remainingSeconds)}
            </Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
            </View>

            <View style={styles.timerActions}>
              <Pressable
                onPress={pomodoroSession.isRunning ? pausePomodoro : resumePomodoro}
                style={styles.timerBtn}
              >
                <Text style={styles.timerBtnText}>
                  {pomodoroSession.isRunning ? 'Pause' : 'Resume'}
                </Text>
              </Pressable>
              <Pressable onPress={completePomodoro} style={[styles.timerBtn, styles.doneBtn]}>
                <Text style={[styles.timerBtnText, styles.doneBtnText]}>Done early</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.card}>
          {tasks.map((task, i) => (
            <View key={task.id} style={[styles.taskRow, i < tasks.length - 1 && styles.rowBorder]}>
              <View style={[styles.dot, { backgroundColor: task.color }]} />
              <Text style={styles.taskName} numberOfLines={1}>{task.name}</Text>
              <Text style={styles.taskMeta}>{task.minutes}m</Text>
              <Pressable onPress={() => startPomodoro(task)} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>Focus</Text>
              </Pressable>
              <Pressable onPress={() => handleDone(task)} style={[styles.actionBtn, styles.checkBtn]}>
                <Text style={[styles.actionBtnText, styles.checkBtnText]}>✓</Text>
              </Pressable>
              <Pressable onPress={() => deleteTask(task.id)} style={[styles.actionBtn, styles.deleteBtn]}>
                <Text style={[styles.actionBtnText, styles.deleteBtnText]}>×</Text>
              </Pressable>
            </View>
          ))}

          {adding ? (
            <View style={styles.addRow}>
              <View style={[styles.dot, { backgroundColor: '#8E8E93' }]} />
              <TextInput
                value={name}
                onChangeText={setName}
                onBlur={handleAdd}
                onSubmitEditing={handleAdd}
                autoFocus
                placeholder="Task name..."
                placeholderTextColor="#8E8E93"
                style={styles.addInput}
                returnKeyType="done"
              />
              <TextInput
                value={mins}
                onChangeText={setMins}
                keyboardType="number-pad"
                style={styles.minsInput}
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
              <Text style={styles.minsLabel}>min</Text>
            </View>
          ) : (
            <Pressable onPress={() => setAdding(true)} style={styles.newTaskBtn}>
              <Text style={styles.newTaskBtnText}>+ New task…</Text>
            </Pressable>
          )}
        </View>

        {tasks.length === 0 && !adding && (
          <Text style={styles.emptyHint}>No tasks yet. Tap + New task to add one.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF9F7' },
  navBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5E0',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  navTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5E0',
    overflow: 'hidden',
  },
  focusingLabel: {
    paddingHorizontal: 20,
    paddingTop: 16,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: '#8E8E93',
  },
  focusingTask: { paddingHorizontal: 20, marginTop: 4, fontSize: 20, fontWeight: '600', color: '#1C1C1E' },
  timerText: {
    paddingHorizontal: 20,
    marginTop: 12,
    fontSize: 48,
    fontWeight: '300',
    color: '#1C1C1E',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    marginHorizontal: 20,
    marginTop: 12,
    height: 4,
    backgroundColor: '#E8E5E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 },
  timerActions: { flexDirection: 'row', gap: 10, padding: 16 },
  timerBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8E5E0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  timerBtnText: { fontSize: 15, color: '#1C1C1E', fontWeight: '500' },
  doneBtn: { borderColor: 'rgba(52,199,89,0.4)', backgroundColor: 'rgba(52,199,89,0.08)' },
  doneBtnText: { color: '#34C759' },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#E8E5E0' },
  dot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  taskName: { flex: 1, fontSize: 17, color: '#1C1C1E' },
  taskMeta: { fontSize: 15, color: '#8E8E93' },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E5E0',
  },
  actionBtnText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  checkBtn: { borderColor: 'rgba(52,199,89,0.4)', backgroundColor: 'rgba(52,199,89,0.08)' },
  checkBtnText: { color: '#34C759' },
  deleteBtn: { borderColor: 'rgba(255,59,48,0.3)', backgroundColor: 'rgba(255,59,48,0.06)' },
  deleteBtnText: { color: '#FF3B30' },
  addRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  addInput: { flex: 1, fontSize: 17, color: '#1C1C1E' },
  minsInput: {
    width: 52,
    fontSize: 17,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E8E5E0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: 'center',
  },
  minsLabel: { fontSize: 15, color: '#8E8E93' },
  newTaskBtn: { paddingHorizontal: 20, paddingVertical: 16 },
  newTaskBtnText: { fontSize: 17, color: '#007AFF', fontWeight: '500' },
  emptyHint: { textAlign: 'center', color: '#8E8E93', fontSize: 15, marginTop: 8 },
});
