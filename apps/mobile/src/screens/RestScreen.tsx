import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, Brain, Check, ChevronDown, ChevronUp, Coffee, Frown, Info, Meh, MessageCircle, PenLine, Plus, Timer, X, Zap } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useApp, type RestTask, type DailyMood, type RestCategory, type ActiveRestTimer } from '../context/AppContext';
import { TOKENS } from '../theme/tokens';
import { formatMmSs } from '../utils/task';

// ─── Confetti ──────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#4ECDC4','#A78BFA','#FFE66D','#93C5FD','#60D394'];
const CONF_PARTICLES = Array.from({ length: 40 }, (_, i) => ({
  x: (i / 40) * 360,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 6 + (i % 3) * 3,
  delay: (i % 8) * 100,
  drift: ((i % 5) - 2) * 60,
}));

function RestConfetti({ onDone }: { onDone: () => void }) {
  const anims = useRef(CONF_PARTICLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = CONF_PARTICLES.map((p, i) =>
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(anims[i], { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ])
    );
    Animated.parallel(animations).start(() => onDone());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {CONF_PARTICLES.map((p, i) => {
        const translateY = anims[i].interpolate({ inputRange: [0, 1], outputRange: [-20, 700] });
        const translateX = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] });
        const opacity = anims[i].interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] });
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
              transform: [{ translateY }, { translateX }],
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Category info ─────────────────────────────────────────────────────────────

const CATEGORY_META: Record<RestCategory, { icon: LucideIcon; color: string; bg: string }> = {
  Physical:    { icon: Activity,       color: TOKENS.colors.rest.physical,    bg: '#FFF4EC' },
  Mental:      { icon: Brain,          color: TOKENS.colors.rest.mental,      bg: '#F5F3FF' },
  Social:      { icon: MessageCircle,  color: TOKENS.colors.rest.social,      bg: '#EDFAFA' },
  Nourishment: { icon: Coffee,         color: TOKENS.colors.rest.nourishment, bg: '#FFFDE8' },
  'My Tasks':  { icon: PenLine,        color: TOKENS.colors.rest.custom,      bg: '#EFF6FF' },
};

const MOOD_ORDER: Record<DailyMood & string, string[]> = {
  drained:  ['preset_6', 'preset_4', 'preset_1'],  // nap, stretch, coffee
  okay:     ['preset_3', 'preset_9', 'preset_7'],  // read, journal, cook
  restless: ['preset_8', 'preset_2', 'preset_5'],  // run, walk, call friend
};

// ─── Energy Check-in ──────────────────────────────────────────────────────────

interface EnergyCheckInProps {
  onSelect: (mood: DailyMood) => void;
}

