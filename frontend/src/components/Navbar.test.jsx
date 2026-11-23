// frontend/src/components/Navbar.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import * as AuthContext from "../context/AuthContext";
import * as ThemeContext from "../context/ThemeContext";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../context/ThemeContext", () => ({
  useTheme: vi.fn(),
}));

vi.mock("../context/InvitationsContext", () => ({
  useInvitations: () => ({ invitations: [] }),
  useInvitationsActions: () => ({ respond: vi.fn() }),
}));

vi.mock("../context/NotificationsContext", () => ({
  useNotifications: () => ({ notifications: [], unreadCount: 0 }),
  useNotificationsActions: () => ({ markRead: vi.fn(), markAllRead: vi.fn() }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => vi.fn(),
}));

describe("Navbar Horizontal Component", () => {
  beforeEach(() => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      user: { id: "u-1", name: "Alex Admin", email: "alex@teamsync.dev" },
      logout: vi.fn(),
    });
    vi.spyOn(ThemeContext, "useTheme").mockReturnValue({
      theme: "dark",
      toggleTheme: vi.fn(),
    });
  });

  it("renders brand name and all main navigation items", () => {
    render(
      <BrowserRouter>
        <Navbar onOpenSearch={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText("TeamSync")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Boards")).toBeInTheDocument();
    expect(screen.getByText("My Tasks")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("invokes onOpenSearch when the quick search button is clicked", () => {
    const searchSpy = vi.fn();
    render(
      <BrowserRouter>
        <Navbar onOpenSearch={searchSpy} />
      </BrowserRouter>
    );

    const searchBtn = screen.getByText(/Quick search…/i).closest("button");
    fireEvent.click(searchBtn);

    expect(searchSpy).toHaveBeenCalled();
  });
});
