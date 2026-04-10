export type Task = {
  id: string;
  text: string;
  minutes: number;
  completedAt?: number;
  elapsedMs?: number;
  remainingMs?: number;
  runningAtCompletion?: boolean;
};

export type DayRecord = {
  dateKey: string;
  tasks: Task[];
  doneTasks: Task[];
};

