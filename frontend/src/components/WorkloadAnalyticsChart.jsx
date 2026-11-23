// frontend/src/components/WorkloadAnalyticsChart.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import UserAvatar from "./UserAvatar.jsx";
import { fetchBoardAnalytics, fetchWorkspaceAnalytics } from "../api/analytics.js";

export default function WorkloadAnalyticsChart({ boardId, initialData }) {
  const [data, setData] = useState(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const promise = boardId ? fetchBoardAnalytics(boardId) : fetchWorkspaceAnalytics();

    promise
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load analytics");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [boardId, initialData]);

  if (isLoading) {
    return (
      <div className="analytics-card analytics-card--loading" style={{ padding: "28px 24px", textAlign: "center", opacity: 0.7 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Calculating team workload & productivity metrics…</p>
      </div>
    );
  }

  if (error || !data) {
    return null; // Silently degrade or show nothing if no boards yet
  }

  const { overview, employees = [] } = data;
  const { totalTasks = 0, completedTasks = 0, inProgressTasks = 0, pendingTasks = 0, overdueTasks = 0, completionRate = 0 } = overview || {};

  return (
    <div
      className="analytics-card"
      style={{
        background: "rgba(18, 20, 31, 0.65)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 16,
        padding: "24px 26px",
        marginTop: 20,
        marginBottom: 24,
        color: "#f1f5f9",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>📊</span>
            Workload &amp; Productivity Analytics
          </h3>
          <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8" }}>
            Real-time employee workload distribution, task completion velocity, and pending backlogs.
          </p>
        </div>

        {/* Global Progress Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(139, 111, 242, 0.12)",
            border: "1px solid rgba(139, 111, 242, 0.25)",
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span style={{ color: "#a78bfa" }}>Project Completion:</span>
          <span style={{ color: "#4ade80", fontSize: 14 }}>{completionRate}%</span>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div style={{ background: "rgba(255, 255, 255, 0.04)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Total Tasks</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc" }}>{totalTasks}</div>
        </div>
        <div style={{ background: "rgba(16, 185, 129, 0.08)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
          <div style={{ fontSize: 11, color: "#34d399", marginBottom: 4 }}>Completed</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#10b981" }}>{completedTasks}</div>
        </div>
        <div style={{ background: "rgba(56, 189, 248, 0.08)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(56, 189, 248, 0.2)" }}>
          <div style={{ fontSize: 11, color: "#38bdf8", marginBottom: 4 }}>In Progress</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#38bdf8" }}>{inProgressTasks}</div>
        </div>
        <div style={{ background: "rgba(139, 111, 242, 0.08)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(139, 111, 242, 0.2)" }}>
          <div style={{ fontSize: 11, color: "#a78bfa", marginBottom: 4 }}>Pending Backlog</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#c084fc" }}>{pendingTasks}</div>
        </div>
        <div style={{ background: "rgba(239, 68, 68, 0.08)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <div style={{ fontSize: 11, color: "#f87171", marginBottom: 4 }}>Overdue Tasks</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#ef4444" }}>{overdueTasks}</div>
        </div>
      </div>

      {/* Employee Breakdown Section */}
      <div>
        <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "#cbd5e1", letterSpacing: "0.02em" }}>
          Team Workload Distribution &amp; Productivity Scores
        </h4>

        {employees.length === 0 ? (
          <p style={{ fontSize: 12.5, color: "#94a3b8", margin: 0 }}>No team members assigned tasks yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {employees.map((emp) => {
              const completedWidth = emp.totalTasks ? (emp.completedTasks / emp.totalTasks) * 100 : 0;
              const inProgressWidth = emp.totalTasks ? (emp.inProgressTasks / emp.totalTasks) * 100 : 0;
              const pendingWidth = emp.totalTasks ? Math.max(0, 100 - completedWidth - inProgressWidth) : 0;

              const isHeavy = emp.workloadStatus === "Heavy Workload";
              const isModerate = emp.workloadStatus === "Moderate Workload";

              return (
                <div
                  key={emp.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: 12,
                    padding: "12px 16px",
                  }}
                >
                  {/* Member Info Row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <UserAvatar user={emp} name={emp.name} size={30} />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#f8fafc" }}>
                          {emp.name}
                          {emp.role === "owner" && (
                            <span style={{ fontSize: 10, background: "rgba(139, 111, 242, 0.2)", color: "#a78bfa", padding: "1px 6px", borderRadius: 10, marginLeft: 6 }}>
                              Lead
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                          {emp.totalTasks} total · {emp.completedTasks} done · {emp.pendingTasks} pending
                          {emp.overdueTasks > 0 && (
                            <span style={{ color: "#f87171", marginLeft: 4, fontWeight: 600 }}>
                              · {emp.overdueTasks} overdue
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* Workload Status Badge */}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: isHeavy
                            ? "rgba(239, 68, 68, 0.15)"
                            : isModerate
                            ? "rgba(245, 158, 11, 0.15)"
                            : "rgba(16, 185, 129, 0.15)",
                          color: isHeavy ? "#f87171" : isModerate ? "#fbbf24" : "#34d399",
                          border: `1px solid ${
                            isHeavy
                              ? "rgba(239, 68, 68, 0.3)"
                              : isModerate
                              ? "rgba(245, 158, 11, 0.3)"
                              : "rgba(16, 185, 129, 0.3)"
                          }`,
                        }}
                      >
                        {emp.workloadStatus}
                      </span>

                      {/* Productivity Score */}
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>
                        {emp.productivityScore}% Score
                      </span>
                    </div>
                  </div>

                  {/* Multi-segment Workload Bar */}
                  <div
                    style={{
                      height: 8,
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.08)",
                      borderRadius: 4,
                      overflow: "hidden",
                      display: "flex",
                    }}
                    title={`${emp.completedTasks} completed, ${emp.inProgressTasks} in progress, ${emp.pendingTasks} pending`}
                  >
                    {completedWidth > 0 && (
                      <div
                        style={{
                          width: `${completedWidth}%`,
                          background: "#10b981",
                          height: "100%",
                        }}
                      />
                    )}
                    {inProgressWidth > 0 && (
                      <div
                        style={{
                          width: `${inProgressWidth}%`,
                          background: "#38bdf8",
                          height: "100%",
                        }}
                      />
                    )}
                    {pendingWidth > 0 && (
                      <div
                        style={{
                          width: `${pendingWidth}%`,
                          background: "#8b6ff2",
                          height: "100%",
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
