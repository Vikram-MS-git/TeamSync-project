// src/services/taskService.js
import * as taskRepository from "../repositories/taskRepository.js";
import * as boardRepository from "../repositories/boardRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import * as activityService from "./activityService.js";
import * as boardService from "./boardService.js";
import { sendEmail } from "../utils/emailService.js";
import * as notificationService from "./notificationService.js";
import { NotFoundError, ForbiddenError } from "../utils/AppError.js";

// Only fields a non-owner assignee is allowed to change when moving their
// own card between columns. Anything else in the patch is an editing
// action, which only the board owner may do.
//
// Note: the client is offline-first (PouchDB) and always PATCHes the
// *whole* task doc, not just the changed field — so we can't reject a
// patch just because a restricted key is present. Instead, for each
// restricted key we only object if its value actually changed from what
// the task had before.
const ASSIGNEE_ALLOWED_FIELDS = new Set(["columnId", "version"]);

function valuesDiffer(a, b) {
  return String(a ?? "") !== String(b ?? "");
}

export function getAllTasks(userId) {
  return taskRepository.findAllForUser(userId);
}

export async function getTaskById(id) {
  const task = await taskRepository.findById(id);
  if (!task) throw new NotFoundError("Task");
  return task;
}

// Resolves an assigneeId into the {assigneeId, assignee} pair stored on
// the task, after checking the chosen person actually has access to the
// board (you can't assign a task to someone who isn't on the board).
// Also returns the full user doc (assigneeUser) so callers can check
// notification preferences without a second lookup.
async function resolveAssignee(board, assigneeId) {
  const user = await userRepository.findById(assigneeId);
  if (!user) throw new NotFoundError("User");

  const isOwner = board.owner.toString() === String(assigneeId);
  const isMember = board.members.some((m) => m.toString() === String(assigneeId));
  if (!isOwner && !isMember) {
    throw new ForbiddenError();
  }

  return { assigneeId: user.id, assignee: user.name, assigneeUser: user };
}

// Always creates the bell notification — the email preference only
// controls whether an email *also* goes out, not whether the person
// hears about it at all.
async function notifyAssignment(user, task, boardName) {
  if (!user) return;

  await notificationService.notify({
    recipientId: user.id,
    type: "task_assigned",
    message: `You've been assigned "${task.title}" on "${boardName}"`,
    link: `/tasks/${task.id}`,
  });

  if (user.preferences?.notifyAssigned === false) return;
  await sendEmail({
    to: user.email,
    subject: `You've been assigned: "${task.title}"`,
    text:
      `Hi ${user.name},\n\n` +
      `You've been assigned a task on "${boardName}":\n\n"${task.title}"\n\n` +
      `Open TeamSync to see the details.`,
  });
}

export async function createTask(data, actorId) {
  // A task must belong to a real board — fail loudly here rather than
  // silently creating an orphaned task nothing can ever find.
  const board = await boardRepository.findById(data.boardId);
  if (!board) {
    throw new NotFoundError("Board");
  }

  // Only the board owner creates (and therefore assigns) tasks.
  boardService.assertOwner(board, actorId);

  const { assigneeId, assignee, assigneeUser } = await resolveAssignee(board, data.assigneeId);

  const task = await taskRepository.create({ ...data, assigneeId, assignee });

  await activityService.logActivity({
    action: "created",
    actorId,
    boardId: task.boardId,
    taskId: task.id,
    taskTitle: task.title,
  });

notifyAssignment(assigneeUser, task, board.name).catch((err) => console.error("Notify failed:", err));

  return task;
}

