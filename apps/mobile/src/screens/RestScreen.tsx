import React, { useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Plus, ShieldCheck, X } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { TOKENS } from '../theme/tokens';

export function RestScreen() {
  const { restTasks, completedRestDays, toggleRestTask, addRestTask, removeRestTask } = useApp();
  const [inputText, setInputText] = useState('');

  const streakProtected = restTasks.some((t) => t.completedToday);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const alreadyProtectedByRest = completedRestDays.some(
    (d) => d.getTime() === today.getTime()
  );

  const handleAdd = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    addRestTask(trimmed);
    setInputText('');
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Take it easy today 🌿</Text>
          <Text style={styles.subtitle}>Tick off a few wants. Your streak is safe.</Text>
        </View>

        {/* Streak protected badge */}
        {streakProtected && (
          <View style={styles.protectedBadge}>
            <ShieldCheck
              size={18}
              color={TOKENS.colors.action.success}
              strokeWidth={2.2}
            />
            <Text style={styles.protectedText}>Streak protected — well done</Text>
          </View>
        )}

        {/* Task list */}
        <View style={styles.listCard}>
          {restTasks.map((task, index) => (
            <View key={task.id}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.taskRow}>
                <Pressable
                  onPress={() => toggleRestTask(task.id)}
                  style={[styles.checkbox, task.completedToday && styles.checkboxDone]}
                  hitSlop={8}
                >
                  {task.completedToday && (
                    <Check size={13} color="#ffffff" strokeWidth={3} />
                  )}
                </Pressable>
                <Text
                  style={[styles.taskName, task.completedToday && styles.taskNameDone]}
                >
                  {task.name}
                </Text>
                {!task.isPreset && (
                  <Pressable
                    onPress={() => removeRestTask(task.id)}
                    style={styles.removeBtn}
                    hitSlop={8}
                  >
                    <X size={14} color={TOKENS.colors.text.muted} strokeWidth={2} />
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Add custom task */}
        <View style={styles.addCard}>
          <TextInput
            style={styles.input}
            placeholder="Add your own want…"
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: TOKENS.colors.bg.screen,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: TOKENS.spacing.screenPad,
    gap: 16,
    paddingBottom: 40,
  },
  header: {
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: TOKENS.colors.text.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: TOKENS.colors.text.secondary,
    lineHeight: 20,
  },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e8f8ee',
    borderRadius: TOKENS.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  protectedText: {
    fontSize: 13,
    fontWeight: '600',
    color: TOKENS.colors.action.success,
  },
  listCard: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TOKENS.spacing.cardPad,
    paddingVertical: 14,
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: TOKENS.spacing.cardPad + 30,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    borderColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: TOKENS.colors.action.success,
    borderColor: TOKENS.colors.action.success,
  },
  taskName: {
    flex: 1,
    fontSize: 15,
    color: TOKENS.colors.text.primary,
    lineHeight: 20,
  },
  taskNameDone: {
    color: TOKENS.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  removeBtn: {
    padding: 2,
    flexShrink: 0,
  },
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
});
