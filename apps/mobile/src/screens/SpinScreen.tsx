import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useApp, type Task } from '../context/AppContext';
import { SpinningWheel } from '../components/SpinningWheel';

export function SpinScreen() {
  const { tasks, startPomodoro } = useApp();
  const [picked, setPicked] = useState<Task | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  function handleTaskSelected(task: Task) {
    setPicked(task);
    setResultOpen(true);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Spin</Text>
        <Text style={styles.subtitle}>Spin to pick your next task</Text>
      </View>

      <SpinningWheel
        tasks={tasks}
        onTaskSelected={handleTaskSelected}
        onSliceClick={handleTaskSelected}
      />

      <Modal
        visible={resultOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setResultOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.resultCard}>
            <View style={[styles.resultDot, { backgroundColor: picked?.color ?? '#ccc' }]} />
            <Text style={styles.resultLabel}>You got</Text>
            <Text style={styles.resultTask}>{picked?.name ?? '—'}</Text>
            <Text style={styles.resultMeta}>
              {picked ? `${picked.minutes}-minute focus session` : ''}
            </Text>
            <View style={styles.resultActions}>
              <Pressable
                onPress={() => {
                  if (picked) startPomodoro(picked);
                  setResultOpen(false);
                }}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Start Focus</Text>
              </Pressable>
              <Pressable onPress={() => setResultOpen(false)} style={styles.ghostBtn}>
                <Text style={styles.ghostBtnText}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF9F7' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 34, fontWeight: '700', color: '#1C1C1E', letterSpacing: 0.37 },
  subtitle: { marginTop: 4, fontSize: 15, color: '#8E8E93' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  resultCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  resultDot: { width: 48, height: 48, borderRadius: 24, marginBottom: 16 },
  resultLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  resultTask: { marginTop: 8, fontSize: 24, fontWeight: '700', color: '#1C1C1E', textAlign: 'center' },
  resultMeta: { marginTop: 6, fontSize: 15, color: '#8E8E93' },
  resultActions: { marginTop: 24, flexDirection: 'row', gap: 12, width: '100%' },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '600' },
  ghostBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8E5E0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  ghostBtnText: { color: '#1C1C1E', fontSize: 17 },
});
