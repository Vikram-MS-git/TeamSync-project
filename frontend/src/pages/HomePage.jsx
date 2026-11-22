import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  MessageSquare,
  Sparkles,
  Clock,
  BarChart3,
  Paperclip,
  Shield,
  WifiOff,
  ArrowRight,
  CheckCircle2,
  Layers,
  Activity,
  Globe,
  Sun,
  Moon,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { LOGO_ICON } from "../assets/cdn.js";
import "../styles/homePage.css";

const FEATURES = [
  {
    id: "kanban",
    title: "Live Kanban Board",
    status: "Live",
    statusClass: "hp-card__status-tag--live",
    Icon: Zap,
    description:
      "Interactive drag-and-drop task workflow with sub-50ms Socket.IO real-time updates and live active presence tracking.",
  },
  {
    id: "chat",
    title: "Team Chat",
    status: "Phase 1",
    statusClass: "hp-card__status-tag--planned",
    Icon: MessageSquare,
    description:
      "Real-time project-wise communication channels between team members with persistent conversation history.",
  },
  {
    id: "assignment",
    title: "Smart Task Assignment",
    status: "Phase 2",
    statusClass: "hp-card__status-tag--planned",
    Icon: Sparkles,
    description:
      "Intelligent workload-aware recommendation engine that analyzes pending tasks to suggest the optimal assignee.",
  },
  {
    id: "deadlines",
    title: "Deadline Alerts",
    status: "Active",
    statusClass: "hp-card__status-tag--active",
    Icon: Clock,
    description:
      "Proactive notifications, date/time scheduling, and automated weekly summaries to ensure no milestone is missed.",
  },
  {
    id: "analytics",
    title: "Workload Analytics",
    status: "Phase 3",
    statusClass: "hp-card__status-tag--planned",
    Icon: BarChart3,
    description:
      "Centralized visual charts displaying employee productivity, task completion distribution, and sprint velocity.",
  },
  {
    id: "files",
    title: "File Sharing",
    status: "Active",
    statusClass: "hp-card__status-tag--active",
    Icon: Paperclip,
    description:
      "Cloudinary and Multer powered storage allowing teams to upload documents and attach assets directly to tasks.",
  },
  {
    id: "conflict",
    title: "Conflict Resolution (OCC)",
    status: "Live",
    statusClass: "hp-card__status-tag--live",
    Icon: Shield,
    description:
      "Strict optimistic concurrency control (OCC) preventing simultaneous edits from overwriting newer updates.",
  },
  {
    id: "offline",
    title: "Offline Synchronization",
    status: "Live",
    statusClass: "hp-card__status-tag--live",
    Icon: WifiOff,
    description:
      "Full local IndexedDB persistence via PouchDB. Keep working offline and auto-reconcile seamlessly upon reconnection.",
  },
];

const ARCH_STEPS = [
  {
    step: "1",
    title: "Instant Local PouchDB Write",
    desc: "Every drag, drop, or edit writes immediately to local IndexedDB. The UI updates instantly with zero network delay.",
  },
  {
    step: "2",
    title: "Optimistic Concurrency (OCC)",
    desc: "Background sync PATCHes the server with document integer versions. Concurrent conflicts (409) trigger visual resolution drawers.",
  },
  {
    step: "3",
    title: "WebSocket Broadcast (Socket.IO)",
    desc: "Once confirmed, the server broadcasts domain events to the project board room, updating all online teammates live.",
  },
  {
    step: "4",
    title: "MongoDB Document Ledger",
    desc: "Mongoose models persist boards, tasks, activities, and audit logs reliably in MongoDB.",
  },
];

