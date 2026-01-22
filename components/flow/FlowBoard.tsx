"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Zap,
  Cpu,
  Briefcase,
  Database,
} from "lucide-react";
import ReactFlow, {
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { useTaskInstances } from "@/hooks/useTaskInstances";
import { useTaskTemplates } from "@/hooks/useTaskTemplates";
import { loadNodePositions, saveNodePositions } from "@/utils/nodePositions";
import { applyInstanceStatusOverrides } from "@/utils/taskInstances";
import { createFlowNodes, calculateTemplateProgress } from "@/utils/flowNodes";
import { useFlowSync } from "@/hooks/useFlowSync";
import { useFlowSteps } from "@/hooks/useFlowSteps";
import { CustomFlowNode } from "./CustomFlowNode";
import { FlowBoardHeader } from "./FlowBoardHeader";
import { TaskStatus } from "@/types";


interface FlowBoardProps {
  selectedDate?: Date;
  refreshTrigger?: number;
  instanceStatusOverrides?: Record<string, TaskStatus>;
  onInstanceStatusChange?: (updates: Array<{ instanceId: string; status: TaskStatus }>) => void;
  onTemplateProgressChange?: (progress: Record<string, { done: number; total: number }>) => void;
  onDayStepProgressChange?: (date: string, progress: { completed: number; total: number }) => void;
}

export const FlowBoard: React.FC<FlowBoardProps> = ({
  selectedDate = new Date(),
  refreshTrigger,
  instanceStatusOverrides,
  onInstanceStatusChange,
  onTemplateProgressChange,
  onDayStepProgressChange,
}) => {
  // Helper function to format Date to YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dateString = formatDateString(selectedDate);
  const { instances, loading: instancesLoading, error: instancesError, refetch: refetchInstances } = useTaskInstances(dateString);
  const { templates, loading: templatesLoading, error: templatesError, refetch: refetchTemplates } = useTaskTemplates();

  const {
    isSyncing,
    syncSuccess,
    syncError,
    syncErrorMessage,
    handleSync,
    syncTimeoutRef,
    setSyncError,
    setSyncSuccess,
    setSyncErrorMessage,
  } = useFlowSync({
    refetchInstances,
    refetchTemplates,
  });

  const { stepOverrides, stepUpdating, handleToggleFlowStep } = useFlowSteps({
    templates,
    syncTimeoutRef,
    setSyncError,
    setSyncSuccess,
    setSyncErrorMessage,
  });

  // Refetch templates when triggered by parent (e.g., after task creation in calendar)
  const prevRefreshTrigger = useRef(refreshTrigger);
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger !== prevRefreshTrigger.current) {
      prevRefreshTrigger.current = refreshTrigger;
      refetchTemplates();
      refetchInstances();
    }
  }, [refreshTrigger, refetchTemplates, refetchInstances]);

  const loading = instancesLoading || templatesLoading;
  const error = instancesError || templatesError;
  const isConnected = !loading && !error;

  const effectiveInstances = useMemo(
    () => applyInstanceStatusOverrides(instances, instanceStatusOverrides),
    [instances, instanceStatusOverrides]
  );
  const dayProgressRef = useRef<Record<string, { completed: number; total: number }>>({});

  const templateProgressMap = useMemo(() => {
    return templates.reduce<Record<string, { done: number; total: number }>>(
      (acc, template) => {
        acc[template.id] = calculateTemplateProgress(template, stepOverrides);
        return acc;
      },
      {}
    );
  }, [templates, stepOverrides]);

  useEffect(() => {
    if (onTemplateProgressChange) {
      onTemplateProgressChange(templateProgressMap);
    }
  }, [templateProgressMap, onTemplateProgressChange]);

  useEffect(() => {
    if (!onDayStepProgressChange) return;
    const aggregated = effectiveInstances.reduce(
      (acc, instance) => {
        const progress = calculateTemplateProgress(instance.template, stepOverrides);
        acc.completed += progress.done;
        acc.total += progress.total;
        return acc;
      },
      { completed: 0, total: 0 }
    );
    const prev = dayProgressRef.current[dateString];
    if (!prev || prev.completed !== aggregated.completed || prev.total !== aggregated.total) {
      dayProgressRef.current[dateString] = aggregated;
      onDayStepProgressChange(dateString, aggregated);
    }
  }, [onDayStepProgressChange, effectiveInstances, dateString, stepOverrides]);

  const handleFlowStepToggleWithStatus = useCallback(
    async (stepId: string, nextDone: boolean, previousDone: boolean) => {
      const success = await handleToggleFlowStep(stepId, nextDone, previousDone);
      if (!success) return;

      const template = templates.find((tpl) =>
        tpl.flowSteps.some((step) => step.id === stepId)
      );
      if (!template || !onInstanceStatusChange) return;

      const progress = calculateTemplateProgress(template, {
        ...stepOverrides,
        [stepId]: nextDone,
      });

      const status: TaskStatus =
        progress.done === progress.total
          ? "done"
          : progress.done > 0
          ? "doing"
          : "todo";

      const relatedInstances = effectiveInstances.filter(
        (instance) => instance.templateId === template.id
      );

      if (relatedInstances.length === 0) return;

      if (onTemplateProgressChange) {
        const nextOverrides = { ...stepOverrides, [stepId]: nextDone };
        const nextProgress = templates.reduce<Record<string, { done: number; total: number }>>(
          (acc, tpl) => {
            acc[tpl.id] = calculateTemplateProgress(tpl, nextOverrides);
            return acc;
          },
          {}
        );
        onTemplateProgressChange(nextProgress);

        if (onDayStepProgressChange) {
          const aggregated = effectiveInstances.reduce(
            (acc, instance) => {
              const tplProgress = calculateTemplateProgress(instance.template, {
                ...stepOverrides,
                [stepId]: nextDone,
              });
              const progress = nextProgress[instance.templateId] || tplProgress;
              acc.completed += progress?.done ?? 0;
              acc.total += progress?.total ?? 0;
              return acc;
            },
            { completed: 0, total: 0 }
          );
          onDayStepProgressChange(dateString, aggregated);
        }
      }

      onInstanceStatusChange(
        relatedInstances.map((instance) => ({
          instanceId: instance.id,
          status,
        }))
      );
    },
    [handleToggleFlowStep, templates, onInstanceStatusChange, stepOverrides, effectiveInstances, onTemplateProgressChange, onDayStepProgressChange, dateString]
  );

  // Create nodes and edges for React Flow
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return createFlowNodes({
      loading,
      error,
      instances: effectiveInstances,
      templates,
      stepOverrides,
      stepUpdating,
      isConnected,
      handleToggleFlowStep: handleFlowStepToggleWithStatus,
      icons: {
        trigger: <Zap className="text-orange-500" size={16} />,
        aiAgent: <Cpu className="text-purple-500" size={16} />,
        notionDb: <Briefcase className="text-blue-500" size={16} />,
      },
    });
  }, [loading, error, effectiveInstances, templates, stepOverrides, stepUpdating, isConnected, handleFlowStepToggleWithStatus]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when data changes, preserving user-dragged positions
  React.useEffect(() => {
    setNodes((currentNodes) => {
      const nodeMap = new Map(currentNodes.map(n => [n.id, n]));

      return initialNodes.map(newNode => {
        const existingNode = nodeMap.get(newNode.id);
        // Keep existing position if node already exists (user may have dragged it)
        if (existingNode) {
          return {
            ...newNode,
            position: existingNode.position,
          };
        }
        return newNode;
      });
    });
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Save node positions to localStorage when they change
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);

    // Extract position changes and save to localStorage
    const positionChanges = changes.filter((c: any) => c.type === 'position' && c.dragging === false);
    if (positionChanges.length > 0) {
      setNodes((nds) => {
        const positions = nds.reduce((acc, node) => {
          acc[node.id] = node.position;
          return acc;
        }, {} as Record<string, { x: number; y: number }>);
        saveNodePositions(positions);
        return nds;
      });
    }
  }, [onNodesChange, setNodes]);

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      customNode: CustomFlowNode,
    }),
    []
  );

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <FlowBoardHeader
        loading={loading}
        error={error}
        isConnected={isConnected}
        isSyncing={isSyncing}
        syncSuccess={syncSuccess}
        syncError={syncError}
        syncErrorMessage={syncErrorMessage}
        handleSync={handleSync}
      />

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e6e2f3" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(node) => {
              if (node.data.status === "running") return "#3b82f6";
              if (node.data.status === "success") return "#10b981";
              if (node.data.status === "error") return "#ef4444";
              return "#9ca3af";
            }}
            maskColor="rgba(0, 0, 0, 0.05)"
            style={{
              backgroundColor: "white",
              border: "1px solid #e6e2f3",
            }}
          />
        </ReactFlow>
      </div>

      <div className="p-4 border-t border-[#ececeb] bg-white flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f6f4ff] text-secondary rounded-full text-[10px] font-bold shadow-sm">
            <Database size={12} />
            DATABASE ID: —
          </div>
          <div className="text-[11px] text-secondary">
            Auto-save disabled until connected
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <div className="w-2 h-2 rounded-full bg-orange-500 opacity-30"></div>
          <div className="w-2 h-2 rounded-full bg-red-500 opacity-30"></div>
        </div>
      </div>
    </div>
  );
};
