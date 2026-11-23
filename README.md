# TeamSync – Smart Team Collaboration and Project Management System

> "TeamSync is a smart team collaboration and project management platform designed to help teams organize projects, manage tasks, communicate efficiently, track deadlines and monitor productivity through a centralized workspace."

---

## 1. Project Introduction

**TeamSync** is an enterprise-grade, real-time, offline-first team collaboration and project management system developed as a Master of Computer Applications (MCA) final-year capstone project. 

Modern agile software engineering teams require dynamic workspaces where task management, real-time team communication, document sharing, and workload distribution work in synergy without friction. TeamSync addresses this by providing an intuitive digital workspace that combines interactive Kanban visualization, real-time multi-client updates via WebSockets, offline persistence via client-side replication, and optimistic concurrency control to prevent data collisions.

---

## 2. Problem Statement

Collaborative software teams face several critical operational challenges when relying on traditional project management software:

1. **Tool Fragmentation:** Teams frequently alternate between disconnected tools for task tracking, instant messaging, file sharing, and project metrics, leading to context switching and lost productivity.
2. **Offline Data Vulnerability:** Field engineers, remote workers, and traveling team members frequently encounter unstable network conditions. Most existing tools fail completely or lock users out when offline.
3. **Simultaneous Update Collisions:** When multiple team members concurrently update the same task or board column, typical systems apply a naive "last write wins" policy, silently overwriting teammate edits.
4. **Unbalanced Workload Allocation:** Project managers often lack immediate visibility into active task burdens, leading to uneven sprint task distributions, burnout, and missed delivery milestones.

---

## 3. Project Objectives

- **Centralized Project Hub:** Unify board management, task workflows, team communication, and member roles into a single cohesive interface.
- **Real-Time Collaboration:** Ensure instant bi-directional updates across all connected clients via Socket.IO whenever tasks are created, moved, edited, or deleted.
- **Offline-First Resilience:** Enable full read/write functionality with zero network connectivity using client-side PouchDB (IndexedDB), synchronizing seamlessly upon reconnection.
- **Strict Concurrency Control:** Enforce version-based optimistic concurrency control (OCC) to detect and safely resolve conflicting simultaneous edits.
- **Role-Based Access Governance:** Provide granular permissions distinguishing project/board owners from assigned members.

---

## 4. Key Features & Implementation Status

TeamSync is built around eight foundational features. The current implementation status of each module is accurately outlined below:

| # | Feature | Status | Description |
|---|---|---|---|
| 1 | **Live Kanban Board** | **Implemented** | Interactive drag-and-drop task board with instant updates across all active team members via Socket.IO and live presence tracking. |
| 2 | **Team Chat** | **Implemented** | Real-time project-wise communication via Socket.IO (`chat:message`), REST fallback (`/api/boards/:id/chat`), persistent MongoDB history, unread message badges, and responsive sliding drawer UI. |
| 3 | **Smart Task Assignment** | **Implemented** | Workload recommendation engine analyzing active/pending tasks per member (`/api/boards/:id/smart-assignment`), auto-selecting lowest-workload members with visual UI recommendation badges. |
| 4 | **Deadline Alerts** | **Implemented** | Automated deadline checking engine, upcoming deadline alerts (<24h), overdue task alerts, in-app bell notifications, and real-time visual urgency badges on Kanban cards. |
| 5 | **Workload Analytics** | **Implemented** | Comprehensive visual reports and charts displaying employee productivity, task distribution across team members, completion velocity, and pending backlogs (`/api/analytics/workspace` and `/api/boards/:id/analytics`). |
| 6 | **File Sharing** | **Implemented** | Upload documents (PDF, Word, Excel, text, images, archives) and attach assets to tasks (`/api/tasks/:id/attachments`) with Cloudinary storage, local disk fallback, file size/type validation, download links, and delete controls. |
| 7 | **Conflict Resolution** | **Implemented** | Optimistic concurrency control (OCC) using strict integer versioning (`409 Conflict`), featuring an interactive conflict-resolution modal. |
| 8 | **Offline Synchronization** | **Implemented** | Local client-side PouchDB storage (IndexedDB), offline status detection, floating dynamic status banner with manual 'Sync Now' control, background queue polling, and live change-feed reconciliation. |

---

## 5. Technology Stack

