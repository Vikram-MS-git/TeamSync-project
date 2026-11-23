// frontend/src/pages/MyTasksPage.jsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FolderKanban,
  Paperclip,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useTasks, useTasksActions } from "../context/TasksContext";
import { useBoards } from "../context/BoardsContext";
import { useAuth } from "../context/AuthContext";
import { columnTitle, getColumns } from "../utils/columns";
import { AUTH_BG } from "../assets/cdn.js";

function parseTaskUrgency(dueDate, isDone) {
  if (!dueDate || dueDate === "No date" || isDone) return null;
  let d = null;
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(dueDate)) {
    d = new Date(dueDate);
  } else if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(dueDate)) {
    d = new Date(`${dueDate} ${new Date().getFullYear()}`);
  } else if (/\d/.test(dueDate)) {
    d = new Date(dueDate);
  }
  if (d && !isNaN(d.getTime())) {
    const now = Date.now();
    if (d.getTime() < now) return { type: "overdue", label: "Overdue", date: d };
    if (d.getTime() - now <= 24 * 3600 * 1000) return { type: "upcoming", label: "Due Soon", date: d };
    return { type: "normal", label: dueDate, date: d };
  }
  return null;
}

function MyTasksPage() {
  const tasks = useTasks() || [];
  const { boards = [] } = useBoards() || {};
  const { user } = useAuth() || {};
  const { moveTask } = useTasksActions() || {};

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "To Do" | "Doing" | "Done"
  const [sortBy, setSortBy] = useState("dueDate"); // "dueDate" | "title" | "board"

  // Only tasks assigned to current logged-in user
  const myTasks = useMemo(() => {
    return tasks.filter((t) => t.assigneeId === user?.id || t.assignee === user?.name);
  }, [tasks, user?.id, user?.name]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    return myTasks
      .filter((task) => {
        const board = boards.find((b) => b.id === task.boardId);
        const colTitle = columnTitle(board, task.columnId);

        // Status tab filter
        if (statusFilter !== "all" && colTitle !== statusFilter) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = task.title?.toLowerCase().includes(q);
          const matchDesc = task.description?.toLowerCase().includes(q);
          const matchBoard = board?.name?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchBoard) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "title") return a.title.localeCompare(b.title);
        if (sortBy === "board") {
          const bA = boards.find((b) => b.id === a.boardId)?.name || "";
          const bB = boards.find((b) => b.id === b.boardId)?.name || "";
          return bA.localeCompare(bB);
        }
        // Default sort by dueDate urgency
        const isDoneA = columnTitle(boards.find((b) => b.id === a.boardId), a.columnId) === "Done";
        const isDoneB = columnTitle(boards.find((b) => b.id === b.boardId), b.columnId) === "Done";
        if (isDoneA !== isDoneB) return isDoneA ? 1 : -1;
        const urgA = parseTaskUrgency(a.dueDate, isDoneA);
        const urgB = parseTaskUrgency(b.dueDate, isDoneB);
        if (urgA && urgB) return urgA.date - urgB.date;
        if (urgA) return -1;
        if (urgB) return 1;
        return 0;
      });
  }, [myTasks, boards, statusFilter, searchQuery, sortBy]);

  // Compute breakdown counts
  const counts = useMemo(() => {
    let todo = 0;
    let doing = 0;
    let done = 0;
    let overdue = 0;

    for (const t of myTasks) {
      const board = boards.find((b) => b.id === t.boardId);
      const col = columnTitle(board, t.columnId);
      if (col === "To Do") todo++;
      else if (col === "Doing") doing++;
      else if (col === "Done") done++;

      const urg = parseTaskUrgency(t.dueDate, col === "Done");
      if (urg?.type === "overdue") overdue++;
    }
    return { todo, doing, done, overdue, total: myTasks.length };
  }, [myTasks, boards]);

  function handleQuickMove(taskId, newStatus, currentBoardId) {
    if (!moveTask) return;
    const board = boards.find((b) => b.id === currentBoardId);
    if (!board) return;
    const cols = getColumns(board);
    const targetCol = cols.find((c) => c.title.toLowerCase() === newStatus.toLowerCase());
    if (targetCol) {
      moveTask(taskId, targetCol.id);
    }
  }

  return (
    <motion.div
      className="page-shell bp2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: "32px 24px", maxWidth: 1440, margin: "0 auto", width: "100%" }}
    >
      <div className="bp2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
      <div className="bp2-bg-overlay" aria-hidden="true" />

      {/* Top Header */}
      <div style={{ marginBottom: 28, display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Sparkles size={16} color="#818cf8" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Personal Workload &amp; Sprints
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            My Assigned Tasks
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>
            Tasks directly assigned to <strong>{user?.name}</strong> across all team workspaces.
          </p>
        </div>

        {/* Overview Stats Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ background: "rgba(17, 24, 39, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "8px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600 }}>
            <span style={{ color: "#94a3b8" }}>Total: </span>
            <span style={{ color: "#f8fafc", fontWeight: 800 }}>{counts.total}</span>
          </div>
          <div style={{ background: "rgba(17, 24, 39, 0.8)", border: "1px solid rgba(139, 111, 242, 0.3)", padding: "8px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600 }}>
            <span style={{ color: "#a78bfa" }}>To Do: </span>
            <span style={{ color: "#f8fafc", fontWeight: 800 }}>{counts.todo}</span>
          </div>
          <div style={{ background: "rgba(17, 24, 39, 0.8)", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "8px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600 }}>
            <span style={{ color: "#38bdf8" }}>In Progress: </span>
            <span style={{ color: "#f8fafc", fontWeight: 800 }}>{counts.doing}</span>
          </div>
          <div style={{ background: "rgba(17, 24, 39, 0.8)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "8px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600 }}>
            <span style={{ color: "#4ade80" }}>Completed: </span>
            <span style={{ color: "#f8fafc", fontWeight: 800 }}>{counts.done}</span>
          </div>
          {counts.overdue > 0 && (
            <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.35)", padding: "8px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: "#f87171" }}>
              ⚠️ {counts.overdue} Overdue
            </div>
          )}
        </div>
      </div>

      {/* Toolbar: Search, Filter Tabs, Sorting */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          padding: "14px 18px",
          borderRadius: 14,
          background: "rgba(17, 24, 39, 0.75)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          marginBottom: 24,
        }}
      >
        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 8, padding: "7px 12px", minWidth: 260, flex: "1 1 300px" }}>
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search tasks by title, project, description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              color: "#f8fafc",
              fontSize: 13,
              width: "100%",
              outline: "none",
            }}
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255, 255, 255, 0.04)", padding: 4, borderRadius: 8 }}>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              border: "none",
              background: statusFilter === "all" ? "rgba(99, 102, 241, 0.2)" : "transparent",
              color: statusFilter === "all" ? "#818cf8" : "#94a3b8",
              fontWeight: 600,
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            All ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("To Do")}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              border: "none",
              background: statusFilter === "To Do" ? "rgba(139, 111, 242, 0.2)" : "transparent",
              color: statusFilter === "To Do" ? "#a78bfa" : "#94a3b8",
              fontWeight: 600,
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            To Do ({counts.todo})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("Doing")}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              border: "none",
              background: statusFilter === "Doing" ? "rgba(56, 189, 248, 0.2)" : "transparent",
              color: statusFilter === "Doing" ? "#38bdf8" : "#94a3b8",
              fontWeight: 600,
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            In Progress ({counts.doing})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("Done")}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              border: "none",
              background: statusFilter === "Done" ? "rgba(16, 185, 129, 0.2)" : "transparent",
              color: statusFilter === "Done" ? "#4ade80" : "#94a3b8",
              fontWeight: 600,
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            Completed ({counts.done})
          </button>
        </div>

        {/* Sort Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#94a3b8" }}>
          <ArrowUpDown size={14} />
          <span>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 6,
              color: "#f8fafc",
              padding: "5px 10px",
              fontSize: 12.5,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="dueDate">Due Date / Urgency</option>
            <option value="title">Task Title (A-Z)</option>
            <option value="board">Project Board</option>
          </select>
        </div>
      </div>

      {/* Task List / Grid */}
      {filteredTasks.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "rgba(17, 24, 39, 0.6)",
            borderRadius: 16,
            border: "1px dashed rgba(255, 255, 255, 0.12)",
          }}
        >
          <CheckCircle2 size={42} color="#10b981" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc", margin: "0 0 6px" }}>
            {myTasks.length === 0 ? "You're all caught up!" : "No tasks match your filter"}
          </h3>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            {myTasks.length === 0
              ? "No tasks currently assigned to you. Pick up tasks from project boards or create new ones."
              : "Try switching status tabs or clearing your search term."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
          {filteredTasks.map((task) => {
            const board = boards.find((b) => b.id === task.boardId);
            const col = columnTitle(board, task.columnId);
            const isDone = col === "Done";
            const urgency = parseTaskUrgency(task.dueDate, isDone);

            return (
              <motion.div
                key={task.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                style={{
                  background: "rgba(17, 24, 39, 0.8)",
                  backdropFilter: "blur(14px)",
                  border: isDone
                    ? "1px solid rgba(16, 185, 129, 0.25)"
                    : urgency?.type === "overdue"
                    ? "1px solid rgba(239, 68, 68, 0.35)"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 14,
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
                }}
              >
                <div>
                  {/* Card Top: Board tag + Status badge */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                    <Link
                      to={`/boards/${task.boardId}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "#818cf8",
                        textDecoration: "none",
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: "rgba(99, 102, 241, 0.12)",
                        border: "1px solid rgba(99, 102, 241, 0.25)",
                      }}
                    >
                      <FolderKanban size={13} />
                      <span>{board?.name || "Board"}</span>
                    </Link>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {urgency?.type === "overdue" && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#f87171",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                          }}
                        >
                          ⚠️ Overdue
                        </span>
                      )}
                      {urgency?.type === "upcoming" && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: "rgba(245, 158, 11, 0.15)",
                            color: "#fbbf24",
                            border: "1px solid rgba(245, 158, 11, 0.3)",
                          }}
                        >
                          ⏰ Due Soon
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: "3px 9px",
                          borderRadius: 6,
                          background:
                            col === "Done"
                              ? "rgba(16, 185, 129, 0.15)"
                              : col === "Doing"
                              ? "rgba(56, 189, 248, 0.15)"
                              : "rgba(139, 111, 242, 0.15)",
                          color:
                            col === "Done"
                              ? "#4ade80"
                              : col === "Doing"
                              ? "#38bdf8"
                              : "#a78bfa",
                          border:
                            col === "Done"
                              ? "1px solid rgba(16, 185, 129, 0.3)"
                              : col === "Doing"
                              ? "1px solid rgba(56, 189, 248, 0.3)"
                              : "1px solid rgba(139, 111, 242, 0.3)",
                        }}
                      >
                        {col}
                      </span>
                    </div>
                  </div>

                  {/* Task Title */}
                  <Link
                    to={`/tasks/${task.id}`}
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: isDone ? "#94a3b8" : "#f8fafc",
                      textDecoration: isDone ? "line-through" : "none",
                      lineHeight: 1.4,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    {task.title}
                  </Link>

                  {/* Task Description snippet */}
                  {task.description && (
                    <p
                      style={{
                        margin: "0 0 14px",
                        fontSize: 12.5,
                        color: "#94a3b8",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Footer: Due date + attachments + Quick Move */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 12,
                    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#94a3b8" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Calendar size={13} color="#94a3b8" />
                      <span>{task.dueDate || "No due date"}</span>
                    </span>

                    {task.attachments?.length > 0 && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#a78bfa" }}>
                        <Paperclip size={12} />
                        <span>{task.attachments.length}</span>
                      </span>
                    )}
                  </div>

                  {/* Quick Status Mover */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {col !== "Doing" && (
                      <button
                        type="button"
                        onClick={() => handleQuickMove(task.id, "Doing", task.boardId)}
                        title="Move to In Progress"
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: 5,
                          background: "rgba(56, 189, 248, 0.12)",
                          border: "1px solid rgba(56, 189, 248, 0.25)",
                          color: "#38bdf8",
                          cursor: "pointer",
                        }}
                      >
                        Start
                      </button>
                    )}
                    {col !== "Done" && (
                      <button
                        type="button"
                        onClick={() => handleQuickMove(task.id, "Done", task.boardId)}
                        title="Mark Completed"
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: 5,
                          background: "rgba(16, 185, 129, 0.12)",
                          border: "1px solid rgba(16, 185, 129, 0.25)",
                          color: "#4ade80",
                          cursor: "pointer",
                        }}
                      >
                        Done ✓
                      </button>
                    )}
                    <Link
                      to={`/tasks/${task.id}`}
                      style={{
                        padding: "3px 6px",
                        color: "#818cf8",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="View details"
                    >
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default MyTasksPage;
