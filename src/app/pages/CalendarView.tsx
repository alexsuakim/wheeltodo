import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Check, Wand2 } from "lucide-react";
import { useTasks } from "../context/TaskContext";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";

export default function CalendarView() {
  const { tasks, getTasksForDate, addRecurringTask, addTask, toggleSubtask, formatTime } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskType, setTaskType] = useState<"task" | "event">("task");
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [subtaskMode, setSubtaskMode] = useState<"none" | "add" | "generate">("none");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [interval, setInterval] = useState(1);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [endDate, setEndDate] = useState<string>("");
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];
  const completedCount = selectedDateTasks.filter((t) => t.completed).length;

  const toggleDaySelection = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addSubtaskToList = () => {
    if (subtaskInput.trim()) {
      setSubtasks([...subtasks, subtaskInput.trim()]);
      setSubtaskInput("");
      setSubtaskMode("none");
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleGenerateSubtasks = () => {
    // Mock AI generation - in real app would call an AI API
    const generatedSubtasks = [
      `Research ${taskName.toLowerCase()}`,
      `Create plan for ${taskName.toLowerCase()}`,
      `Execute and complete`,
    ];
    setSubtasks([...subtasks, ...generatedSubtasks]);
    setSubtaskInput("");
    setSubtaskMode("none");
  };

  const addSubtaskToToday = (subtaskText: string, index: number) => {
    addTask(subtaskText);
    removeSubtask(index);
  };

  const handleCreateTask = () => {
    if (!taskName.trim() || !selectedDate) return;

    const isEventType = taskType === "event";

    if (isRecurring) {
      const calculatedEndDate = endDate
        ? new Date(endDate)
        : new Date(selectedDate.getFullYear() + 1, selectedDate.getMonth(), selectedDate.getDate());

      addRecurringTask(
        taskName,
        subtasks,
        {
          frequency,
          interval,
          daysOfWeek: frequency === "weekly" ? selectedDays : undefined,
          endDate: calculatedEndDate,
        },
        selectedDate,
        isEventType,
        description
      );
    } else {
      addTask(taskName, selectedDate, isEventType, description);
      // Add subtasks to the newly created task
      if (subtasks.length > 0) {
        // We'll need to get the task ID and add subtasks
        // For now, this will create just the task
      }
    }

    // Reset form
    setShowTaskModal(false);
    setTaskType("task");
    setTaskName("");
    setDescription("");
    setSubtasks([]);
    setSubtaskInput("");
    setSubtaskMode("none");
    setIsRecurring(false);
    setFrequency("weekly");
    setInterval(1);
    setSelectedDays([]);
    setEndDate("");
  };

  return (
    <div className="size-full flex flex-col bg-white" style={{ paddingBottom: "60px" }}>
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-5 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 style={{ color: "#2D2D2D" }}>{format(currentDate, "MMMM yyyy")}</h1>
            <div className="flex gap-2">
              <button
                onClick={previousMonth}
                className="p-2 rounded-lg hover:bg-opacity-80 transition-all"
                style={{ backgroundColor: "#F3F4F6" }}
              >
                <ChevronLeft className="w-5 h-5" style={{ color: "#6B7280" }} />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-opacity-80 transition-all"
                style={{ backgroundColor: "#F3F4F6" }}
              >
                <ChevronRight className="w-5 h-5" style={{ color: "#6B7280" }} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center py-2"
                style={{ color: "#9CA3AF", fontSize: "12px", fontWeight: 500 }}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}
            {daysInMonth.map((day) => {
              const dayTasks = getTasksForDate(day);
              const hasActiveTasks = dayTasks.some((t) => !t.completed);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isDayToday = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all"
                  style={{
                    backgroundColor: isSelected
                      ? "#6B7280"
                      : isDayToday
                      ? "#F9FAFB"
                      : "transparent",
                    border: isDayToday && !isSelected ? "1px solid #6B7280" : "1px solid transparent",
                  }}
                >
                  <span
                    style={{
                      color: isSelected ? "#FFF" : "#2D2D2D",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {format(day, "d")}
                  </span>
                  {dayTasks.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {dayTasks.slice(0, 3).map((task, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full"
                          style={{
                            backgroundColor: isSelected
                              ? "#FFF"
                              : task.isEvent
                                ? "#DC2626"
                                : "#6B7280",
                            opacity: isSelected ? 0.8 : 0.6,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="flex-1">
            <div className="mb-4">
              <h3 style={{ color: "#2D2D2D", fontSize: "18px", fontWeight: 500 }}>
                {format(selectedDate, "EEEE, MMMM d")}
              </h3>
              {selectedDateTasks.length > 0 && (
                <p style={{ color: "#9CA3AF", fontSize: "14px", marginTop: "4px" }}>
                  {completedCount} of {selectedDateTasks.length} tasks completed
                </p>
              )}
            </div>

            {selectedDateTasks.length === 0 ? (
              <div className="text-center py-16">
                <p style={{ color: "#9CA3AF", marginBottom: "16px" }}>No tasks for this day</p>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-all mx-auto"
                  style={{
                    backgroundColor: "#F3F4F6",
                    color: "#6B7280",
                    fontSize: "14px",
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add task/event
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {selectedDateTasks.map((task) => {
                    const isExpanded = expandedTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        className="rounded-xl transition-all duration-300"
                        style={{
                          backgroundColor: "#F9FAFB",
                          boxShadow: isExpanded
                            ? "0 4px 16px rgba(0,0,0,0.08)"
                            : "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                      >
                        <button
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          className="w-full px-4 py-3 text-left"
                          style={{
                            borderLeft: task.isEvent
                              ? "3px solid #DC2626"
                              : task.completed
                                ? "3px solid #6B7280"
                                : "3px solid #D1D5DB",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <span
                                style={{
                                  color: "#2D2D2D",
                                  fontSize: "15px",
                                  textDecoration: task.completed ? "line-through" : "none",
                                  opacity: task.completed ? 0.6 : 1,
                                }}
                              >
                                {task.text}
                              </span>
                              {task.isEvent && (
                                <span
                                  style={{
                                    color: "#DC2626",
                                    fontSize: "11px",
                                    marginLeft: "8px",
                                    fontWeight: 500,
                                  }}
                                >
                                  (deadline)
                                </span>
                              )}
                              {task.isRecurring && !task.isEvent && (
                                <span
                                  style={{
                                    color: "#9CA3AF",
                                    fontSize: "11px",
                                    marginLeft: "8px",
                                  }}
                                >
                                  (recurring)
                                </span>
                              )}
                              {task.focusTime > 0 && (
                                <div style={{ color: "#6B7280", fontSize: "12px", marginTop: "2px" }}>
                                  {formatTime(task.focusTime)}
                                </div>
                              )}
                            </div>
                            {!isExpanded && task.subtasks.length > 0 && (
                              <div style={{ color: "#9CA3AF", fontSize: "13px" }}>
                                {task.subtasks.filter((s) => s.completed).length} / {task.subtasks.length}
                              </div>
                            )}
                          </div>
                        </button>

                        {isExpanded && task.subtasks.length > 0 && (
                          <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: "#F3F4F6" }}>
                            <div className="space-y-2">
                              {task.subtasks.map((subtask) => (
                                <button
                                  key={subtask.id}
                                  onClick={() => toggleSubtask(task.id, subtask.id)}
                                  className="w-full flex items-center gap-2 group"
                                >
                                  <div
                                    className="flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center hover:border-opacity-100 transition-all"
                                    style={{
                                      backgroundColor: subtask.completed ? "#6B7280" : "transparent",
                                      borderColor: subtask.completed ? "#6B7280" : "#D1D5DB",
                                    }}
                                  >
                                    {subtask.completed && (
                                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                    )}
                                  </div>
                                  <span
                                    className="flex-1 text-left"
                                    style={{
                                      color: "#2D2D2D",
                                      textDecoration: subtask.completed ? "line-through" : "none",
                                      opacity: subtask.completed ? 0.4 : 1,
                                      fontSize: "14px",
                                    }}
                                  >
                                    {subtask.text}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-all"
                  style={{
                    backgroundColor: "#F3F4F6",
                    color: "#6B7280",
                    fontSize: "14px",
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add task/event
                </button>
              </>
            )}
          </div>
        )}

        {!selectedDate && (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ color: "#9CA3AF", fontSize: "15px", textAlign: "center" }}>
              Select a date to view tasks
            </p>
          </div>
        )}
      </div>

      {showTaskModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-5"
          onClick={() => setShowTaskModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "80vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 style={{ color: "#2D2D2D", fontSize: "18px", fontWeight: 500 }}>
                Add Task/Event
              </h3>
              <button onClick={() => setShowTaskModal(false)}>
                <X className="w-5 h-5" style={{ color: "#9CA3AF" }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label style={{ color: "#2D2D2D", fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "8px" }}>
                  Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTaskType("task")}
                    className="flex-1 py-2 rounded-lg transition-all"
                    style={{
                      backgroundColor: taskType === "task" ? "#6B7280" : "#F9FAFB",
                      color: taskType === "task" ? "#FFF" : "#2D2D2D",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    Task
                  </button>
                  <button
                    onClick={() => setTaskType("event")}
                    className="flex-1 py-2 rounded-lg transition-all"
                    style={{
                      backgroundColor: taskType === "event" ? "#6B7280" : "#F9FAFB",
                      color: taskType === "event" ? "#FFF" : "#2D2D2D",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    Event/Deadline
                  </button>
                </div>
              </div>

              <div>
                <label style={{ color: "#2D2D2D", fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "8px" }}>
                  Name
                </label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder={taskType === "task" ? "e.g., Weekly review" : "e.g., Project deadline"}
                  className="w-full px-4 py-2 rounded-lg border-0 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: "#F9FAFB",
                    color: "#2D2D2D",
                    fontSize: "15px",
                  }}
                />
              </div>

              {taskType === "event" ? (
                <div>
                  <label style={{ color: "#2D2D2D", fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "8px" }}>
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add details about this event or deadline..."
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border-0 focus:outline-none focus:ring-2 resize-none"
                    style={{
                      backgroundColor: "#F9FAFB",
                      color: "#2D2D2D",
                      fontSize: "15px",
                    }}
                  />
                </div>
              ) : null}

              <div>
                <label style={{ color: "#2D2D2D", fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "8px" }}>
                  {taskType === "event" ? "Tasks before Event/Deadline" : "Subtasks"}
                </label>

                {subtasks.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {subtasks.map((subtask, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "#F9FAFB" }}>
                        <span className="flex-1" style={{ color: "#2D2D2D", fontSize: "14px" }}>
                          {subtask}
                        </span>
                        {taskType === "event" && (
                          <button
                            onClick={() => addSubtaskToToday(subtask, index)}
                            className="px-2 py-1 rounded text-xs hover:opacity-80 transition-all"
                            style={{ backgroundColor: "#6B7280", color: "#FFF" }}
                          >
                            Add to today
                          </button>
                        )}
                        <button onClick={() => removeSubtask(index)}>
                          <X className="w-4 h-4" style={{ color: "#9CA3AF" }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {subtaskMode === "none" ? (
                  <div className="flex items-center gap-2">
                    <span style={{ color: "#9CA3AF", fontSize: "13px" }}>
                      {taskType === "event" ? "Add/generate tasks" : "Add/generate subtask"}
                    </span>
                    <button
                      onClick={() => setSubtaskMode("add")}
                      className="p-1.5 rounded-lg hover:bg-opacity-80 transition-all"
                      style={{ backgroundColor: "#F3F4F6" }}
                    >
                      <Plus className="w-4 h-4" style={{ color: "#6B7280" }} />
                    </button>
                    <button
                      onClick={() => setSubtaskMode("generate")}
                      className="p-1.5 rounded-lg hover:bg-opacity-80 transition-all"
                      style={{ backgroundColor: "#F3F4F6" }}
                    >
                      <Wand2 className="w-4 h-4" style={{ color: "#6B7280" }} />
                    </button>
                  </div>
                ) : subtaskMode === "add" ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={subtaskInput}
                      onChange={(e) => setSubtaskInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addSubtaskToList()}
                      placeholder={taskType === "event" ? "Add a task" : "Add a subtask"}
                      autoFocus
                      className="flex-1 px-3 py-2 rounded-lg border-0 focus:outline-none focus:ring-1 transition-all"
                      style={{
                        backgroundColor: "#F9FAFB",
                        color: "#2D2D2D",
                        fontSize: "14px",
                        ringColor: "#9CA3AF"
                      }}
                    />
                    <button
                      onClick={addSubtaskToList}
                      className="px-3 py-2 rounded-lg hover:opacity-90 transition-all"
                      style={{
                        backgroundColor: "#6B7280",
                        color: "#FFF",
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSubtaskMode("none")}
                      className="px-3 py-2 rounded-lg hover:opacity-90 transition-all"
                      style={{
                        backgroundColor: "#F3F4F6",
                        color: "#9CA3AF",
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={subtaskInput}
                      onChange={(e) => setSubtaskInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGenerateSubtasks()}
                      placeholder={taskType === "event" ? "Describe for better task generation..." : "Describe the task details for better generation..."}
                      autoFocus
                      className="w-full px-3 py-2 rounded-lg border-0 focus:outline-none focus:ring-1 transition-all"
                      style={{
                        backgroundColor: "#F9FAFB",
                        color: "#2D2D2D",
                        fontSize: "14px",
                        ringColor: "#9CA3AF"
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleGenerateSubtasks}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:opacity-90 transition-all"
                        style={{
                          backgroundColor: "#6B7280",
                          color: "#FFF",
                          fontSize: "13px"
                        }}
                      >
                        <Wand2 className="w-4 h-4" />
                        Generate
                      </button>
                      <button
                        onClick={() => setSubtaskMode("none")}
                        className="px-3 py-2 rounded-lg hover:opacity-90 transition-all"
                        style={{
                          backgroundColor: "#F3F4F6",
                          color: "#9CA3AF",
                        }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span style={{ color: "#2D2D2D", fontSize: "14px", fontWeight: 500 }}>
                    Recurring
                  </span>
                </label>
              </div>

              {isRecurring && (
                <>
                  <div>
                    <label style={{ color: "#2D2D2D", fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "8px" }}>
                      Frequency
                    </label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as "daily" | "weekly" | "monthly")}
                      className="w-full px-4 py-2 rounded-lg border-0 focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: "#F9FAFB",
                        color: "#2D2D2D",
                        fontSize: "15px",
                      }}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {frequency === "weekly" && (
                    <div>
                      <label style={{ color: "#2D2D2D", fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "8px" }}>
                        Days of Week
                      </label>
                      <div className="flex gap-2">
                        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                          <button
                            key={index}
                            onClick={() => toggleDaySelection(index)}
                            className="flex-1 py-2 rounded-lg transition-all"
                            style={{
                              backgroundColor: selectedDays.includes(index) ? "#6B7280" : "#F9FAFB",
                              color: selectedDays.includes(index) ? "#FFF" : "#2D2D2D",
                              fontSize: "12px",
                              fontWeight: 500,
                            }}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ color: "#2D2D2D", fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "8px" }}>
                      End Date (optional)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border-0 focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: "#F9FAFB",
                        color: "#2D2D2D",
                        fontSize: "15px",
                      }}
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleCreateTask}
                disabled={!taskName.trim()}
                className="w-full py-3 rounded-lg transition-all"
                style={{
                  backgroundColor: taskName.trim() ? "#6B7280" : "#D1D5DB",
                  color: "#FFF",
                  fontSize: "15px",
                  fontWeight: 500,
                }}
              >
                {isRecurring ? "Create Recurring " : "Create "}{taskType === "task" ? "Task" : "Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
