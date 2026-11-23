// frontend/src/pages/AnalyticsPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  Sparkles,
  Kanban,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  TrendingUp,
} from "lucide-react";
import { useBoards } from "../context/BoardsContext";
import { useTasks } from "../context/TasksContext";
import WorkloadAnalyticsChart from "../components/WorkloadAnalyticsChart.jsx";
import { AUTH_BG } from "../assets/cdn.js";

export default function AnalyticsPage() {
  const { boards = [] } = useBoards() || {};
  const tasks = useTasks() || [];

  const [selectedBoardId, setSelectedBoardId] = useState("workspace");

  // Filter tasks based on selected board
  const activeTasks = selectedBoardId === "workspace"
    ? tasks
    : tasks.filter((t) => t.boardId === selectedBoardId);

  const totalCount = activeTasks.length;
  const completedCount = activeTasks.filter((t) => t.status === "done" || t.status === "completed").length;
  const pendingCount = totalCount - completedCount;
  const overdueCount = activeTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done" && t.status !== "completed"
  ).length;
  const completionPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <motion.div
      className="page-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        padding: "32px 24px",
        maxWidth: 1440,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div className="bv2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
      <div className="bv2-bg-overlay" aria-hidden="true" />

      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Sparkles size={16} color="#818cf8" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Workforce Intelligence
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            Workload &amp; Productivity Analytics
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>
            Real-time visual reports tracking task distribution, completion velocity, and pending workload.
          </p>
        </div>

        {/* Board Scope Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label htmlFor="analytics-board-select" style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>
            Scope:
          </label>
          <select
            id="analytics-board-select"
            value={selectedBoardId}
            onChange={(e) => setSelectedBoardId(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              background: "rgba(17, 24, 39, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#f8fafc",
              fontSize: 13,
              fontWeight: 600,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="workspace">🌐 All Workspace Projects</option>
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                📁 {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>
            Total Scoped Tasks
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc" }}>{totalCount}</div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#34d399", marginBottom: 6 }}>
            Completed Tasks
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#34d399" }}>{completedCount}</div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#fbbf24", marginBottom: 6 }}>
            Pending Backlog
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24" }}>{pendingCount}</div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#f87171", marginBottom: 6 }}>
            Overdue Deliverables
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#f87171" }}>{overdueCount}</div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#818cf8", marginBottom: 6 }}>
            Completion Velocity
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#818cf8" }}>{completionPct}%</div>
        </div>
      </div>

      {/* Main Workload Analytics Visualizer */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
        }}
      >
        <WorkloadAnalyticsChart
          key={selectedBoardId}
          boardId={selectedBoardId === "workspace" ? undefined : selectedBoardId}
        />
      </div>
    </motion.div>
  );
}
