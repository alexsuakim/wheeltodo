import React, { useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Clock, Flame, ListTodo, Moon, RotateCcw } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { LoginScreen } from '../screens/LoginScreen';
import { SpinScreen } from '../screens/SpinScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { RestScreen } from '../screens/RestScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TOKENS } from '../theme/tokens';

type RootStackParamList = {
  MainTabs: undefined;
  Profile: undefined;
};

type TabParamList = {
  Spin: undefined;
  Tasks: undefined;
  Rest: undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

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
        size={14}
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
  return (
    <Pressable onPress={onPress} style={styles.avatarPressable}>
      <View style={styles.avatarBtn}>
        <Text style={styles.avatarText}>{user?.initials ?? 'U'}</Text>
      </View>
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
          component={MainTabs}
          options={({ navigation }) => ({
            headerTitle: '',
            headerStyle: { backgroundColor: TOKENS.colors.bg.screen },
            headerShadowVisible: false,
            headerLeft: () => (
              <StreakBadge onPress={() => navigation.navigate('MainTabs', { screen: 'History' } as any)} />
            ),
            headerRight: () => (
              <AvatarButton onPress={() => navigation.navigate('Profile')} />
            ),
          })}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 4,
  },
  streakText: {
    fontSize: 15,
    fontWeight: '700',
    color: TOKENS.colors.action.streak,
    letterSpacing: -0.3,
  },
  streakTextMuted: {
    color: TOKENS.colors.text.muted,
  },
  avatarPressable: {
    marginRight: 4,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TOKENS.colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
