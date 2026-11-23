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
    .send({ name: "Workload Test Board", ...overrides });
  return res.body;
}

async function addBoardMember(boardId, userId) {
  await Board.findByIdAndUpdate(boardId, { $addToSet: { members: userId } });
}

describe("Smart Task Assignment Engine (GET /api/boards/:id/smart-assignment)", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it("calculates pending workloads and recommends members with the lowest pending tasks", async () => {
    // 1. Setup owner (Alice) and members (Bob, Charlie)
    const { token: ownerToken, user: alice } = await registerUser({ name: "Alice Owner" });
    const { user: bob } = await registerUser({ name: "Bob Developer" });
    const { user: charlie } = await registerUser({ name: "Charlie QA" });

    const board = await createBoard(ownerToken);
    await addBoardMember(board.id, bob.id);
    await addBoardMember(board.id, charlie.id);

    const todoColId = board.columns.find((c) => c.title === "To Do").id;
    const doingColId = board.columns.find((c) => c.title === "Doing").id;
    const doneColId = board.columns.find((c) => c.title === "Done").id;

    // 2. Assign tasks:
    // Alice has 2 pending tasks (To Do + Doing)
    await Task.create({
      title: "Task 1",
      boardId: board.id,
      columnId: todoColId,
      assigneeId: alice.id,
      assignee: alice.name,
    });
    await Task.create({
      title: "Task 2",
      boardId: board.id,
      columnId: doingColId,
      assigneeId: alice.id,
      assignee: alice.name,
    });

    // Bob has 1 completed task in Done column (0 pending)
    await Task.create({
      title: "Task 3 (Done)",
      boardId: board.id,
      columnId: doneColId,
      assigneeId: bob.id,
      assignee: bob.name,
    });

    // Charlie has 0 tasks at all (0 pending, 0 total)

    // 3. Query smart assignment recommendations
    const res = await request(app)
      .get(`/api/boards/${board.id}/smart-assignment`)
      .set("Authorization", authHeader(ownerToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(3);

    // Charlie (0 pending, 0 total) and Bob (0 pending, 1 total) should be recommended
    const charlieRec = res.body.find((m) => m.id === charlie.id);
    expect(charlieRec).toBeDefined();
    expect(charlieRec.pendingTasksCount).toBe(0);
    expect(charlieRec.totalTasksCount).toBe(0);
    expect(charlieRec.isRecommended).toBe(true);
    expect(charlieRec.workloadStatus).toBe("Available");

    const bobRec = res.body.find((m) => m.id === bob.id);
    expect(bobRec).toBeDefined();
    expect(bobRec.pendingTasksCount).toBe(0);
    expect(bobRec.completedTasksCount).toBe(1);
    expect(bobRec.totalTasksCount).toBe(1);
    expect(bobRec.isRecommended).toBe(true);

    // Alice has 2 pending tasks, so isRecommended should be false
    const aliceRec = res.body.find((m) => m.id === alice.id);
    expect(aliceRec).toBeDefined();
    expect(aliceRec.pendingTasksCount).toBe(2);
    expect(aliceRec.completedTasksCount).toBe(0);
    expect(aliceRec.isRecommended).toBe(false);
    expect(aliceRec.workloadStatus).toBe("Low Workload");

    // The first item in the list must be a recommended member
    expect(res.body[0].isRecommended).toBe(true);
  });

  it("forbids non-members from retrieving recommendations", async () => {
    const { token: ownerToken } = await registerUser();
    const { token: strangerToken } = await registerUser();
    const board = await createBoard(ownerToken);

    const res = await request(app)
      .get(`/api/boards/${board.id}/smart-assignment`)
      .set("Authorization", authHeader(strangerToken));

    expect(res.status).toBe(403);
  });
});
