import * as chatService from "../services/chatService.js";
import { catchAsync } from "../utils/catchAsync.js";
import { emitToBoard } from "../sockets/index.js";

export const getChatMessages = catchAsync(async (req, res) => {
  const { limit, before } = req.query;
  const messages = await chatService.getMessages(req.params.id, req.user.id, {
    limit: limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 50,
    before,
  });
  res.json(messages);
});

export const sendChatMessage = catchAsync(async (req, res) => {
  const message = await chatService.postMessage({
    boardId: req.params.id,
    userId: req.user.id,
    message: req.body.message,
  });

  const io = req.app.get("io");
  if (io) {
    emitToBoard(io, req.params.id, "chat:message", message);
  }

  res.status(201).json(message);
});
