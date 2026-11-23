// frontend/src/pages/BoardsListPage.jsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  Settings as SettingsIcon,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useBoards } from "../context/BoardsContext";
import { useTasks } from "../context/TasksContext";
import { useAuth } from "../context/AuthContext";
import { columnTitle } from "../utils/columns";
import { AUTH_BG } from "../assets/cdn.js";
import CreateBoardModal from "../components/CreateBoardModal";
import BoardSettingsModal from "../components/BoardSettingsModal";
import "../styles/boardsV2.css";

function initials(name) {
  return (name || "?").slice(0, 2).toUpperCase();
}

const GRADIENTS = [
  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)",
  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
];

function BoardsListPage() {
  const { boards = [], isLoading, error } = useBoards() || {};
  const tasks = useTasks() || [];
  const { user } = useAuth() || {};

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // "all" | "mine" | "shared"
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [settingsBoard, setSettingsBoard] = useState(null);

  // Filter boards
  const filteredBoards = useMemo(() => {
    return boards.filter((b) => {
      const matchesSearch =
        b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterTab === "mine") {
        return b.ownerId === user?.id || String(b.owner) === String(user?.id);
      }
      if (filterTab === "shared") {
        return b.ownerId !== user?.id && String(b.owner) !== String(user?.id);
      }
      return true;
    });
  }, [boards, searchQuery, filterTab, user?.id]);

  function getBoardStats(board) {
    const bTasks = tasks.filter((t) => t.boardId === board.id);
    const bDone = bTasks.filter((t) => columnTitle(board, t.columnId) === "Done").length;
    const bPending = bTasks.length - bDone;
    const bPct = bTasks.length ? Math.round((bDone / bTasks.length) * 100) : 0;
    const assignees = [...new Set(bTasks.map((t) => t.assignee).filter(Boolean))];
    return { total: bTasks.length, done: bDone, pending: bPending, pct: bPct, assignees };
  }

  return (
    <motion.div
      className="page-shell bv2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: "32px 24px", maxWidth: 1440, margin: "0 auto", width: "100%" }}
    >
      <div className="bv2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
      <div className="bv2-bg-overlay" aria-hidden="true" />

      {/* Top Header & Project Overview */}
      <div style={{ marginBottom: 28, display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Sparkles size={16} color="#818cf8" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Workspaces &amp; Projects
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Project Boards
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>
            Organize, collaborate, and track deliverables across your active project workspaces.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "#ffffff",
            border: "none",
            fontSize: 13.5,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
            transition: "all 0.15s ease",
          }}
        >
          <Plus size={16} strokeWidth={2.4} />
          <span>New Project Board</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
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
        {/* Search Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 8, padding: "7px 12px", minWidth: 260, flex: "1 1 300px" }}>
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Filter boards by name or description…"
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

        {/* Filter Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255, 255, 255, 0.04)", padding: 4, borderRadius: 8 }}>
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              border: "none",
              background: filterTab === "all" ? "rgba(99, 102, 241, 0.2)" : "transparent",
              color: filterTab === "all" ? "#818cf8" : "#94a3b8",
              fontWeight: 600,
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            All Boards ({boards.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("mine")}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              border: "none",
              background: filterTab === "mine" ? "rgba(99, 102, 241, 0.2)" : "transparent",
              color: filterTab === "mine" ? "#818cf8" : "#94a3b8",
              fontWeight: 600,
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            Created by Me
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("shared")}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              border: "none",
              background: filterTab === "shared" ? "rgba(99, 102, 241, 0.2)" : "transparent",
              color: filterTab === "shared" ? "#818cf8" : "#94a3b8",
              fontWeight: 600,
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            Shared / Collaborating
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
          <p>Loading project boards…</p>
        </div>
      )}

      {error && (
        <div style={{ padding: 16, borderRadius: 10, background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", marginBottom: 20 }}>
          Couldn't load boards: {error}
        </div>
      )}

      {/* Boards Grid */}
      {!isLoading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {filteredBoards.map((board, i) => {
            const { total, done, pending, pct, assignees } = getBoardStats(board);
            const isOwner = board.ownerId === user?.id || String(board.owner) === String(user?.id);
            const gradient = GRADIENTS[i % GRADIENTS.length];

            return (
              <motion.div
                key={board.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.15 }}
                style={{
                  background: "rgba(17, 24, 39, 0.8)",
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 16,
                  padding: "22px 20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
                }}
              >
                <div>
                  {/* Card Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: gradient,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          fontSize: 15,
                          fontWeight: 800,
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                          flexShrink: 0,
                        }}
                      >
                        {initials(board.name)}
                      </div>
                      <div>
                        <Link
                          to={`/boards/${board.id}`}
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#f8fafc",
                            textDecoration: "none",
                            lineHeight: 1.3,
                            display: "block",
                          }}
                        >
                          {board.name}
                        </Link>
                        <span style={{ fontSize: 11, color: isOwner ? "#818cf8" : "#94a3b8", fontWeight: 600 }}>
                          {isOwner ? "👑 Board Owner" : "👥 Team Board"}
                        </span>
                      </div>
                    </div>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => setSettingsBoard(board)}
                        title="Board Settings"
                        style={{
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: 8,
                          padding: 6,
                          color: "#94a3b8",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <SettingsIcon size={14} />
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      margin: "0 0 16px",
                      fontSize: 13,
                      color: "#94a3b8",
                      lineHeight: 1.5,
                      minHeight: 38,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {board.description || "Project collaboration and task management board."}
                  </p>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#94a3b8", marginBottom: 6 }}>
                      <span>Progress</span>
                      <span style={{ color: "#4ade80", fontWeight: 700 }}>{pct}% completed</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "rgba(255, 255, 255, 0.08)", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          borderRadius: 3,
                          background: "linear-gradient(90deg, #6366f1 0%, #10b981 100%)",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 14,
                    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
                    <span style={{ fontWeight: 600, color: "#f1f5f9" }}>{total}</span> tasks
                    <span>•</span>
                    <span style={{ color: "#fbbf24" }}>{pending} pending</span>
                  </div>

                  <Link
                    to={`/boards/${board.id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "#818cf8",
                      textDecoration: "none",
                    }}
                  >
                    <span>Open Board</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>
            );
          })}

          {/* New Board Action Card */}
          <motion.button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            whileHover={{ y: -3 }}
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "2px dashed rgba(99, 102, 241, 0.3)",
              borderRadius: 16,
              padding: 24,
              minHeight: 220,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              color: "#cbd5e1",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(99, 102, 241, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#818cf8",
              }}
            >
              <Plus size={22} strokeWidth={2.4} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>Create New Project Board</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Start a new sprint or project space</div>
            </div>
          </motion.button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredBoards.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "rgba(17, 24, 39, 0.6)",
            borderRadius: 16,
            border: "1px dashed rgba(255, 255, 255, 0.12)",
          }}
        >
          <FolderKanban size={40} color="#818cf8" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "#f8fafc", margin: "0 0 6px" }}>
            No project boards found
          </h3>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 16px" }}>
            {searchQuery ? "No boards match your filter query." : "You haven't created or joined any boards yet."}
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Create Your First Board
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <BoardSettingsModal
        isOpen={Boolean(settingsBoard)}
        onClose={() => setSettingsBoard(null)}
        board={settingsBoard}
        onDeleted={() => setSettingsBoard(null)}
      />
    </motion.div>
  );
}

export default BoardsListPage;
