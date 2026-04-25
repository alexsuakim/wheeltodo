import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, LogOut, Target, Trophy, Zap } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { TOKENS } from '../theme/tokens';

export function ProfileScreen() {
  const {
    user, logout,
    completedTasks,
    defaultTimerMinutes, setDefaultTimerMinutes,
    dailyGoal, setDailyGoal,
    notificationsEnabled, setNotificationsEnabled,
    wheelSoundEnabled, setWheelSoundEnabled,
    categories, addCategory, removeCategory,
  } = useApp();

  const [addingLabel, setAddingLabel] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  const totalMinutes = completedTasks.reduce((s, t) => s + t.minutesActual, 0);
  const completionRate = completedTasks.length > 0
    ? Math.round(
        (completedTasks.filter((t) => t.minutesActual <= t.minutesEstimated).length /
          completedTasks.length) * 100
      )
    : 0;

  const streak = useMemo(() => {
    if (completedTasks.length === 0) return 0;
    let count = 0;
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const day = new Date(base);
      day.setDate(day.getDate() - i);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      if (completedTasks.some((t) => {
        const d = new Date(t.completedAt);
        return d >= day && d < next;
      })) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [completedTasks]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDone = completedTasks.filter((t) => {
    const d = new Date(t.completedAt); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;

  const badges = [
    {
      icon: Target,
      label: 'Daily Goal',
      sub: `${dailyGoal} tasks/day`,
      unlocked: todayDone >= dailyGoal,
    },
    {
      icon: Flame,
      label: 'On Fire',
      sub: `${streak} day streak`,
      unlocked: streak >= 3,
    },
    {
      icon: Trophy,
      label: 'Achiever',
      sub: '10 tasks done',
      unlocked: completedTasks.length >= 10,
    },
    {
      icon: Zap,
      label: 'Speed Run',
      sub: 'Beat the clock',
      unlocked: completedTasks.some((t) => t.minutesActual < t.minutesEstimated),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar row */}
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.initials ?? 'U'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          </View>
          {streak > 0 && (
            <View style={styles.streakPill}>
              <Flame size={18} color={TOKENS.colors.action.streak} strokeWidth={2} />
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedTasks.length}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(totalMinutes / 60).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Hours Focused</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completionRate}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>

        {/* Achievements */}
        <Text style={styles.sectionLabel}>Achievements</Text>
        <View style={styles.badgeGrid}>
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <View key={b.label} style={[styles.badge, !b.unlocked && styles.badgeLocked]}>
                <Icon
                  size={22}
                  color={b.unlocked ? TOKENS.colors.action.streak : TOKENS.colors.text.muted}
                  strokeWidth={2}
                />
                <Text style={[styles.badgeLabel, !b.unlocked && styles.badgeLabelLocked]}>
                  {b.label}
                </Text>
                <Text style={styles.badgeSub}>{b.sub}</Text>
              </View>
            );
          })}
        </View>

        {/* Settings */}
        <Text style={styles.sectionLabel}>Settings</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Default timer</Text>
            <View style={styles.stepperRow}>
              <Pressable onPress={() => setDefaultTimerMinutes(Math.max(5, defaultTimerMinutes - 5))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{defaultTimerMinutes}m</Text>
              <Pressable onPress={() => setDefaultTimerMinutes(Math.min(120, defaultTimerMinutes + 5))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Daily goal</Text>
            <View style={styles.stepperRow}>
              <Pressable onPress={() => setDailyGoal(Math.max(1, dailyGoal - 1))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{dailyGoal} tasks</Text>
              <Pressable onPress={() => setDailyGoal(Math.min(20, dailyGoal + 1))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#e0e0e0', true: TOKENS.colors.action.primary }}
              thumbColor="#ffffff"
            />
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Wheel sound</Text>
            <Switch
              value={wheelSoundEnabled}
              onValueChange={setWheelSoundEnabled}
              trackColor={{ false: '#e0e0e0', true: TOKENS.colors.action.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Task Labels */}
        <Text style={styles.sectionLabel}>Task Labels</Text>
        <View style={styles.labelsCard}>
          {categories.map((cat) => (
            <View key={cat} style={styles.labelRow}>
              <Text style={styles.labelText}>{cat}</Text>
              <Pressable onPress={() => removeCategory(cat)} style={styles.labelRemoveBtn}>
                <Text style={styles.labelRemoveText}>✕</Text>
              </Pressable>
            </View>
          ))}
          <View style={styles.rowDivider} />
          {addingLabel ? (
            <View style={styles.labelAddRow}>
              <TextInput
                value={newLabel}
                onChangeText={setNewLabel}
                placeholder="Label name..."
                placeholderTextColor={TOKENS.colors.text.muted}
                style={styles.labelInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (newLabel.trim()) addCategory(newLabel.trim());
                  setNewLabel('');
                  setAddingLabel(false);
                }}
                onBlur={() => {
                  setNewLabel('');
                  setAddingLabel(false);
                }}
              />
            </View>
          ) : (
            <Pressable style={styles.labelAddBtn} onPress={() => setAddingLabel(true)}>
              <Text style={styles.labelAddText}>+ Add label</Text>
            </Pressable>
          )}
        </View>

        {/* Sign out */}
        <Pressable onPress={logout} style={styles.signOutBtn}>
          <LogOut size={16} color={TOKENS.colors.action.danger} strokeWidth={2} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.colors.bg.screen },
  header: { paddingHorizontal: TOKENS.spacing.screenPad, paddingTop: 12, paddingBottom: 4 },
  title: { fontSize: 34, fontWeight: '700', color: TOKENS.colors.text.primary, letterSpacing: 0.37 },
  content: {
    paddingHorizontal: TOKENS.spacing.screenPad,
    paddingBottom: 40,
    gap: TOKENS.spacing.rowGap,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: TOKENS.colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  userName: { fontSize: 18, fontWeight: '600', color: TOKENS.colors.text.primary },
  userEmail: { marginTop: 2, fontSize: 14, color: TOKENS.colors.text.secondary },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: { fontSize: 20, fontWeight: '700', color: TOKENS.colors.text.primary },
  statCard: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    flexDirection: 'row',
    paddingVertical: 20,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '700', color: TOKENS.colors.text.primary },
  statLabel: { fontSize: 12, color: TOKENS.colors.text.secondary, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: '#e8e8e8' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TOKENS.colors.text.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingTop: 4,
  },
  badgeGrid: { flexDirection: 'row', gap: 8 },
  badge: {
    flex: 1,
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.row,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  badgeLocked: { opacity: 0.45 },
  badgeLabel: { fontSize: 11, fontWeight: '600', color: TOKENS.colors.text.primary, textAlign: 'center' },
  badgeLabelLocked: { color: TOKENS.colors.text.muted },
  badgeSub: { fontSize: 10, color: TOKENS.colors.text.muted, textAlign: 'center' },
  settingsCard: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  settingLabel: { fontSize: 16, color: TOKENS.colors.text.primary },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { fontSize: 18, color: TOKENS.colors.text.primary, lineHeight: 22 },
  stepValue: { fontSize: 15, color: TOKENS.colors.text.secondary, minWidth: 56, textAlign: 'center' },
  rowDivider: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 18 },
  labelsCard: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    overflow: 'hidden',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  labelText: { fontSize: 16, color: TOKENS.colors.text.primary },
  labelRemoveBtn: { padding: 4 },
  labelRemoveText: { fontSize: 14, color: TOKENS.colors.action.danger, fontWeight: '600' },
  labelAddRow: { paddingHorizontal: 18, paddingVertical: 10 },
  labelInput: {
    fontSize: 16,
    color: TOKENS.colors.text.primary,
    paddingVertical: 4,
  },
  labelAddBtn: { paddingHorizontal: 18, paddingVertical: 14 },
  labelAddText: { fontSize: 16, color: '#FF5C4D', fontWeight: '500' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 4,
  },
  signOutText: { fontSize: 16, color: TOKENS.colors.action.danger, fontWeight: '500' },
});
