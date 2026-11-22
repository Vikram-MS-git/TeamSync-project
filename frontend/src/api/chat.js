// frontend/src/api/chat.js
import { apiFetch } from "./client.js";

/**
 * Fetch chat message history for a specific board.
 * @param {string} boardId
 * @param {object} [options]
 * @param {number} [options.limit]
 * @param {string} [options.before]
 * @returns {Promise<Array>}
 */
export async function fetchBoardMessages(boardId, { limit = 50, before } = {}) {
  const query = new URLSearchParams();
  if (limit) query.set("limit", limit);
  if (before) query.set("before", before);
  const qs = query.toString();
  return apiFetch(`/api/boards/${boardId}/chat${qs ? `?${qs}` : ""}`);
}

/**
 * Send a chat message to a specific board via REST (fallback / standard API).
 * @param {string} boardId
 * @param {string} message
 * @returns {Promise<object>}
 */
export async function sendBoardMessage(boardId, message) {
  return apiFetch(`/api/boards/${boardId}/chat`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
