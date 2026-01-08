"use client";

import React, { useCallback, useMemo } from "react";
import {
  Play,
  Plus,
  Zap,
  Cpu,
  Briefcase,
  Database,
  Loader2,
  RefreshCw,
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
import { createFlowNodes } from "@/utils/flowNodes";
import { useFlowSync } from "@/hooks/useFlowSync";
import { useFlowSteps } from "@/hooks/useFlowSteps";
import { CustomFlowNode } from "./CustomFlowNode";

// Helper function to get local date in YYYY-MM-DD format
function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const FlowBoard: React.FC = () => {
  const today = getLocalDateString();
  const { instances, loading: instancesLoading, error: instancesError, refetch: refetchInstances } = useTaskInstances(today);
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

  const loading = instancesLoading || templatesLoading;
  const error = instancesError || templatesError;
  const isConnected = !loading && !error;

  // Create nodes and edges for React Flow
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return createFlowNodes({
      loading,
      error,
      instances,
      templates,
      stepOverrides,
      stepUpdating,
      isConnected,
      handleToggleFlowStep,
      icons: {
        trigger: <Zap className="text-orange-500" size={16} />,
        aiAgent: <Cpu className="text-purple-500" size={16} />,
        notionDb: <Briefcase className="text-blue-500" size={16} />,
      },
    });
  }, [loading, error, instances, templates, stepOverrides, stepUpdating, isConnected, handleToggleFlowStep]);

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
      <div className="p-4 flex items-center justify-between bg-white/80 backdrop-blur-sm border-b border-[#ececeb] z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded flex items-center justify-center">
            <Zap size={18} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#37352f]">
              Daily Automation Flow
            </h2>
            <div className="flex items-center gap-2">
              {loading && (
                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <Loader2 size={12} className="animate-spin" />
                  Loading...
                </span>
              )}
              {error && (
                <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold uppercase tracking-wider">
                  <AlertCircle size={12} />
                  Connection error
                </span>
              )}
              {!loading && !error && (
                <span
                  className={`flex items-center gap-1 text-[10px] font-bold tracking-wide ${isConnected
                    ? "rounded-full bg-green-100 px-2 py-0.5 text-green-700"
                    : "text-gray-400"
                    }`}
                >
                  <span className={`w-1.5 h-1.5 ${isConnected ? 'bg-green-500' : 'bg-gray-300'} rounded-full`}></span>
                  {isConnected ? 'notion connect success' : 'Notion not connected'}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Aria-live region for screen readers */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {isSyncing && "Syncing with Notion..."}
            {syncSuccess && "Sync completed successfully"}
            {syncError && syncErrorMessage && `Sync failed: ${syncErrorMessage}`}
          </div>

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold ${isConnected
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-600"
              }`}
          >
            <Play size={14} fill="currentColor" />
            {isConnected ? "notion connect success" : "Configure .env.local"}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={!isConnected || isSyncing}
              className={`p-2 border border-[#ececeb] rounded-md transition-all ${syncSuccess
                ? "bg-green-100 text-green-600"
                : syncError
                  ? "bg-red-100 text-red-600"
                  : "bg-white text-[#37352f]/60 hover:text-[#37352f]"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={syncError && syncErrorMessage ? `Sync failed: ${syncErrorMessage}` : "Sync with Notion"}
            >
              <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
            </button>
            {syncError && syncErrorMessage && (
              <span className="text-xs text-red-600 font-medium max-w-xs truncate" title={syncErrorMessage}>
                {syncErrorMessage}
              </span>
            )}
          </div>
          <button className="p-2 bg-white border border-[#ececeb] rounded-md text-[#37352f]/60 hover:text-[#37352f] transition-all">
            <Plus size={16} />
          </button>
        </div>
      </div>

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
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
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
              border: "1px solid #ececeb",
            }}
          />
        </ReactFlow>
      </div>

      <div className="p-4 border-t border-[#ececeb] bg-white flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px] font-bold">
            <Database size={12} />
            DATABASE ID: —
          </div>
          <div className="text-[11px] text-gray-400">
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
