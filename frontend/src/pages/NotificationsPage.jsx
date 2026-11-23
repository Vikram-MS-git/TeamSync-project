// frontend/src/pages/NotificationsPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell,
  Sparkles,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  Mail,
  FolderKanban,
  ExternalLink,
  Filter,
} from "lucide-react";
import { useNotifications, useNotificationsActions } from "../context/NotificationsContext";
import { useInvitations, useInvitationsActions } from "../context/InvitationsContext";
import { useToast } from "../context/ToastContext";
import { AUTH_BG } from "../assets/cdn.js";

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

export default function NotificationsPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { notifications = [], unreadCount = 0 } = useNotifications() || {};
  const { markRead, markAllRead } = useNotificationsActions() || {};
  const { invitations = [] } = useInvitations() || {};
  const { respond } = useInvitationsActions() || {};

  const [activeTab, setActiveTab] = useState("all"); // "all" | "invites" | "alerts" | "unread"
  const [respondingId, setRespondingId] = useState(null);

  async function handleRespondInvite(id, action, boardName) {
    setRespondingId(id);
    try {
      if (respond) {
        await respond(id, action);
        showToast(action === "accept" ? `Joined "${boardName}"` : `Declined "${boardName}"`, "success");
      }
    } catch (err) {
      showToast(err.message || "Failed to respond to invite", "error");
    } finally {
      setRespondingId(null);
    }
  }

  function handleNotificationClick(n) {
    if (!n.read && markRead) {
      markRead(n.id);
    }
    if (n.link) {
      navigate(n.link);
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.read;
    if (activeTab === "alerts") return n.type === "task_overdue" || n.type === "deadline_upcoming";
    return true;
  });

  return (
    <motion.div
      className="page-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        padding: "32px 24px",
        maxWidth: 1100,
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
              Alerts &amp; Activity
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            Notifications Center
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>
            Review pending project invitations, deadline alerts, and task activity updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 10,
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              color: "#818cf8",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <CheckCheck size={16} />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Pending Board Invitations (Hero Banner if any exist) */}
      {invitations.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 24,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Mail size={18} color="#818cf8" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              Pending Board Invitations ({invitations.length})
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {invitations.map((inv) => (
              <div
                key={inv.id}
                style={{
                  background: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 12,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc", marginBottom: 4 }}>
                    {inv.boardName}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    Invited by <strong style={{ color: "#cbd5e1" }}>{inv.invitedByName}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    disabled={respondingId === inv.id}
                    onClick={() => handleRespondInvite(inv.id, "accept", inv.boardName)}
                    style={{
                      flex: 1,
                      padding: "7px 12px",
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      color: "#fff",
                      border: "none",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    Accept Invite
                  </button>
                  <button
                    type="button"
                    disabled={respondingId === inv.id}
                    onClick={() => handleRespondInvite(inv.id, "decline", inv.boardName)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#cbd5e1",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          background: "rgba(17, 24, 39, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 12,
          padding: 4,
          marginBottom: 20,
          width: "fit-content",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          style={{
            padding: "7px 14px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "all" ? "rgba(99, 102, 241, 0.2)" : "transparent",
            color: activeTab === "all" ? "#fff" : "#94a3b8",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          All Activity ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          style={{
            padding: "7px 14px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "unread" ? "rgba(99, 102, 241, 0.2)" : "transparent",
            color: activeTab === "unread" ? "#fff" : "#94a3b8",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("alerts")}
          style={{
            padding: "7px 14px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "alerts" ? "rgba(99, 102, 241, 0.2)" : "transparent",
            color: activeTab === "alerts" ? "#fff" : "#94a3b8",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Deadlines &amp; Overdue
        </button>
      </div>

      {/* Notifications List */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {filteredNotifications.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#94a3b8" }}>
            <Bell size={36} color="#818cf8" style={{ margin: "0 auto 12px", opacity: 0.6 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", margin: "0 0 6px" }}>
              No Notifications Found
            </h3>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
              You are all caught up! New assignment alerts and deadline notices will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredNotifications.map((n, idx) => {
              const isOverdue = n.type === "task_overdue";
              const isDueSoon = n.type === "deadline_upcoming";

              return (
                <div
                  key={n.id || idx}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                    background: n.read ? "transparent" : "rgba(99, 102, 241, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    cursor: n.link ? "pointer" : "default",
                    transition: "background 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: isOverdue
                          ? "rgba(239, 68, 68, 0.15)"
                          : isDueSoon
                          ? "rgba(245, 158, 11, 0.15)"
                          : "rgba(99, 102, 241, 0.15)",
                        border: isOverdue
                          ? "1px solid rgba(239, 68, 68, 0.3)"
                          : isDueSoon
                          ? "1px solid rgba(245, 158, 11, 0.3)"
                          : "1px solid rgba(99, 102, 241, 0.3)",
                        color: isOverdue ? "#f87171" : isDueSoon ? "#fbbf24" : "#818cf8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isOverdue ? (
                        <AlertTriangle size={18} />
                      ) : isDueSoon ? (
                        <Clock size={18} />
                      ) : (
                        <Bell size={18} />
                      )}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        {isOverdue && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "rgba(239, 68, 68, 0.2)",
                              color: "#f87171",
                              textTransform: "uppercase",
                            }}
                          >
                            Overdue
                          </span>
                        )}
                        {isDueSoon && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "rgba(245, 158, 11, 0.2)",
                              color: "#fbbf24",
                              textTransform: "uppercase",
                            }}
                          >
                            Due Soon
                          </span>
                        )}
                        <span style={{ fontSize: 13.5, fontWeight: n.read ? 500 : 700, color: "#f8fafc" }}>
                          {n.message}
                        </span>
                      </div>
                      <span style={{ fontSize: 11.5, color: "#94a3b8" }}>
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {!n.read && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#818cf8",
                          boxShadow: "0 0 8px rgba(129, 140, 248, 0.8)",
                        }}
                      />
                    )}
                    {n.link && <ExternalLink size={14} color="#94a3b8" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