### Frontend Architecture
- **Core Library:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Animations & Layout Transitions:** [Framer Motion](https://www.framer.com/motion/)
- **Offline Storage:** [PouchDB Browser](https://pouchdb.com/) (IndexedDB adapter)
- **Real-Time Client:** [Socket.IO Client](https://socket.io/)
- **Iconography:** [Lucide React](https://lucide.dev/)
- **Testing:** [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/)

### Backend Architecture
- **Runtime Environment:** [Node.js](https://nodejs.org/) (ES Modules)
- **Web Framework:** [Express.js](https://expressjs.com/)
- **Database & ODM:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Real-Time Engine:** [Socket.IO](https://socket.io/)
- **Authentication:** [JSON Web Tokens (JWT)](https://jwt.io/) & [Bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
- **Data Validation:** [Zod](https://zod.dev/)
- **Cloud Media Storage:** [Cloudinary SDK](https://cloudinary.com/) (configured)
- **Background Jobs:** [Node-Cron](https://github.com/node-cron/node-cron)
- **Email Delivery:** [Nodemailer](https://nodemailer.com/) (dev console fallback & SMTP)
- **Testing:** [Jest](https://jestjs.io/) & [Supertest](https://github.com/ladjs/supertest)

---

## 6. System Architecture

TeamSync employs a hybrid **REST + WebSocket + Offline Replication** architecture. Express and Socket.IO share a single unified HTTP server instance to simplify networking and local proxy routing.

```
                           +------------------------------------------+
                           |           TeamSync Web Client            |
                           |   (React 19 + Framer Motion + Vite)      |
                           +--------------------+---------------------+
                                                |
                     +--------------------------+--------------------------+
                     | Local Write (Optimistic)                            | REST API (HTTP)
                     v                                                     v
          +--------------------+                               +-----------------------+
          |  PouchDB Store     |                               | Express API Server    |
          |  (IndexedDB local) |                               | (Controllers/Services)|
          +---------+----------+                               +-----------+-----------+
                    |                                                      |
                    | Background Sync Loop                                 | Mongoose
                    +------------------------> [HTTP PATCH /api/tasks] ----+
                                                        |                  v
                                                        |        +-------------------+
                                                        |        | MongoDB Database  |
                                                        |        | (Collections)     |
                                                        |        +-------------------+
                                                        |
                                                        v
                                            +-----------------------+
                                            |   Socket.IO Server    |
                                            | (Rooms: board:<id>)   |
                                            +-----------+-----------+
                                                        |
                                                        | Real-Time Broadcast
                                                        v (task:updated, etc.)
                                            +-----------------------+
                                            | Other Active Clients  |
                                            | (Live Kanban Updates) |
                                            +-----------------------+
```

### Key Architectural Highlights
1. **Single HTTP Server Sharing:** Express and Socket.IO attach to the same HTTP server (`src/server.js`), eliminating CORS and port conflicts in local development and production.
2. **Optimistic UI with PouchDB:** When a user drags a task card, changes write to local PouchDB first. The UI updates instantaneously via PouchDB's `.changes()` feed before the network request finishes.
3. **Optimistic Concurrency Control (OCC):** Every task document has an integer `version`. The server increments this on each mutation. If a client attempts to update a task with a stale version, the server rejects it with `409 Conflict`, triggering the interactive conflict-resolution interface.
4. **Scoped Socket Rooms:** Socket connections are authenticated via JWT during the handshake and scoped strictly to `board:<boardId>` rooms. Sockets only receive updates for boards they own or belong to.

---

## 7. Project Modules

```
TeamSync/
├── backend/                  # Express REST API & Socket.IO server
│   ├── src/
│   │   ├── config/           # Cloudinary & environment configuration
│   │   ├── controllers/      # Route request/response handlers
│   │   ├── db/               # MongoDB connection lifecycle
│   │   ├── jobs/             # Scheduled background jobs (weekly summary)
│   │   ├── middleware/       # JWT auth, error handlers, request loggers
│   │   ├── models/           # Mongoose schemas (User, Board, Task, ChatMessage, Activity, Notification)
│   │   ├── repositories/     # Data access abstraction layer
│   │   ├── routes/           # REST endpoint definitions
│   │   ├── schemas/          # Zod validation schemas
│   │   ├── services/         # Core business logic
│   │   ├── sockets/          # Socket.IO connection & room management
│   │   └── utils/            # JWT, email service, error helpers
│   └── tests/                # Jest integration and socket tests
│
├── frontend/                 # React 19 single-page application
│   ├── src/
│   │   ├── api/              # Fetch API wrappers for REST endpoints
│   │   ├── components/       # Reusable UI components (Board, Column, TaskCard, TeamChat, etc.)
│   │   ├── context/          # Context providers (Auth, Boards, Tasks, Socket, Users)
│   │   ├── db/               # Local PouchDB instance & background sync loop
│   │   ├── pages/            # View pages (BoardPage, Dashboard, MyTasks, Team, Auth)
│   │   ├── styles/           # CSS design systems (light/dark themes, teamChat.css)
│   │   └── utils/            # Formatting and column utilities
│   └── index.html            # Application entry point
│
└── docs/                     # Architectural, API contract & deployment documentation
```

### Module Breakdown:
1. **Authentication & Profile Module:** Secure registration, login, JWT token management, password reset flow, and avatar management.
2. **Board & Project Management Module:** Creation, editing, and deletion of project boards with customizable columns and member invitation acceptance flows.
3. **Live Kanban Engine:** Column drag-over indicators, Framer Motion card animations, and instant real-time synchronization across team members.
4. **Team Chat Module:** Real-time project-wise communication via Socket.IO (`chat:message`), REST history endpoints, unread badge notifications, and modern drawer interface.
5. **Offline Synchronization & OCC Engine:** Local IndexedDB caching, background polling fallback, queue processing, and conflict detection.
5. **Team & Collaboration Module:** Member invitations, role permissions (owner vs assignee), activity audit trail, and presence indicators.

---

## 8. Installation & Setup Instructions

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **MongoDB:** Community Server v7.0 or v9.0 installed locally and running on port `27017` (or a MongoDB Atlas connection string)
- **Operating System:** Windows 10/11, macOS, or Linux

### Clone Repository

```powershell
git clone https://github.com/Vikram-MS-git/TeamSync-project.git
cd TeamSync-project
```

---

## 9. MongoDB & Environment Configuration

### Backend Configuration (`backend/.env`)

Copy `.env.example` in `backend` to `.env`:

```powershell
cd backend
Copy-Item .env.example .env
```

Ensure the configuration matches your local setup:

```ini
PORT=4000
CLIENT_ORIGIN=http://localhost:5173

# Secret key for JWT session tokens
JWT_SECRET=teamsync_dev_secret_2026_change_this_to_a_random_value

# MongoDB Connection String
MONGODB_URI=mongodb://127.0.0.1:27017/teamsync

# Email Configuration (Optional - dev mode logs to console automatically)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=TeamSync <no-reply@teamsync.dev>

# Cloudinary Storage (Optional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

> **Security Note:** Never commit actual production credentials or private keys to source control.

---

## 10. Execution Guide (Windows PowerShell)

### Step 1: Install Dependencies

Open a PowerShell terminal and install packages for both backend and frontend:

```powershell
# Install Backend Dependencies
cd backend
npm.cmd install

# Install Frontend Dependencies
cd ../frontend
npm.cmd install
```

### Step 2: Start the Backend Server

```powershell
cd backend
npm.cmd run dev
```

*Expected output:*
```
API listening on http://localhost:4000
MongoDB connected
Weekly summary job scheduled (Mondays 08:00).
```

### Step 3: Start the Frontend Application

Open a second PowerShell terminal:

```powershell
cd frontend
npm.cmd run dev
```

*Expected output:*
```
  VITE v8.2.0  ready in 320 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 4: Access Application
Open `http://localhost:5173` in your browser. Register a new user account or log in with the initial test credentials:
- **Email:** `greenlanterns@gmail.com`
- **Password:** `password123`

---

## 11. Testing & Verification

TeamSync includes automated unit and integration tests across both frontend and backend.

### Run Backend Tests (Jest)
```powershell
cd backend
npm.cmd test -- tests/sockets.test.js
npm.cmd test -- tests/tasks.test.js
```
*Coverage includes:* JWT handshake authentication, board room scoping, `task:created`/`task:updated`/`task:deleted` broadcasts, presence updates, and optimistic concurrency version conflict rejections.

### Run Frontend Tests (Vitest)
```powershell
cd frontend
npm.cmd test
```
*Coverage includes:* TaskCard rendering, TeamPage member invitations, and TaskConflictBanner conflict resolution.

---

## 12. Screenshots Section

| View | Description | Preview Placeholder |
|---|---|---|
| **Login & Signup** | Secure JWT authentication with animated showcase panel | `![TeamSync Auth](docs/screenshots/auth.png)` |
| **Live Kanban Board** | Real-time columns, drag-and-drop cards, and presence indicators | `![TeamSync Board](docs/screenshots/board.png)` |
| **Task Drawer & Details** | Full task inspector with status, assignee, and due date | `![TeamSync Task Detail](docs/screenshots/task_detail.png)` |
| **Conflict Resolution** | Visual comparison banner when concurrent edits are detected | `![TeamSync Conflict](docs/screenshots/conflict.png)` |
| **Team Management** | Team member roster with invitation management | `![TeamSync Team](docs/screenshots/team.png)` |

*(Place screenshots into the `docs/screenshots/` folder to view rendered previews.)*

---

## 13. Future Enhancements Roadmap

- [ ] **Phase 1 (Finalizing):** Team Chat with real-time project-wise communication channels and notification badges.
- [ ] **Phase 2:** Smart Task Assignment algorithm balancing workload based on member active task counts.
- [ ] **Phase 2:** Proactive deadline alert popups and email triggers for overdue tasks.
- [ ] **Phase 3:** Workload Analytics dashboard featuring task velocity, completion distributions, and productivity charts.
- [ ] **Phase 3:** Task attachment file sharing with Cloudinary document viewers.
- [ ] **Phase 4:** Advanced PouchDB multi-master conflict resolution and offline queue auditing.

---

## 14. Conclusion

**TeamSync** demonstrates the implementation of a modern, resilient collaboration system. By marrying the immediacy of WebSockets with the reliability of offline-first PouchDB and optimistic concurrency control, TeamSync guarantees that team members can collaborate seamlessly without risk of data loss or workflow interruption. The project fulfills all academic MCA capstone criteria and exemplifies industry-standard software design patterns.

---

**Developed for Master of Computer Applications (MCA) Project**  
*Repository:* [https://github.com/Vikram-MS-git/TeamSync-project](https://github.com/Vikram-MS-git/TeamSync-project)
