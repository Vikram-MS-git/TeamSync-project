// frontend/src/pages/TeamPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  UserPlus,
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  X,
  Mail,
} from "lucide-react";
import { useBoards } from "../context/BoardsContext";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TasksContext";
import { useToast } from "../context/ToastContext";
import { usePresence } from "../context/SocketContext";
import { searchUsers } from "../api/users.js";
import { columnTitle } from "../utils/columns.js";
import { AUTH_BG } from "../assets/cdn.js";
import {
  fetchBoardStats,
  fetchBoardMembers,
  fetchBoardInvitations,
  inviteBoardMember,
  kickBoardMember,
} from "../api/boards.js";
import UserAvatar from "../components/UserAvatar.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

const SEARCH_DEBOUNCE_MS = 300;

function BoardSelectDropdown({ boards, selectedBoardId, onSelectBoard, isLoading }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedBoard = boards.find((b) => b.id === selectedBoardId);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", minWidth: 240 }}>
      <button
        type="button"
        onClick={() => !isLoading && boards.length > 0 && setIsOpen((prev) => !prev)}
        disabled={isLoading || boards.length === 0}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "9px 14px",
          borderRadius: 10,
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          color: "#ffffff",
          cursor: isLoading || boards.length === 0 ? "not-allowed" : "pointer",
          width: "100%",
          fontSize: 13.5,
          fontWeight: 600,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "#ffffff",
              fontSize: 11,
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {selectedBoard ? selectedBoard.name.slice(0, 2).toUpperCase() : "?"}
          </span>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {selectedBoard ? selectedBoard.name : isLoading ? "Loading boards…" : "Select a board"}
          </span>
        </div>
        <ChevronDown size={15} color="#94a3b8" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              zIndex: 100,
              borderRadius: 12,
              background: "#111827",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5)",
              padding: 6,
              maxHeight: 240,
              overflowY: "auto",
            }}
          >
            {boards.map((b) => {
              const isSelected = b.id === selectedBoardId;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    onSelectBoard(b.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: isSelected ? "rgba(99, 102, 241, 0.18)" : "transparent",
                    color: isSelected ? "#818cf8" : "#cbd5e1",
                    fontSize: 13,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {b.name}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TeamPage() {
  const [query, setQuery] = useState("");
  const showToast = useToast();
  const { user } = useAuth() || {};
  const { boards = [], isLoading: boardsLoading } = useBoards() || {};
  const allTasks = useTasks() || [];

  const [boardId, setBoardId] = useState("");
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState(null);
  const [stats, setStats] = useState({});

  const [pendingInvites, setPendingInvites] = useState({});
  const [invitingId, setInvitingId] = useState(null);

  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (boardsLoading || boardId || boards.length === 0) return;
    setBoardId(boards[0].id);
  }, [boardsLoading, boards, boardId]);

  const board = boards.find((b) => b.id === boardId);
  const isOwner = !!board && (board.ownerId === user?.id || String(board.owner) === String(user?.id));
  const onlineUserIds = usePresence(boardId) || [];

  const loadMembers = useCallback(() => {
    if (!boardId) return;
    setMembersLoading(true);
    setMembersError(null);
    return fetchBoardMembers(boardId)
      .then(setMembers)
      .catch((err) => setMembersError(err.message))
      .finally(() => setMembersLoading(false));
  }, [boardId]);

  const loadPendingInvites = useCallback(() => {
    if (!boardId || !isOwner) {
      setPendingInvites({});
      return;
    }
    fetchBoardInvitations(boardId)
      .then((invites) => {
        const byUserId = {};
        for (const inv of invites) byUserId[inv.invitedUserId] = inv;
        setPendingInvites(byUserId);
      })
      .catch(() => setPendingInvites({}));
  }, [boardId, isOwner]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    loadPendingInvites();
  }, [loadPendingInvites]);

  useEffect(() => {
    if (!boardId) return;
    fetchBoardStats(boardId)
      .then((rows) => {
        const byId = {};
        for (const row of rows) byId[row.assigneeId] = row;
        setStats(byId);
      })
      .catch(() => setStats({}));
  }, [boardId]);

  // Directory Search for invitations
  useEffect(() => {
    const trimmed = query.trim();
    if (!isOwner || trimmed.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    const timer = setTimeout(() => {
      searchUsers(trimmed)
        .then((results) => {
          if (!cancelled) setSearchResults(results);
        })
        .catch(() => {
          if (!cancelled) setSearchResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearchLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, isOwner]);

  async function handleInvite(email, targetUserId) {
    if (!boardId) return;
    setInvitingId(targetUserId);
    try {
      await inviteBoardMember(boardId, email);
      showToast(`Invited ${email}`, "success");
      await loadPendingInvites();
    } catch (err) {
      showToast(err.message || "Couldn't invite user", "error");
    } finally {
      setInvitingId(null);
    }
  }

  const [memberToKick, setMemberToKick] = useState(null);
  const [isKicking, setIsKicking] = useState(false);

  function handlePromptKick(memberId, memberName) {
    if (!boardId || !isOwner) return;
    setMemberToKick({ id: memberId, name: memberName });
  }

  async function executeKick() {
    if (!memberToKick || !boardId || !isOwner) return;
    setIsKicking(true);
    try {
      await kickBoardMember(boardId, memberToKick.id);
      showToast(`Removed ${memberToKick.name}`, "success");
      setMembers((prev) => prev.filter((m) => m.id !== memberToKick.id));
      setMemberToKick(null);
    } catch (err) {
      showToast(err.message || "Couldn't remove member", "error");
    } finally {
      setIsKicking(false);
    }
  }

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase())
  );

  const memberIds = new Set(members.map((m) => m.id));
  const invitableResults = searchResults.filter((u) => !memberIds.has(u.id));

  // Board tasks for completed calculation
  const boardTasks = allTasks.filter((t) => t.boardId === boardId);

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

      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Sparkles size={16} color="#818cf8" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Collaborators &amp; Roles
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Team Directory
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>
            {board
              ? `${members.length} ${members.length === 1 ? "member" : "members"} collaborating on "${board.name}".`
              : "Select a project board to manage team members and workloads."}
          </p>
        </div>

        {/* Board Selector & Member Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <BoardSelectDropdown
            boards={boards}
            selectedBoardId={boardId}
            onSelectBoard={setBoardId}
            isLoading={boardsLoading}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 10, padding: "8px 12px" }}>
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search or invite by email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "#f8fafc",
                fontSize: 13,
                outline: "none",
                minWidth: 160,
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {boardsLoading && <p style={{ color: "#94a3b8" }}>Loading boards…</p>}
      {!boardsLoading && boards.length === 0 && (
        <p style={{ color: "#94a3b8" }}>You don't own or belong to any boards yet.</p>
      )}

      {membersLoading && <p style={{ color: "#94a3b8" }}>Loading team…</p>}
      {membersError && (
        <p style={{ color: "#f87171", padding: 12, borderRadius: 8, background: "rgba(239, 68, 68, 0.12)" }}>
          Couldn't load team: {membersError}
        </p>
      )}

      {/* Member Cards Grid */}
      {!membersLoading && !membersError && board && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {filteredMembers.map((member) => {
              const memberStats = stats[member.id] ?? { taskCount: 0, overdueCount: 0 };
              const { taskCount, overdueCount } = memberStats;
              const isMemberOnline = onlineUserIds.includes(member.id);

              // Calculate completed vs pending tasks for this member on this board
              const mTasks = boardTasks.filter((t) => t.assigneeId === member.id || t.assignee === member.name);
              const completedCount = mTasks.filter((t) => columnTitle(board, t.columnId) === "Done").length;
              const pendingCount = Math.max(0, taskCount - completedCount);
              const onTrackPct = taskCount ? Math.round(((taskCount - overdueCount) / taskCount) * 100) : 100;

              // Workload Badge
              let workloadLabel = "Available";
              let workloadColor = "#10b981";
              let workloadBg = "rgba(16, 185, 129, 0.12)";
              let workloadBorder = "rgba(16, 185, 129, 0.25)";

              if (overdueCount > 0) {
                workloadLabel = `${overdueCount} Overdue`;
                workloadColor = "#ef4444";
                workloadBg = "rgba(239, 68, 68, 0.15)";
                workloadBorder = "rgba(239, 68, 68, 0.3)";
              } else if (pendingCount >= 4) {
                workloadLabel = "High Workload";
                workloadColor = "#f59e0b";
                workloadBg = "rgba(245, 158, 11, 0.15)";
                workloadBorder = "rgba(245, 158, 11, 0.3)";
              } else if (pendingCount >= 2) {
                workloadLabel = "Optimal Workload";
                workloadColor = "#818cf8";
                workloadBg = "rgba(129, 140, 248, 0.15)";
                workloadBorder = "rgba(129, 140, 248, 0.3)";
              }

              return (
                <motion.div
                  key={member.id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    background: "rgba(17, 24, 39, 0.8)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 16,
                    padding: "22px 20px",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  {/* Remove Member Button (Owner only) */}
                  {isOwner && member.role !== "owner" && (
                    <button
                      type="button"
                      onClick={() => handlePromptKick(member.id, member.name)}
                      title={`Remove ${member.name}`}
                      style={{
                        position: "absolute",
                        top: 14,
                        right: 14,
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: 6,
                        color: "#94a3b8",
                        cursor: "pointer",
                        padding: "3px 6px",
                        fontSize: 12,
                      }}
                    >
                      ×
                    </button>
                  )}

                  <div>
                    {/* Top: Avatar + Name + Online Status */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                      <div style={{ position: "relative" }}>
                        <UserAvatar user={member} size={50} />
                        <span
                          title={isMemberOnline ? "Online now" : "Offline"}
                          style={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: isMemberOnline ? "#10b981" : "#64748b",
                            border: "2px solid #111827",
                          }}
                        />
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {member.name}
                          </h3>
                        </div>
                        <p style={{ margin: "2px 0 6px", fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {member.email}
                        </p>

                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: member.role === "owner" ? "rgba(99, 102, 241, 0.18)" : "rgba(255, 255, 255, 0.06)",
                              color: member.role === "owner" ? "#818cf8" : "#cbd5e1",
                              border: member.role === "owner" ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                            }}
                          >
                            {member.role === "owner" ? "👑 Owner" : "Member"}
                          </span>

                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: isMemberOnline ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.04)",
                              color: isMemberOnline ? "#4ade80" : "#94a3b8",
                            }}
                          >
                            {isMemberOnline ? "Online" : "Offline"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Workload Pill */}
                    <div style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: 20,
                          background: workloadBg,
                          color: workloadColor,
                          border: `1px solid ${workloadBorder}`,
                        }}
                      >
                        <span>Workload: {workloadLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Task Metrics Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 8,
                      paddingTop: 14,
                      borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "8px 6px", borderRadius: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#f8fafc" }}>{taskCount}</div>
                      <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>Assigned</div>
                    </div>
                    <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "8px 6px", borderRadius: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#4ade80" }}>{completedCount}</div>
                      <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>Completed</div>
                    </div>
                    <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "8px 6px", borderRadius: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: overdueCount > 0 ? "#f87171" : "#cbd5e1" }}>
                        {overdueCount}
                      </div>
                      <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>Overdue</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* User Directory Invitation Section (Owner only) */}
          {isOwner && query.trim().length >= 2 && (
            <div
              style={{
                marginTop: 28,
                padding: 22,
                borderRadius: 16,
                background: "rgba(17, 24, 39, 0.8)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <UserPlus size={18} color="#818cf8" />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                  Invite New Collaborators to "{board.name}"
                </h3>
              </div>

              {searchLoading && <p style={{ color: "#94a3b8", fontSize: 13 }}>Searching user directory…</p>}
              {!searchLoading && invitableResults.length === 0 && (
                <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                  No matching registered users found outside of this board.
                </p>
              )}

              {!searchLoading && invitableResults.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {invitableResults.map((u) => {
                    const pending = pendingInvites[u.id];
                    return (
                      <div
                        key={u.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: 8,
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <UserAvatar user={u} size={32} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{u.email}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!!pending || invitingId === u.id}
                          onClick={() => handleInvite(u.email, u.id)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 6,
                            background: pending ? "rgba(255, 255, 255, 0.08)" : "#4f46e5",
                            color: "#ffffff",
                            border: "none",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: pending || invitingId === u.id ? "default" : "pointer",
                          }}
                        >
                          {pending ? "Invited ✓" : invitingId === u.id ? "Inviting…" : "Invite Member"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={Boolean(memberToKick)}
        onClose={() => setMemberToKick(null)}
        onConfirm={executeKick}
        title="Remove Team Member"
        message={memberToKick ? `Are you sure you want to remove ${memberToKick.name} from "${board?.name || "this board"}"?` : ""}
        confirmText="Remove Member"
        danger={true}
        isLoading={isKicking}
      />
    </motion.div>
  );
}

export default TeamPage;
