// frontend/src/db/tasksSync.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as tasksApi from "../api/tasks.js";
import { tasksDB, toDoc } from "./pouchdb.js";
import { pullRemoteTasks, pushPendingDocs, applyRemoteTask } from "./tasksSync.js";

vi.mock("../api/tasks.js", () => ({
  fetchTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  fetchTask: vi.fn(),
}));

describe("tasksSync Offline Reconciliation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pullRemoteTasks merges remote tasks into local PouchDB", async () => {
    const remoteTasks = [
      { id: "task-1", title: "Remote Task 1", columnId: "col-1", version: 1 },
      { id: "task-2", title: "Remote Task 2", columnId: "col-2", version: 2 },
    ];

    vi.spyOn(tasksApi, "fetchTasks").mockResolvedValue(remoteTasks);
    vi.spyOn(tasksDB, "allDocs").mockResolvedValue({ rows: [] });
    const bulkSpy = vi.spyOn(tasksDB, "bulkDocs").mockResolvedValue([]);

    await pullRemoteTasks();

    expect(bulkSpy).toHaveBeenCalled();
    const writtenDocs = bulkSpy.mock.calls[0][0];
    expect(writtenDocs.length).toBe(2);
    expect(writtenDocs[0].title).toBe("Remote Task 1");
    expect(writtenDocs[0].syncStatus).toBe("synced");
  });

  it("pushPendingDocs pushes local pending creates to the API and updates local ids", async () => {
    const pendingDoc = toDoc(
      { id: "local-123", title: "Pending Task", columnId: "col-1" },
      { syncStatus: "pending", pendingOp: "create" }
    );

    vi.spyOn(tasksDB, "allDocs").mockResolvedValue({
      rows: [{ id: "local-123", doc: pendingDoc }],
    });

    const serverCreated = { id: "real-server-id", title: "Pending Task", columnId: "col-1", version: 0 };
    vi.spyOn(tasksApi, "createTask").mockResolvedValue(serverCreated);

    const removeSpy = vi.spyOn(tasksDB, "remove").mockResolvedValue({ ok: true });
    const putSpy = vi.spyOn(tasksDB, "put").mockResolvedValue({ ok: true });

    const result = await pushPendingDocs();

    expect(tasksApi.createTask).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith(pendingDoc);
    expect(putSpy).toHaveBeenCalled();
    expect(result.conflicts).toEqual([]);
  });

  it("applyRemoteTask ignores updates when a local document has pending changes", async () => {
    const localPending = toDoc(
      { id: "task-99", title: "Locally Edited Task" },
      { syncStatus: "pending", pendingOp: "update" }
    );

    vi.spyOn(tasksDB, "get").mockResolvedValue(localPending);
    const putSpy = vi.spyOn(tasksDB, "put").mockResolvedValue({ ok: true });

    await applyRemoteTask({ id: "task-99", title: "Conflicting Remote Task" });

    // Should not overwrite local in-flight edits
    expect(putSpy).not.toHaveBeenCalled();
  });
});
