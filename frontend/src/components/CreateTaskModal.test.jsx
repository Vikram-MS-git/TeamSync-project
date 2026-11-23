// frontend/src/components/CreateTaskModal.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CreateTaskModal from "./CreateTaskModal.jsx";
import * as boardsApi from "../api/boards.js";

vi.mock("../context/TasksContext", () => ({
  useTasksActions: () => ({
    addTask: vi.fn(),
  }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => vi.fn(),
}));

describe("CreateTaskModal with Smart Task Assignment", () => {
  const mockColumns = [
    { id: "col-1", title: "To Do" },
    { id: "col-2", title: "Doing" },
    { id: "col-3", title: "Done" },
  ];

  const mockMembers = [
    { id: "user-1", name: "Alice Owner" },
    { id: "user-2", name: "Bob Developer" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the modal and shows Smart Recommendation when loaded", async () => {
    vi.spyOn(boardsApi, "fetchSmartAssignment").mockResolvedValueOnce([
      {
        id: "user-2",
        name: "Bob Developer",
        pendingTasksCount: 0,
        totalTasksCount: 1,
        workloadStatus: "Available",
        isRecommended: true,
        recommendationReason: "Zero pending tasks (Optimal availability)",
      },
      {
        id: "user-1",
        name: "Alice Owner",
        pendingTasksCount: 3,
        totalTasksCount: 4,
        workloadStatus: "Moderate Workload",
        isRecommended: false,
        recommendationReason: "3 active tasks currently assigned",
      },
    ]);

    render(
      <CreateTaskModal
        isOpen={true}
        onClose={vi.fn()}
        boardId="board-123"
        columns={mockColumns}
        members={mockMembers}
        defaultColumnId="col-1"
      />
    );

    expect(screen.getByText("New task")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Smart Recommendation:/i)).toBeInTheDocument();
      expect(screen.getByText("Bob Developer")).toBeInTheDocument();
      expect(screen.getByText(/Zero pending tasks/i)).toBeInTheDocument();
    });

    const assigneeSelect = screen.getByLabelText("Assignee");
    expect(assigneeSelect.value).toBe("user-2"); // Pre-selected Bob Developer
  });
});
