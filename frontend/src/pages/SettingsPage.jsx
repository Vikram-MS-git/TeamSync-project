import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  User,
  Mail,
  Camera,
  Trash2,
  Moon,
  Sun,
  Globe,
  Calendar,
  Bell,
  Command,
  Download,
  LogOut,
  AlertTriangle,
  Check,
  ShieldAlert,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TasksContext";
import { useToast } from "../context/ToastContext";
import { useBoards } from "../context/BoardsContext";
import { useUsers } from "../context/UsersContext";
import { updateMyPreferences, uploadAvatarFile, updateAvatarUrl } from "../api/users.js";
import { AUTH_BG } from "../assets/cdn.js";
import UserAvatar from "../components/UserAvatar.jsx";
import ImageCropModal from "../components/ImageCropModal.jsx";
import "../styles/boardPageV2.css";

const SHORTCUTS = [
  { keys: "/", action: "Focus Quick Search" },
  { keys: "N", action: "Create new task on board" },
  { keys: "Esc", action: "Close modal / drawer" },
  { keys: "Ctrl + B", action: "Navigate to Project Boards" },
  { keys: "Ctrl + D", action: "Navigate to Dashboard" },
  { keys: "Ctrl + T", action: "Navigate to My Tasks" },
];

function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, logout, updateUser } = useAuth();
  const mockTasks = useTasks();
  const { boards } = useBoards();
  const { users } = useUsers();
  const showToast = useToast();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [selectedImageSrc, setSelectedImageSrc] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);

  const [emailNotifs, setEmailNotifs] = useState(user?.preferences?.emailNotifs ?? true);
  const [inAppNotifs, setInAppNotifs] = useState(user?.preferences?.inAppNotifs ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(user?.preferences?.weeklyDigest ?? false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("MMM D");

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast("Image size must be smaller than 10MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleCropSave(croppedBlob) {
    setIsUploadingAvatar(true);
    try {
      const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      const updatedUser = await uploadAvatarFile(croppedFile);
      updateUser(updatedUser);
      setIsCropModalOpen(false);
      setSelectedImageSrc(null);
      showToast("Profile picture updated", "success");
    } catch (err) {
      showToast(err.message || "Failed to upload profile picture", "error");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleRemoveAvatar() {
    try {
      const updatedUser = await updateAvatarUrl(null);
      updateUser(updatedUser);
      showToast("Profile picture removed", "info");
    } catch {
      showToast("Failed to remove profile picture", "error");
    }
  }

  function handleSaveAccount(e) {
    e.preventDefault();
    updateUser({ name, email });
    showToast("Account changes saved", "success");
  }

  async function handleTogglePref(key, value, setter) {
    const prev = { emailNotifs, inAppNotifs, weeklyDigest };
    setter(value);
    const next = { ...prev, [key]: value };

    setIsSavingPrefs(true);
    try {
      await updateMyPreferences(next);
      updateUser({ preferences: next });
      showToast("Notification settings updated", "success");
    } catch (err) {
      setter(!value);
      showToast(err.message || "Couldn't save preferences", "error");
    } finally {
      setIsSavingPrefs(false);
    }
  }

  function handleExportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: user,
      boards: boards,
      tasks: mockTasks,
      team: users,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "teamsync-export.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Export downloaded", "success");
  }

  function handleDeleteAccount() {
    if (deleteStep === 0) {
      setDeleteStep(1);
      return;
    }
    logout();
    localStorage.removeItem("collabboard-theme");
    showToast("Account deleted", "info");
    navigate("/login");
  }

  function handleLogout() {
    logout();
    navigate("/login");
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
      <div className="bp2-glow bp2-glow--a" aria-hidden="true" />
      <div className="bp2-glow bp2-glow--b" aria-hidden="true" />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Sparkles size={16} color="#818cf8" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            System &amp; Workspace
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          Settings &amp; Profile
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>
          Manage your personal profile details, notification preferences, display theme, and workspace data.
        </p>
      </div>

      {/* Profile Overview Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 18,
          padding: "24px 28px",
          marginBottom: 28,
          backdropFilter: "blur(16px)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <UserAvatar user={user} size={72} className="settings-header__avatar-img" />
            <label
              htmlFor="settings-avatar-file-input"
              className="settings-avatar-badge"
              title="Upload profile picture"
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
                border: "2px solid #0f172a",
              }}
            >
              <Camera size={13} strokeWidth={2.4} />
            </label>
            <input
              id="settings-avatar-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", margin: 0 }}>
                {user?.name || "Team Member"}
              </h2>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: "rgba(99, 102, 241, 0.15)",
                  color: "#818cf8",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                }}
              >
                Active Account
              </span>
            </div>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "#94a3b8" }}>
              {user?.email || "Manage your account & preferences"}
            </p>
            {isUploadingAvatar && (
              <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 600 }}>
                Uploading profile image…
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <label
            htmlFor="settings-avatar-file-input-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 15px",
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#e2e8f0",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Camera size={14} />
            <span>Change Photo</span>
          </label>
          <input
            id="settings-avatar-file-input-btn"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          {user?.avatarUrl && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 15px",
                borderRadius: 10,
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "#f87171",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Trash2 size={14} />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="settings-grid">
        {/* Left Column */}
        <div className="settings-col">
          {/* Account Information Card */}
          <motion.section
            className="settings-card"
            whileHover={{ y: -2 }}
            style={{
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.75) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 18,
            }}
          >
            <div className="settings-card__header">
              <div
                className="settings-card__icon"
                style={{
                  background: "rgba(99, 102, 241, 0.15)",
                  borderColor: "rgba(99, 102, 241, 0.3)",
                  color: "#818cf8",
                }}
              >
                <User size={18} />
              </div>
              <div>
                <h2 className="settings-card__title">Personal Information</h2>
                <p className="settings-card__subtitle">Update your profile identity and contact email</p>
              </div>
            </div>

            <form className="settings-form" onSubmit={handleSaveAccount}>
              <div className="settings-field">
                <label htmlFor="settings-name">Full Name</label>
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>
              <div className="settings-field">
                <label htmlFor="settings-email">Email Address</label>
                <input
                  id="settings-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 8 }}>
                <button
                  type="submit"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 20px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "#ffffff",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.35)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Check size={15} strokeWidth={2.5} />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </motion.section>

          {/* Appearance & Locale Card */}
          <motion.section
            className="settings-card"
            whileHover={{ y: -2 }}
            style={{
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.75) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 18,
            }}
          >
            <div className="settings-card__header">
              <div
                className="settings-card__icon"
                style={{
                  background: "rgba(139, 92, 246, 0.15)",
                  borderColor: "rgba(139, 92, 246, 0.3)",
                  color: "#a78bfa",
                }}
              >
                <Moon size={18} />
              </div>
              <div>
                <h2 className="settings-card__title">Appearance &amp; Regional</h2>
                <p className="settings-card__subtitle">Configure theme mode, timezone, and calendar formats</p>
              </div>
            </div>

            <div className="settings-form">
              <div className="settings-field">
                <label>Theme Mode</label>
                <div
                  className="settings-theme-pills"
                  style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <button
                    type="button"
                    className={`settings-theme-pill ${theme === "light" ? "settings-theme-pill--active" : ""}`}
                    onClick={() => setTheme("light")}
                  >
                    <Sun size={14} />
                    <span>Light Mode</span>
                  </button>
                  <button
                    type="button"
                    className={`settings-theme-pill ${theme === "dark" ? "settings-theme-pill--active" : ""}`}
                    onClick={() => setTheme("dark")}
                  >
                    <Moon size={14} />
                    <span>Dark SaaS</span>
                  </button>
                </div>
              </div>

              <div className="settings-field-group">
                <div className="settings-field">
                  <label htmlFor="settings-tz">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Globe size={11} />
                      Timezone
                    </span>
                  </label>
                  <select id="settings-tz" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    <option value="UTC">UTC (Universal)</option>
                    <option value="America/New_York">Eastern Time (US)</option>
                    <option value="America/Los_Angeles">Pacific Time (US)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Asia/Kolkata">India (IST +5:30)</option>
                    <option value="Asia/Colombo">Colombo (+5:30)</option>
                    <option value="Asia/Singapore">Singapore (SGT +8)</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label htmlFor="settings-date-format">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Calendar size={11} />
                      Date Format
                    </span>
                  </label>
                  <select
                    id="settings-date-format"
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                  >
                    <option value="MMM D">Aug 21</option>
                    <option value="D/M/YYYY">21/8/2026</option>
                    <option value="M/D/YYYY">8/21/2026</option>
                    <option value="YYYY-MM-DD">2026-08-21 (ISO)</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Right Column */}
        <div className="settings-col">
          {/* Notifications Card */}
          <motion.section
            className="settings-card"
            whileHover={{ y: -2 }}
            style={{
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.75) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 18,
            }}
          >
            <div className="settings-card__header">
              <div
                className="settings-card__icon"
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  color: "#34d399",
                }}
              >
                <Bell size={18} />
              </div>
              <div>
                <h2 className="settings-card__title">Notifications &amp; Alerts</h2>
                <p className="settings-card__subtitle">Choose how and when TeamSync communicates with you</p>
              </div>
            </div>

            <div className="settings-switches">
              <label className="settings-switch">
                <div className="settings-switch__info">
                  <span className="settings-switch__title">Task Assignment</span>
                  <span className="settings-switch__desc">Receive an alert when you are assigned or mentioned</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  disabled={isSavingPrefs}
                  onChange={(e) => handleTogglePref("emailNotifs", e.target.checked, setEmailNotifs)}
                />
                <span className="settings-switch__slider" />
              </label>

              <label className="settings-switch">
                <div className="settings-switch__info">
                  <span className="settings-switch__title">Board &amp; Chat Activity</span>
                  <span className="settings-switch__desc">In-app popups on real-time task moves & team messages</span>
                </div>
                <input
                  type="checkbox"
                  checked={inAppNotifs}
                  disabled={isSavingPrefs}
                  onChange={(e) => handleTogglePref("inAppNotifs", e.target.checked, setInAppNotifs)}
                />
                <span className="settings-switch__slider" />
              </label>

              <label className="settings-switch">
                <div className="settings-switch__info">
                  <span className="settings-switch__title">Weekly Digest</span>
                  <span className="settings-switch__desc">Send a weekly summary report of workload & deliverables</span>
                </div>
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  disabled={isSavingPrefs}
                  onChange={(e) => handleTogglePref("weeklyDigest", e.target.checked, setWeeklyDigest)}
                />
                <span className="settings-switch__slider" />
              </label>
            </div>
          </motion.section>

          {/* Keyboard Shortcuts Card */}
          <motion.section
            className="settings-card"
            whileHover={{ y: -2 }}
            style={{
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.75) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 18,
            }}
          >
            <div className="settings-card__header">
              <div
                className="settings-card__icon"
                style={{
                  background: "rgba(59, 130, 246, 0.15)",
                  borderColor: "rgba(59, 130, 246, 0.3)",
                  color: "#60a5fa",
                }}
              >
                <Command size={18} />
              </div>
              <div>
                <h2 className="settings-card__title">Keyboard Shortcuts</h2>
                <p className="settings-card__subtitle">Accelerate your navigation and workflow</p>
              </div>
            </div>

            <div className="settings-shortcuts-grid">
              {SHORTCUTS.map((s) => (
                <div className="settings-shortcut-row" key={s.action}>
                  <span className="settings-shortcut-action">{s.action}</span>
                  <kbd className="settings-kbd">{s.keys}</kbd>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Account Actions & Danger Zone */}
          <motion.section
            className="settings-card"
            whileHover={{ y: -2 }}
            style={{
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.75) 100%)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: 18,
            }}
          >
            <div className="settings-card__header">
              <div
                className="settings-card__icon settings-card__icon--danger"
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                }}
              >
                <ShieldAlert size={18} />
              </div>
              <div>
                <h2 className="settings-card__title" style={{ color: "#f87171" }}>
                  Account Actions &amp; Security
                </h2>
                <p className="settings-card__subtitle">Data backup, session control, and permanent deletion</p>
              </div>
            </div>

            <div className="settings-danger-list">
              <div className="settings-danger-item">
                <div>
                  <span className="settings-danger-title">Export Workspace Data</span>
                  <span className="settings-danger-desc">Download all boards, tasks, and settings as JSON file</span>
                </div>
                <button
                  type="button"
                  className="settings-btn settings-btn--ghost"
                  onClick={handleExportData}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#e2e8f0",
                  }}
                >
                  <Download size={14} />
                  <span>Export JSON</span>
                </button>
              </div>

              <div className="settings-danger-item">
                <div>
                  <span className="settings-danger-title">Sign Out</span>
                  <span className="settings-danger-desc">End your active authenticated session safely</span>
                </div>
                <button
                  type="button"
                  className="settings-btn settings-btn--ghost"
                  onClick={handleLogout}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#e2e8f0",
                  }}
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>

              <div className="settings-danger-item">
                <div>
                  <span className="settings-danger-title" style={{ color: "#f87171" }}>
                    Delete Account
                  </span>
                  <span className="settings-danger-desc">
                    {deleteStep === 0
                      ? "Permanently purge your account, assignments, and personal records"
                      : "Irreversible action. Click 'Confirm Delete' to proceed"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {deleteStep === 1 && (
                    <button
                      type="button"
                      className="settings-btn settings-btn--ghost"
                      onClick={() => setDeleteStep(0)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        color: "#e2e8f0",
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      borderRadius: 8,
                      background: "rgba(239, 68, 68, 0.2)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      color: "#fca5a5",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <AlertTriangle size={14} />
                    <span>{deleteStep === 0 ? "Delete Account" : "Confirm Delete"}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>

      <AnimatePresence>
        {isCropModalOpen && selectedImageSrc && (
          <ImageCropModal
            imageSrc={selectedImageSrc}
            onClose={() => {
              setIsCropModalOpen(false);
              setSelectedImageSrc(null);
            }}
            onCrop={handleCropSave}
            isUploading={isUploadingAvatar}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SettingsPage;
