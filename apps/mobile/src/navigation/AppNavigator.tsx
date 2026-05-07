import React, { useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Apple, Bird, Cake, Candy, Cherry, Clock, Cookie, Crown, Diamond, Flame, Flower, Gem, Heart, Leaf, ListTodo, Moon, RotateCcw, Sparkles, Star, Sun, Trophy, Turtle, Zap } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { LoginScreen } from '../screens/LoginScreen';
import { SpinScreen } from '../screens/SpinScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { RestScreen } from '../screens/RestScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { TOKENS } from '../theme/tokens';

type RootStackParamList = {
  MainTabs: undefined;
  Profile: undefined;
  EditProfile: undefined;
};

type TabParamList = {
  Spin: undefined;
  Tasks: undefined;
  Rest: undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const AVATAR_ICON_MAP: Record<string, { Icon: LucideIcon; bg: string; fg: string }> = {
  flame:    { Icon: Flame,    bg: '#FF5C4D', fg: '#ffffff' },
  heart:    { Icon: Heart,    bg: '#FF5C4D', fg: '#ffffff' },
  cherry:   { Icon: Cherry,   bg: '#FF5C4D', fg: '#ffffff' },
  apple:    { Icon: Apple,    bg: '#FF5C4D', fg: '#ffffff' },
  star:     { Icon: Star,     bg: '#FF5C4D', fg: '#ffffff' },
  cookie:   { Icon: Cookie,   bg: '#FF9B50', fg: '#ffffff' },
  candy:    { Icon: Candy,    bg: '#FF9B50', fg: '#ffffff' },
  cake:     { Icon: Cake,     bg: '#FF9B50', fg: '#ffffff' },
  trophy:   { Icon: Trophy,   bg: '#FF9B50', fg: '#ffffff' },
  zap:      { Icon: Zap,      bg: '#FF9B50', fg: '#ffffff' },
  sun:      { Icon: Sun,      bg: '#111111', fg: '#FFE66D' },
  moon:     { Icon: Moon,     bg: '#111111', fg: '#ffffff' },
  crown:    { Icon: Crown,    bg: '#111111', fg: '#FFE66D' },
  gem:      { Icon: Gem,      bg: '#111111', fg: '#A78BFA' },
  diamond:  { Icon: Diamond,  bg: '#111111', fg: '#4ECDC4' },
  flower:   { Icon: Flower,   bg: '#E8E0D5', fg: '#FF5C4D' },
  leaf:     { Icon: Leaf,     bg: '#E8E0D5', fg: '#111111' },
  bird:     { Icon: Bird,     bg: '#E8E0D5', fg: '#111111' },
  turtle:   { Icon: Turtle,   bg: '#E8E0D5', fg: '#111111' },
  sparkles: { Icon: Sparkles, bg: '#E8E0D5', fg: '#FF5C4D' },
};

const TAB_ICONS: Record<keyof TabParamList, any> = {
  Spin:    RotateCcw,
  Tasks:   ListTodo,
  Rest:    Moon,
  History: Clock,
};

// ─── Onboarding Sheet ─────────────────────────────────────────────────────────

const ONBOARDING_STEPS = [
  {
    emoji: '📝',
    title: 'Add tasks to your wheel',
    body: 'Head to the Tasks tab and add what you need to get done. They\'ll appear as slices on the wheel.',
  },
  {
    emoji: '🎡',
    title: 'Spin to pick what to work on',
    body: 'Can\'t decide where to start? Spin the wheel! It picks a task for you, then starts a focus timer.',
  },
  {
    emoji: '🌿',
    title: 'Rest days count too',
    body: 'Switch to Rest Mode on off days. Complete your rest goal to protect your streak — no burnout allowed.',
  },
];

function OnboardingSheet({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const current = ONBOARDING_STEPS[step];

  function next() {
    if (step < ONBOARDING_STEPS.length - 1) {
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -20, duration: 150, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      ]).start();
      setStep((s) => s + 1);
    } else {
      onDone();
    }
  }

  return (
    <Modal transparent animationType="fade">
      <View style={onbStyles.overlay}>
        <Animated.View style={[onbStyles.card, { transform: [{ translateX: slideAnim }] }]}>
          <View style={onbStyles.dotsRow}>
            {ONBOARDING_STEPS.map((_, i) => (
              <View key={i} style={[onbStyles.dot, i === step && onbStyles.dotActive]} />
            ))}
          </View>
          <Text style={onbStyles.emoji}>{current.emoji}</Text>
          <Text style={onbStyles.title}>{current.title}</Text>
          <Text style={onbStyles.body}>{current.body}</Text>
          <Pressable style={onbStyles.btn} onPress={next}>
            <Text style={onbStyles.btnText}>
              {step < ONBOARDING_STEPS.length - 1 ? 'Next' : 'Get started'}
            </Text>
          </Pressable>
          {step < ONBOARDING_STEPS.length - 1 && (
            <Pressable style={onbStyles.skipBtn} onPress={onDone}>
              <Text style={onbStyles.skipText}>Skip</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const onbStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: TOKENS.radius.sheet,
    padding: 32,
    marginHorizontal: 24,
    alignItems: 'center',
    gap: 12,
  },
  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#e0e0e0' },
  dotActive: { backgroundColor: TOKENS.colors.action.primary, width: 18 },
  emoji: { fontSize: 52 },
  title: { fontSize: 22, fontWeight: '800', color: TOKENS.colors.text.primary, textAlign: 'center' },
  body: { fontSize: 14, color: TOKENS.colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  btn: {
    marginTop: 8,
    backgroundColor: TOKENS.colors.action.primary,
    borderRadius: TOKENS.radius.pill,
    paddingHorizontal: 40,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  skipBtn: { paddingVertical: 8 },
  skipText: { fontSize: 14, color: TOKENS.colors.text.secondary },
});

// ─── Nav components ───────────────────────────────────────────────────────────

function StreakBadge({ onPress }: { onPress: () => void }) {
  const { streak, hasActivityToday } = useApp();
  const hasStreak = streak > 0;
  const atRisk = hasStreak && !hasActivityToday;
  const flameColor = !hasStreak
    ? TOKENS.colors.text.muted
    : TOKENS.colors.action.streak;
  return (
    <Pressable onPress={onPress} style={styles.streakBadge} hitSlop={8}>
      <Flame
        size={18}
        color={flameColor}
        strokeWidth={2.2}
        fill={atRisk ? 'transparent' : hasStreak ? flameColor : 'transparent'}
      />
      <Text style={[styles.streakText, !hasStreak && styles.streakTextMuted]}>{streak}</Text>
    </Pressable>
  );
}

function AvatarButton({ onPress }: { onPress: () => void }) {
  const { user } = useApp();
  const av = user?.avatarId ? AVATAR_ICON_MAP[user.avatarId] : null;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.avatarBtn, av ? { backgroundColor: av.bg } : null]}
      hitSlop={8}
    >
      {av ? (
        <av.Icon size={20} color={av.fg} strokeWidth={1.8} />
      ) : (
        <Text style={styles.avatarText}>{user?.initials ?? 'U'}</Text>
      )}
    </Pressable>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Spin"
      screenOptions={({ route }) => {
        const Icon = TAB_ICONS[route.name as keyof TabParamList];
        return {
          headerShown: false,
          tabBarActiveTintColor: TOKENS.colors.text.primary,
          tabBarInactiveTintColor: TOKENS.colors.text.secondary,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e8e8e8',
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarIcon: ({ focused, color, size }) => (
            <Icon size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
          tabBarLabel: () => null,
        };
      }}
    >
      <Tab.Screen name="Spin"    component={SpinScreen}    />
      <Tab.Screen name="Tasks"   component={TasksScreen}   />
      <Tab.Screen name="Rest"    component={RestScreen}    />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

// Custom header rendered in plain React Native — bypasses the native UIBarButtonItem
// container that caused the white ring around the avatar.
function MainTabsWithHeader() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: TOKENS.colors.bg.screen }}>
      <View style={[styles.headerBar, { paddingTop: insets.top }]}>
        <StreakBadge
          onPress={() => (navigation as any).navigate('MainTabs', { screen: 'History' })}
        />
        <AvatarButton onPress={() => navigation.navigate('Profile')} />
      </View>
      <View style={{ flex: 1 }}>
        <MainTabs />
      </View>
    </View>
  );
}

export function AppNavigator() {
  const { user, hasSeenOnboarding, markOnboardingSeen } = useApp();

  if (!user) {
    return <LoginScreen onLogin={() => {}} />;
  }

  return (
    <>
      <Stack.Navigator>
        <Stack.Screen
          name="MainTabs"
          component={MainTabsWithHeader}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>

      {!hasSeenOnboarding && (
        <OnboardingSheet onDone={markOnboardingSeen} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: TOKENS.spacing.screenPad,
    paddingBottom: 10,
    backgroundColor: TOKENS.colors.bg.screen,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 17,
    fontWeight: '700',
    color: TOKENS.colors.action.streak,
    letterSpacing: -0.3,
  },
  streakTextMuted: {
    color: TOKENS.colors.text.muted,
  },
  avatarBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: TOKENS.colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
