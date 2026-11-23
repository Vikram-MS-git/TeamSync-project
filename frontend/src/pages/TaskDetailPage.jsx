
import { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTasks, useTasksActions } from "../context/TasksContext";
import { useBoards } from "../context/BoardsContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fetchBoardMembers } from "../api/boards.js";
import { BASE_URL } from "../api/client.js";
import { avatarColor } from "../utils/avatarColor";
import { getColumns } from "../utils/columns";
import { AUTH_BG } from "../assets/cdn.js";

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

const STATUS_ACCENT = {
  "To Do": "var(--cb-violet)",
  Doing: "var(--cb-sky)",
  Done: "var(--cb-success)",
};

function initials(name) {
  return (name || "?").slice(0, 2).toUpperCase();
}

function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tasks = useTasks();
  const { boards } = useBoards();
  const { user } = useAuth();
  const { updateTask, deleteTask, moveTask, uploadAttachment, removeAttachment } = useTasksActions();
  const showToast = useToast();
  const [members, setMembers] = useState([]);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const task = tasks.find((t) => String(t.id) === id);
  const board = boards.find((b) => b.id === task?.boardId);

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
      // toast in context
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveAttachment(attId) {
    try {
      await removeAttachment(task.id, attId);
    } catch {
      // toast in context
    }
  }

  useEffect(() => {
    if (!board) return;
    let cancelled = false;
    fetchBoardMembers(board.id)
      .then((m) => !cancelled && setMembers(m))
      .catch(() => !cancelled && setMembers([]));
    return () => {
      cancelled = true;
    };
  }, [board]);

  if (!task) {
    return (
      <div className="page-shell bp2">
        <div className="bp2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
        <div className="bp2-bg-overlay" aria-hidden="true" />
        <p style={{ color: "#fff", position: "relative", zIndex: 1 }}>No task found with id "{id}". It may have been deleted.</p>
        <Link to="/my-tasks" className="bp2-back-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to My Tasks
        </Link>
      </div>
    );
  }

  const columns = getColumns(board);
  const currentColumn = columns.find((c) => c.id === task.columnId);

  const isOwner = !!board && board.ownerId === user?.id;
  const isAssignee = task.assigneeId === user?.id;
  const canMove = isOwner || isAssignee;
  const canEdit = isOwner;

  function handleDelete() {
    if (!canEdit) return;
    deleteTask(task.id);
    showToast(`Deleted "${task.title}"`, "success");
    navigate("/my-tasks");
  }

  function handleAssigneeChange(memberId) {
    if (!canEdit) return;
    const name = members.find((m) => m.id === memberId)?.name || "";
    updateTask(task.id, { assigneeId: memberId, assignee: name });
  }

  return (
    <motion.div
      className="page-shell bp2 task-detail-page"
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
        initial={{ opacity: 0, y: 15, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="task-detail-wrap">
        <Link to="/my-tasks" className="back-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to My Tasks
        </Link>

        <div className="task-detail">
        <div className="task-detail__header">
          <span className="task-detail__status-dot" style={{ background: STATUS_ACCENT[currentColumn?.title] || "var(--cb-text-muted)" }} />
          <input
            className="task-detail__title"
            value={task.title}
            disabled={!canEdit}
            onChange={(e) => canEdit && updateTask(task.id, { title: e.target.value })}
          />
          <span className="task-detail__id">#{task.id}</span>
        </div>

        <div className="task-detail__grid">
          <div className="task-detail__field">
            <span className="task-detail__label">Status</span>
            <div className="task-detail__status-group">
              {columns.map((c) => (
                <button
                  key={c.id}
                  disabled={!canMove}
                  className={`task-detail__status-btn ${task.columnId === c.id ? "task-detail__status-btn--active" : ""}`}
                  onClick={() => canMove && moveTask(task.id, c.id)}
                >
                  {c.title}
                </button>
              ))}
            </div>
            {!canMove && <span className="task-panel__hint">Only the owner or assignee can move this card.</span>}
          </div>

          <div className="task-detail__field">
            <span className="task-detail__label">Assignee</span>
            {canEdit ? (
              <div className="task-detail__assignee-group">
                {members.map((m) => (
                  <button
                    key={m.id}
                    className={`task-detail__assignee-btn ${task.assigneeId === m.id ? "task-detail__assignee-btn--active" : ""}`}
                    onClick={() => handleAssigneeChange(m.id)}
                    title={m.name}
                  >
                    <span className="task-detail__assignee-avatar" style={{ background: avatarColor(m.name) }}>
                      {initials(m.name)}
                    </span>
                    {m.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="task-detail__assignee-group">
                <span className="task-detail__assignee-btn task-detail__assignee-btn--active">
                  <span className="task-detail__assignee-avatar" style={{ background: avatarColor(task.assignee) }}>
                    {initials(task.assignee)}
                  </span>
                  {task.assignee}
                </span>
              </div>
            )}
          </div>

          <div className="task-detail__field">
            <span className="task-detail__label">Due date</span>
            <input
              className="task-detail__input"
              value={task.dueDate}
              disabled={!canEdit}
              onChange={(e) => canEdit && updateTask(task.id, { dueDate: e.target.value })}
            />
          </div>
        </div>

        <div className="task-detail__field">
          <span className="task-detail__label">Description</span>
          <textarea
            className="task-detail__textarea"
            placeholder="Add more detail about this task…"
            value={task.description || ""}
            disabled={!canEdit}
            onChange={(e) => canEdit && updateTask(task.id, { description: e.target.value })}
          />
        </div>

        {/* Attachments Section */}
        <div className="task-detail__field" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span className="task-detail__label" style={{ margin: 0 }}>
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
                padding: "5px 12px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: isUploading ? "not-allowed" : "pointer",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
                fontSize: 12.5,
              }}
            >
              No documents attached yet. Click "Attach File" to share documents or assets.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {task.attachments.map((att) => {
                const fullUrl = att.url?.startsWith("http") ? att.url : `${BASE_URL}${att.url}`;
                const canDeleteAtt = isOwner || (att.uploadedBy && att.uploadedBy === user?.id);

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
                      padding: "10px 14px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 20 }}>{getFileIcon(att.name)}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={att.name}
                          style={{
                            color: "#93c5fd",
                            fontSize: 13,
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
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                          {formatBytes(att.size)} • {att.uploadedByName || "Team Member"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
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
                          padding: 5,
                          borderRadius: 4,
                          background: "rgba(255,255,255,0.06)",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                            padding: 5,
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
          <button className="task-detail__delete" onClick={handleDelete}>
            Delete task
          </button>
        )}
        </div>
      </div>
    </motion.div>
  </motion.div>
);
}

export default TaskDetailPage;
