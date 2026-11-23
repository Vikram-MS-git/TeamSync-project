import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTasks, useTasksActions } from "../context/TasksContext";
import { useBoards } from "../context/BoardsContext";
import { useToast } from "../context/ToastContext";
import { getColumns } from "../utils/columns";
import { fetchSmartAssignment } from "../api/boards";
import { BASE_URL } from "../api/client";
import UserAvatar from "./UserAvatar.jsx";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(filename = "") {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["pdf"].includes(ext)) return "📄";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "🖼️";
  if (["zip", "tar", "gz", "rar"].includes(ext)) return "📦";
  return "📎";
}

function TaskDetailPanel({ taskId, onClose, isOwner, currentUserId, members = [] }) {
  const tasks = useTasks();
  const { boards } = useBoards();
  const { updateTask, deleteTask, moveTask, uploadAttachment, removeAttachment } = useTasksActions();
  const showToast = useToast();
  const [recommendations, setRecommendations] = useState([]);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("File size must be under 10MB", "error");
      return;
    }
    setIsUploading(true);
    try {
      await uploadAttachment(task.id, file);
    } catch {
      // toast shown in context
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveAttachment(attId) {
    try {
      await removeAttachment(task.id, attId);
    } catch {
      // toast shown in context
    }
  }

  useEffect(() => {
    if (!task?.boardId) return;
    fetchSmartAssignment(task.boardId)
      .then((recs) => {
        if (Array.isArray(recs)) setRecommendations(recs);
      })
      .catch(() => setRecommendations([]));
  }, [task?.boardId]);

  const board = boards.find((b) => b.id === task.boardId);
  const columns = getColumns(board);
  const currentColumn = columns.find((c) => c.id === task.columnId);
  const isDone = currentColumn?.title?.toLowerCase() === "done";

  // Calculate deadline urgency
  let urgency = null;
  if (task.dueDate && task.dueDate !== "No date" && !isDone) {
    let d = null;
    if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(task.dueDate)) {
      d = new Date(task.dueDate);
    } else if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(task.dueDate)) {
      d = new Date(`${task.dueDate} ${new Date().getFullYear()}`);
    } else if (/\d/.test(task.dueDate)) {
      d = new Date(task.dueDate);
    }
    if (d && !isNaN(d.getTime())) {
      const now = Date.now();
      if (d.getTime() < now) urgency = "overdue";
      else if (d.getTime() - now <= 24 * 3600 * 1000) urgency = "upcoming";
    }
  }

  const isAssignee = task.assigneeId === currentUserId;
  const canMove = isOwner || isAssignee;
  const canEdit = isOwner;

  function handleDelete() {
    if (!canEdit) return;
    deleteTask(task.id);
    showToast(`Deleted "${task.title}"`, "success");
    onClose();
  }

  function handleColumnChange(newColumnId) {
    if (!canMove) return;
    moveTask(task.id, newColumnId);
  }

  function handleAssigneeChange(memberId) {
    if (!canEdit) return;
    const name = members.find((m) => m.id === memberId)?.name || "";
    updateTask(task.id, { assigneeId: memberId, assignee: name });
  }

  return (
    <>
      <motion.div
        className="bp2-panel-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      />
      {/* Shares a layoutId with the TaskCard that was clicked to open this
          panel — Framer Motion morphs the small card into this full-height
          drawer instead of just popping it in from nowhere. */}
      <motion.div
        layoutId={`task-card-${task.id}`}
        className="bp2-panel"
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
      >
        <div className="bp2-panel__header">
          <span className="bp2-panel__eyebrow">Task</span>
          <button className="bp2-panel__close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {urgency === "overdue" && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#f87171",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 500,
            }}
          >
            <span>⚠️</span>
            <span>Overdue Task: Due date was {task.dueDate}. Needs immediate attention.</span>
          </div>
        )}

        {urgency === "upcoming" && (
          <div
            style={{
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              color: "#fbbf24",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 500,
            }}
          >
            <span>⏰</span>
            <span>Upcoming Deadline: Due soon ({task.dueDate}).</span>
          </div>
        )}

        <input
          className="bp2-panel__title"
          value={task.title}
          disabled={!canEdit}
          onChange={(e) => canEdit && updateTask(task.id, { title: e.target.value })}
        />

        <div className="bp2-panel__field">
          <span className="bp2-panel__label">Status</span>
          <div className="bp2-panel__status-group">
            {columns.map((c) => (
              <button
                key={c.id}
                disabled={!canMove}
                className={`bp2-panel__status-btn ${task.columnId === c.id ? "bp2-panel__status-btn--active" : ""}`}
                onClick={() => handleColumnChange(c.id)}
              >
                {c.title}
              </button>
            ))}
          </div>
          {!canMove && <span className="bp2-panel__hint">Only the owner or assignee can move this card.</span>}
        </div>

        <div className="bp2-panel__field">
          <span className="bp2-panel__label">Assignee</span>
          {canEdit ? (
            <>
              <select
                className="bp2-panel__input"
                value={task.assigneeId || ""}
                onChange={(e) => handleAssigneeChange(e.target.value)}
              >
                {members.map((m) => {
                  const rec = recommendations.find((r) => r.id === m.id);
                  const label = rec
                    ? `${m.name} ${rec.isRecommended ? "⭐ (Recommended · " : "("}${rec.pendingTasksCount} pending)`
                    : m.name;
                  return (
                    <option key={m.id} value={m.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
              {recommendations.find((r) => r.isRecommended) && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#a78bfa",
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  ✨ Recommended: {recommendations.find((r) => r.isRecommended).name} ({recommendations.find((r) => r.isRecommended).recommendationReason})
                </span>
              )}
            </>
          ) : (
            <div className="bp2-panel__assignee">
              <UserAvatar user={members.find((m) => m.id === task.assigneeId || m.name === task.assignee)} name={task.assignee} size={26} className="bp2-panel__avatar" />
              {task.assignee}
            </div>
          )}
        </div>

        <div className="bp2-panel__field">
          <span className="bp2-panel__label">Due date</span>
          <input
            className="bp2-panel__input"
            value={task.dueDate}
            disabled={!canEdit}
            onChange={(e) => canEdit && updateTask(task.id, { dueDate: e.target.value })}
          />
        </div>

        <div className="bp2-panel__field">
          <span className="bp2-panel__label">Description</span>
          <textarea
            className="bp2-panel__textarea"
            placeholder="Add more detail about this task…"
            value={task.description || ""}
            disabled={!canEdit}
            onChange={(e) => canEdit && updateTask(task.id, { description: e.target.value })}
            rows={4}
          />
        </div>

        {/* Attachments & File Sharing Section */}
        <div className="bp2-panel__field" style={{ marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span className="bp2-panel__label" style={{ margin: 0 }}>
              Attachments ({task.attachments?.length || 0})
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md,.zip,.png,.jpg,.jpeg,.gif,.webp,.svg"
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(139, 111, 242, 0.15)",
                border: "1px solid rgba(139, 111, 242, 0.3)",
                color: "#a78bfa",
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: isUploading ? "not-allowed" : "pointer",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              {isUploading ? "Uploading..." : "Attach File"}
            </button>
          </div>

          {(!task.attachments || task.attachments.length === 0) ? (
            <div
              style={{
                border: "1px dashed rgba(255, 255, 255, 0.12)",
                borderRadius: 8,
                padding: "16px 12px",
                textAlign: "center",
                color: "#94a3b8",
                fontSize: 12,
              }}
            >
              No documents attached yet. Click "Attach File" to share PDFs, spreadsheets, or specs.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {task.attachments.map((att) => {
                const fullUrl = att.url?.startsWith("http") ? att.url : `${BASE_URL}${att.url}`;
                const canDeleteAtt = isOwner || (att.uploadedBy && att.uploadedBy === currentUserId);

                return (
                  <div
                    key={att.id || att.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: 8,
                      padding: "8px 12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 18 }}>{getFileIcon(att.name)}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={att.name}
                          style={{
                            color: "#93c5fd",
                            fontSize: 12.5,
                            fontWeight: 500,
                            textDecoration: "none",
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={`Download ${att.name}`}
                        >
                          {att.name}
                        </a>
                        <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>
                          {formatBytes(att.size)} • {att.uploadedByName || "Team Member"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={att.name}
                        title="Download file"
                        style={{
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 4,
                          borderRadius: 4,
                          background: "rgba(255,255,255,0.06)",
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </a>
                      {canDeleteAtt && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          title="Remove attachment"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: 4,
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {canEdit && (
          <button className="bp2-panel__delete" onClick={handleDelete}>
            Delete task
          </button>
        )}
      </motion.div>
    </>
  );
}

export default TaskDetailPanel;