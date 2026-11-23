// frontend/src/api/analytics.js
import { apiFetch } from "./client.js";

/**
 * Fetch detailed workload and productivity analytics for a specific board.
 * @param {string} boardId
 * @returns {Promise<object>}
 */
export function fetchBoardAnalytics(boardId) {
  return apiFetch(`/api/boards/${boardId}/analytics`);
}

/**
 * Fetch aggregated workspace-wide workload analytics across all accessible boards.
 * @returns {Promise<object>}
 */
export function fetchWorkspaceAnalytics() {
  return apiFetch("/api/analytics/workspace");
}
