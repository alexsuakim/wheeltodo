import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Clock, ListTodo, RotateCcw, User } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { LoginScreen } from '../screens/LoginScreen';
import { SpinScreen } from '../screens/SpinScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TOKENS } from '../theme/tokens';

type TabParamList = {
  Spin: undefined;
  Tasks: undefined;
  History: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS = {
  Spin:    RotateCcw,
  Tasks:   ListTodo,
  History: Clock,
  Profile: User,
};

export function AppNavigator() {
  const { user } = useApp();

  if (!user) {
    return <LoginScreen onLogin={() => {}} />;
  }

  return (
    <Tab.Navigator
      initialRouteName="Spin"
      screenOptions={({ route }) => {
        const Icon = ICONS[route.name as keyof TabParamList];
        return {
          headerShown: false,
          tabBarActiveTintColor: TOKENS.colors.text.primary,
          tabBarInactiveTintColor: TOKENS.colors.text.secondary,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e8e8e8',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarIcon: ({ focused, color, size }) => (
            <Icon size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
          tabBarLabel: ({ focused, color }) => (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color, fontWeight: focused ? '600' : '400' }}>
                {route.name}
              </Text>
              {focused && (
                <View style={{
                  width: 4, height: 4, borderRadius: 2,
                  backgroundColor: TOKENS.colors.action.streak,
                  marginTop: 2,
                }} />
              )}
            </View>
          ),
        };
      }}
    >
      <Tab.Screen name="Spin"    component={SpinScreen}    />
      <Tab.Screen name="Tasks"   component={TasksScreen}   />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
