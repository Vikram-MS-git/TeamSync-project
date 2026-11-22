// frontend/src/components/TeamChat.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import TeamChat from "./TeamChat.jsx";
import * as chatApi from "../api/chat.js";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: () => ({
    user: { id: "user-1", name: "Current User", email: "user1@teamsync.dev" },
  }),
}));

vi.mock("../context/SocketContext.jsx", () => ({
  useSocket: () => ({
    socket: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    isConnected: true,
  }),
}));

describe("TeamChat Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the chat header with board title", async () => {
    vi.spyOn(chatApi, "fetchBoardMessages").mockResolvedValueOnce([]);

    render(
      <TeamChat
        boardId="board-123"
        boardName="Sprint Planning"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Team Chat")).toBeInTheDocument();
    expect(screen.getByText("#Sprint Planning")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("renders empty state when no messages exist", async () => {
    vi.spyOn(chatApi, "fetchBoardMessages").mockResolvedValueOnce([]);

    render(
      <TeamChat
        boardId="board-123"
        boardName="Sprint Planning"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("No messages yet")).toBeInTheDocument();
    });
  });

  it("renders loaded messages", async () => {
    const mockMessages = [
      {
        id: "msg-1",
        boardId: "board-123",
        senderId: "user-2",
        senderName: "Sarah Connor",
        message: "Hey team, welcome to the new Sprint!",
        createdAt: new Date().toISOString(),
      },
      {
        id: "msg-2",
        boardId: "board-123",
        senderId: "user-1",
        senderName: "Current User",
        message: "Thanks Sarah, excited to collaborate!",
        createdAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(chatApi, "fetchBoardMessages").mockResolvedValueOnce(mockMessages);

    render(
      <TeamChat
        boardId="board-123"
        boardName="Sprint Planning"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Hey team, welcome to the new Sprint!")).toBeInTheDocument();
      expect(screen.getByText("Thanks Sarah, excited to collaborate!")).toBeInTheDocument();
      expect(screen.getByText("Sarah Connor")).toBeInTheDocument();
    });
  });
});
