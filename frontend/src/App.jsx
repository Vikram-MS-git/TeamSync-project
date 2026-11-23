// App.jsx
import { useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import CommandPalette from "./components/CommandPalette";
import { TaskConflictBanner } from "./components/TaskConflictBanner";
import { OfflineBanner } from "./components/OfflineBanner";
import { useAuth } from "./context/AuthContext";
import { TasksProvider } from "./context/TasksContext";
import { BoardsProvider } from "./context/BoardsContext";
import { SocketProvider } from "./context/SocketContext";
import { UsersProvider } from "./context/UsersContext";
import { InvitationsProvider } from "./context/InvitationsContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import BoardsListPage from "./pages/BoardsListPage";
import BoardPage from "./pages/BoardPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import DashboardPage from "./pages/DashboardPage";
import MyTasksPage from "./pages/MyTasksPage";
import TeamPage from "./pages/TeamPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

function App() {
  const location = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);
  const isDashboard = location.pathname === "/dashboard";
  const { isAuthenticated, isLoading } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);


  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    );
  }


  if (isLoading) {
    return <div className="app-loading">Loading…</div>;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <BoardsProvider>
      <SocketProvider>
      <InvitationsProvider>
      <NotificationsProvider>
      <TasksProvider>
        <UsersProvider>
          <div className="app app--horizontal">
            <Navbar onOpenSearch={() => setIsSearchOpen(true)} />
            <main className={`app__main ${isDashboard ? "app__main--dashboard" : ""}`}>
              <Routes>
                <Route path="/" element={<BoardsListPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/boards" element={<BoardsListPage />} />
                <Route path="/boards/:boardId" element={<BoardPage />} />
                <Route path="/tasks/:id" element={<TaskDetailPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/my-tasks" element={<MyTasksPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <CommandPalette isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
            <TaskConflictBanner />
            <OfflineBanner />
          </div>
        </UsersProvider>
      </TasksProvider>
      </NotificationsProvider>
      </InvitationsProvider>
      </SocketProvider>
    </BoardsProvider>
  );
}

export default App;