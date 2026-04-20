import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { useTasks } from "../context/TaskContext";

export default function WheelPage() {
  const navigate = useNavigate();
  const { tasks, toggleExpanded, getTasksForDate } = useTasks();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);

  const todaysTasks = getTasksForDate(new Date());
  const activeTasks = todaysTasks.filter((t) => !t.completed);

  useEffect(() => {
    if (activeTasks.length === 0) {
      navigate("/");
    }
  }, [activeTasks.length, navigate]);

  const spinWheel = () => {
    if (isSpinning || activeTasks.length === 0) return;

    setIsSpinning(true);
    setSelectedTask(null);

    const randomIndex = Math.floor(Math.random() * activeTasks.length);
    const degreesPerTask = 360 / activeTasks.length;
    const targetRotation = 360 * 5 + (360 - randomIndex * degreesPerTask - degreesPerTask / 2);

    setRotation(targetRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setSelectedTask(activeTasks[randomIndex].id);

      setTimeout(() => {
        toggleExpanded(activeTasks[randomIndex].id);
        navigate("/");
      }, 1500);
    }, 4000);
  };

  if (activeTasks.length === 0) {
    return null;
  }

  const degreesPerTask = 360 / activeTasks.length;
  const colors = [
    "#EF4444", // red
    "#F59E0B", // amber
    "#10B981", // emerald
    "#3B82F6", // blue
    "#8B5CF6", // violet
    "#EC4899", // pink
    "#14B8A6", // teal
    "#F97316", // orange
  ];

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
          <h2 style={{ color: "#2D2D2D", fontSize: "20px", fontWeight: 500, marginBottom: "32px" }}>
            Spin the Wheel
          </h2>

          <div className="relative mb-12" style={{ width: "280px", height: "280px" }}>
            {/* Pointer */}
            <div
              className="absolute left-1/2 -translate-x-1/2 z-10"
              style={{ top: "-10px" }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "12px solid transparent",
                  borderRight: "12px solid transparent",
                  borderTop: "20px solid #2D2D2D",
                }}
              />
            </div>

            {/* Wheel */}
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
                filter: "drop-shadow(0 8px 32px rgba(0, 0, 0, 0.15))",
              }}
            >
              {activeTasks.map((task, index) => {
                const startAngle = (index * degreesPerTask - 90) * (Math.PI / 180);
                const endAngle = ((index + 1) * degreesPerTask - 90) * (Math.PI / 180);
                const midAngle = (startAngle + endAngle) / 2;

                const x1 = 100 + 100 * Math.cos(startAngle);
                const y1 = 100 + 100 * Math.sin(startAngle);
                const x2 = 100 + 100 * Math.cos(endAngle);
                const y2 = 100 + 100 * Math.sin(endAngle);

                const largeArcFlag = degreesPerTask > 180 ? 1 : 0;

                const pathData = `M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                const textX = 100 + 60 * Math.cos(midAngle);
                const textY = 100 + 60 * Math.sin(midAngle);
                const textRotation = ((index + 0.5) * degreesPerTask) % 360;

                const color = colors[index % colors.length];

                return (
                  <g key={task.id}>
                    <path d={pathData} fill={color} />
                    <text
                      x={textX}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#FFF"
                      fontSize="10"
                      fontWeight="600"
                      transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                      style={{
                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      }}
                    >
                      {task.text.length > 20 ? task.text.substring(0, 20) + "..." : task.text}
                    </text>
                  </g>
                );
              })}

              {/* Center circle */}
              <circle cx="100" cy="100" r="20" fill="#FFF" />
            </svg>
          </div>

          <button
            onClick={spinWheel}
            disabled={isSpinning}
            className="px-12 py-4 rounded-2xl hover:opacity-90 transition-all"
            style={{
              backgroundColor: isSpinning ? "#F3F4F6" : "#6B7280",
              color: isSpinning ? "#9CA3AF" : "#FFF",
              fontSize: "16px",
              fontWeight: 500,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              opacity: isSpinning ? 0.6 : 1,
            }}
          >
            {isSpinning ? "Spinning..." : "Spin the Wheel"}
          </button>

          {selectedTask && (
            <p style={{ color: "#9CA3AF", fontSize: "14px", marginTop: "16px" }}>
              Redirecting...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
