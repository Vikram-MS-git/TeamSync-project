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
    .send({ name: "Attachment Test Board", ...overrides });
  return res.body;
}

async function addBoardMember(boardId, userId) {
  await Board.findByIdAndUpdate(boardId, { $addToSet: { members: userId } });
}

describe("File Sharing & Task Attachments", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it("uploads a document attachment and updates task attachments list", async () => {
    const { token: ownerToken, user: owner } = await registerUser({ name: "Alice Owner" });
    const { token: memberToken, user: member } = await registerUser({ name: "Bob Member" });

    const board = await createBoard(ownerToken);
    await addBoardMember(board.id, member.id);

    const todoColId = board.columns.find((c) => c.title === "To Do").id;

    // Create a task
    const taskRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", authHeader(ownerToken))
      .send({
        title: "API Specification",
        boardId: board.id,
        columnId: todoColId,
        assigneeId: member.id,
      });

    expect(taskRes.status).toBe(201);
    const taskId = taskRes.body.id;

    // Member uploads an attachment
    const fileBuffer = Buffer.from("openapi: 3.0.0\ninfo:\n  title: TeamSync API");
    const uploadRes = await request(app)
      .post(`/api/tasks/${taskId}/attachments`)
      .set("Authorization", authHeader(memberToken))
      .attach("file", fileBuffer, "openapi.yaml.txt");

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.attachments).toBeDefined();
    expect(uploadRes.body.attachments.length).toBe(1);

    const att = uploadRes.body.attachments[0];
    expect(att.name).toBe("openapi.yaml.txt");
    expect(att.url).toBeDefined();
    expect(att.uploadedByName).toBe("Bob Member");
    expect(att.id).toBeDefined();

    // Verify task in DB has the attachment
    const dbTask = await Task.findById(taskId);
    expect(dbTask.attachments.length).toBe(1);
    expect(dbTask.attachments[0].name).toBe("openapi.yaml.txt");
  });

  it("allows removing an attachment by owner or uploader", async () => {
    const { token: ownerToken, user: owner } = await registerUser({ name: "Alice Owner" });
    const board = await createBoard(ownerToken);
    const todoColId = board.columns.find((c) => c.title === "To Do").id;

    const taskRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", authHeader(ownerToken))
      .send({
        title: "Database Architecture",
        boardId: board.id,
        columnId: todoColId,
        assigneeId: owner.id,
      });

    const taskId = taskRes.body.id;

    // Upload attachment
    const uploadRes = await request(app)
      .post(`/api/tasks/${taskId}/attachments`)
      .set("Authorization", authHeader(ownerToken))
      .attach("file", Buffer.from("ER Diagram details"), "schema.txt");

    expect(uploadRes.status).toBe(201);
    const attachmentId = uploadRes.body.attachments[0].id;

    // Delete attachment
    const deleteRes = await request(app)
      .delete(`/api/tasks/${taskId}/attachments/${attachmentId}`)
      .set("Authorization", authHeader(ownerToken));

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.attachments.length).toBe(0);

    // Verify in DB
    const dbTask = await Task.findById(taskId);
    expect(dbTask.attachments.length).toBe(0);
  });

  it("rejects unauthorized non-members from uploading attachments", async () => {
    const { token: ownerToken, user: owner } = await registerUser({ name: "Alice Owner" });
    const { token: strangerToken } = await registerUser({ name: "Stranger" });

    const board = await createBoard(ownerToken);
    const todoColId = board.columns.find((c) => c.title === "To Do").id;

    const taskRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", authHeader(ownerToken))
      .send({
        title: "Confidential Blueprint",
        boardId: board.id,
        columnId: todoColId,
        assigneeId: owner.id,
      });

    const taskId = taskRes.body.id;

    const uploadRes = await request(app)
      .post(`/api/tasks/${taskId}/attachments`)
      .set("Authorization", authHeader(strangerToken))
      .attach("file", Buffer.from("injected payload"), "hack.txt");

    expect(uploadRes.status).toBe(403);
  });
});
