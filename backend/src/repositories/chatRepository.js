import { ChatMessage } from "../models/ChatMessage.js";

export function createMessage(data) {
  return ChatMessage.create(data);
}

export async function findByBoardId(boardId, { limit = 50, before } = {}) {
  const query = { boardId };
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }
  const messages = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();

  // Return in chronological order
  return messages.reverse();
}

export function countByBoardId(boardId) {
  return ChatMessage.countDocuments({ boardId });
}
