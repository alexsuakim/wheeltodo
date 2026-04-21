import React, { useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  Briefcase, Code, Coffee, Dumbbell, GraduationCap, Heart,
  Mail, BookOpen, Palette, PenLine, ShoppingCart, Users,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { Task } from '../context/AppContext';
import { TOKENS } from '../theme/tokens';

const iconMap: Record<string, LucideIcon> = {
  PenLine, Code, Palette, Users, Mail, BookOpen,
  Briefcase, Coffee, Dumbbell, ShoppingCart, Heart, GraduationCap,
};

const SIZE = 280;
const CX = SIZE / 2;
const R = SIZE / 2;
const ICON_R = 85;
const HUB_R = 45;

interface SpinningWheelProps {
  tasks: Task[];
  onTaskSelected: (task: Task) => void;
  onSliceClick: (task: Task) => void;
  dailyGoal?: number;
  todayDone?: number;
  style?: object;
}

function polar(r: number, deg: number) {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: CX + r * Math.cos(rad), y: CX + r * Math.sin(rad) };
}

function slicePath(index: number, n: number): string {
  const sliceDeg = 360 / n;
  const s = polar(R, index * sliceDeg);
  const e = polar(R, (index + 1) * sliceDeg);
  const largeArc = sliceDeg > 180 ? 1 : 0;
  return `M ${CX} ${CX} L ${s.x} ${s.y} A ${R} ${R} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
}

// When the wheel has rotated clockwise by rotDeg, the slice now under the top
// pointer is the one whose initial angular position was (360 - rotDeg) % 360.
function pickIndex(rotDeg: number, n: number): number {
  const norm = ((rotDeg % 360) + 360) % 360;
  const atTop = ((360 - norm) + 360) % 360;
  const sliceDeg = 360 / n;
  return Math.floor(atTop / sliceDeg) % n;
}

export function SpinningWheel({
  tasks, onTaskSelected, onSliceClick, dailyGoal, todayDone = 0, style,
}: SpinningWheelProps) {
  const wheelTasks = tasks;
  const n = wheelTasks.length;

  const rotation = useRef(new Animated.Value(0)).current;
  const rotDegRef = useRef(0);
  const [isSpinning, setIsSpinning] = useState(false);

  React.useEffect(() => {
    const id = rotation.addListener(({ value }) => { rotDegRef.current = value; });
    return () => rotation.removeListener(id);
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  function spin() {
    if (isSpinning || n === 0) return;
    setIsSpinning(true);

    const sliceDeg = 360 / n;
    const targetIndex = Math.floor(Math.random() * n);
    // Centre of the target slice in its initial position (clock angle from top).
    const targetNorm = targetIndex * sliceDeg + sliceDeg / 2;
    // For the target to sit under the top pointer, rotDeg % 360 must equal
    // (360 - targetNorm) % 360 so that atTop == targetNorm.
    const wantMod = (360 - targetNorm + 360) % 360;
    const currentMod = ((rotDegRef.current % 360) + 360) % 360;
    let delta = wantMod - currentMod;
    if (delta < 0) delta += 360;
    const toValue = rotDegRef.current + 5 * 360 + delta;

    Animated.timing(rotation, {
      toValue,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false);
      const idx = pickIndex(toValue, n);
      onTaskSelected(wheelTasks[idx] ?? wheelTasks[targetIndex]);
    });
  }

  return (
    <View style={[styles.container, style]}>
      {/* Wheel */}
      <View style={styles.wheelWrap}>
        <View style={styles.pointerWrap} pointerEvents="none">
          <Svg width={28} height={28} viewBox="0 0 28 28">
            <Path d="M14 20L7 8H21L14 20Z" fill="#111111" />
          </Svg>
        </View>

        <Animated.View style={{ width: SIZE, height: SIZE, transform: [{ rotate }] }}>
          <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
            {n === 0 ? (
              <Circle cx={CX} cy={CX} r={R} fill="#E8E5E0" />
            ) : (
              wheelTasks.map((task, i) => (
                <Path
                  key={task.id}
                  d={slicePath(i, n)}
                  fill={task.color}
                  onPress={() => !isSpinning && onSliceClick(task)}
                />
              ))
            )}
            <Circle cx={CX} cy={CX} r={HUB_R} fill="white" stroke="#E8E5E0" strokeWidth={2} />
          </Svg>

          {wheelTasks.map((task, i) => {
            const sliceDeg = 360 / n;
            const { x, y } = polar(ICON_R, (i + 0.5) * sliceDeg);
            const Icon = (iconMap[task.icon] ?? Briefcase) as LucideIcon;
            const iconSize = n <= 8 ? 24 : n <= 12 ? 18 : 14;
            const half = iconSize / 2;
            return (
              <View
                key={`icon-${task.id}`}
                style={[styles.iconOverlay, { left: x - half, top: y - half, width: iconSize * 1.33, height: iconSize * 1.33 }]}
                pointerEvents="none"
              >
                <Icon size={iconSize} color="white" strokeWidth={2} />
              </View>
            );
          })}
        </Animated.View>
      </View>

      {/* Daily goal + spin button */}
      <View style={styles.bottomArea}>
        {dailyGoal !== undefined && (
          <Text style={styles.goalText}>
            Daily goal: {todayDone} / {dailyGoal} tasks
          </Text>
        )}
        <Pressable
          onPress={spin}
          disabled={isSpinning || n === 0}
          style={[styles.spinBtn, (isSpinning || n === 0) && styles.disabled]}
        >
          <Text style={styles.spinBtnText}>
            {isSpinning ? 'Spinning…' : 'Spin the wheel'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    paddingHorizontal: 24,
  },
  wheelWrap: { width: SIZE, height: SIZE },
  pointerWrap: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  iconOverlay: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomArea: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  goalText: {
    fontSize: 14,
    color: TOKENS.colors.text.secondary,
    fontWeight: '500',
  },
  spinBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#111111',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '600' },
  disabled: { opacity: 0.4 },
});
