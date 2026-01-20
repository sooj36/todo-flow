import type { ReactNode } from "react";
import { Node, Edge } from "reactflow";
import { TaskInstance, TaskTemplate } from "@/types";
import { loadNodePositions } from "./nodePositions";

export function calculateTemplateProgress(
  template: TaskTemplate,
  stepOverrides: Record<string, boolean>
) {
  const totals = template.flowSteps.reduce(
    (acc, step) => {
      const done = stepOverrides[step.id] ?? step.done;
      if (done) acc.done += 1;
      return acc;
    },
    { done: 0, total: template.flowSteps.length }
  );

  const percent =
    totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0;

  return { ...totals, percent };
}

export interface CreateFlowNodesProps {
  loading: boolean;
  error: string | null;
  instances: TaskInstance[];
  templates: TaskTemplate[];
  stepOverrides: Record<string, boolean>;
  stepUpdating: Record<string, boolean>;
  isConnected: boolean;
  handleToggleFlowStep: (stepId: string, nextDone: boolean, previousDone: boolean) => void | Promise<void | boolean>;
  icons: {
    trigger: ReactNode;
    aiAgent: ReactNode;
    notionDb: ReactNode;
  };
}

export function createFlowNodes({
  loading,
  error,
  instances,
  templates,
  stepOverrides,
  stepUpdating,
  isConnected,
  handleToggleFlowStep,
  icons,
}: CreateFlowNodesProps): { nodes: Node[]; edges: Edge[] } {
  const savedPositions = loadNodePositions();

  const nodes: Node[] = [
    {
      id: "daily-start",
      type: "customNode",
      position: savedPositions["daily-start"] || { x: 50, y: 100 },
      data: {
        title: "Daily Start",
        icon: icons.trigger,
        status: "idle",
        type: "Trigger",
      },
    },
    {
      id: "ai-reporter",
      type: "customNode",
      position: savedPositions["ai-reporter"] || { x: 350, y: 100 },
      data: {
        title: "AI Daily Reporter",
        icon: icons.aiAgent,
        status: "idle",
        type: "AI Agent",
      },
    },
  ];

  const edges: Edge[] = [
    {
      id: "e-start-reporter",
      source: "daily-start",
      target: "ai-reporter",
      type: "smoothstep",
      animated: false,
    },
  ];

  // Add Notion DB nodes dynamically
  if (!loading && !error && instances.length > 0 && templates.length > 0) {
    let yOffset = 50;
    templates.forEach((template) => {
      const templateInstances = instances.filter(inst => inst.templateId === template.id);
      if (templateInstances.length === 0) return;

      const completedCount = templateInstances.filter(inst => inst.status === 'done').length;
      const syncState = completedCount === templateInstances.length ? 'success' : 'idle';
      const status = templateInstances.some(inst => inst.status === 'doing') ? 'running' : 'idle';

      const nodeId = `notion-${template.id}`;

      const tasks = template.flowSteps.map((step) => {
        const done = stepOverrides[step.id] ?? step.done;
        return {
          id: step.id,
          name: step.name,
          done,
          isUpdating: Boolean(stepUpdating[step.id]),
        };
      });

      const progressTotals = calculateTemplateProgress(template, stepOverrides);

      nodes.push({
        id: nodeId,
        type: "customNode",
        position: savedPositions[nodeId] || { x: 700, y: yOffset },
        data: {
          title: template.name,
          icon: icons.notionDb,
          status,
          type: "Notion DB",
          isSyncable: true,
          syncState,
          progress: {
            done: progressTotals.done,
            total: progressTotals.total,
            percent: progressTotals.percent,
          },
          tasks,
          onToggleFlowStep: isConnected ? handleToggleFlowStep : undefined,
        },
      });

      edges.push({
        id: `e-reporter-${nodeId}`,
        source: "ai-reporter",
        target: nodeId,
        type: "smoothstep",
        animated: false,
      });

      yOffset += 250;
    });
  }

  return { nodes, edges };
}
