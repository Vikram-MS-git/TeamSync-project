// src/jobs/deadlineAlertJob.js
import cron from "node-cron";
import { checkAllUsersDeadlines } from "../services/notificationService.js";

/**
 * Periodically scan all assigned tasks for upcoming deadlines (<24h) and overdue tasks,
 * generating notifications and dispatching real-time alerts.
 */
export function startDeadlineAlertJob(io) {
  // Run at minute 0 of every hour
  cron.schedule("0 * * * *", () => {
    checkAllUsersDeadlines(io).catch((err) =>
      console.error("Deadline alerts cron job failed:", err.message)
    );
  });
  console.log("Deadline alerts background job scheduled (hourly).");
}
