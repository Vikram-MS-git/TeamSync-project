// frontend/src/components/WorkloadAnalyticsChart.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import WorkloadAnalyticsChart from "./WorkloadAnalyticsChart.jsx";

describe("WorkloadAnalyticsChart", () => {
  const sampleAnalyticsData = {
    overview: {
      totalTasks: 10,
      completedTasks: 6,
      inProgressTasks: 2,
      pendingTasks: 2,
      overdueTasks: 1,
      completionRate: 60,
    },
    employees: [
      {
        id: "user-1",
        name: "Alex Designer",
        email: "alex@teamsync.test",
        total: 5,
        completed: 3,
        inProgress: 1,
        pending: 1,
        overdue: 0,
        productivityScore: 60,
        workloadStatus: "Optimal Workload",
        color: "#6366f1",
      },
      {
        id: "user-2",
        name: "Sarah Engineer",
        email: "sarah@teamsync.test",
        total: 5,
        completed: 3,
        inProgress: 1,
        pending: 1,
        overdue: 1,
        productivityScore: 60,
        workloadStatus: "Overdue Attention Needed",
        color: "#ef4444",
      },
    ],
  };

  it("renders the KPI overview metrics correctly from initialData", () => {
    render(<WorkloadAnalyticsChart initialData={sampleAnalyticsData} />);

    expect(screen.getByText("Workload & Productivity Analytics")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("Total Tasks")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("renders employee workload distribution rows and status pills", () => {
    render(<WorkloadAnalyticsChart initialData={sampleAnalyticsData} />);

    expect(screen.getByText("Alex Designer")).toBeInTheDocument();
    expect(screen.getByText("Sarah Engineer")).toBeInTheDocument();
    expect(screen.getByText("Optimal Workload")).toBeInTheDocument();
    expect(screen.getByText("Overdue Attention Needed")).toBeInTheDocument();
  });
});
