// frontend/src/pages/HomePage.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext.jsx";
import { ThemeProvider } from "../context/ThemeContext.jsx";
import HomePage from "./HomePage.jsx";

function renderHomePage() {
  return render(
    <MemoryRouter initialEntries={["/home"]}>
      <ThemeProvider>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe("HomePage Component", () => {
  it("renders the hero headline and introduction", async () => {
    renderHomePage();

    expect(
      screen.getByText(/Where High-Performing Teams/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/smart team collaboration and project management platform/i)
    ).toBeInTheDocument();
  });

  it("renders the eight strategic pillar features", () => {
    renderHomePage();

    expect(screen.getByText("Live Kanban Board")).toBeInTheDocument();
    expect(screen.getByText("Conflict Resolution (OCC)")).toBeInTheDocument();
    expect(screen.getByText("Offline Synchronization")).toBeInTheDocument();
    expect(screen.getByText("Team Chat")).toBeInTheDocument();
  });

  it("renders call-to-action buttons", () => {
    renderHomePage();

    expect(screen.getByRole("link", { name: /View Analytics Dashboard/i })).toBeInTheDocument();
  });
});
