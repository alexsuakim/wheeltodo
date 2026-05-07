import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Apple, Bird, Bug, Cat, Cherry, ChevronRight, Clock, Coffee, Dog, Fish, Flame, Flower, Leaf, LogOut, Moon, PawPrint, Pizza, Rabbit, Rainbow, Rat, RotateCcw, Shrimp, Snail, Squirrel, Trophy, Turtle, Worm, X, Zap } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ACHIEVEMENT_DEFS } from '../utils/achievements';
import { useApp, REST_GOAL_MINUTES, type RestGoalTier } from '../context/AppContext';
import { TOKENS } from '../theme/tokens';

const ICON_MAP: Record<string, LucideIcon> = {
  Flame, Trophy, Clock, Zap, Moon, RotateCcw,
};

const AVATAR_MAP: Record<string, { Icon: LucideIcon; bg: string; fg: string }> = {
  cherry:   { Icon: Cherry,   bg: '#FF5C4D', fg: '#ffffff' },
  apple:    { Icon: Apple,    bg: '#FF5C4D', fg: '#ffffff' },
  cat:      { Icon: Cat,      bg: '#FF5C4D', fg: '#ffffff' },
  dog:      { Icon: Dog,      bg: '#FF5C4D', fg: '#ffffff' },
  rabbit:   { Icon: Rabbit,   bg: '#FF5C4D', fg: '#ffffff' },
  fish:     { Icon: Fish,     bg: '#111111', fg: '#ffffff' },
  squirrel: { Icon: Squirrel, bg: '#111111', fg: '#ffffff' },
  snail:    { Icon: Snail,    bg: '#111111', fg: '#ffffff' },
  rat:      { Icon: Rat,      bg: '#111111', fg: '#ffffff' },
  bug:      { Icon: Bug,      bg: '#111111', fg: '#ffffff' },
  bird:     { Icon: Bird,     bg: '#E8E0D5', fg: '#111111' },
  turtle:   { Icon: Turtle,   bg: '#E8E0D5', fg: '#111111' },
  flower:   { Icon: Flower,   bg: '#E8E0D5', fg: '#FF5C4D' },
  leaf:     { Icon: Leaf,     bg: '#E8E0D5', fg: '#111111' },
  pawprint: { Icon: PawPrint, bg: '#E8E0D5', fg: '#111111' },
  shrimp:   { Icon: Shrimp,   bg: '#E8E0D5', fg: '#FF5C4D' },
  worm:     { Icon: Worm,     bg: '#E8E0D5', fg: '#FF5C4D' },
  pizza:    { Icon: Pizza,    bg: '#E8E0D5', fg: '#111111' },
  coffee:   { Icon: Coffee,   bg: '#E8E0D5', fg: '#111111' },
  rainbow:  { Icon: Rainbow,  bg: '#E8E0D5', fg: '#FF5C4D' },
};

interface Props {
  navigation?: any;
}

function ComingSoonModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>Coming Soon</Text>
          <Text style={modalStyles.sub}>
            Sign-up and full account sync are coming in a future update. For now, your data is stored locally on your device.
          </Text>
          <Pressable style={modalStyles.btn} onPress={onClose}>
            <Text style={modalStyles.btnText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: TOKENS.radius.card,
    padding: 28,
    marginHorizontal: 32,
    gap: 14,
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: TOKENS.colors.text.primary, textAlign: 'center' },
  sub: { fontSize: 14, color: TOKENS.colors.text.secondary, textAlign: 'center', lineHeight: 20 },
  btn: {
    backgroundColor: TOKENS.colors.action.primary,
    borderRadius: TOKENS.radius.pill,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginTop: 4,
  },
  btnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});

const REST_GOAL_TIERS: { key: RestGoalTier; label: string; minutes: number }[] = [
  { key: 'easy',     label: 'Easy',      minutes: 15 },
  { key: 'standard', label: 'Standard',  minutes: 30 },
  { key: 'dedicated',label: 'Dedicated', minutes: 45 },
];

