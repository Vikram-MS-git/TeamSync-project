import { createServer } from "node:http";
import request from "supertest";
import { io as ioClient } from "socket.io-client";
import app from "../src/app.js";
import { config } from "../src/config.js";
import { attachSockets } from "../src/sockets/index.js";
import { Board } from "../src/models/Board.js";
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
    .send({ name: "Chat Board", ...overrides });
  return res.body;
}

async function addBoardMember(boardId, userId) {
  await Board.findByIdAndUpdate(boardId, { $addToSet: { members: userId } });
}

function waitForEvent(socket, event, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for "${event}"`)), timeoutMs);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

describe("Team Chat API & Socket.IO Real-time Communication", () => {
  let server;
  let serverPort;
  let io;

  beforeAll(async () => {
    await connectTestDb();
    server = createServer(app);
    io = attachSockets(server, config);
    app.set("io", io);
    await new Promise((resolve) => server.listen(0, resolve));
    serverPort = server.address().port;
  }, 30000);

  afterAll(async () => {
    io?.close();
    await new Promise((resolve) => server.close(resolve));
    await closeTestDb();
  }, 10000);

  beforeEach(async () => {
    await clearTestDb();
  });

  describe("REST Endpoints (/api/boards/:id/chat)", () => {
    it("allows a board owner to post and retrieve messages", async () => {
      const { token, user } = await registerUser({ name: "Alice" });
      const board = await createBoard(token, { name: "Project Sync" });

      const postRes = await request(app)
        .post(`/api/boards/${board.id}/chat`)
        .set("Authorization", authHeader(token))
        .send({ message: "Hello team, welcome to TeamSync!" });

      expect(postRes.status).toBe(201);
      expect(postRes.body.message).toBe("Hello team, welcome to TeamSync!");
      expect(postRes.body.senderName).toBe("Alice");
      expect(postRes.body.senderId).toBe(user.id);
      expect(postRes.body.boardId).toBe(board.id);

      const getRes = await request(app)
        .get(`/api/boards/${board.id}/chat`)
        .set("Authorization", authHeader(token));

      expect(getRes.status).toBe(200);
      expect(Array.isArray(getRes.body)).toBe(true);
      expect(getRes.body).toHaveLength(1);
      expect(getRes.body[0].message).toBe("Hello team, welcome to TeamSync!");
    });

    it("allows an invited member to post and view messages", async () => {
      const { token: ownerToken } = await registerUser({ name: "Board Owner" });
      const { token: memberToken, user: member } = await registerUser({ name: "Bob Member" });
      const board = await createBoard(ownerToken, { name: "Collab Project" });
      await addBoardMember(board.id, member.id);

      const postRes = await request(app)
        .post(`/api/boards/${board.id}/chat`)
        .set("Authorization", authHeader(memberToken))
        .send({ message: "Thanks for inviting me!" });

      expect(postRes.status).toBe(201);
      expect(postRes.body.senderName).toBe("Bob Member");

      const getRes = await request(app)
        .get(`/api/boards/${board.id}/chat`)
        .set("Authorization", authHeader(ownerToken));

      expect(getRes.status).toBe(200);
      expect(getRes.body).toHaveLength(1);
      expect(getRes.body[0].message).toBe("Thanks for inviting me!");
    });

    it("forbids non-members from posting or viewing messages", async () => {
      const { token: ownerToken } = await registerUser({ name: "Owner" });
      const { token: outsiderToken } = await registerUser({ name: "Outsider" });
      const board = await createBoard(ownerToken, { name: "Private Project" });

      const postRes = await request(app)
        .post(`/api/boards/${board.id}/chat`)
        .set("Authorization", authHeader(outsiderToken))
        .send({ message: "Can I enter?" });

      expect(postRes.status).toBe(403);

      const getRes = await request(app)
        .get(`/api/boards/${board.id}/chat`)
        .set("Authorization", authHeader(outsiderToken));

      expect(getRes.status).toBe(403);
    });

    it("rejects empty messages", async () => {
      const { token } = await registerUser();
      const board = await createBoard(token);

      const res = await request(app)
        .post(`/api/boards/${board.id}/chat`)
        .set("Authorization", authHeader(token))
        .send({ message: "   " });

      expect(res.status).toBe(400);
    });
  });

  describe("Real-time Socket.IO chat:message communication", () => {
    it("broadcasts chat:message in real time to connected board room members", async () => {
      const { token: aliceToken, user: alice } = await registerUser({ name: "Alice" });
      const { token: bobToken, user: bob } = await registerUser({ name: "Bob" });
      const board = await createBoard(aliceToken, { name: "Live Chat Board" });
      await addBoardMember(board.id, bob.id);

      const socketA = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: aliceToken },
      });
      const socketB = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: bobToken },
      });

      await Promise.all([
        new Promise((resolve) => socketA.once("connect", resolve)),
        new Promise((resolve) => socketB.once("connect", resolve)),
      ]);

      // Both join the board room
      socketA.emit("board:join", board.id);
      socketB.emit("board:join", board.id);

      await Promise.all([
        waitForEvent(socketA, "board:joined"),
        waitForEvent(socketB, "board:joined"),
      ]);

      // Bob waits for incoming chat:message
      const bobMessagePromise = waitForEvent(socketB, "chat:message");

      // Alice emits chat:message via socket
      socketA.emit("chat:message", {
        boardId: board.id,
        message: "Hey Bob, check out the live chat!",
      });

      const receivedMsg = await bobMessagePromise;
      expect(receivedMsg).toBeDefined();
      expect(receivedMsg.boardId).toBe(board.id);
      expect(receivedMsg.senderId).toBe(alice.id);
      expect(receivedMsg.senderName).toBe("Alice");
      expect(receivedMsg.message).toBe("Hey Bob, check out the live chat!");

      socketA.disconnect();
      socketB.disconnect();
    });
  });
});
