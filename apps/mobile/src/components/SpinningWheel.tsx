import React, { useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  Briefcase,
  Code,
  Coffee,
  Dumbbell,
  GraduationCap,
  Heart,
  Mail,
  BookOpen,
  Palette,
  PenLine,
  ShoppingCart,
  Users,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { Task } from '../context/AppContext';

const iconMap: Record<string, LucideIcon> = {
  PenLine, Code, Palette, Users, Mail, BookOpen,
  Briefcase, Coffee, Dumbbell, ShoppingCart, Heart, GraduationCap,
};

const SIZE = 280;
const CX = SIZE / 2;       // 140
const R = SIZE / 2;        // outer radius — 140
const ICON_R = 85;         // radial distance for icon centres
const HUB_R = 45;          // white centre hub radius
const MAX_TASKS = 6;

interface SpinningWheelProps {
  tasks: Task[];
  onTaskSelected: (task: Task) => void;
  onSliceClick: (task: Task) => void;
}

// Clock convention: 0° = top, clockwise positive.
// Converts to standard math angles for cos/sin.
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

// After the wheel rotates `rotDeg` clockwise, the slice now at the top is
// the one whose initial centre was at rotDeg % 360 from the top.
function pickIndex(rotDeg: number, n: number): number {
  const sliceDeg = 360 / n;
  return Math.floor((((rotDeg % 360) + 360) % 360) / sliceDeg) % n;
}

export function SpinningWheel({ tasks, onTaskSelected, onSliceClick }: SpinningWheelProps) {
  const wheelTasks = tasks.slice(0, MAX_TASKS);
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
    // Land with centre of targetIndex slice at the top pointer.
    const targetNorm = targetIndex * sliceDeg + sliceDeg / 2;
    const currentNorm = ((rotDegRef.current % 360) + 360) % 360;
    let delta = targetNorm - currentNorm;
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
    <View style={styles.container}>
      {/* Wheel */}
      <View style={styles.wheelWrap}>
        {/* Pointer: sits outside the rotating view so it stays fixed at top */}
        <View style={styles.pointerWrap} pointerEvents="none">
          <Svg width={28} height={28} viewBox="0 0 28 28">
            <Path d="M14 20L7 8H21L14 20Z" fill="#1C1C1E" />
          </Svg>
        </View>

        <Animated.View style={{ width: SIZE, height: SIZE, transform: [{ rotate }] }}>
          {/* SVG layer: coloured slices + centre hub */}
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

          {/*
           * Icon layer: absolutely positioned Views on top of the SVG.
           * They live inside Animated.View so they rotate with the wheel.
           * pointerEvents="none" lets taps fall through to the Path onPress handlers.
           */}
          {wheelTasks.map((task, i) => {
            const sliceDeg = 360 / n;
            const { x, y } = polar(ICON_R, (i + 0.5) * sliceDeg);
            const Icon = (iconMap[task.icon] ?? Briefcase) as LucideIcon;
            return (
              <View
                key={`icon-${task.id}`}
                style={[styles.iconOverlay, { left: x - 16, top: y - 16 }]}
                pointerEvents="none"
              >
                <Icon size={24} color="white" strokeWidth={2} />
              </View>
            );
          })}
        </Animated.View>
      </View>

      {/* Spin button */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
    paddingHorizontal: 24,
  },
  wheelWrap: {
    width: SIZE,
    height: SIZE,
  },
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
  spinBtn: {
    width: '100%',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  spinBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '600' },
  disabled: { opacity: 0.4 },
});