export function ProfileScreen({ navigation }: Props) {
  const {
    user, logout,
    completedTasks, streak, achievementValues, unlockedTierIds,
    defaultTimerMinutes, setDefaultTimerMinutes,
    dailyGoal, setDailyGoal,
    notificationsEnabled, setNotificationsEnabled,
    wheelSoundEnabled, setWheelSoundEnabled,
    categories, addCategory, removeCategory,
    restGoalTier, setRestGoalTier,
  } = useApp();

  const [addingLabel, setAddingLabel] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [showComingSoon, setShowComingSoon] = useState(false);

  const totalMinutes = completedTasks.reduce((s, t) => s + t.minutesActual, 0);
  const completionRate = completedTasks.length > 0
    ? Math.round(
        (completedTasks.filter((t) => t.minutesActual <= t.minutesEstimated).length /
          completedTasks.length) * 100
      )
    : 0;

  const handleClose = () => {
    if (navigation?.goBack) navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={10}>
          <X size={20} color={TOKENS.colors.text.primary} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar row — tap to edit */}
        <Pressable style={styles.avatarRow} onPress={() => navigation?.navigate('EditProfile')}>
          {(() => {
            const av = user?.avatarId ? AVATAR_MAP[user.avatarId] : null;
            return av ? (
              <View style={[styles.avatar, { backgroundColor: av.bg }]}>
                <av.Icon size={26} color={av.fg} strokeWidth={1.8} />
              </View>
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.initials ?? 'U'}</Text>
              </View>
            );
          })()}
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          </View>
          <ChevronRight size={18} color={TOKENS.colors.text.muted} strokeWidth={2} />
        </Pressable>

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
            <Text style={styles.statLabel}>On Time %</Text>
            <Text style={styles.statSubLabel}>finished at or{'\n'}under estimate</Text>
          </View>
        </View>

        {/* Achievements */}
        <Text style={styles.sectionLabel}>Achievements</Text>
        {ACHIEVEMENT_DEFS.map((def) => {
          const Icon = ICON_MAP[def.iconName] ?? Flame;
          const current = achievementValues[def.key];
          const nextTier = def.tiers.find((t) => current < t.target);
          const progressLabel = nextTier
            ? `${current} / ${nextTier.target}`
            : 'Complete';
          return (
            <View key={def.key} style={styles.achievementCard}>
              <View style={styles.achievementHeader}>
                <View style={[styles.achievementIconWrap, { backgroundColor: def.color + '22' }]}>
                  <Icon size={15} color={def.color} strokeWidth={2.2} />
                </View>
                <Text style={styles.achievementLabel}>{def.label}</Text>
                <Text style={styles.achievementProgress}>{progressLabel}</Text>
              </View>
              <View style={styles.tiersRow}>
                {def.tiers.map((tier) => {
                  const unlocked = unlockedTierIds.includes(tier.id);
                  return (
                    <View key={tier.id} style={styles.tierItem}>
                      <View style={[
                        styles.tierDot,
                        unlocked
                          ? { backgroundColor: def.color, borderColor: def.color }
                          : styles.tierDotLocked,
                      ]}>
                        {unlocked && <View style={styles.tierDotInner} />}
                      </View>
                      <Text style={[styles.tierBadge, unlocked && { color: def.color }]}>
                        {tier.badge}
                      </Text>
                      <Text style={styles.tierTarget}>
                        {def.description(tier.target)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

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

        {/* Rest Goal */}
        <Text style={styles.sectionLabel}>Rest Goal</Text>
        <View style={styles.restGoalCard}>
          <Text style={styles.restGoalDescription}>
            How many minutes of rest do you need to protect your streak?
          </Text>
          <View style={styles.restGoalTiers}>
            {REST_GOAL_TIERS.map((tier) => (
              <Pressable
                key={tier.key}
                style={[
                  styles.restGoalTierBtn,
                  restGoalTier === tier.key && styles.restGoalTierBtnActive,
                ]}
                onPress={() => setRestGoalTier(tier.key)}
              >
                <Text style={[
                  styles.restGoalTierLabel,
                  restGoalTier === tier.key && styles.restGoalTierLabelActive,
                ]}>
                  {tier.label}
                </Text>
                <Text style={[
                  styles.restGoalTierMins,
                  restGoalTier === tier.key && styles.restGoalTierMinsActive,
                ]}>
                  {tier.minutes}m
                </Text>
              </Pressable>
            ))}
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

        {/* Sign Up */}
        <Pressable style={styles.signUpBtn} onPress={() => setShowComingSoon(true)}>
          <Text style={styles.signUpText}>Create an account to sync across devices →</Text>
        </Pressable>

        {/* Sign out */}
        <Pressable onPress={logout} style={styles.signOutBtn}>
          <LogOut size={16} color={TOKENS.colors.action.danger} strokeWidth={2} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>

      <ComingSoonModal visible={showComingSoon} onClose={() => setShowComingSoon(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.colors.bg.screen },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: TOKENS.spacing.screenPad,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: { fontSize: 34, fontWeight: '700', color: TOKENS.colors.text.primary, letterSpacing: 0.37 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  statSubLabel: { fontSize: 10, color: TOKENS.colors.text.muted, textAlign: 'center', lineHeight: 13, marginTop: 1 },
  statDivider: { width: 1, backgroundColor: '#e8e8e8' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TOKENS.colors.text.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingTop: 4,
  },
  achievementCard: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    padding: 14,
    gap: 12,
    marginBottom: 8,
  },
  achievementHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  achievementIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  achievementLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: TOKENS.colors.text.primary },
  achievementProgress: { fontSize: 12, color: TOKENS.colors.text.secondary, fontWeight: '500' },
  tiersRow: { flexDirection: 'row', gap: 8 },
  tierItem: { flex: 1, alignItems: 'center', gap: 4 },
  tierDot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  tierDotLocked: { borderColor: '#e0e0e0', backgroundColor: 'transparent' },
  tierDotInner: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffffff',
  },
  tierBadge: {
    fontSize: 12, fontWeight: '700', color: TOKENS.colors.text.muted,
    textAlign: 'center',
  },
  tierTarget: {
    fontSize: 12, color: TOKENS.colors.text.muted, textAlign: 'center',
  },
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

  // Rest goal
  restGoalCard: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    padding: 16,
    gap: 12,
  },
  restGoalDescription: { fontSize: 13, color: TOKENS.colors.text.secondary, lineHeight: 18 },
  restGoalTiers: { flexDirection: 'row', gap: 8 },
  restGoalTierBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: TOKENS.radius.row,
    backgroundColor: '#f0f0f0',
    gap: 4,
  },
  restGoalTierBtnActive: {
    backgroundColor: TOKENS.colors.action.primary,
  },
  restGoalTierLabel: { fontSize: 13, fontWeight: '700', color: TOKENS.colors.text.secondary },
  restGoalTierLabelActive: { color: '#ffffff' },
  restGoalTierMins: { fontSize: 12, color: TOKENS.colors.text.muted },
  restGoalTierMinsActive: { color: 'rgba(255,255,255,0.7)' },

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
  labelAddText: { fontSize: 16, color: TOKENS.colors.accent.heading, fontWeight: '500' },

  signUpBtn: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    padding: 16,
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: TOKENS.colors.action.primary,
    fontWeight: '600',
  },
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