const COMPARISON = [
  {
    aspect: "Network Disconnections",
    traditional: "App freezes or locks you out entirely with error banners",
    teamsync: "100% functional read/write offline via local PouchDB",
  },
  {
    aspect: "Simultaneous Edits",
    traditional: "Silent 'last write wins' data loss and overwritten work",
    teamsync: "OCC version checking with interactive 3-way merge resolution",
  },
  {
    aspect: "Collaboration Speed",
    traditional: "Requires manual page refresh or slow periodic polling",
    teamsync: "Sub-50ms instant Socket.IO board room event broadcasting",
  },
  {
    aspect: "Workload Balancing",
    traditional: "Blind assignments leading to member burnout and bottlenecks",
    teamsync: "Smart task assignment recommendations based on real capacity",
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="hp-canvas-bg" aria-hidden="true" />

      {/* Navigation Header */}
      <header className="hp-header">
        <Link to="/home" className="hp-header__brand">
          <img src={LOGO_ICON} alt="TeamSync" className="hp-header__logo" />
          <span className="hp-header__title">TeamSync</span>
        </Link>

        <nav className="hp-header__nav">
          <a href="#features" className="hp-header__link">Features</a>
          <a href="#kanban-preview" className="hp-header__link">Live Kanban</a>
          <a href="#architecture" className="hp-header__link">Architecture</a>
          <a href="#comparison" className="hp-header__link">Why TeamSync</a>
        </nav>

        <div className="hp-header__actions">
          <button
            className="hp-btn hp-btn--ghost"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === "dark" ? "Light theme" : "Dark theme"}
            style={{ padding: "8px 12px" }}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {isAuthenticated ? (
            <Link to="/" className="hp-btn hp-btn--primary">
              Go to Workspace <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="hp-btn hp-btn--ghost">
                Log In
              </Link>
              <Link to="/signup" className="hp-btn hp-btn--primary">
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="hp-hero">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="hp-hero__pill"
        >
          <span className="hp-hero__pill-dot" />
          Smart Team Collaboration & Project Management System
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hp-hero__title"
        >
          Where High-Performing Teams{" "}
          <span className="hp-hero__title-gradient">Synchronize, Collaborate & Deliver.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="hp-hero__subtitle"
        >
          TeamSync is a smart team collaboration and project management platform designed to help teams organize projects, manage tasks, communicate efficiently, track deadlines and monitor productivity through a centralized workspace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="hp-hero__actions"
        >
          {isAuthenticated ? (
            <Link to="/" className="hp-btn hp-btn--primary hp-btn--lg">
              Open Workspace <ArrowRight size={18} />
            </Link>
          ) : (
            <Link to="/signup" className="hp-btn hp-btn--primary hp-btn--lg">
              Get Started Free <ArrowRight size={18} />
            </Link>
          )}
          <Link to="/dashboard" className="hp-btn hp-btn--secondary hp-btn--lg">
            <Activity size={18} /> View Analytics Dashboard
          </Link>
        </motion.div>

        {/* Live Kanban Preview Interactive Mock */}
        <motion.div
          id="kanban-preview"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="hp-preview"
        >
          <div className="hp-preview__bar">
            <div className="hp-preview__dots">
              <span className="hp-preview__dot hp-preview__dot--red" />
              <span className="hp-preview__dot hp-preview__dot--yellow" />
              <span className="hp-preview__dot hp-preview__dot--green" />
            </div>
            <div className="hp-preview__title-tag">
              <Layers size={15} /> TeamSync Sprint Board – Product Launch
            </div>
            <div className="hp-preview__live-badge">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
              Live Sync & OCC Active
            </div>
          </div>

          <div className="hp-preview__columns">
            {/* Column 1 */}
            <div className="hp-preview__col">
              <div className="hp-preview__col-header">
                <span className="hp-preview__col-title">
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b6ff2" }} />
                  To Do
                </span>
                <span className="hp-preview__col-badge">2</span>
              </div>
              <div className="hp-preview__card">
                <div className="hp-preview__card-title">Implement WebSocket Chat Rooms</div>
                <div className="hp-preview__card-footer">
                  <div className="hp-preview__card-assignee">
                    <span className="hp-preview__avatar-chip">HJ</span>
                    Hal Jorden
                  </div>
                  <span>Nov 24</span>
                </div>
              </div>
              <div className="hp-preview__card">
                <div className="hp-preview__card-title">Setup Cloudinary Attachment Pipe</div>
                <div className="hp-preview__card-footer">
                  <div className="hp-preview__card-assignee">
                    <span className="hp-preview__avatar-chip" style={{ background: "#38bdf8" }}>VK</span>
                    Vikram
                  </div>
                  <span>Nov 26</span>
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="hp-preview__col">
              <div className="hp-preview__col-header">
                <span className="hp-preview__col-title">
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8" }} />
                  Doing
                </span>
                <span className="hp-preview__col-badge">2</span>
              </div>
              <div className="hp-preview__card" style={{ borderColor: "rgba(139, 111, 242, 0.45)" }}>
                <div className="hp-preview__card-title">Real-Time Drag-and-Drop Sync</div>
                <div className="hp-preview__card-footer">
                  <div className="hp-preview__card-assignee">
                    <span className="hp-preview__avatar-chip" style={{ background: "#10b981" }}>AL</span>
                    Alex
                  </div>
                  <span style={{ color: "#38bdf8", fontWeight: 600 }}>Active</span>
                </div>
              </div>
              <div className="hp-preview__card">
                <div className="hp-preview__card-title">Workload Analytics UI Charts</div>
                <div className="hp-preview__card-footer">
                  <div className="hp-preview__card-assignee">
                    <span className="hp-preview__avatar-chip">HJ</span>
                    Hal Jorden
                  </div>
                  <span>Nov 25</span>
                </div>
              </div>
            </div>

            {/* Column 3 */}
            <div className="hp-preview__col">
              <div className="hp-preview__col-header">
                <span className="hp-preview__col-title">
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                  Done
                </span>
                <span className="hp-preview__col-badge">2</span>
              </div>
              <div className="hp-preview__card">
                <div className="hp-preview__card-title">PouchDB Offline-First Core</div>
                <div className="hp-preview__card-footer">
                  <div className="hp-preview__card-assignee">
                    <span className="hp-preview__avatar-chip" style={{ background: "#10b981" }}>AL</span>
                    Alex
                  </div>
                  <span style={{ color: "#10b981", fontWeight: 600 }}>Done</span>
                </div>
              </div>
              <div className="hp-preview__card">
                <div className="hp-preview__card-title">JWT Authentication & Roles</div>
                <div className="hp-preview__card-footer">
                  <div className="hp-preview__card-assignee">
                    <span className="hp-preview__avatar-chip" style={{ background: "#38bdf8" }}>VK</span>
                    Vikram
                  </div>
                  <span style={{ color: "#10b981", fontWeight: 600 }}>Done</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Eight Features Section */}
      <section id="features" className="hp-section">
        <div className="hp-section__header">
          <div className="hp-section__eyebrow">Enterprise Capability Matrix</div>
          <h2 className="hp-section__title">Engineered with Eight Strategic Pillars</h2>
          <p className="hp-section__desc">
            Everything your team needs to plan sprints, track productivity, collaborate in real time, and eliminate workflow friction.
          </p>
        </div>

        <div className="hp-grid-4">
          {FEATURES.map(({ id, title, status, statusClass, Icon, description }) => (
            <motion.div
              key={id}
              className="hp-card"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <div className="hp-card__icon-box">
                <Icon size={24} />
              </div>
              <span className={`hp-card__status-tag ${statusClass}`}>{status}</span>
              <h3 className="hp-card__title">{title}</h3>
              <p className="hp-card__desc">{description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="hp-section">
        <div className="hp-section__header">
          <div className="hp-section__eyebrow">Technical Architecture</div>
          <h2 className="hp-section__title">Hybrid Real-Time & Offline Sync Loop</h2>
          <p className="hp-section__desc">
            How TeamSync marries the sub-second speed of WebSockets with the bulletproof resiliency of offline client-side replication.
          </p>
        </div>

        <div className="hp-arch-box">
          <div className="hp-arch-grid">
            {ARCH_STEPS.map(({ step, title, desc }) => (
              <div key={step} className="hp-arch-item">
                <div className="hp-arch-item__num">{step}</div>
                <div>
                  <h4 className="hp-arch-item__title">{title}</h4>
                  <p className="hp-arch-item__text">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="hp-section">
        <div className="hp-section__header">
          <div className="hp-section__eyebrow">Why TeamSync</div>
          <h2 className="hp-section__title">Built Different from Conventional Tools</h2>
          <p className="hp-section__desc">
            See how TeamSync eliminates the common data-loss and synchronization pitfalls found in standard project management software.
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="hp-compare-table">
            <thead>
              <tr>
                <th>Workflow Dimension</th>
                <th>Standard Project Tools</th>
                <th>TeamSync Platform</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(({ aspect, traditional, teamsync }) => (
                <tr key={aspect}>
                  <td><strong>{aspect}</strong></td>
                  <td style={{ color: "var(--hp-text-dimmer)" }}>{traditional}</td>
                  <td style={{ color: "#10b981", fontWeight: 600 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle2 size={16} /> {teamsync}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="hp-cta-banner">
        <h2 className="hp-cta-banner__title">Ready to Elevate Your Team's Productivity?</h2>
        <p className="hp-cta-banner__sub">
          Experience seamless real-time Kanban management, intelligent task allocation, and offline resilience with TeamSync.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          {isAuthenticated ? (
            <button onClick={() => navigate("/")} className="hp-btn hp-btn--primary hp-btn--lg">
              Go to Your Workspace <ArrowRight size={18} />
            </button>
          ) : (
            <button onClick={() => navigate("/signup")} className="hp-btn hp-btn--primary hp-btn--lg">
              Start Free Today <ArrowRight size={18} />
            </button>
          )}
          <a
            href="https://github.com/Vikram-MS-git/TeamSync-project"
            target="_blank"
            rel="noopener noreferrer"
            className="hp-btn hp-btn--secondary hp-btn--lg"
          >
            <Globe size={18} /> View GitHub Repository
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="hp-footer">
        <div className="hp-footer__content">
          <div className="hp-footer__brand">
            <img src={LOGO_ICON} alt="" style={{ width: 22, height: 22 }} />
            <span>TeamSync – Smart Team Collaboration and Project Management System</span>
          </div>
          <div className="hp-footer__badge">
            Master of Computer Applications (MCA) Final-Year Capstone Project
          </div>
          <p style={{ margin: 0 }}>
            Designed & Developed with React 19, Node.js, Express, Socket.IO, PouchDB & MongoDB.
          </p>
        </div>
      </footer>
    </div>
  );
}
