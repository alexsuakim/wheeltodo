import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path, Text as SvgText } from "react-native-svg";

type Task = { id: string; text: string; minutes: number };
type DoneTask = Task & { completedAt: number; elapsedMs: number };

const STORAGE_KEY = "wheelTodo.mobile.v1";
const DEFAULT_MINUTES = 25;
const WHEEL_COLORS = [
  "#5b8def",
  "#6ee7b7",
  "#c4b5fd",
  "#fbbf24",
  "#f472b6",
  "#67e8f9",
  "#a3e635",
  "#fb923c",
  "#94a3b8",
  "#f87171",
];

function clampMinutes(m: number) {
  if (!Number.isFinite(m)) return DEFAULT_MINUTES;
  const r = Math.round(m);
  return Math.max(1, Math.min(480, r));
}

function newId() {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

function formatMmSs(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const startPt = polarToCartesian(cx, cy, r, start);
  const endPt = polarToCartesian(cx, cy, r, end);
  const largeArc = end - start > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${largeArc} 1 ${endPt.x} ${endPt.y} Z`;
}

function pickIndexFromRotation(rotationDeg: number, n: number) {
  // Pointer is at top (270deg / -90deg). Our wheel starts at 0deg pointing to the right.
  // We rotate the wheel; we want the slice that ends up under the pointer.
  const normalized = ((rotationDeg % 360) + 360) % 360;
  const pointerDeg = 270;
  const relative = (pointerDeg - normalized + 360) % 360;
  const slice = 360 / n;
  return Math.floor(relative / slice);
}

function Wheel({
  tasks,
  size,
  rotation,
}: {
  tasks: Task[];
  size: number;
  rotation: Animated.Value;
}) {
  const r = size / 2;
  const n = tasks.length;
  const slice = n > 0 ? (Math.PI * 2) / n : Math.PI * 2;

  const rotate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={size} height={size}>
          {n === 0 ? (
            <Path d={arcPath(r, r, r - 3, 0, Math.PI * 2)} fill="#e6edf9" />
          ) : (
            tasks.map((t, i) => {
              const start = i * slice - Math.PI / 2;
              const end = start + slice;
              const mid = (start + end) / 2;
              const labelR = (r - 10) * 0.62;
              const p = polarToCartesian(r, r, labelR, mid);
              const label = t.text.length > (n > 8 ? 10 : 14) ? `${t.text.slice(0, n > 8 ? 9 : 13)}…` : t.text;
              return (
                <View key={t.id}>
                  <Path d={arcPath(r, r, r - 6, start, end)} fill={WHEEL_COLORS[i % WHEEL_COLORS.length]} />
                  {n <= 10 ? (
                    <SvgText
                      x={p.x}
                      y={p.y}
                      fill="rgba(15,23,42,0.9)"
                      fontSize={n > 8 ? 9 : 10}
                      fontWeight="600"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      transform={`rotate(${(mid * 180) / Math.PI + 90} ${p.x} ${p.y})`}
                    >
                      {label}
                    </SvgText>
                  ) : null}
                </View>
              );
            })
          )}
        </Svg>
      </Animated.View>

      {/* Pointer */}
      <View style={styles.pointerWrap} pointerEvents="none">
        <View style={styles.pointer} />
      </View>
    </View>
  );
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [done, setDone] = useState<DoneTask[]>([]);
  const [text, setText] = useState("");
  const [mins, setMins] = useState(String(DEFAULT_MINUTES));

  const [wheelOpen, setWheelOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [picked, setPicked] = useState<Task | null>(null);

  const rotation = useRef(new Animated.Value(0)).current;
  const rotationDegRef = useRef(0);
  const spinningRef = useRef(false);

  const [pomoTask, setPomoTask] = useState<Task | null>(null);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoRemainingSec, setPomoRemainingSec] = useState(0);
  const pomoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pomoStartedAtRef = useRef<number | null>(null);
  const pomoPlannedSec = pomoTask ? clampMinutes(pomoTask.minutes) * 60 : 0;

  useEffect(() => {
    rotation.addListener(({ value }) => {
      rotationDegRef.current = value;
    });
    return () => {
      rotation.removeAllListeners();
    };
  }, [rotation]);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as { tasks?: Task[]; done?: DoneTask[] };
        if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks);
        if (Array.isArray(parsed.done)) setDone(parsed.done);
      } catch {
        // ignore
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, done }));
      } catch {
        // ignore
      }
    };
    void save();
  }, [tasks, done]);

  useEffect(() => {
    if (!pomoRunning) return;
    if (!pomoTask) return;
    if (pomoIntervalRef.current) clearInterval(pomoIntervalRef.current);
    pomoIntervalRef.current = setInterval(() => {
      setPomoRemainingSec((s) => {
        const next = Math.max(0, s - 1);
        if (next === 0) {
          // auto-finish
          setPomoRunning(false);
        }
        return next;
      });
    }, 1000);
    return () => {
      if (pomoIntervalRef.current) clearInterval(pomoIntervalRef.current);
      pomoIntervalRef.current = null;
    };
  }, [pomoRunning, pomoTask]);

  useEffect(() => {
    if (!pomoTask && pomoIntervalRef.current) {
      clearInterval(pomoIntervalRef.current);
      pomoIntervalRef.current = null;
    }
  }, [pomoTask]);

  const productivity = useMemo(() => {
    const doneMs = done.reduce((sum, t) => sum + (Number.isFinite(t.elapsedMs) ? Math.max(0, t.elapsedMs) : 0), 0);
    const remainingMs = tasks.reduce((sum, t) => sum + clampMinutes(t.minutes) * 60 * 1000, 0);
    const totalMs = doneMs + remainingMs;
    const pct = totalMs > 0 ? Math.round((doneMs / totalMs) * 100) : 0;
    const tasksPct = tasks.length + done.length > 0 ? Math.round((done.length / (tasks.length + done.length)) * 100) : 0;
    return { doneMin: Math.round(doneMs / 60000), remainingMin: Math.round(remainingMs / 60000), pct, tasksPct };
  }, [tasks, done]);

  function addTask() {
    const v = text.trim();
    if (!v) return;
    const m = clampMinutes(parseInt(mins, 10));
    setTasks((cur) => cur.concat([{ id: newId(), text: v, minutes: m }]));
    setText("");
    setMins(String(DEFAULT_MINUTES));
  }

  function removeTask(id: string) {
    setTasks((cur) => cur.filter((t) => t.id !== id));
  }

  function markDoneNow(task: Task, elapsedMs?: number) {
    const completedAt = Date.now();
    const elapsed = typeof elapsedMs === "number" ? Math.max(0, elapsedMs) : clampMinutes(task.minutes) * 60 * 1000;
    setTasks((cur) => cur.filter((t) => t.id !== task.id));
    setDone((cur) => cur.concat([{ ...task, completedAt, elapsedMs: elapsed }]));
  }

  function startPomodoro(task: Task) {
    setPomoTask(task);
    setPomoRemainingSec(clampMinutes(task.minutes) * 60);
    setPomoRunning(true);
    pomoStartedAtRef.current = Date.now();
  }

  function pauseResumePomodoro() {
    setPomoRunning((r) => !r);
  }

  function resetPomodoro() {
    if (!pomoTask) return;
    setPomoRemainingSec(clampMinutes(pomoTask.minutes) * 60);
    setPomoRunning(false);
    pomoStartedAtRef.current = null;
  }

  function finishPomodoro(early: boolean) {
    if (!pomoTask) return;
    const plannedMs = clampMinutes(pomoTask.minutes) * 60 * 1000;
    const elapsedMs = early ? Math.max(0, plannedMs - pomoRemainingSec * 1000) : plannedMs;
    markDoneNow(pomoTask, elapsedMs);
    setPomoRunning(false);
    setPomoTask(null);
    setPomoRemainingSec(0);
    pomoStartedAtRef.current = null;
  }

  function spinWheel() {
    if (spinningRef.current) return;
    if (tasks.length === 0) return;

    spinningRef.current = true;

    const n = tasks.length;
    const sliceDeg = 360 / n;
    const targetIndex = Math.floor(Math.random() * n);
    const pointerDeg = 270;

    // Want the center of target slice under the pointer at end.
    const targetCenterDeg = targetIndex * sliceDeg + sliceDeg / 2;
    // rotation such that: (pointer - rotation) == targetCenter (mod 360)
    const targetRotationNorm = (pointerDeg - targetCenterDeg + 360) % 360;

    const extraSpins = 5 + Math.floor(Math.random() * 4);
    const current = rotationDegRef.current;
    const currentNorm = ((current % 360) + 360) % 360;
    let delta = targetRotationNorm - currentNorm;
    if (delta < 0) delta += 360;
    const toValue = current + extraSpins * 360 + delta;

    Animated.timing(rotation, {
      toValue,
      duration: 3200 + Math.random() * 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      spinningRef.current = false;
      const finalDeg = toValue;
      const idx = pickIndexFromRotation(finalDeg, n);
      const task = tasks[idx] ?? tasks[targetIndex] ?? null;
      setPicked(task);
      setResultOpen(true);
      setWheelOpen(false);
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <Text style={styles.h1}>Wheel Todo</Text>
        <Text style={styles.tagline}>Spin to pick a task, then focus with Pomodoro.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Add task</Text>
          <View style={styles.row}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="What needs doing?"
              style={[styles.input, { flex: 1 }]}
              returnKeyType="done"
              onSubmitEditing={addTask}
            />
            <TextInput
              value={mins}
              onChangeText={setMins}
              placeholder="Min"
              style={[styles.input, styles.minsInput]}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={addTask}
            />
          </View>
          <Pressable onPress={addTask} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Add</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Today’s tasks</Text>
            <Pressable onPress={() => setWheelOpen(true)} style={[styles.ghostBtn, tasks.length === 0 && styles.btnDisabled]}>
              <Text style={styles.ghostBtnText}>Open wheel</Text>
            </Pressable>
          </View>

          {tasks.length === 0 ? (
            <Text style={styles.muted}>Add at least one task to spin.</Text>
          ) : (
            tasks.map((t) => (
              <View key={t.id} style={styles.taskRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskText}>{t.text}</Text>
                  <Text style={styles.taskMeta}>{clampMinutes(t.minutes)} min</Text>
                </View>
                <Pressable onPress={() => startPomodoro(t)} style={styles.smallBtn}>
                  <Text style={styles.smallBtnText}>Focus</Text>
                </Pressable>
                <Pressable onPress={() => markDoneNow(t)} style={[styles.smallBtn, styles.doneBtn]}>
                  <Text style={[styles.smallBtnText, styles.doneBtnText]}>Done</Text>
                </Pressable>
                <Pressable onPress={() => removeTask(t.id)} style={[styles.smallBtn, styles.dangerBtn]}>
                  <Text style={[styles.smallBtnText, styles.dangerBtnText]}>×</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pomodoro</Text>
          {!pomoTask ? (
            <Text style={styles.muted}>Spin the wheel or tap Focus on a task to start.</Text>
          ) : (
            <>
              <Text style={styles.pomoLabel}>Working on</Text>
              <Text style={styles.pomoTask}>{pomoTask.text}</Text>
              <Text style={styles.pomoPlanned}>Timer: {Math.round(pomoPlannedSec / 60)} min</Text>
              <Text style={styles.pomoTime}>{formatMmSs(pomoRemainingSec)}</Text>
              <View style={styles.row}>
                <Pressable onPress={pauseResumePomodoro} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>{pomoRunning ? "Pause" : "Resume"}</Text>
                </Pressable>
                <Pressable onPress={resetPomodoro} style={styles.ghostBtn}>
                  <Text style={styles.ghostBtnText}>Reset</Text>
                </Pressable>
                <Pressable onPress={() => finishPomodoro(true)} style={[styles.ghostBtn, styles.doneBtn]}>
                  <Text style={[styles.ghostBtnText, styles.doneBtnText]}>Done</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Daily productivity</Text>
          <Text style={styles.muted}>
            {productivity.doneMin} min done · {productivity.remainingMin} min planned · {productivity.pct}% time progress
          </Text>
          <Text style={styles.muted}>
            {done.length}/{tasks.length + done.length} tasks done · {productivity.tasksPct}% task progress
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Done</Text>
          {done.length === 0 ? (
            <Text style={styles.muted}>Completed tasks will appear here.</Text>
          ) : (
            done
              .slice()
              .sort((a, b) => b.completedAt - a.completedAt)
              .map((t) => (
                <View key={t.id} style={styles.taskRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskText}>{t.text}</Text>
                    <Text style={styles.taskMeta}>Took {formatMmSs(Math.round(t.elapsedMs / 1000))}</Text>
                  </View>
                </View>
              ))
          )}
        </View>
      </ScrollView>

      {/* Wheel modal */}
      <Modal visible={wheelOpen} animationType="slide" onRequestClose={() => setWheelOpen(false)}>
        <SafeAreaView style={[styles.safe, { padding: 16 }]}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Spin</Text>
            <Pressable onPress={() => setWheelOpen(false)} style={styles.ghostBtn}>
              <Text style={styles.ghostBtnText}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.wheelCenter}>
            <Wheel tasks={tasks} size={320} rotation={rotation} />
          </View>

          <Pressable
            onPress={spinWheel}
            style={[styles.primaryBtn, (tasks.length === 0 || spinningRef.current) && styles.btnDisabled]}
          >
            <Text style={styles.primaryBtnText}>Spin the wheel</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>

      {/* Result modal */}
      <Modal visible={resultOpen} transparent animationType="fade" onRequestClose={() => setResultOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>You got</Text>
            <Text style={styles.resultTask}>{picked?.text ?? "—"}</Text>
            <Text style={styles.muted}>{picked ? `${clampMinutes(picked.minutes)}-minute focus session` : ""}</Text>
            <View style={styles.row}>
              <Pressable
                onPress={() => {
                  if (picked) startPomodoro(picked);
                  setResultOpen(false);
                }}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Start Pomodoro</Text>
              </Pressable>
              <Pressable onPress={() => setResultOpen(false)} style={styles.ghostBtn}>
                <Text style={styles.ghostBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f7ff" },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  h1: { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  tagline: { marginTop: 6, color: "#516074" },
  content: { padding: 16, gap: 12, paddingBottom: 28 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#dbe3f2",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 1, color: "#516074", textTransform: "uppercase" },
  muted: { marginTop: 8, color: "#516074" },
  row: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 10 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#dbe3f2",
    backgroundColor: "#f5f7ff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    color: "#0f172a",
  },
  minsInput: { width: 88, textAlign: "center" },
  primaryBtn: {
    marginTop: 10,
    backgroundColor: "#4f7cff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#0a0c10", fontWeight: "800" },
  ghostBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe3f2",
    backgroundColor: "#ffffff",
  },
  ghostBtnText: { color: "#516074", fontWeight: "700" },
  btnDisabled: { opacity: 0.5 },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eef2ff" },
  taskText: { color: "#0f172a", fontSize: 16, fontWeight: "700" },
  taskMeta: { marginTop: 2, color: "#10b981", fontWeight: "700" },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbe3f2",
    backgroundColor: "#ffffff",
  },
  smallBtnText: { color: "#516074", fontWeight: "800" },
  doneBtn: { borderColor: "rgba(16,185,129,0.35)", backgroundColor: "rgba(16,185,129,0.10)" },
  doneBtnText: { color: "#059669" },
  dangerBtn: { borderColor: "rgba(220,38,38,0.35)", backgroundColor: "rgba(220,38,38,0.06)" },
  dangerBtnText: { color: "#dc2626" },
  pomoLabel: { marginTop: 10, color: "#516074", fontWeight: "700", textTransform: "uppercase", fontSize: 12, letterSpacing: 1 },
  pomoTask: { marginTop: 6, fontSize: 18, fontWeight: "800", color: "#0f172a" },
  pomoPlanned: { marginTop: 6, color: "#516074" },
  pomoTime: { marginTop: 10, fontSize: 44, fontWeight: "700", color: "#10b981", letterSpacing: -1 },
  wheelCenter: { marginTop: 18, alignItems: "center", justifyContent: "center" },
  pointerWrap: { position: "absolute", top: -4, left: 0, right: 0, alignItems: "center" },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 22,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#10b981",
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 16 },
  resultCard: { width: "100%", maxWidth: 420, backgroundColor: "#ffffff", borderRadius: 16, padding: 16 },
  resultTitle: { color: "#516074", fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", fontSize: 12 },
  resultTask: { marginTop: 8, fontSize: 22, fontWeight: "900", color: "#0f172a" },
});
