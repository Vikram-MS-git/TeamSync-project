// frontend/src/pages/ChatPage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Sparkles,
  Kanban,
  Users,
  Search,
  Send,
  Loader2,
  FolderKanban,
  ExternalLink,
} from "lucide-react";
import { useBoards } from "../context/BoardsContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { AUTH_BG } from "../assets/cdn.js";
import TeamChat from "../components/TeamChat.jsx";

export default function ChatPage() {
  const { boards = [], isLoading: boardsLoading } = useBoards() || {};
  const { user } = useAuth() || {};
  const { isConnected } = useSocket() || {};

  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [boardSearch, setBoardSearch] = useState("");

  // Auto-select first board when available
  useEffect(() => {
    if (!selectedBoardId && boards.length > 0) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards, selectedBoardId]);

  const filteredBoards = boards.filter((b) =>
    (b.name || "").toLowerCase().includes(boardSearch.toLowerCase())
  );

  const selectedBoard = boards.find((b) => b.id === selectedBoardId) || boards[0];

  return (
    <motion.div
      className="page-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        padding: "24px 20px",
        maxWidth: 1540,
        margin: "0 auto",
        width: "100%",
        minHeight: "calc(100vh - 80px)",
      }}
    >
      <div className="bv2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
      <div className="bv2-bg-overlay" aria-hidden="true" />

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Sparkles size={16} color="#818cf8" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Collaboration Hub
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              Team Chat &amp; Project Channels
            </h1>
            <p style={{ margin: 0, fontSize: 13.5, color: "#94a3b8" }}>
              Real-time project communication, updates, and discussion across your workspaces.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 20,
                background: isConnected ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                border: isConnected ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(245, 158, 11, 0.25)",
                color: isConnected ? "#34d399" : "#fbbf24",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: isConnected ? "#10b981" : "#f59e0b",
                }}
              />
              {isConnected ? "Socket.IO Live" : "Connecting…"}
            </span>
          </div>
        </div>
      </div>

      {boardsLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, color: "#94a3b8" }}>
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : boards.length === 0 ? (
        <div
          style={{
            background: "rgba(17, 24, 39, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 16,
            padding: "48px 24px",
            textAlign: "center",
            maxWidth: 520,
            margin: "40px auto",
          }}
        >
          <FolderKanban size={48} color="#818cf8" style={{ margin: "0 auto 16px", opacity: 0.8 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc", margin: "0 0 8px" }}>
            No Active Project Boards
          </h2>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 20px" }}>
            You need to create or join a project board before you can chat with teammates.
          </p>
          <Link
            to="/boards"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 13.5,
            }}
          >
            <Kanban size={16} />
            <span>Go to Boards</span>
          </Link>
        </div>
      ) : (
        /* Chat Main Layout: Sidebar Channels + Chat Window */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            gap: 16,
            minHeight: "calc(100vh - 200px)",
            height: "calc(100vh - 200px)",
          }}
        >
          {/* Left: Project Channels List */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 16,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Project Channels
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", padding: "2px 8px", borderRadius: 12, background: "rgba(99, 102, 241, 0.15)" }}>
                {boards.length} Boards
              </span>
            </div>

            {/* Filter Search */}
            <div style={{ position: "relative" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: 10 }} />
              <input
                type="text"
                placeholder="Filter channels…"
                value={boardSearch}
                onChange={(e) => setBoardSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 32px",
                  borderRadius: 8,
                  background: "rgba(0, 0, 0, 0.25)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#f8fafc",
                  fontSize: 12.5,
                  outline: "none",
                }}
              />
            </div>

            {/* Channel List */}
            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
              {filteredBoards.map((b) => {
                const isActive = b.id === (selectedBoard?.id || selectedBoardId);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBoardId(b.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: isActive ? "rgba(99, 102, 241, 0.18)" : "transparent",
                      border: isActive ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid transparent",
                      color: isActive ? "#ffffff" : "#94a3b8",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: isActive
                          ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                          : "rgba(255, 255, 255, 0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      #
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? 700 : 600,
                          color: isActive ? "#f8fafc" : "#cbd5e1",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {b.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        {b.members?.length || 1} members
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Active Board Chat Container */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 16,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {selectedBoard ? (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Channel Header Bar */}
                <div
                  style={{
                    padding: "12px 20px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "rgba(0, 0, 0, 0.15)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <MessageSquare size={18} color="#818cf8" />
                    <div>
                      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                        #{selectedBoard.name}
                      </h2>
                      <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0 }}>
                        {selectedBoard.description || "General project team channel"}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/boards/${selectedBoard.id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "#cbd5e1",
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>View Kanban Board</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>

                {/* TeamChat Embedded View */}
                <div style={{ flex: 1, position: "relative", height: "calc(100% - 60px)" }}>
                  <TeamChat
                    boardId={selectedBoard.id}
                    boardName={selectedBoard.name}
                    onClose={() => {}}
                    members={selectedBoard.members || []}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </motion.div>
  );
}
