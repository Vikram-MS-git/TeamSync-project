// src/services/analyticsService.js
import { Board } from "../models/Board.js";
import { Task } from "../models/Task.js";
import * as userRepository from "../repositories/userRepository.js";
import { parseDueDate } from "./notificationService.js";
import { getBoardForAccess, assertMember } from "./boardService.js";

/**
 * Compute detailed workload and productivity analytics for a specific board.
 */
export async function getBoardAnalytics(boardId, userId) {
  const board = await getBoardForAccess(boardId);
  assertMember(board, userId);

  const tasks = await Task.find({ boardId: board._id }).lean();
  const memberIds = [board.owner.toString(), ...board.members.map((m) => m.toString())];
  const users = await userRepository.findByIds(memberIds);
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const doneColIdSet = new Set(
    (board.columns || [])
      .filter((c) => c.title.toLowerCase().trim() === "done")
      .map((c) => (c._id?.toString?.() ?? c.id))
  );

  const inProgressColIdSet = new Set(
    (board.columns || [])
      .filter((c) =>
        c.title.toLowerCase().trim().includes("doing") ||
        c.title.toLowerCase().trim().includes("progress")
      )
      .map((c) => (c._id?.toString?.() ?? c.id))
  );

  const now = new Date();

  let completedTasks = 0;
  let inProgressTasks = 0;
  let pendingTasks = 0;
  let overdueTasks = 0;

  const employeeMap = new Map();
  for (const u of users) {
    employeeMap.set(u._id.toString(), {
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      role: board.owner.toString() === u._id.toString() ? "owner" : "member",
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
      productivityScore: 100,
      workloadStatus: "Optimal",
    });
  }

  for (const t of tasks) {
    const colIdStr = t.columnId ? t.columnId.toString() : "";
    const isCompleted = doneColIdSet.has(colIdStr);
    const isInProgress = inProgressColIdSet.has(colIdStr);
    const dueDate = parseDueDate(t.dueDate);
    const isOverdue = !isCompleted && dueDate && dueDate < now;

    if (isCompleted) completedTasks++;
    else pendingTasks++;

    if (isInProgress) inProgressTasks++;
    if (isOverdue) overdueTasks++;

    const assigneeKey = t.assigneeId ? t.assigneeId.toString() : null;
    if (assigneeKey && employeeMap.has(assigneeKey)) {
      const emp = employeeMap.get(assigneeKey);
      emp.totalTasks++;
      if (isCompleted) emp.completedTasks++;
      else emp.pendingTasks++;

      if (isInProgress) emp.inProgressTasks++;
      if (isOverdue) emp.overdueTasks++;
    }
  }

  const totalTasks = tasks.length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const employees = Array.from(employeeMap.values()).map((emp) => {
    const rate = emp.totalTasks ? Math.round((emp.completedTasks / emp.totalTasks) * 100) : 0;
    emp.completionRate = rate;

    // Productivity score: completion rate penalized by overdue count
    let score = emp.totalTasks === 0 ? 100 : Math.max(0, rate - emp.overdueTasks * 10);
    emp.productivityScore = score;

    if (emp.pendingTasks >= 5 || emp.overdueTasks >= 2) {
      emp.workloadStatus = "Heavy Workload";
    } else if (emp.pendingTasks >= 3) {
      emp.workloadStatus = "Moderate Workload";
    } else {
      emp.workloadStatus = "Optimal";
    }

    return emp;
  });

  return {
    boardId: board._id.toString(),
    boardName: board.name,
    overview: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
    },
    employees: employees.sort((a, b) => b.totalTasks - a.totalTasks),
  };
}

/**
 * Compute workspace-wide workload and productivity analytics for a user.
 */
export async function getWorkspaceAnalytics(userId) {
  const boards = await Board.find({
    $or: [{ owner: userId }, { members: userId }],
  }).lean();

  const boardIds = boards.map((b) => b._id);
  const tasks = await Task.find({ boardId: { $in: boardIds } }).lean();

  const allMemberIds = [
    ...new Set(
      boards.flatMap((b) => [b.owner.toString(), ...b.members.map((m) => m.toString())])
    ),
  ];
  const users = await userRepository.findByIds(allMemberIds);
  const now = new Date();

  // Create column lookup for completion
  const doneColIdSet = new Set(
    boards.flatMap((b) =>
      (b.columns || [])
        .filter((c) => c.title.toLowerCase().trim() === "done")
        .map((c) => (c._id?.toString?.() ?? c.id))
    )
  );

  const inProgressColIdSet = new Set(
    boards.flatMap((b) =>
      (b.columns || [])
        .filter((c) =>
          c.title.toLowerCase().trim().includes("doing") ||
          c.title.toLowerCase().trim().includes("progress")
        )
        .map((c) => (c._id?.toString?.() ?? c.id))
    )
  );

  let completedTasks = 0;
  let inProgressTasks = 0;
  let pendingTasks = 0;
  let overdueTasks = 0;

  const employeeMap = new Map();
  for (const u of users) {
    employeeMap.set(u._id.toString(), {
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
      productivityScore: 100,
      workloadStatus: "Optimal",
    });
  }

  for (const t of tasks) {
    const colIdStr = t.columnId ? t.columnId.toString() : "";
    const isCompleted = doneColIdSet.has(colIdStr);
    const isInProgress = inProgressColIdSet.has(colIdStr);
    const dueDate = parseDueDate(t.dueDate);
    const isOverdue = !isCompleted && dueDate && dueDate < now;

    if (isCompleted) completedTasks++;
    else pendingTasks++;

    if (isInProgress) inProgressTasks++;
    if (isOverdue) overdueTasks++;

    const assigneeKey = t.assigneeId ? t.assigneeId.toString() : null;
    if (assigneeKey && employeeMap.has(assigneeKey)) {
      const emp = employeeMap.get(assigneeKey);
      emp.totalTasks++;
      if (isCompleted) emp.completedTasks++;
      else emp.pendingTasks++;

      if (isInProgress) emp.inProgressTasks++;
      if (isOverdue) emp.overdueTasks++;
    }
  }

  const totalTasks = tasks.length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const employees = Array.from(employeeMap.values()).map((emp) => {
    const rate = emp.totalTasks ? Math.round((emp.completedTasks / emp.totalTasks) * 100) : 0;
    emp.completionRate = rate;

    let score = emp.totalTasks === 0 ? 100 : Math.max(0, rate - emp.overdueTasks * 10);
    emp.productivityScore = score;

    if (emp.pendingTasks >= 5 || emp.overdueTasks >= 2) {
      emp.workloadStatus = "Heavy Workload";
    } else if (emp.pendingTasks >= 3) {
      emp.workloadStatus = "Moderate Workload";
    } else {
      emp.workloadStatus = "Optimal";
    }

    return emp;
  });

  return {
    overview: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
      activeBoardsCount: boards.length,
    },
    employees: employees.sort((a, b) => b.totalTasks - a.totalTasks),
  };
}
