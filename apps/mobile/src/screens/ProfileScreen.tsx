import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';

export function ProfileScreen() {
  const {
    user, logout,
    completedTasks,
    defaultTimerMinutes, setDefaultTimerMinutes,
    dailyGoal, setDailyGoal,
    notificationsEnabled, setNotificationsEnabled,
  } = useApp();

  const totalMinutes = completedTasks.reduce((sum, t) => sum + t.minutesActual, 0);
  const completionRate =
    completedTasks.length > 0
      ? Math.round(
          (completedTasks.filter((t) => t.minutesActual <= t.minutesEstimated).length /
            completedTasks.length) *
            100
        )
      : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.initials ?? 'U'}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
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

        <Text style={styles.sectionLabel}>Settings</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Default timer</Text>
            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => setDefaultTimerMinutes(Math.max(5, defaultTimerMinutes - 5))}
                style={styles.stepperBtn}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{defaultTimerMinutes} min</Text>
              <Pressable
                onPress={() => setDefaultTimerMinutes(Math.min(120, defaultTimerMinutes + 5))}
                style={styles.stepperBtn}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Daily goal</Text>
            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => setDailyGoal(Math.max(1, dailyGoal - 1))}
                style={styles.stepperBtn}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{dailyGoal} tasks</Text>
              <Pressable
                onPress={() => setDailyGoal(Math.min(20, dailyGoal + 1))}
                style={styles.stepperBtn}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View style={[styles.card, { marginTop: 4 }]}>
          <Pressable onPress={logout} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF9F7' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 34, fontWeight: '700', color: '#1C1C1E', letterSpacing: 0.37 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '600', color: '#ffffff' },
  userName: { fontSize: 20, fontWeight: '600', color: '#1C1C1E' },
  userEmail: { marginTop: 2, fontSize: 15, color: '#8E8E93' },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5E0',
    flexDirection: 'row',
    paddingVertical: 20,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 28, fontWeight: '600', color: '#1C1C1E' },
  statLabel: { fontSize: 13, color: '#8E8E93', textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: '#E8E5E0' },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5E0',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  settingLabel: { fontSize: 17, color: '#1C1C1E' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: { fontSize: 20, color: '#1C1C1E', lineHeight: 24 },
  stepperValue: { fontSize: 17, color: '#8E8E93', minWidth: 60, textAlign: 'center' },
  rowDivider: { height: 1, backgroundColor: '#E8E5E0', marginLeft: 20 },
  signOutBtn: { paddingHorizontal: 20, paddingVertical: 16 },
  signOutText: { fontSize: 17, color: '#FF3B30' },
});
