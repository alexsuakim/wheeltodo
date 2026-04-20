import { useNavigate } from "react-router";
import { Check, Pause, Play, ChevronLeft } from "lucide-react";
import { useTasks } from "../context/TaskContext";

export default function FocusMode() {
  const navigate = useNavigate();
  const { tasks, activeTaskId, toggleFocus, toggleSubtask, formatTime } = useTasks();

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  if (!activeTask) {
    return (
      <div className="size-full flex flex-col bg-white items-center justify-center" style={{ paddingBottom: "60px" }}>
        <div className="w-full max-w-md mx-auto px-5 py-8 text-center">
          <h2 style={{ color: "#2D2D2D", marginBottom: "16px" }}>No Active Task</h2>
          <p style={{ color: "#9CA3AF", fontSize: "15px", marginBottom: "24px" }}>
            Start a task from the Today page to begin focusing.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-xl hover:opacity-90 transition-all"
            style={{
              backgroundColor: "#6B7280",
              color: "#FFF",
            }}
          >
            Go to Today
          </button>
        </div>
      </div>
    );
  }

  const completedSubtasks = activeTask.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = activeTask.subtasks.length;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div className="size-full flex flex-col bg-white" style={{ paddingBottom: "60px" }}>
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-5 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 mb-8 transition-all hover:opacity-70"
          style={{ color: "#9CA3AF", fontSize: "15px" }}
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div
            className="w-48 h-48 rounded-full flex items-center justify-center mb-8 relative"
            style={{
              background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
              boxShadow: "0 8px 32px rgba(201, 145, 106, 0.15)",
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#6B7280 ${progress}%, transparent ${progress}%)`,
                opacity: 0.3,
              }}
            />
            <div
              className="w-40 h-40 rounded-full bg-white flex flex-col items-center justify-center relative z-10"
              style={{ boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)" }}
            >
              <div style={{ color: "#6B7280", fontSize: "32px", fontWeight: 500 }}>
                {formatTime(activeTask.focusTime)}
              </div>
              <div style={{ color: "#9CA3AF", fontSize: "13px", marginTop: "4px" }}>
                Focus time
              </div>
            </div>
          </div>

          <h2
            style={{
              color: "#2D2D2D",
              fontSize: "24px",
              fontWeight: 500,
              textAlign: "center",
              marginBottom: "24px",
              maxWidth: "320px",
            }}
          >
            {activeTask.text}
          </h2>

          <button
            onClick={() => toggleFocus(activeTask.id)}
            className="mb-12 px-12 py-4 rounded-2xl hover:opacity-90 transition-all"
            style={{
              backgroundColor: activeTask.isActive ? "#F3F4F6" : "#6B7280",
              color: activeTask.isActive ? "#6B7280" : "#FFF",
              fontSize: "16px",
              fontWeight: 500,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
          >
            {activeTask.isActive ? (
              <span className="flex items-center gap-2">
                <Pause className="w-5 h-5" />
                Pause
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Resume
              </span>
            )}
          </button>

          {activeTask.subtasks.length > 0 && (
            <div className="w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ color: "#2D2D2D", fontSize: "16px", fontWeight: 500 }}>
                  Subtasks
                </h3>
                <span style={{ color: "#9CA3AF", fontSize: "14px" }}>
                  {completedSubtasks} / {totalSubtasks}
                </span>
              </div>

              <div className="space-y-3">
                {activeTask.subtasks.map((subtask) => (
                  <button
                    key={subtask.id}
                    onClick={() => toggleSubtask(activeTask.id, subtask.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-opacity-80"
                    style={{
                      backgroundColor: "#F9FAFB",
                    }}
                  >
                    <div
                      className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: subtask.completed ? "#6B7280" : "transparent",
                        borderColor: subtask.completed ? "#6B7280" : "#D1D5DB",
                      }}
                    >
                      {subtask.completed && (
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
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
      </div>
    </div>
  );
}
