// frontend/src/components/OfflineBanner.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OfflineBanner } from "./OfflineBanner.jsx";
import * as TasksContext from "../context/TasksContext.jsx";
import * as tasksSync from "../db/tasksSync.js";

vi.mock("../context/TasksContext.jsx", () => ({
  useIsOnline: vi.fn(),
}));

vi.mock("../db/tasksSync.js", () => ({
  syncNow: vi.fn(),
}));

describe("OfflineBanner Component", () => {
  it("renders offline banner when client is offline", () => {
    vi.spyOn(TasksContext, "useIsOnline").mockReturnValue(false);

    render(<OfflineBanner />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Offline Mode — Changes saved to PouchDB/i)).toBeInTheDocument();
  });

  it("renders connected status with Sync Now button when recently reconnected", () => {
    vi.spyOn(TasksContext, "useIsOnline").mockReturnValue(true);

    render(<OfflineBanner />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Sync Now/i)).toBeInTheDocument();
  });

  it("triggers manual sync on Sync Now button click", () => {
    vi.spyOn(TasksContext, "useIsOnline").mockReturnValue(true);
    const syncSpy = vi.spyOn(tasksSync, "syncNow").mockResolvedValue([]);

    render(<OfflineBanner />);

    const syncBtn = screen.getByText(/Sync Now/i);
    fireEvent.click(syncBtn);

    expect(syncSpy).toHaveBeenCalled();
  });
});
