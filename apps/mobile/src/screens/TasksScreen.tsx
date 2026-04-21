import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp, COLORS, type Task } from '../context/AppContext';
import { formatMmSs } from '../utils/task';
import { TOKENS } from '../theme/tokens';

const ICON_NAMES = ['PenLine', 'Code', 'Palette', 'Users', 'Mail', 'BookOpen', 'Briefcase', 'Coffee'];
const DURATIONS = [15, 25, 45, 60];
const CATEGORIES = ['Work', 'Personal', 'Learning', 'Health'];

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Add Task Sheet ────────────────────────────────────────────────────────────

interface AddTaskSheetProps {
  onClose: () => void;
  onAdd: (name: string, mins: number, color: string) => void;
}

function AddTaskSheet({ onClose, onAdd }: AddTaskSheetProps) {
  const sheetY = useRef(new Animated.Value(700)).current;
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    Animated.spring(sheetY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, []);

  function close() {
    Animated.timing(sheetY, {
      toValue: 700,
      duration: 260,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onClose());
  }

  function handleAdd() {
    const v = name.trim();
    if (v) onAdd(v, selectedDuration, selectedColor);
    close();
  }

  return (
    <View style={sheet.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      <Animated.View style={[sheet.panel, { transform: [{ translateY: sheetY }] }]}>
        <View style={sheet.handle} />

        <Text style={sheet.title}>Add task</Text>
        <Text style={sheet.subtitle}>What needs doing?</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Task name..."
          placeholderTextColor={TOKENS.colors.text.muted}
          style={sheet.input}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />

        <Text style={sheet.sectionLabel}>COLOUR</Text>
        <View style={sheet.colorRow}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setSelectedColor(c)}
              style={[
                sheet.colorCircle,
                { backgroundColor: c },
                selectedColor === c && sheet.colorSelected,
              ]}
            />
          ))}
        </View>

        <Text style={sheet.sectionLabel}>DURATION</Text>
        <View style={sheet.chipRow}>
          {DURATIONS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setSelectedDuration(d)}
              style={[sheet.chip, selectedDuration === d && sheet.chipActive]}
            >
              <Text style={[sheet.chipText, selectedDuration === d && sheet.chipTextActive]}>
                {d}m
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={sheet.sectionLabel}>CATEGORY</Text>
        <View style={sheet.chipRow}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
              style={[sheet.chip, selectedCategory === cat && sheet.chipActive]}
            >
              <Text style={[sheet.chipText, selectedCategory === cat && sheet.chipTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={handleAdd} style={sheet.addBtn}>
          <Text style={sheet.addBtnText}>Add task</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── Tasks Screen ──────────────────────────────────────────────────────────────

export function TasksScreen() {
  const {
    tasks, addTask, deleteTask, completeTask, startPomodoro,
    pomodoroSession, pausePomodoro, resumePomodoro, completePomodoro, tickPomodoro,
    completedTasks, dailyGoal,
  } = useApp();

  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!pomodoroSession?.isRunning) return;
    const id = setInterval(tickPomodoro, 1000);
    return () => clearInterval(id);
  }, [pomodoroSession?.isRunning, tickPomodoro]);

  const progress = pomodoroSession
    ? (pomodoroSession.totalSeconds - pomodoroSession.remainingSeconds) / pomodoroSession.totalSeconds
    : 0;

  function handleAdd(taskName: string, mins: number, color: string) {
    addTask({ name: taskName, minutes: mins, color, icon: randomFrom(ICON_NAMES) });
  }

  function handleDone(task: Task) {
    completeTask(task.id, task.minutes);
    deleteTask(task.id);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCompleted = completedTasks.filter((t) => {
    const d = new Date(t.completedAt); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  const todayDone = todayCompleted.length;
  const totalMinutesDone = todayCompleted.reduce((s, t) => s + t.minutesActual, 0);
  const goalPct = dailyGoal > 0 ? Math.min(Math.round((todayDone / dailyGoal) * 100), 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <View>
          <Text style={styles.navTitle}>Tasks</Text>
          <Text style={styles.navSubtitle}>Spin to pick a task, then focus.</Text>
        </View>
        <Pressable onPress={() => setSheetOpen(true)} style={styles.addFab}>
          <Text style={styles.addFabText}>+</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Focus card */}
        {pomodoroSession && (() => {
          const activeTask = tasks.find((t) => t.id === pomodoroSession.taskId);
          return (
          <View style={styles.focusCard}>
            <Text style={styles.focusingLabel}>FOCUSING NOW</Text>
            <View style={styles.focusingRow}>
              {activeTask && (
                <View style={[styles.focusingDot, { backgroundColor: activeTask.color }]} />
              )}
              <Text style={styles.focusingTask}>{pomodoroSession.taskName}</Text>
            </View>
            <Text style={styles.timerText}>{formatMmSs(pomodoroSession.remainingSeconds)}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as `${number}%` }]} />
            </View>
            <View style={styles.timerActions}>
              <Pressable
                onPress={pomodoroSession.isRunning ? pausePomodoro : resumePomodoro}
                style={styles.pauseBtn}
              >
                <Text style={styles.pauseBtnText}>
                  {pomodoroSession.isRunning ? 'Pause' : 'Resume'}
                </Text>
              </Pressable>
              <Pressable onPress={completePomodoro} style={styles.earlyDoneBtn}>
                <Text style={styles.earlyDoneBtnText}>Done ✓</Text>
              </Pressable>
            </View>
          </View>
          );
        })()}

        {tasks.length > 0 && (
          <Text style={styles.sectionLabel}>TODAY'S TASKS</Text>
        )}

        {tasks.map((task) => {
          const isActive = pomodoroSession?.taskId === task.id;
          return (
          <View key={task.id} style={[styles.taskCard, isActive && styles.taskCardActive]}>
            <View style={[styles.taskDot, { backgroundColor: task.color }]} />
            <Text style={styles.taskName} numberOfLines={1}>{task.name}</Text>
            <Text style={styles.taskMeta}>{task.minutes}m</Text>
            <Pressable onPress={() => startPomodoro(task)} style={styles.focusBtn}>
              <Text style={styles.focusBtnText}>Focus</Text>
            </Pressable>
            <Pressable onPress={() => handleDone(task)} style={styles.checkBtn}>
              <Text style={styles.checkBtnText}>✓</Text>
            </Pressable>
            <Pressable onPress={() => deleteTask(task.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>×</Text>
            </Pressable>
          </View>
          );
        })}

        {tasks.length === 0 && (
          <Text style={styles.emptyHint}>No tasks yet. Tap + to add one.</Text>
        )}

        {/* Today's stats */}
        {todayDone > 0 && (
          <View style={styles.statCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalMinutesDone}m</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayDone}/{dailyGoal}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{goalPct}%</Text>
              <Text style={styles.statLabel}>Goal</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {sheetOpen && (
        <AddTaskSheet
          onClose={() => setSheetOpen(false)}
          onAdd={handleAdd}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.colors.bg.screen },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: TOKENS.spacing.screenPad,
    paddingTop: 12,
    paddingBottom: 8,
  },
  navTitle: { fontSize: 34, fontWeight: '700', color: TOKENS.colors.text.primary, letterSpacing: 0.37 },
  navSubtitle: { fontSize: 14, color: TOKENS.colors.text.secondary, marginTop: 2 },
  addFab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TOKENS.colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFabText: { fontSize: 22, color: '#ffffff', lineHeight: 28, marginTop: -2 },
  content: {
    paddingHorizontal: TOKENS.spacing.screenPad,
    paddingBottom: 40,
    gap: TOKENS.spacing.rowGap,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TOKENS.colors.text.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingTop: 4,
  },

  // Focus card
  focusCard: {
    backgroundColor: TOKENS.colors.action.primary,
    borderRadius: TOKENS.radius.card,
    padding: 20,
    marginBottom: 4,
  },
  focusingLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.45)',
  },
  focusingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  focusingDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  focusingTask: { fontSize: 20, fontWeight: '600', color: '#ffffff', flex: 1 },
  timerText: {
    marginTop: 12,
    fontSize: 48,
    fontWeight: '300',
    color: '#ffffff',
  },
  progressTrack: {
    marginTop: 12,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: TOKENS.colors.action.streak, borderRadius: 2 },
  timerActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  pauseBtn: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: TOKENS.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBtnText: { fontSize: 15, color: '#ffffff', fontWeight: '500' },
  earlyDoneBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: TOKENS.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earlyDoneBtnText: { fontSize: 15, color: TOKENS.colors.action.primary, fontWeight: '600' },

  // Task cards
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.row,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  taskCardActive: {
    opacity: 0.5,
  },
  taskDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  taskName: { flex: 1, fontSize: 16, color: TOKENS.colors.text.primary, fontWeight: '500' },
  taskMeta: { fontSize: 14, color: TOKENS.colors.text.secondary },
  focusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: TOKENS.colors.action.primary,
    borderRadius: TOKENS.radius.pill,
  },
  focusBtnText: { fontSize: 13, color: '#ffffff', fontWeight: '600' },
  checkBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(34,167,34,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkBtnText: { color: TOKENS.colors.action.success, fontWeight: '700', fontSize: 16 },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,92,77,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { color: TOKENS.colors.action.danger, fontWeight: '700', fontSize: 18 },
  emptyHint: { textAlign: 'center', color: TOKENS.colors.text.secondary, fontSize: 15, marginTop: 8 },

  // Stat card
  statCard: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    flexDirection: 'row',
    paddingVertical: 18,
    marginTop: 4,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '700', color: TOKENS.colors.text.primary },
  statLabel: { fontSize: 12, color: TOKENS.colors.text.secondary },
  statDivider: { width: 1, backgroundColor: '#e8e8e8' },
});

const sheet = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: TOKENS.radius.sheet,
    borderTopRightRadius: TOKENS.radius.sheet,
    padding: 24,
    paddingBottom: 48,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '700', color: TOKENS.colors.text.primary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: TOKENS.colors.text.secondary, marginBottom: 20 },
  input: {
    backgroundColor: TOKENS.colors.bg.input,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: TOKENS.colors.text.primary,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TOKENS.colors.text.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  colorCircle: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: '#111111' },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#f0f0f0',
  },
  chipActive: { backgroundColor: TOKENS.colors.action.primary },
  chipText: { fontSize: 14, color: TOKENS.colors.text.secondary, fontWeight: '500' },
  chipTextActive: { color: '#ffffff' },
  addBtn: {
    height: 52,
    backgroundColor: TOKENS.colors.action.primary,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addBtnText: { fontSize: 17, color: '#ffffff', fontWeight: '600' },
});