function EnergyCheckIn({ onSelect }: EnergyCheckInProps) {
  const moods: { key: DailyMood; label: string; icon: LucideIcon; color: string }[] = [
    { key: 'drained',  label: 'Drained',  icon: Frown, color: TOKENS.colors.rest.mental },
    { key: 'okay',     label: 'Okay',     icon: Meh,   color: TOKENS.colors.rest.social },
    { key: 'restless', label: 'Restless', icon: Zap,   color: TOKENS.colors.rest.physical },
  ];

  return (
    <View style={styles.checkInCard}>
      <Text style={styles.checkInTitle}>How are you feeling?</Text>
      <Text style={styles.checkInSub}>We'll suggest the best activities for you.</Text>
      <View style={styles.moodRow}>
        {moods.map((m) => {
          const MoodIcon = m.icon;
          return (
            <Pressable key={m.key} style={styles.moodBtn} onPress={() => onSelect(m.key)}>
              <MoodIcon size={24} color={m.color} strokeWidth={2} />
              <Text style={styles.moodLabel}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Rest Task Row ─────────────────────────────────────────────────────────────

interface RestTaskRowProps {
  task: RestTask;
  isTimerActive: boolean;
  timerRemaining: number;
  timerTotal: number;
  onStart: () => void;
  onCancel: () => void;
  onRemove: () => void;
}

function RestTaskRow({ task, isTimerActive, timerRemaining, timerTotal, onStart, onCancel, onRemove }: RestTaskRowProps) {
  const timerPct = timerTotal > 0 ? (timerTotal - timerRemaining) / timerTotal : 0;

  if (task.completedToday) {
    return (
      <View style={rowStyles.row}>
        <View style={rowStyles.checkboxDone}>
          <Check size={13} color="#fff" strokeWidth={3} />
        </View>
        <Text style={rowStyles.taskNameDone} numberOfLines={1}>{task.name}</Text>
        <Text style={rowStyles.duration}>{task.durationMinutes}m</Text>
      </View>
    );
  }

  if (task.skippedToday) {
    return (
      <View style={rowStyles.row}>
        <View style={rowStyles.checkboxSkipped}>
          <X size={11} color={TOKENS.colors.text.muted} strokeWidth={2.5} />
        </View>
        <Text style={rowStyles.taskNameSkipped} numberOfLines={1}>{task.name}</Text>
        <Text style={rowStyles.duration}>{task.durationMinutes}m</Text>
      </View>
    );
  }

  if (isTimerActive) {
    return (
      <View style={rowStyles.activeTimerRow}>
        <View style={rowStyles.activeTimerTop}>
          <View style={rowStyles.timerIconWrap}>
            <Timer size={15} color={TOKENS.colors.rest.mental} strokeWidth={2} />
          </View>
          <Text style={rowStyles.taskNameActive} numberOfLines={1}>{task.name}</Text>
          <Text style={rowStyles.timerCountdown}>{formatMmSs(timerRemaining)}</Text>
          <Pressable onPress={onCancel} style={rowStyles.cancelBtn} hitSlop={8}>
            <X size={14} color={TOKENS.colors.text.muted} strokeWidth={2.5} />
          </Pressable>
        </View>
        <View style={rowStyles.timerTrack}>
          <View style={[rowStyles.timerFill, { width: `${Math.round(timerPct * 100)}%` as any }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.checkbox} />
      <Text style={rowStyles.taskName} numberOfLines={1}>{task.name}</Text>
      <Text style={rowStyles.duration}>{task.durationMinutes}m</Text>
      <Pressable onPress={onStart} style={rowStyles.startBtn} hitSlop={6}>
        <Timer size={16} color={TOKENS.colors.text.primary} strokeWidth={1.8} />
      </Pressable>
      {!task.isPreset && (
        <Pressable onPress={onRemove} style={rowStyles.removeBtn} hitSlop={8}>
          <X size={14} color={TOKENS.colors.text.muted} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TOKENS.spacing.cardPad,
    paddingVertical: 13,
    gap: 10,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.8, borderColor: '#d0d0d0',
    flexShrink: 0,
  },
  checkboxDone: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: TOKENS.colors.action.success,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkboxSkipped: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.8, borderColor: '#e0e0e0',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  taskName: { flex: 1, fontSize: 15, color: TOKENS.colors.text.primary },
  taskNameDone: { flex: 1, fontSize: 15, color: TOKENS.colors.text.secondary, textDecorationLine: 'line-through' },
  taskNameSkipped: { flex: 1, fontSize: 15, color: TOKENS.colors.text.muted },
  taskNameActive: { flex: 1, fontSize: 15, color: TOKENS.colors.text.primary, fontWeight: '600' },
  duration: { fontSize: 13, color: TOKENS.colors.text.muted },
  startBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtn: { padding: 2 },
  cancelBtn: { padding: 2 },
  activeTimerRow: {
    paddingHorizontal: TOKENS.spacing.cardPad,
    paddingVertical: 12,
    gap: 8,
  },
  activeTimerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timerIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F5F3FF',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  timerCountdown: { fontSize: 16, fontWeight: '700', color: TOKENS.colors.rest.mental },
  timerTrack: {
    height: 4,
    backgroundColor: '#ebebeb',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  timerFill: { height: 4, backgroundColor: TOKENS.colors.rest.mental, borderRadius: 2 },
});

// ─── Category Section ──────────────────────────────────────────────────────────

interface CategorySectionProps {
  category: RestCategory;
  tasks: RestTask[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeRestTimer: ActiveRestTimer | null;
  onStartTimer: (id: string) => void;
  onCancelTimer: () => void;
  onRemove: (id: string) => void;
}

function CategorySection({
  category, tasks, isCollapsed, onToggleCollapse,
  activeRestTimer, onStartTimer, onCancelTimer, onRemove,
}: CategorySectionProps) {
  const meta = CATEGORY_META[category];
  const CatIcon = meta.icon;
  const doneCount = tasks.filter((t) => t.completedToday).length;

  return (
    <View style={catStyles.container}>
      <Pressable style={catStyles.header} onPress={onToggleCollapse}>
        <View style={[catStyles.iconWrap, { backgroundColor: meta.bg }]}>
          <CatIcon size={16} color={meta.color} strokeWidth={2} />
        </View>
        <Text style={[catStyles.title, { color: meta.color }]}>{category}</Text>
        <Text style={catStyles.progress}>{doneCount}/{tasks.length}</Text>
        {isCollapsed
          ? <ChevronDown size={16} color={TOKENS.colors.text.muted} strokeWidth={2} />
          : <ChevronUp   size={16} color={TOKENS.colors.text.muted} strokeWidth={2} />
        }
      </Pressable>

      {!isCollapsed && (
        <View style={catStyles.body}>
          {tasks.map((task, i) => (
            <View key={task.id}>
              {i > 0 && <View style={catStyles.divider} />}
              <RestTaskRow
                task={task}
                isTimerActive={activeRestTimer?.taskId === task.id}
                timerRemaining={activeRestTimer?.taskId === task.id ? activeRestTimer.remainingSeconds : 0}
                timerTotal={activeRestTimer?.taskId === task.id ? activeRestTimer.totalSeconds : 0}
                onStart={() => onStartTimer(task.id)}
                onCancel={onCancelTimer}
                onRemove={() => onRemove(task.id)}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const catStyles = StyleSheet.create({
  container: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  title: { flex: 1, fontSize: 14, fontWeight: '700' },
  progress: { fontSize: 13, color: TOKENS.colors.text.muted },
  body: {},
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: TOKENS.spacing.cardPad + 32 + 10,
  },
});

// ─── Rest Meter ────────────────────────────────────────────────────────────────

function RestMeter({ minutesDone, goalMinutes }: { minutesDone: number; goalMinutes: number }) {
  const pct = goalMinutes > 0 ? Math.min(minutesDone / goalMinutes, 1) : 0;
  const goalMet = pct >= 1;

  return (
    <View style={meterStyles.container}>
      <View style={meterStyles.topRow}>
        <Text style={meterStyles.label}>Rest Meter</Text>
        <Text style={meterStyles.value}>
          {minutesDone} / {goalMinutes}m
        </Text>
      </View>
      <View style={meterStyles.track}>
        <View style={[
          meterStyles.fill,
          { width: `${Math.round(pct * 100)}%` as any },
          goalMet && meterStyles.fillDone,
        ]} />
      </View>
      <Text style={[meterStyles.sub, goalMet && meterStyles.subDone]}>
        {goalMet
          ? '🌿 Streak protected!'
          : `${goalMinutes - minutesDone}m more to protect your streak`
        }
      </Text>
    </View>
  );
}

const meterStyles = StyleSheet.create({
  container: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    padding: 16,
    gap: 10,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '700', color: TOKENS.colors.text.primary },
  value: { fontSize: 14, fontWeight: '600', color: TOKENS.colors.text.secondary },
  track: {
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: { height: 10, backgroundColor: '#4ECDC4', borderRadius: 5 },
  fillDone: { backgroundColor: TOKENS.colors.action.success },
  sub: { fontSize: 13, color: TOKENS.colors.text.secondary },
  subDone: { color: TOKENS.colors.action.success, fontWeight: '600' },
});

// ─── Completion Celebration ────────────────────────────────────────────────────

function RestCelebration({ onDismiss }: { onDismiss: () => void }) {
  const [showConfetti, setShowConfetti] = useState(true);

  return (
    <Modal transparent animationType="fade">
      <View style={celebStyles.overlay}>
        {showConfetti && <RestConfetti onDone={() => setShowConfetti(false)} />}
        <View style={celebStyles.card}>
          <Text style={celebStyles.emoji}>🌿</Text>
          <Text style={celebStyles.title}>Rest complete!</Text>
          <Text style={celebStyles.sub}>Streak protected. You've earned your rest.</Text>
          <Pressable style={celebStyles.btn} onPress={onDismiss}>
            <Text style={celebStyles.btnText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const celebStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: TOKENS.radius.card,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 32,
  },
  emoji: { fontSize: 56 },
  title: { fontSize: 24, fontWeight: '800', color: TOKENS.colors.text.primary, textAlign: 'center' },
  sub: { fontSize: 15, color: TOKENS.colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  btn: {
    marginTop: 8,
    backgroundColor: TOKENS.colors.action.primary,
    borderRadius: TOKENS.radius.pill,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  btnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});

// ─── Rest FAQ Accordion ────────────────────────────────────────────────────────

function RestFaqAccordion() {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={faqStyles.card}>
      <Pressable style={faqStyles.header} onPress={() => setExpanded((v) => !v)}>
        <Info size={15} color={TOKENS.colors.accent.heading} strokeWidth={2} />
        <Text style={faqStyles.headerText}>How does Rest Mode protect my streak?</Text>
        {expanded
          ? <ChevronUp size={16} color={TOKENS.colors.text.secondary} strokeWidth={2} />
          : <ChevronDown size={16} color={TOKENS.colors.text.secondary} strokeWidth={2} />
        }
      </Pressable>
      {expanded && (
        <View style={faqStyles.body}>
          <Text style={faqStyles.bodyText}>
            Complete your daily rest goal to protect your streak — even on off days. Rest days count towards consecutive days, so taking a break never breaks your momentum.
          </Text>
        </View>
      )}
    </View>
  );
}

const faqStyles = StyleSheet.create({
  card: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    color: TOKENS.colors.text.primary,
    flex: 1,
  },
  body: { paddingHorizontal: 14, paddingBottom: 14 },
  bodyText: { fontSize: 13, color: TOKENS.colors.text.secondary, lineHeight: 20 },
});

// ─── Main RestScreen ───────────────────────────────────────────────────────────

const CATEGORIES_ORDER: RestCategory[] = ['Physical', 'Mental', 'Social', 'Nourishment', 'My Tasks'];

export function RestScreen() {
  const {
    restTasks,
    completedRestDays,
    addRestTask,
    removeRestTask,
    activeRestTimer,
    startRestTimer,
    cancelRestTimer,
    tickRestTimer,
    todayMood,
    setTodayMood,
    restMinutesToday,
    restGoalMinutes,
    streak,
    hasActivityToday,
    restStreak,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [collapsed, setCollapsed] = useState<Record<RestCategory, boolean>>({
    Physical: false,
    Mental: false,
    Social: false,
    Nourishment: false,
    'My Tasks': false,
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const prevGoalMet = useRef(false);

  // Drive active rest timer
  useEffect(() => {
    if (!activeRestTimer?.isRunning) return;
    const id = setInterval(tickRestTimer, 1000);
    return () => clearInterval(id);
  }, [activeRestTimer?.isRunning, tickRestTimer]);

  // Trigger celebration when meter hits 100%
  const goalMet = restGoalMinutes > 0 && restMinutesToday >= restGoalMinutes;
  useEffect(() => {
    if (goalMet && !prevGoalMet.current) {
      setShowCelebration(true);
    }
    prevGoalMet.current = goalMet;
  }, [goalMet]);

  const atRisk = streak > 0 && !hasActivityToday;

  // Sort tasks so that suggested ones appear first when mood is set
  const getSortedTasks = (tasks: RestTask[]): RestTask[] => {
    if (!todayMood) return tasks;
    const suggested = MOOD_ORDER[todayMood] ?? [];
    return [...tasks].sort((a, b) => {
      const ai = suggested.indexOf(a.id);
      const bi = suggested.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  };

  const tasksByCategory = CATEGORIES_ORDER.reduce<Record<RestCategory, RestTask[]>>((acc, cat) => {
    const catTasks = getSortedTasks(restTasks.filter((t) => t.category === cat));
    if (catTasks.length > 0) acc[cat] = catTasks;
    return acc;
  }, {} as Record<RestCategory, RestTask[]>);

  const handleAdd = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    addRestTask(trimmed);
    setInputText('');
    Keyboard.dismiss();
  };

  const toggleCollapse = (cat: RestCategory) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Need a day off?</Text>
          <Text style={[styles.title, { color: TOKENS.colors.accent.heading }]}>
            {atRisk ? 'Streak at risk!' : 'Take it easy today.'}
          </Text>
        </View>

        {/* Rest FAQ accordion */}
        <RestFaqAccordion />

        {/* Rest Meter */}
        <RestMeter minutesDone={restMinutesToday} goalMinutes={restGoalMinutes} />

        {/* Rest streak badge */}
        {restStreak > 0 && (
          <View style={styles.restStreakBadge}>
            <Text style={styles.restStreakEmoji}>🌙</Text>
            <Text style={styles.restStreakText}>
              {restStreak}-day rest streak
            </Text>
          </View>
        )}

        {/* Energy check-in — only if mood not yet set today */}
        {todayMood === null && (
          <EnergyCheckIn onSelect={setTodayMood} />
        )}

        {/* Category sections */}
        {CATEGORIES_ORDER.map((cat) => {
          const catTasks = tasksByCategory[cat];
          if (!catTasks || catTasks.length === 0) return null;
          return (
            <CategorySection
              key={cat}
              category={cat}
              tasks={catTasks}
              isCollapsed={collapsed[cat] ?? false}
              onToggleCollapse={() => toggleCollapse(cat)}
              activeRestTimer={activeRestTimer}
              onStartTimer={(id) => startRestTimer(id)}
              onCancelTimer={cancelRestTimer}
              onRemove={removeRestTask}
            />
          );
        })}

        {/* Add custom task */}
        <View>
          <Text style={styles.sectionLabel}>MY TASKS</Text>
          <View style={styles.addCard}>
            <TextInput
              style={styles.input}
              placeholder="Add your own rest activity…"
              placeholderTextColor={TOKENS.colors.text.muted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
              maxLength={60}
            />
            <Pressable
              onPress={handleAdd}
              style={[styles.addBtn, !inputText.trim() && styles.addBtnDisabled]}
              disabled={!inputText.trim()}
            >
              <Plus size={18} color="#ffffff" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {showCelebration && (
        <RestCelebration onDismiss={() => setShowCelebration(false)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: TOKENS.colors.bg.screen,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: TOKENS.spacing.screenPad,
    gap: 12,
    paddingBottom: 4,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 8,
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: TOKENS.colors.text.primary,
    letterSpacing: 0.1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TOKENS.colors.text.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingTop: 4,
    paddingBottom: 6,
  },
  restStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.row,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  restStreakEmoji: { fontSize: 18 },
  restStreakText: { fontSize: 14, fontWeight: '600', color: TOKENS.colors.text.primary },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    paddingHorizontal: TOKENS.spacing.cardPad,
    paddingVertical: 8,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: TOKENS.colors.text.primary,
    paddingVertical: 8,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: TOKENS.colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#cccccc',
  },

  // Energy check-in
  checkInCard: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    padding: 16,
    gap: 10,
  },
  checkInTitle: { fontSize: 16, fontWeight: '700', color: TOKENS.colors.text.primary },
  checkInSub: { fontSize: 13, color: TOKENS.colors.text.secondary },
  moodRow: { flexDirection: 'row', gap: 8 },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: TOKENS.radius.row,
    backgroundColor: TOKENS.colors.bg.input,
    gap: 6,
  },
  moodLabel: { fontSize: 13, fontWeight: '600', color: TOKENS.colors.text.secondary },
});
