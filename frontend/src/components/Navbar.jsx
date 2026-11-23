// frontend/src/components/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  LayoutDashboard,
  Kanban,
  CheckSquare,
  Users,
  Settings,
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  User,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useInvitations, useInvitationsActions } from "../context/InvitationsContext";
import { useNotifications, useNotificationsActions } from "../context/NotificationsContext";
import { useToast } from "../context/ToastContext";
import UserAvatar from "./UserAvatar.jsx";
import "../styles/horizontalNav.css";

const NAV_ITEMS = [
  { label: "Home", to: "/home", Icon: Home },
  { label: "Dashboard", to: "/dashboard", Icon: LayoutDashboard },
  { label: "Boards", to: "/", end: true, Icon: Kanban },
  { label: "My Tasks", to: "/my-tasks", Icon: CheckSquare },
  { label: "Team", to: "/team", Icon: Users },
  { label: "Settings", to: "/settings", Icon: Settings },
];

function timeAgo(isoString) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Navbar({ onOpenSearch }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { invitations = [] } = useInvitations() || {};
  const { respond } = useInvitationsActions() || {};
  const { notifications = [], unreadCount = 0 } = useNotifications() || {};
  const { markRead, markAllRead } = useNotificationsActions() || {};
  const showToast = useToast();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [respondingId, setRespondingId] = useState(null);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const totalBadge = (invitations?.length || 0) + (unreadCount || 0);
  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    setProfileOpen(false);
    logout();
    navigate("/login");
  }

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

  function handleOpenNotification(n) {
    if (!n.read && markRead) markRead(n.id);
    setNotifOpen(false);
    if (n.link) navigate(n.link);
  }

  return (
    <header className="hnav">
      <div className="hnav__inner">
        {/* Left: Brand + Navigation links */}
        <div className="hnav__left">
          <Link to="/home" className="hnav__brand" title="TeamSync Major Project Home">
            <div className="hnav__brand-badge">
              <span>TS</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="hnav__brand-text">TeamSync</span>
              <span className="hnav__brand-tag">Project Hub</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hnav__links" aria-label="Main Navigation">
            {NAV_ITEMS.map(({ label, to, end, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `hnav__link ${isActive ? "hnav__link--active" : ""}`
                }
              >
                <Icon className="hnav__link-icon" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right Section: Search, Theme, Notifications, Profile, Mobile Toggle */}
        <div className="hnav__right">
          {/* Quick Search */}
          <button
            type="button"
            className="hnav__search"
            onClick={onOpenSearch}
            title="Search boards and tasks (Ctrl+K)"
          >
            <Search size={14} />
            <span>Quick search…</span>
            <span className="hnav__search-kbd">{isMac ? "⌘K" : "Ctrl K"}</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            className="hnav__btn"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Notifications Dropdown */}
          <div style={{ position: "relative" }} ref={notifRef}>
            <button
              type="button"
              className="hnav__btn"
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="Notifications"
              title="Notifications & Invitations"
            >
              <Bell size={17} />
              {totalBadge > 0 && <span className="hnav__badge">{totalBadge}</span>}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  className="hnav__dropdown"
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Board Invitations Header */}
                  <div className="hnav__dropdown-header">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="hnav__dropdown-title">Board Invitations</span>
                      {invitations.length > 0 && (
                        <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 700 }}>
                          {invitations.length} pending
                        </span>
                      )}
                    </div>
                  </div>

                  {invitations.length === 0 ? (
                    <div style={{ padding: "8px 12px", fontSize: 12, color: "#94a3b8" }}>
                      No pending board invitations.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                      {invitations.map((inv) => (
                        <div
                          key={inv.id}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            background: "rgba(255, 255, 255, 0.04)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                          }}
                        >
                          <div style={{ fontSize: 12, color: "#f1f5f9", marginBottom: 6 }}>
                            <strong>{inv.invitedByName}</strong> invited you to <strong>{inv.boardName}</strong>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              disabled={respondingId === inv.id}
                              onClick={() => handleRespondInvite(inv.id, "accept", inv.boardName)}
                              style={{
                                flex: 1,
                                padding: "4px 8px",
                                borderRadius: 6,
                                background: "#4f46e5",
                                color: "#fff",
                                border: "none",
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              disabled={respondingId === inv.id}
                              onClick={() => handleRespondInvite(inv.id, "decline", inv.boardName)}
                              style={{
                                flex: 1,
                                padding: "4px 8px",
                                borderRadius: 6,
                                background: "rgba(255, 255, 255, 0.08)",
                                color: "#cbd5e1",
                                border: "none",
                                fontSize: 11.5,
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
                  )}

                  {/* Task & Urgency Notifications Header */}
                  <div className="hnav__dropdown-header" style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="hnav__dropdown-title">Activity &amp; Deadline Alerts</span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllRead}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#818cf8",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ padding: "8px 12px", fontSize: 12, color: "#94a3b8" }}>
                      No new alerts.
                    </div>
                  ) : (
                    <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                      {notifications.slice(0, 10).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleOpenNotification(n)}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                            padding: "8px 10px",
                            borderRadius: 6,
                            background: n.read ? "transparent" : "rgba(99, 102, 241, 0.08)",
                            border: "none",
                            textAlign: "left",
                            cursor: "pointer",
                            width: "100%",
                          }}
                        >
                          {!n.read && (
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#818cf8",
                                marginTop: 6,
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: "#f1f5f9" }}>
                              {n.type === "task_overdue" && (
                                <span style={{ color: "#f87171", fontWeight: 700, marginRight: 4 }}>[Overdue]</span>
                              )}
                              {n.type === "deadline_upcoming" && (
                                <span style={{ color: "#fbbf24", fontWeight: 700, marginRight: 4 }}>[Due Soon]</span>
                              )}
                              {n.message}
                            </div>
                            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                              {timeAgo(n.createdAt)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Menu */}
          <div style={{ position: "relative" }} ref={profileRef}>
            <button
              type="button"
              className="hnav__profile-trigger"
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="Account Menu"
            >
              <UserAvatar user={user} size={28} />
              <span className="hnav__profile-name">{user?.name || "Account"}</span>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  className="hnav__dropdown"
                  style={{ width: 240 }}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="hnav__dropdown-header">
                    <div className="hnav__dropdown-title">{user?.name || "User"}</div>
                    <div className="hnav__dropdown-email">{user?.email || ""}</div>
                  </div>

                  <Link
                    to="/settings"
                    className="hnav__dropdown-item"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Settings size={15} />
                    <span>Account Settings</span>
                  </Link>

                  <Link
                    to="/my-tasks"
                    className="hnav__dropdown-item"
                    onClick={() => setProfileOpen(false)}
                  >
                    <CheckSquare size={15} />
                    <span>My Assigned Tasks</span>
                  </Link>

                  <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "4px 0" }} />

                  <button
                    type="button"
                    className="hnav__dropdown-item hnav__dropdown-item--danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="hnav__mobile-toggle"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="hnav__mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ul className="hnav__mobile-links">
              {NAV_ITEMS.map(({ label, to, end, Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `hnav__mobile-link ${isActive ? "hnav__mobile-link--active" : ""}`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <UserAvatar user={user} size={36} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{user?.name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{user?.email}</div>
                </div>
              </div>
              <button
                type="button"
                className="hnav__dropdown-item hnav__dropdown-item--danger"
                onClick={handleLogout}
                style={{ justifyContent: "center" }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