export async function updateTask(id, patch, actorId) {
  // Fetch the pre-update state so we can tell whether this update moved
  // the task to a different column (for the "moved" activity entry), and
  // so we can check who's allowed to make this particular change.
  const before = await taskRepository.findById(id);
  if (!before) throw new NotFoundError("Task");

  const board = await boardRepository.findById(before.boardId);
  if (!board) throw new NotFoundError("Board");

  const isOwner = board.owner.toString() === String(actorId);
  const isAssignee = before.assigneeId && before.assigneeId.toString() === String(actorId);

  if (!isOwner) {
    // Not the owner: only the assigned member may touch this task, and
    // only to move it between columns — everything else (title, due
    // date, description, re-assigning) is owner-only.
    if (!isAssignee) throw new ForbiddenError();
    const changedRestrictedField = Object.keys(patch).some(
      (field) => !ASSIGNEE_ALLOWED_FIELDS.has(field) && valuesDiffer(patch[field], before[field])
    );
    if (changedRestrictedField) throw new ForbiddenError();
  }

  let resolvedPatch = patch;
  let reassignedTo = null;
  if (patch.assigneeId) {
    const { assigneeId, assignee, assigneeUser } = await resolveAssignee(board, patch.assigneeId);
    resolvedPatch = { ...patch, assigneeId, assignee };
    // Only a genuine reassignment, not just the unchanged assigneeId that
    // rides along on every full-doc PATCH from the offline-sync client.
    if (String(assigneeId) !== String(before.assigneeId)) {
      reassignedTo = assigneeUser;
    }
  }

  const updated = await taskRepository.update(id, resolvedPatch);
  if (!updated) throw new NotFoundError("Task");

  if (reassignedTo) {
    await notifyAssignment(reassignedTo, updated, board.name);
  }

  if (patch.columnId && String(patch.columnId) !== String(before.columnId)) {
    const fromCol = board.columns?.find(
      (c) => (c._id?.toString?.() ?? c.id) === String(before.columnId)
    );
    const toCol = board.columns?.find(
      (c) => (c._id?.toString?.() ?? c.id) === String(patch.columnId)
    );
    await activityService.logActivity({
      action: "moved",
      actorId,
      boardId: updated.boardId,
      taskId: updated.id,
      taskTitle: updated.title,
      details: {
        from: fromCol?.title ?? before.columnId,
        to: toCol?.title ?? patch.columnId,
      },
    });
  }

  return updated;
}

export async function deleteTask(id, actorId) {
  // Grab the task before removing it — need its title/boardId for the
  // activity entry, and the row won't exist to look up afterward.
  const task = await taskRepository.findById(id);
  if (!task) throw new NotFoundError("Task");

  const board = await boardRepository.findById(task.boardId);
  if (board) boardService.assertOwner(board, actorId);

  const deleted = await taskRepository.remove(id);
  if (!deleted) throw new NotFoundError("Task");

  await activityService.logActivity({
    action: "deleted",
    actorId,
    boardId: task.boardId,
    taskId: task.id,
    taskTitle: task.title,
  });

  // The row is gone by the time we'd otherwise need this for the socket
  // event, so hand back the bit of the pre-deletion doc the controller
  // needs to tell the right board room what happened.
  return { id: task.id, boardId: task.boardId };
}

export async function getSmartAssignmentRecommendations(boardId, userId) {
  const board = await boardService.getBoardForAccess(boardId);
  boardService.assertMember(board, userId);

  const members = await boardService.getMembers(boardId, userId);
  const tasks = await taskRepository.getTasksByBoardId(board._id);

  // Identify completed/done columns
  const doneColumnIdSet = new Set(
    (board.columns || [])
      .filter((c) => c.title.toLowerCase().trim() === "done")
      .map((c) => (c._id?.toString?.() ?? c.id))
  );

  const memberWorkloads = members.map((member) => {
    const memberTasks = tasks.filter((t) => String(t.assigneeId) === String(member.id));
    const completedTasksCount = memberTasks.filter((t) => doneColumnIdSet.has(String(t.columnId))).length;
    const pendingTasksCount = memberTasks.length - completedTasksCount;
    const totalTasksCount = memberTasks.length;

    let workloadStatus = "Available";
    if (pendingTasksCount >= 5) {
      workloadStatus = "Heavy Workload";
    } else if (pendingTasksCount >= 3) {
      workloadStatus = "Moderate Workload";
    } else if (pendingTasksCount >= 1) {
      workloadStatus = "Low Workload";
    }

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      pendingTasksCount,
      completedTasksCount,
      totalTasksCount,
      workloadStatus,
    };
  });

  const minPending = memberWorkloads.reduce(
    (min, m) => Math.min(min, m.pendingTasksCount),
    memberWorkloads.length ? memberWorkloads[0].pendingTasksCount : 0
  );

  const recommendations = memberWorkloads.map((m) => {
    const isRecommended = m.pendingTasksCount === minPending;
    let recommendationReason = "";
    if (isRecommended) {
      if (m.pendingTasksCount === 0) {
        recommendationReason = "Zero pending tasks (Optimal availability)";
      } else if (m.pendingTasksCount === 1) {
        recommendationReason = "Only 1 pending task (High capacity)";
      } else {
        recommendationReason = `Lowest pending workload (${m.pendingTasksCount} active tasks)`;
      }
    } else {
      recommendationReason = `${m.pendingTasksCount} active tasks currently assigned`;
    }

    return {
      ...m,
      isRecommended,
      recommendationReason,
    };
  });

  return recommendations.sort((a, b) => {
    if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
    if (a.pendingTasksCount !== b.pendingTasksCount) return a.pendingTasksCount - b.pendingTasksCount;
    if (a.totalTasksCount !== b.totalTasksCount) return a.totalTasksCount - b.totalTasksCount;
    return a.name.localeCompare(b.name);
  });
}
