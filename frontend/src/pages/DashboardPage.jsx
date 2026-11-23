// frontend/src/pages/DashboardPage.jsx
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Layers,
  ArrowRight,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useTasks } from "../context/TasksContext";
import { useBoards } from "../context/BoardsContext";
import { useAuth } from "../context/AuthContext";
import { fetchActivity } from "../api/activity.js";
import { columnTitle } from "../utils/columns";
import { AUTH_BG } from "../assets/cdn.js";
import WorkloadAnalyticsChart from "../components/WorkloadAnalyticsChart.jsx";
import UserAvatar from "../components/UserAvatar.jsx";
import "../styles/dashboardV2.css";

const STATUSES = ["To Do", "Doing", "Done"];
const MotionLink = motion.create(Link);

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function timeAgo(isoString) {
  if (!isoString) return "";
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function useActivity() {
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchActivity()
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setActivity(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { activity, isLoading, error };
}

function formatActivityMessage(message, boards) {
  if (!message) return "";
  return message.replace(/\b([0-9a-fA-F]{24})\b/g, (hex) => {
    if (Array.isArray(boards)) {
      for (const b of boards) {
        if (Array.isArray(b.columns)) {
          const found = b.columns.find((c) => (c.id || c._id?.toString?.()) === hex);
          if (found) return found.title;
        }
      }
    }
    return "Doing";
  });
}

function DashboardPage() {
  const { boards = [] } = useBoards() || {};
  const tasks = useTasks() || [];
  const { user } = useAuth() || {};
  const { activity, isLoading: activityLoading, error: activityError } = useActivity();

  const total = tasks.length;
  const counts = STATUSES.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => {
      const board = boards.find((b) => b.id === t.boardId);
      return columnTitle(board, t.columnId) === status;
    }).length;
    return acc;
  }, {});

  const doneCount = counts["Done"] || 0;
  const pendingCount = (counts["To Do"] || 0) + (counts["Doing"] || 0);
  const donePct = total ? Math.round((doneCount / total) * 100) : 0;
  const myTasks = tasks.filter((t) => t.assigneeId === user?.id);

  // Parse real deadlines and overdue tasks
  const now = Date.now();
  const overdueTasksList = [];
  const upcomingDeadlinesList = [];

  for (const t of tasks) {
    const board = boards.find((b) => b.id === t.boardId);
    const colName = columnTitle(board, t.columnId);
    const isDone = colName === "Done";
    if (isDone || !t.dueDate || t.dueDate === "No date") continue;

    let d = null;
    if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(t.dueDate)) {
      d = new Date(t.dueDate);
    } else if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(t.dueDate)) {
      d = new Date(`${t.dueDate} ${new Date().getFullYear()}`);
    } else if (/\d/.test(t.dueDate)) {
      d = new Date(t.dueDate);
    }

    if (d && !isNaN(d.getTime())) {
      const diff = d.getTime() - now;
      if (diff < 0) {
        overdueTasksList.push({ ...t, boardName: board?.name || "Project", dueDateObj: d });
      } else if (diff <= 7 * 24 * 3600 * 1000) {
        upcomingDeadlinesList.push({ ...t, boardName: board?.name || "Project", dueDateObj: d });
      }
    }
  }

  upcomingDeadlinesList.sort((a, b) => a.dueDateObj - b.dueDateObj);
  overdueTasksList.sort((a, b) => a.dueDateObj - b.dueDateObj);

  const kpis = [
    {
      label: "Total Projects",
      value: boards.length,
      detail: "Active workspaces",
      Icon: FolderKanban,
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.12)",
      border: "rgba(59, 130, 246, 0.25)",
    },
    {
      label: "Total Tasks",
      value: total,
      detail: "Across all boards",
      Icon: Layers,
      color: "#8b5cf6",
      bg: "rgba(139, 92, 246, 0.12)",
      border: "rgba(139, 92, 246, 0.25)",
    },
    {
      label: "Completed Tasks",
      value: doneCount,
      detail: `${donePct}% overall velocity`,
      Icon: CheckCircle2,
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.12)",
      border: "rgba(16, 185, 129, 0.25)",
    },
    {
      label: "Pending Tasks",
      value: pendingCount,
      detail: "To Do & In Progress",
      Icon: Clock,
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.12)",
      border: "rgba(245, 158, 11, 0.25)",
    },
    {
      label: "Overdue Tasks",
      value: overdueTasksList.length,
      detail: "Requires urgent action",
      Icon: AlertTriangle,
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.25)",
    },
    {
      label: "Completion Rate",
      value: `${donePct}%`,
      detail: "Sprint target pace",
      Icon: TrendingUp,
      color: "#06b6d4",
      bg: "rgba(6, 182, 212, 0.12)",
      border: "rgba(6, 182, 212, 0.25)",
    },
  ];

  return (
    <div className="page-shell dashv2">
      <div className="dashv2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
      <div className="dashv2-bg-overlay" aria-hidden="true" />
      <div className="dashv2-glow dashv2-glow--a" aria-hidden="true" />
      <div className="dashv2-glow dashv2-glow--b" aria-hidden="true" />

      <motion.div
        className="dashv2-frame"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Welcome Header */}
        <div className="dashv2-hero">
          <div className="dashv2-hero__content">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Sparkles size={18} color="#818cf8" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                TeamSync Workspace Overview
              </span>
            </div>
            <h1 className="dashv2-hero__title">
              {getTimeGreeting()}, <span className="dashv2-hero__name">{user?.name || "Member"}</span>! 👋
            </h1>
            <p className="dashv2-hero__subtitle">
              Monitor team productivity, track active project velocity, and stay ahead of upcoming sprint deadlines.
            </p>
          </div>
          <div className="dashv2-hero__actions">
            <Link to="/" className="dashv2-hero__btn dashv2-hero__btn--primary">
              <FolderKanban size={15} />
              <span>Browse Boards</span>
            </Link>
            <Link to="/my-tasks" className="dashv2-hero__btn dashv2-hero__btn--ghost">
              <CheckCircle2 size={15} />
              <span>My Tasks ({myTasks.length})</span>
            </Link>
          </div>
        </div>

        {/* 6 Metric KPI Stats Grid */}
        <div className="dashv2-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {kpis.map((kpi) => {
            const { label, value, detail, Icon, color, bg, border } = kpi;
            return (
              <motion.div
                key={label}
                className="dashv2-stat"
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                style={{
                  background: "rgba(17, 24, 39, 0.75)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  border: `1px solid ${border}`,
                  borderRadius: 14,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: color,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", lineHeight: 1.1 }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginTop: 2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    {detail}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Workload Analytics & Team Productivity Chart */}
        <WorkloadAnalyticsChart />

        {/* 2-Column Dashboard Sections */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
          
          {/* Column A: Upcoming Deadlines & Overdue Tasks */}
          <section
            className="dashv2-panel"
            style={{
              background: "rgba(17, 24, 39, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={18} color="#f59e0b" />
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                  Deadlines &amp; Urgent Tasks
                </h2>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 12,
                  background: overdueTasksList.length > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.08)",
                  color: overdueTasksList.length > 0 ? "#f87171" : "#94a3b8",
                  border: overdueTasksList.length > 0 ? "1px solid rgba(239, 68, 68, 0.3)" : "none",
                }}
              >
                {overdueTasksList.length} overdue · {upcomingDeadlinesList.length} upcoming
              </span>
            </div>

            {overdueTasksList.length === 0 && upcomingDeadlinesList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "#94a3b8", fontSize: 13 }}>
                <CheckCircle2 size={32} color="#10b981" style={{ margin: "0 auto 8px" }} />
                <p style={{ margin: 0, fontWeight: 600, color: "#e2e8f0" }}>No urgent deadlines</p>
                <p style={{ margin: "4px 0 0", fontSize: 12 }}>All tasks are on track and completed on time.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Overdue Items */}
                {overdueTasksList.slice(0, 4).map((task) => (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {task.boardName} • {task.assignee || "Unassigned"}
                      </div>
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: "rgba(239, 68, 68, 0.2)",
                        color: "#f87171",
                      }}
                    >
                      ⚠️ Overdue ({task.dueDate})
                    </span>
                  </Link>
                ))}

                {/* Upcoming Items */}
                {upcomingDeadlinesList.slice(0, 4).map((task) => (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.22)",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {task.boardName} • {task.assignee || "Unassigned"}
                      </div>
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: "rgba(245, 158, 11, 0.2)",
                        color: "#fbbf24",
                      }}
                    >
                      ⏰ Due {task.dueDate}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Column B: Recent Activity Stream */}
          <section
            className="dashv2-panel"
            style={{
              background: "rgba(17, 24, 39, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={18} color="#818cf8" />
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                  Recent Team Activity
                </h2>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#94a3b8",
                }}
              >
                {activity.length} events
              </span>
            </div>

            {activityLoading ? (
              <p style={{ textAlign: "center", padding: 24, color: "#94a3b8", fontSize: 13 }}>
                Loading real-time audit activity…
              </p>
            ) : activityError ? (
              <p style={{ color: "#f87171", fontSize: 12 }}>Couldn't load activity: {activityError}</p>
            ) : activity.length === 0 ? (
              <p style={{ textAlign: "center", padding: 24, color: "#94a3b8", fontSize: 13 }}>
                No audit activity recorded yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto" }}>
                {activity.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#818cf8",
                        marginTop: 5,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12.5, color: "#f1f5f9", lineHeight: 1.4 }}>
                        {formatActivityMessage(item.message, boards)}
                      </p>
                      <span style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2, display: "block" }}>
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Active Workspace Boards Grid */}
        <section
          style={{
            background: "rgba(17, 24, 39, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 16,
            padding: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FolderKanban size={18} color="#6366f1" />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                Active Project Boards
              </h2>
            </div>
            <Link
              to="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12.5,
                fontWeight: 600,
                color: "#818cf8",
                textDecoration: "none",
              }}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {boards.slice(0, 6).map((board) => {
              const bTasks = tasks.filter((t) => t.boardId === board.id);
              const bDone = bTasks.filter((t) => columnTitle(board, t.columnId) === "Done").length;
              const bPct = bTasks.length ? Math.round((bDone / bTasks.length) * 100) : 0;

              return (
                <Link
                  key={board.id}
                  to={`/boards/${board.id}`}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>{board.name}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{bTasks.length} tasks</span>
                  </div>
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {board.description || "Project collaboration board"}
                  </p>
                  <div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${bPct}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #10b981)", borderRadius: 3 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                      <span>{bDone} completed</span>
                      <span style={{ color: "#4ade80", fontWeight: 600 }}>{bPct}%</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

      </motion.div>
    </div>
  );
}

export default DashboardPage;
