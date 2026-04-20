import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Subtask {
  id: number;
  text: string;
  completed: boolean;
}

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  daysOfWeek?: number[];
  endDate?: Date;
}

export interface Task {
  id: number;
  text: string;
  completed: boolean;
  focusTime: number;
  isActive: boolean;
  isExpanded: boolean;
  subtasks: Subtask[];
  createdAt: Date;
  scheduledDate?: Date;
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRule;
  recurringTemplateId?: number;
  isEvent?: boolean;
  description?: string;
}

interface TaskContextType {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  activeTaskId: number | null;
  setActiveTaskId: (id: number | null) => void;
  addTask: (text: string, scheduledDate?: Date, isEvent?: boolean, description?: string) => void;
  toggleTask: (id: number) => void;
  deleteTask: (id: number) => void;
  toggleFocus: (id: number) => void;
  toggleExpanded: (id: number) => void;
  addSubtask: (taskId: number, text: string) => void;
  toggleSubtask: (taskId: number, subtaskId: number) => void;
  deleteSubtask: (taskId: number, subtaskId: number) => void;
  generateSubtasks: (taskId: number) => void;
  formatTime: (seconds: number) => string;
  addRecurringTask: (text: string, subtasks: string[], recurrenceRule: RecurrenceRule, startDate: Date, isEvent?: boolean, description?: string) => void;
  getTasksForDate: (date: Date) => Task[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const today = new Date();
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Review project documentation", completed: false, focusTime: 0, isActive: false, isExpanded: false, subtasks: [], createdAt: today, scheduledDate: today },
    { id: 2, text: "Schedule team meeting", completed: false, focusTime: 0, isActive: false, isExpanded: false, subtasks: [], createdAt: today, scheduledDate: today },
    { id: 3, text: "Update dependencies", completed: false, focusTime: 0, isActive: false, isExpanded: false, subtasks: [], createdAt: today, scheduledDate: today },
  ]);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  useEffect(() => {
    if (activeTaskId === null) return;

    const interval = setInterval(() => {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === activeTaskId && task.isActive
            ? { ...task, focusTime: task.focusTime + 1 }
            : task
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTaskId]);

  const addTask = (text: string, scheduledDate?: Date, isEvent?: boolean, description?: string) => {
    if (text.trim()) {
      const taskDate = scheduledDate || new Date();
      setTasks([
        ...tasks,
        {
          id: Date.now(),
          text: text.trim(),
          completed: false,
          focusTime: 0,
          isActive: false,
          isExpanded: false,
          subtasks: [],
          createdAt: taskDate,
          scheduledDate: taskDate,
          isEvent: isEvent,
          description: description
        },
      ]);
    }
  };

  const addRecurringTask = (text: string, subtaskTexts: string[], recurrenceRule: RecurrenceRule, startDate: Date, isEvent?: boolean, description?: string) => {
    const templateId = Date.now();
    const newTasks: Task[] = [];

    const generateOccurrences = (start: Date, rule: RecurrenceRule): Date[] => {
      const occurrences: Date[] = [];
      let currentDate = new Date(start);
      const endDate = rule.endDate || new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());

      while (currentDate <= endDate && occurrences.length < 365) {
        if (rule.frequency === "daily") {
          occurrences.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + rule.interval);
        } else if (rule.frequency === "weekly") {
          if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
            const dayOfWeek = currentDate.getDay();
            if (rule.daysOfWeek.includes(dayOfWeek)) {
              occurrences.push(new Date(currentDate));
            }
            currentDate.setDate(currentDate.getDate() + 1);
          } else {
            occurrences.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 7 * rule.interval);
          }
        } else if (rule.frequency === "monthly") {
          occurrences.push(new Date(currentDate));
          currentDate.setMonth(currentDate.getMonth() + rule.interval);
        }
      }

      return occurrences;
    };

    const occurrences = generateOccurrences(startDate, recurrenceRule);

    occurrences.forEach((date, index) => {
      const taskSubtasks = subtaskTexts.map((subtext, subIndex) => ({
        id: templateId + index * 1000 + subIndex,
        text: subtext,
        completed: false,
      }));

      newTasks.push({
        id: templateId + index,
        text: text.trim(),
        completed: false,
        focusTime: 0,
        isActive: false,
        isExpanded: false,
        subtasks: taskSubtasks,
        createdAt: date,
        scheduledDate: date,
        isRecurring: true,
        recurrenceRule: recurrenceRule,
        recurringTemplateId: templateId,
        isEvent: isEvent,
        description: description,
      });
    });

    setTasks([...tasks, ...newTasks]);
  };

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter((task) => {
      const taskDate = task.scheduledDate || task.createdAt;
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      );
    });
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: number) => {
    if (activeTaskId === id) {
      setActiveTaskId(null);
    }
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const toggleFocus = (id: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === id) {
          const newIsActive = !task.isActive;
          if (newIsActive) {
            setActiveTaskId(id);
          } else if (activeTaskId === id) {
            setActiveTaskId(null);
          }
          return { ...task, isActive: newIsActive };
        }
        return { ...task, isActive: false };
      })
    );
  };

  const toggleExpanded = (id: number) => {
    setTasks(tasks.map((task) =>
      task.id === id ? { ...task, isExpanded: !task.isExpanded } : task
    ));
  };

  const addSubtask = (taskId: number, text: string) => {
    if (text.trim()) {
      setTasks(tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: [
                ...task.subtasks,
                { id: Date.now(), text: text.trim(), completed: false }
              ]
            }
          : task
      ));
    }
  };

  const toggleSubtask = (taskId: number, subtaskId: number) => {
    setTasks(tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            subtasks: task.subtasks.map((subtask) =>
              subtask.id === subtaskId
                ? { ...subtask, completed: !subtask.completed }
                : subtask
            )
          }
        : task
    ));
  };

  const deleteSubtask = (taskId: number, subtaskId: number) => {
    setTasks(tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId)
          }
        : task
    ));
  };

  const generateSubtasks = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const generatedSubtasks: Subtask[] = [
      { id: Date.now() + 1, text: `Research ${task.text.toLowerCase()}`, completed: false },
      { id: Date.now() + 2, text: `Create plan for ${task.text.toLowerCase()}`, completed: false },
      { id: Date.now() + 3, text: `Execute and complete`, completed: false },
    ];

    setTasks(tasks.map((t) =>
      t.id === taskId
        ? { ...t, subtasks: [...t.subtasks, ...generatedSubtasks] }
        : t
    ));
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    const hrsStr = hrs.toString().padStart(2, '0');
    const minsStr = mins.toString().padStart(2, '0');

    return `${hrsStr}:${minsStr}`;
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        setTasks,
        activeTaskId,
        setActiveTaskId,
        addTask,
        toggleTask,
        deleteTask,
        toggleFocus,
        toggleExpanded,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        generateSubtasks,
        formatTime,
        addRecurringTask,
        getTasksForDate,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
}
