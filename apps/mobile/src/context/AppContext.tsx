import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface Task {
  id: string;
  name: string;
  minutes: number;
  color: string;
  icon: string;
  category?: string;
}

export interface CompletedTask {
  id: string;
  taskId: string;
  taskName: string;
  color: string;
  icon: string;
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
  uncompleteTask: (completedTaskId: string) => void;

  pomodoroSession: PomodoroSession | null;
  taskProgress: Record<string, number>;
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
  wheelSoundEnabled: boolean;
  setWheelSoundEnabled: (enabled: boolean) => void;

  user: { name: string; email: string; initials: string } | null;
  login: (email: string, password: string) => void;
  logout: () => void;

  categories: string[];
  addCategory: (cat: string) => void;
  removeCategory: (cat: string) => void;

  seenAchievements: string[];
  markAchievementSeen: (label: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  tasks: 'wheelTodo.tasks',
  completedTasks: 'wheelTodo.completedTasks',
  user: 'wheelTodo.user',
  categories: 'wheelTodo.categories',
  seenAchievements: 'wheelTodo.seenAchievements',
} as const;

const DEFAULT_CATEGORIES = ['Work', 'Personal', 'Learning', 'Health'];

export const COLORS = [
  '#FF5C4D', '#FF9B50', '#4ECDC4', '#FFE66D', '#A78BFA', '#F9A8D4',
];

const defaultTasks: Task[] = [
  { id: '1', name: 'Write blog post',  minutes: 25, color: '#FF5C4D', icon: 'PenLine'   },
  { id: '2', name: 'Review code',      minutes: 15, color: '#FF9B50', icon: 'Code'      },
  { id: '3', name: 'Design mockups',   minutes: 30, color: '#4ECDC4', icon: 'Palette'   },
  { id: '4', name: 'Team meeting',     minutes: 20, color: '#FFE66D', icon: 'Users'     },
  { id: '5', name: 'Email replies',    minutes: 10, color: '#A78BFA', icon: 'Mail'      },
  { id: '6', name: 'Research',         minutes: 25, color: '#F9A8D4', icon: 'BookOpen'  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [pomodoroSession, setPomodoroSession] = useState<PomodoroSession | null>(null);
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});
  const [defaultTimerMinutes, setDefaultTimerMinutes] = useState(25);
  const [dailyGoal, setDailyGoal] = useState(6);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [wheelSoundEnabled, setWheelSoundEnabled] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string; initials: string } | null>(null);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [seenAchievements, setSeenAchievements] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [[, tasksRaw], [, completedRaw], [, userRaw], [, categoriesRaw]] = await AsyncStorage.multiGet([
          STORAGE_KEYS.tasks,
          STORAGE_KEYS.completedTasks,
          STORAGE_KEYS.user,
          STORAGE_KEYS.categories,
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
        if (categoriesRaw) setCategories(JSON.parse(categoriesRaw));
        const [, seenRaw] = await AsyncStorage.getItem(STORAGE_KEYS.seenAchievements).then(v => ['', v] as const).catch(() => ['', null] as const);
        if (seenRaw) setSeenAchievements(JSON.parse(seenRaw));
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
      icon: task.icon,
      minutesEstimated: task.minutes,
      minutesActual,
      completedAt: new Date(),
    };
    setCompletedTasks((prev) => [completed, ...prev]);
  };

  const uncompleteTask = (completedTaskId: string) => {
    const ct = completedTasks.find((t) => t.id === completedTaskId);
    if (!ct) return;
    setTasks((prev) => [...prev, {
      id: ct.taskId,
      name: ct.taskName,
      minutes: ct.minutesEstimated,
      color: ct.color,
      icon: ct.icon ?? 'BookOpen',
    }]);
    setCompletedTasks((prev) => prev.filter((t) => t.id !== completedTaskId));
  };

  const startPomodoro = (task: Task) => {
    const totalSeconds = task.minutes * 60;
    // Save current session's progress before switching
    if (pomodoroSession && pomodoroSession.taskId !== task.id) {
      setTaskProgress((prev) => ({ ...prev, [pomodoroSession.taskId]: pomodoroSession.remainingSeconds }));
    }
    const savedRemaining = taskProgress[task.id];
    setPomodoroSession({
      taskId: task.id,
      taskName: task.name,
      totalSeconds,
      remainingSeconds: savedRemaining ?? totalSeconds,
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
    const { taskId } = pomodoroSession;
    const minutesActual = Math.ceil(
      (pomodoroSession.totalSeconds - pomodoroSession.remainingSeconds) / 60
    );
    completeTask(taskId, minutesActual);
    deleteTask(taskId);
    setPomodoroSession(null);
    setTaskProgress((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  // Caller is responsible for driving this with setInterval (keeps context side-effect free).
  const tickPomodoro = useCallback(() => {
    setPomodoroSession((s) =>
      s && s.isRunning && s.remainingSeconds > 0
        ? { ...s, remainingSeconds: s.remainingSeconds - 1 }
        : s
    );
  }, []);

  // TODO: replace with supabase.auth.signInWithPassword() once the shared
  // Supabase client is patched for React Native (needs storage: AsyncStorage,
  // detectSessionInUrl: false).
  const login = (email: string, _password: string) => {
    const name = email.split('@')[0];
    const initials = name.slice(0, 2).toUpperCase();
    setUser({ name, email, initials });
  };

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories)).catch(() => {});
  }, [categories, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.seenAchievements, JSON.stringify(seenAchievements)).catch(() => {});
  }, [seenAchievements, loaded]);

  const markAchievementSeen = (label: string) => {
    setSeenAchievements((prev) => prev.includes(label) ? prev : [...prev, label]);
  };

  const addCategory = (cat: string) => {
    const trimmed = cat.trim();
    if (trimmed && !categories.includes(trimmed)) setCategories((prev) => [...prev, trimmed]);
  };

  const removeCategory = (cat: string) => {
    setCategories((prev) => prev.filter((c) => c !== cat));
  };

  const logout = () => {
    setUser(null);
    setPomodoroSession(null);
  };

  const value: AppContextType = {
    tasks, addTask, updateTask, deleteTask,
    completedTasks, completeTask, uncompleteTask,
    pomodoroSession, taskProgress, startPomodoro, pausePomodoro, resumePomodoro, completePomodoro, tickPomodoro,
    defaultTimerMinutes, setDefaultTimerMinutes,
    dailyGoal, setDailyGoal,
    notificationsEnabled, setNotificationsEnabled,
    wheelSoundEnabled, setWheelSoundEnabled,
    user, login, logout,
    categories, addCategory, removeCategory,
    seenAchievements, markAchievementSeen,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
