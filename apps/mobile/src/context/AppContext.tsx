import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Task {
  id: string;
  name: string;
  minutes: number;
  color: string;
  icon: string;
}

export interface CompletedTask {
  id: string;
  taskId: string;
  taskName: string;
  color: string;
  minutesEstimated: number;
  minutesActual: number;
  completedAt: Date;
}

export interface PomodoroSession {
  taskId: string;
  taskName: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

interface AppContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  completedTasks: CompletedTask[];
  completeTask: (taskId: string, minutesActual: number) => void;

  pomodoroSession: PomodoroSession | null;
  startPomodoro: (task: Task) => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  completePomodoro: () => void;
  tickPomodoro: () => void;

  defaultTimerMinutes: number;
  setDefaultTimerMinutes: (minutes: number) => void;
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;

  user: { name: string; email: string; initials: string } | null;
  login: (email: string, password: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  tasks: 'wheelTodo.tasks',
  completedTasks: 'wheelTodo.completedTasks',
  user: 'wheelTodo.user',
} as const;

export const COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#C7CEEA', '#FFDAB9',
  '#FF9FF3', '#54A0FF', '#48DBFB', '#FF6348', '#1DD1A1', '#EE5A6F',
];

const defaultTasks: Task[] = [
  { id: '1',  name: 'Write blog post',  minutes: 25, color: '#FF6B6B', icon: 'PenLine'      },
  { id: '2',  name: 'Review code',      minutes: 15, color: '#4ECDC4', icon: 'Code'          },
  { id: '3',  name: 'Design mockups',   minutes: 30, color: '#FFE66D', icon: 'Palette'       },
  { id: '4',  name: 'Team meeting',     minutes: 20, color: '#95E1D3', icon: 'Users'         },
  { id: '5',  name: 'Email replies',    minutes: 10, color: '#C7CEEA', icon: 'Mail'          },
  { id: '6',  name: 'Research',         minutes: 25, color: '#FFDAB9', icon: 'BookOpen'      },
  { id: '7',  name: 'Workout',          minutes: 30, color: '#FF9FF3', icon: 'Dumbbell'      },
  { id: '8',  name: 'Grocery shopping', minutes: 45, color: '#54A0FF', icon: 'ShoppingCart'  },
  { id: '9',  name: 'Meditation',       minutes: 15, color: '#48DBFB', icon: 'Heart'         },
  { id: '10', name: 'Study session',    minutes: 50, color: '#FF6348', icon: 'GraduationCap' },
  { id: '11', name: 'Client call',      minutes: 30, color: '#1DD1A1', icon: 'Briefcase'     },
  { id: '12', name: 'Coffee break',     minutes: 10, color: '#EE5A6F', icon: 'Coffee'        },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [pomodoroSession, setPomodoroSession] = useState<PomodoroSession | null>(null);
  const [defaultTimerMinutes, setDefaultTimerMinutes] = useState(25);
  const [dailyGoal, setDailyGoal] = useState(6);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string; initials: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [[, tasksRaw], [, completedRaw], [, userRaw]] = await AsyncStorage.multiGet([
          STORAGE_KEYS.tasks,
          STORAGE_KEYS.completedTasks,
          STORAGE_KEYS.user,
        ]);
        if (tasksRaw) setTasks(JSON.parse(tasksRaw));
        if (completedRaw) {
          setCompletedTasks(
            (JSON.parse(completedRaw) as any[]).map((t) => ({
              ...t,
              completedAt: new Date(t.completedAt),
            }))
          );
        }
        if (userRaw) setUser(JSON.parse(userRaw));
      } catch {
        // keep defaults on parse failure
      } finally {
        setLoaded(true);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks)).catch(() => {});
  }, [tasks, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.completedTasks, JSON.stringify(completedTasks)).catch(() => {});
  }, [completedTasks, loaded]);

  useEffect(() => {
    if (!loaded) return;
    if (user) {
      AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user)).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.user).catch(() => {});
    }
  }, [user, loaded]);

  const addTask = (task: Omit<Task, 'id'>) => {
    setTasks((prev) => [...prev, { ...task, id: Date.now().toString() }]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const completeTask = (taskId: string, minutesActual: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const completed: CompletedTask = {
      id: Date.now().toString(),
      taskId: task.id,
      taskName: task.name,
      color: task.color,
      minutesEstimated: task.minutes,
      minutesActual,
      completedAt: new Date(),
    };
    setCompletedTasks((prev) => [completed, ...prev]);
  };

  const startPomodoro = (task: Task) => {
    const totalSeconds = task.minutes * 60;
    setPomodoroSession({
      taskId: task.id,
      taskName: task.name,
      totalSeconds,
      remainingSeconds: totalSeconds,
      isRunning: true,
    });
  };

  const pausePomodoro = () => {
    setPomodoroSession((s) => (s ? { ...s, isRunning: false } : null));
  };

  const resumePomodoro = () => {
    setPomodoroSession((s) => (s ? { ...s, isRunning: true } : null));
  };

  const completePomodoro = () => {
    if (!pomodoroSession) return;
    const minutesActual = Math.ceil(
      (pomodoroSession.totalSeconds - pomodoroSession.remainingSeconds) / 60
    );
    completeTask(pomodoroSession.taskId, minutesActual);
    setPomodoroSession(null);
  };

  // Caller is responsible for driving this with setInterval (keeps context side-effect free).
  const tickPomodoro = () => {
    setPomodoroSession((s) =>
      s && s.isRunning && s.remainingSeconds > 0
        ? { ...s, remainingSeconds: s.remainingSeconds - 1 }
        : s
    );
  };

  // TODO: replace with supabase.auth.signInWithPassword() once the shared
  // Supabase client is patched for React Native (needs storage: AsyncStorage,
  // detectSessionInUrl: false).
  const login = (email: string, _password: string) => {
    const name = email.split('@')[0];
    const initials = name.slice(0, 2).toUpperCase();
    setUser({ name, email, initials });
  };

  const logout = () => {
    setUser(null);
    setPomodoroSession(null);
  };

  const value: AppContextType = {
    tasks, addTask, updateTask, deleteTask,
    completedTasks, completeTask,
    pomodoroSession, startPomodoro, pausePomodoro, resumePomodoro, completePomodoro, tickPomodoro,
    defaultTimerMinutes, setDefaultTimerMinutes,
    dailyGoal, setDailyGoal,
    notificationsEnabled, setNotificationsEnabled,
    user, login, logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
