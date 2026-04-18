import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import type { Task } from '../context/AppContext';

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polarToCartesian(cx, cy, r, start);
  const e = polarToCartesian(cx, cy, r, end);
  const largeArc = end - start > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
}

export function pickIndexFromRotation(rotationDeg: number, n: number): number {
  const normalized = ((rotationDeg % 360) + 360) % 360;
  const relative = (270 - normalized + 360) % 360;
  return Math.floor(relative / (360 / n));
}

interface WheelProps {
  tasks: Task[];
  size: number;
  rotation: Animated.Value;
}

export function Wheel({ tasks, size, rotation }: WheelProps) {
  const r = size / 2;
  const n = tasks.length;
  const slice = n > 0 ? (Math.PI * 2) / n : Math.PI * 2;

  const rotate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
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
              const maxLen = n > 8 ? 9 : 13;
              const label = t.name.length > maxLen ? `${t.name.slice(0, maxLen)}…` : t.name;
              return (
                <G key={t.id}>
                  <Path d={arcPath(r, r, r - 6, start, end)} fill={t.color} />
                  {n <= 10 && (
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
                  )}
                </G>
              );
            })
          )}
        </Svg>
      </Animated.View>

      <View style={styles.pointerWrap} pointerEvents="none">
        <View style={styles.pointer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pointerWrap: { position: 'absolute', top: -4, left: 0, right: 0, alignItems: 'center' },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#111111',
  },
});
