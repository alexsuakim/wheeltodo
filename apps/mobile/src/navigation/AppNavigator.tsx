import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

const TAB_ICONS = {
  Spin:    RotateCcw,
  Tasks:   ListTodo,
  Rest:    Moon,
  History: Clock,
};

function StreakBadge({ onPress }: { onPress: () => void }) {
  const { streak, hasActivityToday } = useApp();
  // Three states: no streak (grey), at risk (outline coral), protected (filled coral)
  const hasStreak = streak > 0;
  const atRisk = hasStreak && !hasActivityToday;
  const flameColor = !hasStreak
    ? TOKENS.colors.text.muted
    : TOKENS.colors.action.streak;
  return (
    <Pressable onPress={atRisk ? onPress : undefined} style={styles.streakBadge} hitSlop={8}>
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
    <Pressable onPress={onPress} style={styles.avatarBtn} hitSlop={8}>
      <Text style={styles.avatarText}>{user?.initials ?? 'U'}</Text>
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
            height: 56,
            paddingBottom: 6,
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
  const { user } = useApp();

  if (!user) {
    return <LoginScreen onLogin={() => {}} />;
  }

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={({ navigation }) => ({
          headerTitle: '',
          headerStyle: { backgroundColor: TOKENS.colors.bg.screen },
          headerShadowVisible: false,
          headerLeft: () => (
            <StreakBadge onPress={() => navigation.navigate('MainTabs', { screen: 'Rest' } as any)} />
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
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: TOKENS.colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
