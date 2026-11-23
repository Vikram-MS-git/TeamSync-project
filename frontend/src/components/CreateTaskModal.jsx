// CreateTaskModal.jsx
import { useState, useEffect, useRef } from "react";
import { useTasksActions } from "../context/TasksContext";
import { useToast } from "../context/ToastContext";
import { fetchSmartAssignment } from "../api/boards";
import DateTimePicker from "./DateTimePicker";
import { AUTH_BG } from "../assets/cdn.js";

function CreateTaskModal({ isOpen, onClose, boardId, columns = [], members = [], defaultColumnId }) {
  const { addTask } = useTasksActions();
  const showToast = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState(defaultColumnId || columns[0]?.id || "");
  const [assigneeId, setAssigneeId] = useState(members[0]?.id || "");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setDescription("");
    setColumnId(defaultColumnId || columns[0]?.id || "");
    setDueDate("");
    setIsSubmitting(false);

    // Fetch Smart Task Assignment recommendations based on current workloads
    if (boardId) {
      fetchSmartAssignment(boardId)
        .then((recs) => {
          if (Array.isArray(recs)) {
            setRecommendations(recs);
            const topRec = recs.find((r) => r.isRecommended);
            if (topRec) {
              setAssigneeId(topRec.id);
            } else if (members[0]?.id) {
              setAssigneeId(members[0].id);
            }
          }
        })
        .catch(() => {
          setRecommendations([]);
          if (members[0]?.id) setAssigneeId(members[0].id);
        });
    } else if (members[0]?.id) {
      setAssigneeId(members[0].id);
    }

    // Focus the title field once the modal has actually mounted.
    const t = setTimeout(() => titleRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [isOpen, defaultColumnId, columns, members, boardId]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canSubmit = title.trim() && columnId && assigneeId && !isSubmitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    const assigneeName = members.find((m) => m.id === assigneeId)?.name || "";
    try {
      await addTask({
        columnId,
        title,
        boardId,
        assigneeId,
        assigneeName,
        dueDate,
        description,
      });
      showToast(`Added "${title.trim()}"`, "success");
      onClose();
    } catch (err) {
      showToast(err.message || "Couldn't create the task", "error");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="bp2-modal-backdrop" onClick={onClose} />
      <div className="bp2-modal" role="dialog" aria-modal="true" aria-label="Create task">
        <form className="bp2-modal__card" onSubmit={handleSubmit}>
          <div className="bp2-modal__card-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
          <div className="bp2-modal__card-overlay" aria-hidden="true" />
          <div className="bp2-modal__card-glow" aria-hidden="true" />
          <div className="bp2-modal__header">
            <h2 className="bp2-modal__title">New task</h2>
            <button type="button" className="bp2-modal__close" onClick={onClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="bp2-modal__body">
            <div className="bp2-modal__field">
              <label className="bp2-modal__label" htmlFor="task-title">Title</label>
              <input
                id="task-title"
                ref={titleRef}
                className="bp2-modal__input"
                placeholder="e.g. Design the empty-state illustration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="bp2-modal__field">
              <label className="bp2-modal__label" htmlFor="task-description">Description</label>
              <textarea
                id="task-description"
                className="bp2-modal__textarea"
                placeholder="Add more detail about this task… (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Smart Task Assignment Recommendation Banner */}
            {recommendations.find((r) => r.isRecommended) && (
              <div
                className="bp2-modal__smart-rec"
                style={{
                  background: "linear-gradient(135deg, rgba(139, 111, 242, 0.14) 0%, rgba(99, 102, 241, 0.14) 100%)",
                  border: "1px solid rgba(139, 111, 242, 0.3)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  fontSize: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>✨</span>
                  <span>
                    <strong style={{ color: "#a78bfa" }}>Smart Recommendation: </strong>
                    <strong>{recommendations.find((r) => r.isRecommended).name}</strong>{" "}
                    <span style={{ opacity: 0.85 }}>({recommendations.find((r) => r.isRecommended).recommendationReason})</span>
                  </span>
                </div>
                {assigneeId !== recommendations.find((r) => r.isRecommended).id && (
                  <button
                    type="button"
                    style={{
                      background: "#8b6ff2",
                      color: "#fff",
                      border: "none",
                      padding: "3px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                    onClick={() => setAssigneeId(recommendations.find((r) => r.isRecommended).id)}
                  >
                    Select
                  </button>
                )}
              </div>
            )}

            <div className="bp2-modal__row">
              <div className="bp2-modal__field">
                <label className="bp2-modal__label" htmlFor="task-status">Status</label>
                <select
                  id="task-status"
                  className="bp2-modal__input"
                  value={columnId}
                  onChange={(e) => setColumnId(e.target.value)}
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bp2-modal__field">
                <label className="bp2-modal__label" htmlFor="task-assignee">Assignee</label>
                <select
                  id="task-assignee"
                  className="bp2-modal__input"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                >
                  {members.length === 0 && <option value="">No members yet</option>}
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
              </div>
            </div>

            <div className="bp2-modal__field">
              <label className="bp2-modal__label" htmlFor="task-due">Due date &amp; time</label>
              <DateTimePicker value={dueDate} onChange={setDueDate} />
            </div>
          </div>

          <div className="bp2-modal__footer">
            <button type="button" className="bp2-modal__btn bp2-modal__btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="bp2-modal__btn bp2-modal__btn--primary" disabled={!canSubmit}>
              {isSubmitting ? "Adding…" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default CreateTaskModal;