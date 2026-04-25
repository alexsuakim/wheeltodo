import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Target, Flame, Trophy, Zap } from 'lucide-react-native';
import { useApp, COLORS, type Task } from '../context/AppContext';
import { formatMmSs } from '../utils/task';
import { TOKENS } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONFETTI_COLORS = ['#FF5C4D', '#FF9B50', '#4ECDC4', '#FFE66D', '#A78BFA', '#F9A8D4', '#60D394', '#118AB2'];
const PARTICLE_COUNT = 50;

const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
  x: Math.random() * SCREEN_WIDTH,
  color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  size: 6 + Math.random() * 8,
  delay: Math.random() * 600,
  maxRotation: 360 + Math.random() * 720,
  drift: (Math.random() - 0.5) * 80,
}));

function Confetti({ onDone }: { onDone: () => void }) {
  const anims = useRef(particles.map(() => new Animated.Value(0))).current;
  const rotAnims = useRef(particles.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = particles.map((p, i) =>
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(anims[i], { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(rotAnims[i], { toValue: 1, duration: 1600, useNativeDriver: true }),
        ]),
      ])
    );
    Animated.parallel(animations).start(() => onDone());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => {
        const translateY = anims[i].interpolate({ inputRange: [0, 1], outputRange: [-20, 680] });
        const translateX = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] });
        const opacity = anims[i].interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] });
        const rotate = rotAnims[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.maxRotation}deg`] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: 0,
              width: p.size,
              height: p.size * 0.5,
              backgroundColor: p.color,
              borderRadius: 2,
              opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}

const ICON_NAMES = ['PenLine', 'Code', 'Palette', 'Users', 'Mail', 'BookOpen', 'Briefcase', 'Coffee'];


function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Add Task Sheet ────────────────────────────────────────────────────────────

interface AddTaskSheetProps {
  onClose: () => void;
  onAdd: (name: string, mins: number, color: string, category: string) => void;
  onSave?: (id: string, name: string, mins: number, color: string, category: string) => void;
  categories: string[];
  onAddCategory: (cat: string) => void;
  task?: Task;
}

const ACHIEVEMENT_ICONS: Record<string, React.ComponentType<any>> = {
  'Daily Goal': Target,
  'On Fire': Flame,
  'Achiever': Trophy,
  'Speed Run': Zap,
};

function AchievementToast({ label, onDone }: { label: string; onDone: () => void }) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const Icon = ACHIEVEMENT_ICONS[label] ?? Trophy;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 70, friction: 11 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 100, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start(() => onDone());
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[toastStyles.container, { transform: [{ translateY }], opacity }]}>
      <View style={toastStyles.iconCircle}>
        <Icon size={18} color="#FFE66D" strokeWidth={2} />
      </View>
      <View style={toastStyles.textCol}>
        <Text style={toastStyles.eyebrow}>Achievement unlocked</Text>
        <Text style={toastStyles.label}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#111111',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  eyebrow: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  label: { fontSize: 16, color: '#ffffff', fontWeight: '700', marginTop: 1 },
});

function AddTaskSheet({ onClose, onAdd, onSave, categories, onAddCategory, task }: AddTaskSheetProps) {
  const isEdit = !!task;
  const initMins = task?.minutes ?? 25;
  const sheetY = useRef(new Animated.Value(700)).current;
  const [name, setName] = useState(task?.name ?? '');
  const [selectedColor, setSelectedColor] = useState(task?.color ?? COLORS[0]);
  const [selectedDuration, setSelectedDuration] = useState(initMins);
  const [durationHours, setDurationHours] = useState(String(Math.floor(initMins / 60)));
  const [durationMins, setDurationMins] = useState(String(initMins % 60));
  const [selectedCategory, setSelectedCategory] = useState(task?.category ?? '');
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryText, setNewCategoryText] = useState('');
  const dragY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) dragY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          Animated.timing(dragY, { toValue: 700, duration: 220, useNativeDriver: true }).start(() => onClose());
        } else {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

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
    if (v) {
      if (isEdit && task && onSave) {
        onSave(task.id, v, selectedDuration, selectedColor, selectedCategory);
      } else {
        onAdd(v, selectedDuration, selectedColor, selectedCategory);
      }
    }
    close();
  }

  return (
    <View style={sheet.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      <Animated.View style={[sheet.panel, { transform: [{ translateY: Animated.add(sheetY, dragY) }] }]}>
        <View style={sheet.handleArea} {...panResponder.panHandlers}>
          <View style={sheet.handle} />
        </View>

        <Text style={sheet.title}>{isEdit ? 'Edit task' : 'Add task'}</Text>
        <Text style={sheet.subtitle}>{isEdit ? 'Update the details below.' : 'What needs doing?'}</Text>

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
        <View style={sheet.durationRow}>
          <TextInput
            value={durationHours}
            onChangeText={(t) => {
              const digits = t.replace(/[^0-9]/g, '');
              setDurationHours(digits);
              const h = parseInt(digits || '0', 10);
              const m = parseInt(durationMins || '0', 10);
              const total = h * 60 + m;
              if (total > 0) setSelectedDuration(total);
            }}
            keyboardType="number-pad"
            maxLength={2}
            style={sheet.durationInput}
            selectTextOnFocus
          />
          <Text style={sheet.durationUnit}>h</Text>
          <TextInput
            value={durationMins}
            onChangeText={(t) => {
              const digits = t.replace(/[^0-9]/g, '');
              setDurationMins(digits);
              const h = parseInt(durationHours || '0', 10);
              const m = parseInt(digits || '0', 10);
              const total = h * 60 + m;
              if (total > 0) setSelectedDuration(total);
            }}
            keyboardType="number-pad"
            maxLength={2}
            style={sheet.durationInput}
            selectTextOnFocus
          />
          <Text style={sheet.durationUnit}>m</Text>
        </View>

        <Text style={sheet.sectionLabel}>CATEGORY</Text>
        <View style={sheet.chipRow}>
          {categories.map((cat) => (
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
          {addingCategory ? (
            <TextInput
              value={newCategoryText}
              onChangeText={setNewCategoryText}
              placeholder="Label name..."
              placeholderTextColor={TOKENS.colors.text.muted}
              style={sheet.categoryInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                if (newCategoryText.trim()) {
                  onAddCategory(newCategoryText.trim());
                  setSelectedCategory(newCategoryText.trim());
                }
                setNewCategoryText('');
                setAddingCategory(false);
              }}
              onBlur={() => {
                setNewCategoryText('');
                setAddingCategory(false);
              }}
            />
          ) : (
            <Pressable style={sheet.chip} onPress={() => setAddingCategory(true)}>
              <Text style={[sheet.chipText, { color: '#FF5C4D' }]}>+ Add</Text>
            </Pressable>
          )}
        </View>

        <Pressable onPress={handleAdd} style={sheet.addBtn}>
          <Text style={sheet.addBtnText}>{isEdit ? 'Save changes' : 'Add task'}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── Tasks Screen ──────────────────────────────────────────────────────────────

export function TasksScreen() {
  const {
    tasks, addTask, updateTask, deleteTask, completeTask, startPomodoro,
    pomodoroSession, pausePomodoro, resumePomodoro, completePomodoro, tickPomodoro,
    completedTasks, dailyGoal, categories, addCategory,
    seenAchievements, markAchievementSeen, taskProgress,
  } = useApp();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [achievementToast, setAchievementToast] = useState<string | null>(null);

  function checkAchievements(newCompleted: typeof completedTasks) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCount = newCompleted.filter((t) => {
      const d = new Date(t.completedAt); d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).length;

    const checks = [
      { label: 'Daily Goal', unlocked: todayCount >= dailyGoal },
      { label: 'Achiever', unlocked: newCompleted.length >= 10 },
      { label: 'Speed Run', unlocked: newCompleted.some((t) => t.minutesActual < t.minutesEstimated) },
    ];

    for (const { label, unlocked } of checks) {
      if (unlocked && !seenAchievements.includes(label)) {
        markAchievementSeen(label);
        setAchievementToast(label);
        return;
      }
    }
  }

  function celebrate() {
    setShowConfetti(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  useEffect(() => {
    if (!pomodoroSession?.isRunning) return;
    const id = setInterval(tickPomodoro, 1000);
    return () => clearInterval(id);
  }, [pomodoroSession?.isRunning, tickPomodoro]);

  useEffect(() => {
    if (pomodoroSession?.remainingSeconds === 0) {
      completePomodoro();
      celebrate();
    }
  }, [pomodoroSession?.remainingSeconds]);

  const progress = pomodoroSession
    ? (pomodoroSession.totalSeconds - pomodoroSession.remainingSeconds) / pomodoroSession.totalSeconds
    : 0;

  function handleAdd(taskName: string, mins: number, color: string, category: string) {
    addTask({ name: taskName, minutes: mins, color, icon: randomFrom(ICON_NAMES), category });
  }

  function handleSave(id: string, taskName: string, mins: number, color: string, category: string) {
    updateTask(id, { name: taskName, minutes: mins, color, category });
    setEditingTask(null);
  }

  function handleDone(task: Task) {
    completeTask(task.id, task.minutes);
    deleteTask(task.id);
    celebrate();
    const newEntry = { id: Date.now().toString(), taskId: task.id, taskName: task.name, color: task.color, icon: task.icon ?? 'BookOpen', minutesEstimated: task.minutes, minutesActual: task.minutes, completedAt: new Date() };
    checkAchievements([newEntry, ...completedTasks]);
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
        {/* Your stats */}
        {todayDone > 0 && (
          <>
            <Text style={styles.sectionLabel}>Your stats</Text>
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
          </>
        )}

        {/* Focus card */}
        {pomodoroSession && (() => {
          const activeTask = tasks.find((t) => t.id === pomodoroSession.taskId);
          return (
          <>
            <Text style={styles.sectionLabel}>Focusing now</Text>
            <View style={styles.focusCard}>
            <View style={styles.focusingRow}>
              {activeTask && (
                <View style={[styles.focusingDot, { backgroundColor: activeTask.color }]} />
              )}
              <Text style={styles.focusingTask}>{pomodoroSession.taskName}</Text>
            </View>
            {activeTask?.category ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{activeTask.category}</Text>
              </View>
            ) : null}
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
              <Pressable onPress={() => { completePomodoro(); celebrate(); }} style={styles.earlyDoneBtn}>
                <Text style={styles.earlyDoneBtnText}>Done ✓</Text>
              </Pressable>
            </View>
          </View>
          </>
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
            <Pressable style={styles.taskInfo} onPress={() => setEditingTask(task)}>
              <Text style={styles.taskName} numberOfLines={1}>{task.name}</Text>
              {task.category ? (
                <Text style={styles.taskCategory}>{task.category}</Text>
              ) : null}
            </Pressable>
            <Text style={styles.taskMeta}>
              {taskProgress[task.id] != null
                ? formatMmSs(taskProgress[task.id])
                : `${task.minutes}m`}
            </Text>
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

      </ScrollView>

      {sheetOpen && (
        <AddTaskSheet
          onClose={() => setSheetOpen(false)}
          onAdd={handleAdd}
          categories={categories}
          onAddCategory={addCategory}
        />
      )}
      {editingTask && (
        <AddTaskSheet
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onAdd={handleAdd}
          onSave={handleSave}
          categories={categories}
          onAddCategory={addCategory}
        />
      )}
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      {achievementToast && (
        <AchievementToast
          label={achievementToast}
          onDone={() => setAchievementToast(null)}
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
  addFabText: { fontSize: 22, color: '#ffffff', lineHeight: 22 },
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
  focusingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  focusingLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.45)',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.3,
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
  taskInfo: { flex: 1, gap: 2 },
  taskName: { fontSize: 16, color: TOKENS.colors.text.primary, fontWeight: '500' },
  taskCategory: { fontSize: 12, color: TOKENS.colors.text.muted, fontWeight: '500' },
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
  handleArea: {
    width: '100%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    marginBottom: 8,
  },
  handle: {
    width: 72, height: 5, borderRadius: 3,
    backgroundColor: '#e0e0e0',
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
  categoryInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: TOKENS.colors.text.primary,
    minWidth: 100,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  durationInput: {
    fontSize: 48,
    fontWeight: '700',
    color: TOKENS.colors.text.primary,
    backgroundColor: TOKENS.colors.bg.input,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 110,
    textAlign: 'center',
    letterSpacing: 2,
  },
  durationUnit: {
    fontSize: 22,
    fontWeight: '600',
    color: TOKENS.colors.text.secondary,
  },
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
