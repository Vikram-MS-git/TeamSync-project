import request from "supertest";
import app from "../src/app.js";
import { Board } from "../src/models/Board.js";
import { Task } from "../src/models/Task.js";
import { Notification } from "../src/models/Notification.js";
import { checkAndTriggerDeadlineAlerts, parseDueDate } from "../src/services/notificationService.js";
import { connectTestDb, clearTestDb, closeTestDb } from "./setup/db.js";

function authHeader(token) {
  return `Bearer ${token}`;
}

async function registerUser(overrides = {}) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Test User",
      email: `user-${Date.now()}-${Math.random()}@teamsync.dev`,
      password: "atleast8chars",
      ...overrides,
    });
  return { token: res.body.token, user: res.body.user };
}

async function createBoard(token, overrides = {}) {
  const res = await request(app)
    .post("/api/boards")
    .set("Authorization", authHeader(token))
    .send({ name: "Deadline Board", ...overrides });
  return res.body;
}

describe("Deadline Alerts & Urgency Notification Engine", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe("parseDueDate helper", () => {
    it("parses valid ISO and formatted date strings", () => {
      const iso = parseDueDate("2026-12-25T10:00:00.000Z");
      expect(iso).toBeInstanceOf(Date);
      expect(iso.getUTCFullYear()).toBe(2026);

      const monthDay = parseDueDate("Aug 15");
      expect(monthDay).toBeInstanceOf(Date);
      expect(monthDay.getMonth()).toBe(7); // August is month index 7
    });

    it("returns null for empty or invalid strings", () => {
      expect(parseDueDate("")).toBeNull();
      expect(parseDueDate("No date")).toBeNull();
      expect(parseDueDate("random-text-xyz")).toBeNull();
    });
  });

  describe("checkAndTriggerDeadlineAlerts", () => {
    it("creates overdue and upcoming alerts, but skips completed tasks", async () => {
      const { token, user } = await registerUser({ name: "Deadline Tester" });
      const board = await createBoard(token);

      const todoColId = board.columns.find((c) => c.title === "To Do").id;
      const doneColId = board.columns.find((c) => c.title === "Done").id;

      // 1. Overdue task (yesterday)
      const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      await Task.create({
        title: "Overdue Project Report",
        boardId: board.id,
        columnId: todoColId,
        assigneeId: user.id,
        assignee: user.name,
        dueDate: yesterday,
      });

      // 2. Upcoming deadline task (due in 6 hours)
      const in6Hours = new Date(Date.now() + 6 * 3600 * 1000).toISOString();
      await Task.create({
        title: "Urgent Bugfix",
        boardId: board.id,
        columnId: todoColId,
        assigneeId: user.id,
        assignee: user.name,
        dueDate: in6Hours,
      });

      // 3. Completed task with past deadline (in Done column - should NOT alert)
      await Task.create({
        title: "Completed Milestone",
        boardId: board.id,
        columnId: doneColId,
        assigneeId: user.id,
        assignee: user.name,
        dueDate: yesterday,
      });

      // Trigger deadline checks
      const createdAlerts = await checkAndTriggerDeadlineAlerts(user.id);
      expect(createdAlerts).toHaveLength(2);

      const overdueAlert = createdAlerts.find((a) => a.type === "task_overdue");
      expect(overdueAlert).toBeDefined();
      expect(overdueAlert.message).toContain("Overdue");

      const upcomingAlert = createdAlerts.find((a) => a.type === "deadline_upcoming");
      expect(upcomingAlert).toBeDefined();
      expect(upcomingAlert.message).toContain("Upcoming Deadline");

      // Verify idempotency (no duplicate alerts created on immediate second run)
      const secondRun = await checkAndTriggerDeadlineAlerts(user.id);
      expect(secondRun).toHaveLength(0);

      // Verify GET /api/notifications returns them
      const notifRes = await request(app)
        .get("/api/notifications")
        .set("Authorization", authHeader(token));

      expect(notifRes.status).toBe(200);
      expect(notifRes.body.notifications).toHaveLength(2);
      expect(notifRes.body.unreadCount).toBe(2);
    });
  });
});
