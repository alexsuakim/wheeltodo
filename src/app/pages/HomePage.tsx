import { useState } from "react";
import { Check, X, Plus, Play, Pause, Sparkles, Dices, Maximize2, Wand2 } from "lucide-react";
import { useTasks } from "../context/TaskContext";
import { useNavigate } from "react-router";

export default function HomePage() {
  const navigate = useNavigate();
  const {
    tasks,
    activeTaskId,
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
    getTasksForDate,
  } = useTasks();

  const [inputValue, setInputValue] = useState("");
  const [subtaskInputs, setSubtaskInputs] = useState<{ [key: number]: string }>({});
  const [subtaskMode, setSubtaskMode] = useState<{ [key: number]: "none" | "add" | "generate" }>({});
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const handleAddTask = () => {
    addTask(inputValue);
    setInputValue("");
  };

  const handleAddSubtask = (taskId: number) => {
    const subtaskText = subtaskInputs[taskId];
    if (subtaskText) {
      addSubtask(taskId, subtaskText);
      setSubtaskInputs({ ...subtaskInputs, [taskId]: "" });
      setSubtaskMode({ ...subtaskMode, [taskId]: "none" });
    }
  };

  const handleGenerateSubtasks = (taskId: number) => {
    const prompt = subtaskInputs[taskId];
    if (prompt) {
      generateSubtasks(taskId);
      setSubtaskInputs({ ...subtaskInputs, [taskId]: "" });
      setSubtaskMode({ ...subtaskMode, [taskId]: "none" });
    } else {
      generateSubtasks(taskId);
      setSubtaskMode({ ...subtaskMode, [taskId]: "none" });
    }
  };

  const todaysTasks = getTasksForDate(new Date());
  const activeTasks = todaysTasks.filter((t) => !t.completed);
  const completedTasks = todaysTasks.filter((t) => t.completed);

  const filteredTasks = (() => {
    let filtered = todaysTasks;
    if (filter === "active") {
      filtered = activeTasks;
    } else if (filter === "completed") {
      filtered = completedTasks;
    }

    if (filter === "all") {
      return [...activeTasks, ...completedTasks];
    }
    return filtered;
  })();

  const goToWheel = () => {
    if (activeTasks.length === 0) return;
    navigate("/wheel");
  };

  return (
    <div className="size-full flex flex-col bg-white" style={{ paddingBottom: "60px" }}>
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-5 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-2">
            <h1 style={{ color: "#2D2D2D" }}>Tasks</h1>
            {activeTasks.length > 0 && (
              <button
                onClick={goToWheel}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:opacity-90 transition-all"
                style={{
                  backgroundColor: "#F3F4F6",
                  color: "#6B7280",
                  fontSize: "14px",
                }}
              >
                <Dices className="w-4 h-4" />
                Pick for me
              </button>
            )}
          </div>
          <div className="flex gap-3" style={{ fontSize: "15px" }}>
            <button
              onClick={() => setFilter("active")}
              className="transition-all"
              style={{
                color: filter === "active" ? "#6B7280" : "#9CA3AF",
                fontWeight: filter === "active" ? 500 : 400,
              }}
            >
              {activeTasks.length} active
            </button>
            <span style={{ color: "#D1D5DB" }}>·</span>
            <button
              onClick={() => setFilter("completed")}
              className="transition-all"
              style={{
                color: filter === "completed" ? "#6B7280" : "#9CA3AF",
                fontWeight: filter === "completed" ? 500 : 400,
              }}
            >
              {completedTasks.length} completed
            </button>
            {filter !== "all" && (
              <>
                <span style={{ color: "#D1D5DB" }}>·</span>
                <button
                  onClick={() => setFilter("all")}
                  className="transition-all"
                  style={{ color: "#9CA3AF" }}
                >
                  show all
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              placeholder="Add a new task"
              className="flex-1 px-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: "#F3F4F6",
                color: "#2D2D2D",
                fontSize: "15px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                ringColor: "#9CA3AF"
              }}
            />
            <button
              onClick={handleAddTask}
              className="px-4 py-3 rounded-xl hover:opacity-90 transition-all"
              style={{
                backgroundColor: "#6B7280",
                color: "#FFF",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
              }}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-3 flex-1">
          {filteredTasks.map((task) => {
            const isOtherTaskActive = activeTaskId !== null && activeTaskId !== task.id;
            const isExpanded = task.isExpanded;

            return (
              <div
                key={task.id}
                className="rounded-2xl transition-all duration-300"
                style={{
                  backgroundColor: "#FFF",
                  boxShadow: isExpanded
                    ? "0 4px 16px rgba(0,0,0,0.08)"
                    : "0 1px 3px rgba(0,0,0,0.05)",
                  opacity: isOtherTaskActive ? 0.4 : 1,
                  filter: isOtherTaskActive ? "blur(1px)" : "none",
                  transform: isExpanded ? "scale(1.02)" : "scale(1)",
                  border: task.isEvent ? "2px solid #DC2626" : "2px solid transparent",
                }}
              >
                <div className="flex items-center gap-3 px-4 py-4">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center hover:border-opacity-100 transition-all"
                    style={{
                      backgroundColor: task.completed ? "#6B7280" : "transparent",
                      borderColor: task.completed ? "#6B7280" : "#D1D5DB",
                    }}
                  >
                    {task.completed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </button>

                  <button
                    onClick={() => toggleExpanded(task.id)}
                    className="flex-1 text-left transition-all"
                  >
                    <div>
                      <span
                        style={{
                          color: "#2D2D2D",
                          textDecoration: task.completed ? "line-through" : "none",
                          opacity: task.completed ? 0.4 : 1,
                          fontSize: "15px",
                          lineHeight: "1.5"
                        }}
                      >
                        {task.text}
                      </span>
                      {task.focusTime > 0 && (
                        <div style={{ color: "#6B7280", fontSize: "12px", marginTop: "2px" }}>
                          {formatTime(task.focusTime)}
                        </div>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => toggleFocus(task.id)}
                    className="flex-shrink-0 transition-all hover:opacity-70"
                    style={{ color: task.isActive ? "#6B7280" : "#9CA3AF" }}
                  >
                    {task.isActive ? (
                      <Pause className="w-5 h-5" fill="currentColor" />
                    ) : (
                      <Play className="w-5 h-5" fill="currentColor" />
                    )}
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:opacity-70 transition-all rounded-full"
                    style={{ color: "#9CA3AF" }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isExpanded && (
                  <div
                    className="px-4 pb-4 pt-2 border-t transition-all"
                    style={{
                      borderColor: "#F3F4F6",
                    }}
                  >
                    {task.isActive && (
                      <div className="mb-4 flex items-center gap-2">
                        <div
                          className="px-3 py-2 rounded-lg inline-block"
                          style={{
                            backgroundColor: "#F9FAFB",
                            color: "#6B7280",
                            fontSize: "14px",
                            fontWeight: 500
                          }}
                        >
                          {formatTime(task.focusTime)}
                        </div>
                        <button
                          onClick={() => navigate("/focus")}
                          className="p-2 rounded-lg hover:opacity-70 transition-all"
                          style={{
                            backgroundColor: "#F9FAFB",
                            color: "#6B7280"
                          }}
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      {task.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-2 group">
                          <button
                            onClick={() => toggleSubtask(task.id, subtask.id)}
                            className="flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center hover:border-opacity-100 transition-all"
                            style={{
                              backgroundColor: subtask.completed ? "#6B7280" : "transparent",
                              borderColor: subtask.completed ? "#6B7280" : "#D1D5DB",
                            }}
                          >
                            {subtask.completed && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                          </button>
                          <span
                            className="flex-1"
                            style={{
                              color: "#2D2D2D",
                              textDecoration: subtask.completed ? "line-through" : "none",
                              opacity: subtask.completed ? 0.4 : 1,
                              fontSize: "14px",
                            }}
                          >
                            {subtask.text}
                          </span>
                          <button
                            onClick={() => deleteSubtask(task.id, subtask.id)}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                            style={{ color: "#9CA3AF" }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {(!subtaskMode[task.id] || subtaskMode[task.id] === "none") ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: "#9CA3AF", fontSize: "13px" }}>
                          Add/generate subtask
                        </span>
                        <button
                          onClick={() => setSubtaskMode({ ...subtaskMode, [task.id]: "add" })}
                          className="p-1.5 rounded-lg hover:bg-opacity-80 transition-all"
                          style={{ backgroundColor: "#F3F4F6" }}
                        >
                          <Plus className="w-4 h-4" style={{ color: "#6B7280" }} />
                        </button>
                        <button
                          onClick={() => setSubtaskMode({ ...subtaskMode, [task.id]: "generate" })}
                          className="p-1.5 rounded-lg hover:bg-opacity-80 transition-all"
                          style={{ backgroundColor: "#F3F4F6" }}
                        >
                          <Wand2 className="w-4 h-4" style={{ color: "#6B7280" }} />
                        </button>
                      </div>
                    ) : subtaskMode[task.id] === "add" ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={subtaskInputs[task.id] || ""}
                          onChange={(e) => setSubtaskInputs({ ...subtaskInputs, [task.id]: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && handleAddSubtask(task.id)}
                          placeholder="Add subtask"
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
                          onClick={() => handleAddSubtask(task.id)}
                          className="px-3 py-2 rounded-lg hover:opacity-90 transition-all"
                          style={{
                            backgroundColor: "#6B7280",
                            color: "#FFF",
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSubtaskMode({ ...subtaskMode, [task.id]: "none" })}
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
                          value={subtaskInputs[task.id] || ""}
                          onChange={(e) => setSubtaskInputs({ ...subtaskInputs, [task.id]: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && handleGenerateSubtasks(task.id)}
                          placeholder="Describe the task details for better generation..."
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
                            onClick={() => handleGenerateSubtasks(task.id)}
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
                            onClick={() => setSubtaskMode({ ...subtaskMode, [task.id]: "none" })}
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
                )}
              </div>
            );
          })}

          {filteredTasks.length === 0 && todaysTasks.length === 0 && (
            <div className="text-center py-16" style={{ color: "#9CA3AF" }}>
              No tasks for today. Add one above to get started.
            </div>
          )}
          {filteredTasks.length === 0 && todaysTasks.length > 0 && (
            <div className="text-center py-16" style={{ color: "#9CA3AF" }}>
              No {filter} tasks for today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
