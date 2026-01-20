import React, { useState } from "react";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NotionCalendar } from "./NotionCalendar";
import { FlowBoard } from "../flow/FlowBoard";
import { TaskInstance, TaskStatus, TaskTemplate } from "@/types";

let templates: TaskTemplate[] = [];
let instances: TaskInstance[] = [];

const refetchInstances = vi.fn().mockResolvedValue({ success: true });
const refetchTemplates = vi.fn().mockResolvedValue({ success: true });

vi.mock("@/hooks/useTaskInstances", () => ({
  useTaskInstances: (date?: string) => {
    const filtered = date
      ? instances.filter((inst) => inst.date === date)
      : instances;
    return {
      instances: filtered,
      loading: false,
      error: null,
      refetch: refetchInstances,
    };
  },
}));

vi.mock("@/hooks/useTaskTemplates", () => ({
  useTaskTemplates: () => ({
    templates,
    loading: false,
    error: null,
    refetch: refetchTemplates,
  }),
}));

// Mock ReactFlow to render nodes without canvas
vi.mock("reactflow", () => ({
  __esModule: true,
  default: ({ children, nodes = [], nodeTypes = {} }: any) => (
    <div data-testid="react-flow">
      {nodes.map((node: any) => {
        const Component = nodeTypes[node.type];
        return Component ? <Component key={node.id} id={node.id} data={node.data} /> : null;
      })}
      {children}
    </div>
  ),
  Controls: () => <div>Controls</div>,
  Background: () => <div>Background</div>,
  MiniMap: () => <div>MiniMap</div>,
  useNodesState: (initial: any) => [initial, vi.fn(), vi.fn()],
  useEdgesState: (initial: any) => [initial, vi.fn(), vi.fn()],
  BackgroundVariant: { Dots: "dots" },
  Handle: () => <div>Handle</div>,
  Position: { Left: "left", Right: "right" },
}));

const createTemplate = (id: string, name: string, stepName: string): TaskTemplate => ({
  id,
  name,
  icon: "📌",
  color: "blue",
  isRepeating: false,
  defaultFrequency: "daily",
  active: true,
  flowSteps: [
    {
      id: `${id}-step`,
      name: stepName,
      order: 1,
      parentTemplateId: id,
      done: false,
    },
  ],
});

const buildFixtures = () => {
  templates = [
    createTemplate("template-1", "Template 1", "T1 Step"),
    createTemplate("template-2", "Template 2", "T2 Step"),
    createTemplate("template-3", "Template 3", "T3 Step"),
    createTemplate("template-4", "Template 4", "T4 Step"),
    createTemplate("template-5", "Template 5", "T5 Step"),
  ];

  const sharedInstanceFields = {
    status: "todo" as TaskStatus,
    currentStepId: null,
    completedStepIds: [],
    createdAt: "2026-01-10T00:00:00Z",
    completedAt: null,
  };

  instances = [
    {
      id: "instance-1",
      templateId: "template-1",
      template: templates[0],
      date: "2026-01-10",
      ...sharedInstanceFields,
    },
    {
      id: "instance-2",
      templateId: "template-2",
      template: templates[1],
      date: "2026-01-10",
      ...sharedInstanceFields,
    },
    {
      id: "instance-3",
      templateId: "template-3",
      template: templates[2],
      date: "2026-01-10",
      ...sharedInstanceFields,
    },
    {
      id: "instance-4",
      templateId: "template-4",
      template: templates[3],
      date: "2026-01-10",
      ...sharedInstanceFields,
    },
    {
      id: "instance-5",
      templateId: "template-5",
      template: templates[4],
      date: "2026-01-10",
      ...sharedInstanceFields,
    },
    {
      id: "instance-other",
      templateId: "template-1",
      template: templates[0],
      date: "2026-01-11",
      ...sharedInstanceFields,
    },
  ];
};

const CalendarFlowHarness = () => {
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 0, 10));
  const [overrides, setOverrides] = useState<Record<string, TaskStatus>>({});
  const [templateProgress, setTemplateProgress] = useState<Record<string, { done: number; total: number }>>({});
  const [dayStepProgressOverrides, setDayStepProgressOverrides] = useState<Record<string, { completed: number; total: number }>>({});

  const handleInstanceStatusChange = (updates: Array<{ instanceId: string; status: TaskStatus }>) => {
    setOverrides((prev) => {
      const next = { ...prev };
      updates.forEach(({ instanceId, status }) => {
        next[instanceId] = status;
      });
      return next;
    });
  };

  return (
    <>
      <NotionCalendar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        instanceStatusOverrides={overrides}
        templateProgress={templateProgress}
        dayStepProgressOverrides={dayStepProgressOverrides}
      />
      <FlowBoard
        selectedDate={selectedDate}
        instanceStatusOverrides={overrides}
        onInstanceStatusChange={handleInstanceStatusChange}
        onTemplateProgressChange={setTemplateProgress}
        onDayStepProgressChange={(date, progress) =>
          setDayStepProgressOverrides((prev) => ({ ...prev, [date]: progress }))
        }
      />
    </>
  );
};

describe("Calendar + FlowBoard percent sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildFixtures();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("updates selected date percent as flow steps complete", async () => {
    render(<CalendarFlowHarness />);

    const day10 = screen.getByTestId("calendar-day-10");
    expect(within(day10).getByText("0/5 steps")).toBeInTheDocument();
    expect(within(day10).getByText("0%")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("T1 Step 완료"));

    await waitFor(() => {
      const updated = screen.getByTestId("calendar-day-10");
      expect(within(updated).getByText("1/5 steps")).toBeInTheDocument();
      expect(within(updated).getByText("20%")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("T2 Step 완료"));

    await waitFor(() => {
      const updated = screen.getByTestId("calendar-day-10");
      expect(within(updated).getByText("2/5 steps")).toBeInTheDocument();
      expect(within(updated).getByText("40%")).toBeInTheDocument();
    });
  });

  it("rolls back calendar percent when flow step toggle fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "fail" }),
    });

    render(<CalendarFlowHarness />);

    fireEvent.click(screen.getByLabelText("T1 Step 완료"));

    await waitFor(() => {
      const day10 = screen.getByTestId("calendar-day-10");
      expect(within(day10).getByText("0/5 steps")).toBeInTheDocument();
      expect(within(day10).getByText("0%")).toBeInTheDocument();
    });
  });

  it("does not mutate other dates when toggling current day", async () => {
    render(<CalendarFlowHarness />);

    const otherDay = screen.getByTestId("calendar-day-11");
    expect(within(otherDay).getByText("0/1 steps")).toBeInTheDocument();
    expect(within(otherDay).getByText("0%")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("T1 Step 완료"));

    await waitFor(() => {
      const day10 = screen.getByTestId("calendar-day-10");
      expect(within(day10).getByText("1/5 steps")).toBeInTheDocument();
      expect(within(day10).getByText("20%")).toBeInTheDocument();
    });

    const otherDayAfter = screen.getByTestId("calendar-day-11");
    expect(within(otherDayAfter).getByText("0/1 steps")).toBeInTheDocument();
    expect(within(otherDayAfter).getByText("0%")).toBeInTheDocument();
  });
});
