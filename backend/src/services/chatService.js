import * as chatRepository from "../repositories/chatRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import { getBoardForAccess, assertMember } from "./boardService.js";
import { BadRequestError, NotFoundError } from "../utils/AppError.js";

export async function getMessages(boardId, userId, options = {}) {
  const board = await getBoardForAccess(boardId);
  assertMember(board, userId);
  return chatRepository.findByBoardId(board._id, options);
}

export async function postMessage({ boardId, userId, message }) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new BadRequestError("Message content is required");
  }

  const board = await getBoardForAccess(boardId);
  assertMember(board, userId);

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError("User");
  }

  const chatMessage = await chatRepository.createMessage({
    boardId: board._id,
    sender: user._id,
    senderName: user.name,
    senderEmail: user.email,
    senderAvatar: user.avatarUrl,
    message: message.trim(),
  });

  return chatMessage.toJSON();
}
