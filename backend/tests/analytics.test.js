import request from "supertest";
import app from "../src/app.js";
import { Board } from "../src/models/Board.js";
import { Task } from "../src/models/Task.js";
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
    .send({ name: "Analytics Test Board", ...overrides });
  return res.body;
}

async function addBoardMember(boardId, userId) {
  await Board.findByIdAndUpdate(boardId, { $addToSet: { members: userId } });
}

describe("Workload & Productivity Analytics Engine", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe("GET /api/boards/:id/analytics", () => {
    it("returns comprehensive project progress and per-employee workload analytics", async () => {
      const { token: ownerToken, user: alice } = await registerUser({ name: "Alice Lead" });
      const { user: bob } = await registerUser({ name: "Bob Dev" });

      const board = await createBoard(ownerToken);
      await addBoardMember(board.id, bob.id);

      const todoColId = board.columns.find((c) => c.title === "To Do").id;
      const doingColId = board.columns.find((c) => c.title === "Doing").id;
      const doneColId = board.columns.find((c) => c.title === "Done").id;

      // Alice: 1 task done, 1 task doing
      await Task.create({
        title: "Alice Done Task",
        boardId: board.id,
        columnId: doneColId,
        assigneeId: alice.id,
        assignee: alice.name,
      });
      await Task.create({
        title: "Alice Doing Task",
        boardId: board.id,
        columnId: doingColId,
        assigneeId: alice.id,
        assignee: alice.name,
      });

      // Bob: 1 task overdue in To Do
      const yesterday = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      await Task.create({
        title: "Bob Overdue Task",
        boardId: board.id,
        columnId: todoColId,
        assigneeId: bob.id,
        assignee: bob.name,
        dueDate: yesterday,
      });

      const res = await request(app)
        .get(`/api/boards/${board.id}/analytics`)
        .set("Authorization", authHeader(ownerToken));

      expect(res.status).toBe(200);
      expect(res.body.boardId).toBe(board.id);
      expect(res.body.boardName).toBe("Analytics Test Board");

      // Check overview
      const overview = res.body.overview;
      expect(overview.totalTasks).toBe(3);
      expect(overview.completedTasks).toBe(1);
      expect(overview.inProgressTasks).toBe(1);
      expect(overview.pendingTasks).toBe(2);
      expect(overview.overdueTasks).toBe(1);
      expect(overview.completionRate).toBe(33); // 1 / 3 = 33%

      // Check employees breakdown
      const employees = res.body.employees;
      expect(employees).toHaveLength(2);

      const aliceStats = employees.find((e) => e.id === alice.id);
      expect(aliceStats.totalTasks).toBe(2);
      expect(aliceStats.completedTasks).toBe(1);
      expect(aliceStats.pendingTasks).toBe(1);
      expect(aliceStats.completionRate).toBe(50);
      expect(aliceStats.productivityScore).toBe(50);

      const bobStats = employees.find((e) => e.id === bob.id);
      expect(bobStats.totalTasks).toBe(1);
      expect(bobStats.completedTasks).toBe(0);
      expect(bobStats.pendingTasks).toBe(1);
      expect(bobStats.overdueTasks).toBe(1);
      expect(bobStats.completionRate).toBe(0);
    });

    it("forbids non-members from viewing board analytics", async () => {
      const { token: ownerToken } = await registerUser();
      const { token: outsiderToken } = await registerUser();
      const board = await createBoard(ownerToken);

      const res = await request(app)
        .get(`/api/boards/${board.id}/analytics`)
        .set("Authorization", authHeader(outsiderToken));

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/analytics/workspace", () => {
    it("returns workspace-wide aggregated metrics across all accessible boards", async () => {
      const { token: userToken, user } = await registerUser({ name: "Multi-Board User" });
      const board1 = await createBoard(userToken, { name: "Board One" });
      const board2 = await createBoard(userToken, { name: "Board Two" });

      const doneCol1 = board1.columns.find((c) => c.title === "Done").id;
      const todoCol2 = board2.columns.find((c) => c.title === "To Do").id;

      await Task.create({
        title: "B1 Task",
        boardId: board1.id,
        columnId: doneCol1,
        assigneeId: user.id,
        assignee: user.name,
      });

      await Task.create({
        title: "B2 Task",
        boardId: board2.id,
        columnId: todoCol2,
        assigneeId: user.id,
        assignee: user.name,
      });

      const res = await request(app)
        .get("/api/analytics/workspace")
        .set("Authorization", authHeader(userToken));

      expect(res.status).toBe(200);
      expect(res.body.overview.totalTasks).toBe(2);
      expect(res.body.overview.completedTasks).toBe(1);
      expect(res.body.overview.pendingTasks).toBe(1);
      expect(res.body.overview.activeBoardsCount).toBe(2);
    });
  });
});
