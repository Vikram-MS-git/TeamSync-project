// src/services/notificationService.js
import * as notificationRepository from "../repositories/notificationRepository.js";
import { Task } from "../models/Task.js";
import { Board } from "../models/Board.js";
import { Notification } from "../models/Notification.js";
import { NotFoundError } from "../utils/AppError.js";

export function parseDueDate(dueDateStr) {
  if (!dueDateStr || typeof dueDateStr !== "string") return null;
  const trimmed = dueDateStr.trim();
  if (!trimmed || trimmed === "No date") return null;

  // 1. ISO or formatted full date (e.g. 2026-12-25, 2026-12-25 14:00)
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(trimmed)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Month + Day (e.g. "Aug 15" or "September 3 10:00")
  if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(trimmed) && /\d/.test(trimmed)) {
    const currentYear = new Date().getFullYear();
    const withYear = new Date(`${trimmed} ${currentYear}`);
    if (!isNaN(withYear.getTime())) return withYear;
  }

  // 3. General parse requiring at least one digit and valid year
  if (/\d/.test(trimmed)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2100) {
      return d;
    }
  }

  return null;
}

export async function checkAndTriggerDeadlineAlerts(userId, io) {
  const tasks = await Task.find({ assigneeId: userId }).lean();
  if (!tasks.length) return [];

  const boardIds = [...new Set(tasks.map((t) => t.boardId.toString()))];
  const boards = await Board.find({ _id: { $in: boardIds } }).lean();
  const boardMap = new Map(boards.map((b) => [b._id.toString(), b]));

  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const createdAlerts = [];

  for (const task of tasks) {
    const board = boardMap.get(task.boardId.toString());
    if (!board) continue;

    // Check if task is in a Done column
    const doneColIds = new Set(
      (board.columns || [])
        .filter((c) => c.title.toLowerCase().trim() === "done")
        .map((c) => (c._id?.toString?.() ?? c.id))
    );
    if (doneColIds.has(task.columnId.toString())) {
      continue; // completed task, no deadline alerts needed
    }

    const dueDate = parseDueDate(task.dueDate);
    if (!dueDate) continue;

    const taskLink = `/tasks/${task._id.toString()}`;

    if (dueDate < now) {
      // Overdue!
      const existingOverdue = await Notification.findOne({
        recipient: userId,
        type: "task_overdue",
        link: taskLink,
      });

      if (!existingOverdue) {
        const notif = await notificationRepository.create({
          recipientId: userId,
          type: "task_overdue",
          message: `Overdue: "${task.title}" on "${board.name}" was due on ${task.dueDate}.`,
          link: taskLink,
        });
        createdAlerts.push(notif);
        if (io) {
          io.to(`user:${userId}`).emit("notification:new", notif);
        }
      }
    } else if (dueDate <= next24h) {
      // Due soon within 24 hours!
      const existingUpcoming = await Notification.findOne({
        recipient: userId,
        type: "deadline_upcoming",
        link: taskLink,
      });

      if (!existingUpcoming) {
        const notif = await notificationRepository.create({
          recipientId: userId,
          type: "deadline_upcoming",
          message: `Upcoming Deadline: "${task.title}" on "${board.name}" is due soon (${task.dueDate}).`,
          link: taskLink,
        });
        createdAlerts.push(notif);
        if (io) {
          io.to(`user:${userId}`).emit("notification:new", notif);
        }
      }
    }
  }

  return createdAlerts;
}

export async function checkAllUsersDeadlines(io) {
  const usersWithTasks = await Task.distinct("assigneeId");
  const results = [];
  for (const userId of usersWithTasks) {
    if (userId) {
      const alerts = await checkAndTriggerDeadlineAlerts(userId, io);
      results.push(...alerts);
    }
  }
  return results;
}

// Called from taskService/activityService — creates the bell entry.
export function notify({ recipientId, type, message, link }) {
  return notificationRepository.create({ recipientId, type, message, link });
}

export async function listMine(userId, io) {
  // Check and trigger deadline alerts so unread list is up to date
  await checkAndTriggerDeadlineAlerts(userId, io).catch((err) =>
    console.error("Deadline alert check failed:", err.message)
  );

  const [notifications, unreadCount] = await Promise.all([
    notificationRepository.findRecentForUser(userId),
    notificationRepository.countUnreadForUser(userId),
  ]);
  return { notifications, unreadCount };
}

export async function markRead(id, userId) {
  const updated = await notificationRepository.markRead(id, userId);
  if (!updated) throw new NotFoundError("Notification");
  return updated;
}

export function markAllRead(userId) {
  return notificationRepository.markAllRead(userId);
}
