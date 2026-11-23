// BoardPage.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useBoards } from "../context/BoardsContext";
import { useTasks } from "../context/TasksContext";
import { useAuth } from "../context/AuthContext";
import { usePresence, useSocket } from "../context/SocketContext";
import { getColumns } from "../utils/columns";
import Board from "../components/Board";
import TaskDetailPanel from "../components/TaskDetailPanel";
import BoardSettingsModal from "../components/BoardSettingsModal";
import TeamChat from "../components/TeamChat.jsx";
import WorkloadAnalyticsChart from "../components/WorkloadAnalyticsChart.jsx";
import { fetchBoardMembers } from "../api/boards.js";
import { AUTH_BG } from "../assets/cdn.js";
import UserAvatar from "../components/UserAvatar.jsx";
import "../styles/boardPageV2.css";

function initials(name) {
  return (name || "?").slice(0, 2).toUpperCase();
}


function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { boards, isLoading } = useBoards();
  // boardId is a Mongo ObjectId string (e.g. "507f1f77bcf86cd799439011"),
  // not a number — Number(boardId) here used to be NaN for every real
  // board, which meant no board could ever be found once boards moved
  // off the old in-memory integer ids.
  const board = boards.find((b) => b.id === boardId);
  const tasks = useTasks();
  const { user } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [members, setMembers] = useState([]);

  const isOwner = !!board && board.ownerId === user?.id;
  const { socket, isConnected, joinBoard, leaveBoard } = useSocket() || {};
  const onlineUserIds = usePresence(boardId);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const handleChatMessage = (msg) => {
      if (msg.boardId === boardId && !isChatOpen && msg.senderId !== user?.id) {
        setUnreadChatCount((c) => c + 1);
      }
    };
    socket.on("chat:message", handleChatMessage);
    return () => {
      socket.off("chat:message", handleChatMessage);
    };
  }, [socket, boardId, isChatOpen, user?.id]);

  useEffect(() => {
    if (boardId && joinBoard) {
      joinBoard(boardId);
      return () => {
        leaveBoard?.(boardId);
      };
    }
  }, [boardId, joinBoard, leaveBoard]);

  useEffect(() => {
    if (!board) return;
    let cancelled = false;
    fetchBoardMembers(board.id)
      .then((m) => {
        if (!cancelled) setMembers(m);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [board]);

  if (isLoading) {
    return (
      <div className="page-shell bp2">
        <div className="bp2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
        <div className="bp2-bg-overlay" aria-hidden="true" />
        <p className="bp2-subtitle" style={{ position: "relative", zIndex: 1, color: "#a3a3b8" }}>Loading board…</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="page-shell bp2">
        <div className="bp2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
        <div className="bp2-bg-overlay" aria-hidden="true" />
        <p style={{ position: "relative", zIndex: 1, color: "#fff" }}>No board found with id "{boardId}".</p>
        <Link to="/" className="bp2-back-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to boards
        </Link>
      </div>
    );
  }

  const boardTasks = tasks.filter((t) => t.boardId === boardId);
  // "Done" isn't a field on the task anymore — it's whichever embedded
  // column on this board is titled "Done" (the default seed data always
  // has one; a board with custom column names may not).
  const doneColumn = getColumns(board).find((c) => c.title === "Done");
  const doneCount = doneColumn ? boardTasks.filter((t) => t.columnId === doneColumn.id).length : 0;
  const totalCount = boardTasks.length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const assignees = [...new Set(boardTasks.map((t) => t.assignee))];

  return (
    <motion.div
      className="page-shell bp2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bp2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
      <div className="bp2-bg-overlay" aria-hidden="true" />
      <div className="bp2-glow bp2-glow--a" aria-hidden="true" />
      <div className="bp2-glow bp2-glow--b" aria-hidden="true" />

      <motion.div
        className="bp2-frame"
        initial={{ opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <Link to="/" className="bp2-back-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to boards
        </Link>

        {/* This is the morph destination — it shares a layoutId with
            whichever board card (on BoardsListPage or DashboardPage) the
            user clicked to get here, so Framer Motion animates the card's
            shrinking/repositioning into this header instead of just
            cutting between two unrelated layouts. */}
        <motion.div layoutId={`board-card-${board.id}`} className="bp2-header">
          <div className="bp2-header__avatar">{initials(board.name)}</div>
          <div className="bp2-header__heading">
            <h1 className="bp2-header__title">{board.name}</h1>
          </div>

          {isOwner && (
            <button
              type="button"
              className="bp2-panel__status-btn"
              onClick={() => setIsSettingsModalOpen(true)}
              title="Board Settings"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                flex: "0 0 auto",
                width: "auto",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </button>
          )}

          <button
            type="button"
            className="bp2-panel__status-btn"
            onClick={() => {
              setIsChatOpen((open) => {
                if (!open) setUnreadChatCount(0);
                return !open;
              });
            }}
            title="Toggle Team Chat"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              flex: "0 0 auto",
              width: "auto",
              background: isChatOpen ? "rgba(139, 111, 242, 0.2)" : undefined,
              borderColor: isChatOpen ? "#8b6ff2" : undefined,
              position: "relative",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Team Chat
            {unreadChatCount > 0 && !isChatOpen && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 18,
                  height: 18,
                  padding: "0 5px",
                  borderRadius: 9,
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1,
                  marginLeft: 2,
                }}
              >
                {unreadChatCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="bp2-panel__status-btn"
            onClick={() => setIsAnalyticsOpen((open) => !open)}
            title="Toggle Workload Analytics"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              flex: "0 0 auto",
              width: "auto",
              background: isAnalyticsOpen ? "rgba(99, 102, 241, 0.2)" : undefined,
              borderColor: isAnalyticsOpen ? "#6366f1" : undefined,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Analytics
          </button>

          <div className="bp2-header__people">
            {assignees.map((name) => {
              const member = members.find((m) => m.name === name);
              return <UserAvatar key={name} user={member} name={name} size={28} className="bp2-header__person" title={name} />;
            })}
          </div>

          <div
            className="bp2-header__live-status"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 20,
              background: isConnected ? "rgba(74, 222, 128, 0.12)" : "rgba(239, 68, 68, 0.12)",
              color: isConnected ? "#4ade80" : "#f87171",
              border: `1px solid ${isConnected ? "rgba(74, 222, 128, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
              fontWeight: 500,
              flex: "0 0 auto",
            }}
            title={isConnected ? "Real-time Socket.IO synchronization active" : "Reconnecting to live server..."}
          >
            <span
              aria-hidden="true"
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: isConnected ? "#4ade80" : "#f87171",
                boxShadow: `0 0 0 2px ${isConnected ? "rgba(74, 222, 128, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
              }}
            />
            {isConnected ? "Live Sync" : "Reconnecting..."}
          </div>

          {onlineUserIds.length > 0 && (
            <div
              className="bp2-header__online"
              title={`Online now: ${onlineUserIds.length}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "#8de08d",
                flex: "0 0 auto",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#4ade80",
                  boxShadow: "0 0 0 2px rgba(74, 222, 128, 0.25)",
                }}
              />
              {onlineUserIds.length} online
            </div>
          )}

          <div className="bp2-header__progress">
            <div className="bp2-header__progress-track">
              <div className="bp2-header__progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="bp2-header__progress-label">
              {doneCount}/{totalCount} done
            </span>
          </div>
        </motion.div>

        <Board
          board={board}
          onOpenTask={setSelectedTaskId}
          isOwner={isOwner}
          currentUserId={user?.id}
          members={members}
        />
      </motion.div>

      <BoardSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        board={board}
        onDeleted={() => navigate("/")}
      />

      <AnimatePresence>
        {selectedTaskId && (
          <TaskDetailPanel
            key={selectedTaskId}
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
            isOwner={isOwner}
            currentUserId={user?.id}
            members={members}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChatOpen && (
          <TeamChat
            boardId={boardId}
            boardName={board.name}
            onClose={() => setIsChatOpen(false)}
            members={members}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAnalyticsOpen && (
          <>
            <motion.div
              className="bp2-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAnalyticsOpen(false)}
              style={{ zIndex: 1200 }}
            />
            <div
              className="bp2-modal"
              role="dialog"
              aria-modal="true"
              style={{ zIndex: 1201, maxWidth: 960, width: "95vw", padding: 16 }}
            >
              <motion.div
                className="bp2-modal__card"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.22 }}
                style={{ maxHeight: "90vh", overflowY: "auto", padding: "24px" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: "rgba(99, 102, 241, 0.18)",
                        border: "1px solid rgba(99, 102, 241, 0.35)",
                        color: "#818cf8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", margin: 0 }}>
                      {board.name} – Analytics
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="bp2-modal__close"
                    onClick={() => setIsAnalyticsOpen(false)}
                    aria-label="Close"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "none",
                      color: "#a3a3b8",
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </div>

                <WorkloadAnalyticsChart boardId={board.id} />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default BoardPage;