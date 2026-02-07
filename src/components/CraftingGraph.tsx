import { useMemo, useEffect, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  useReactFlow,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import type { Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { CraftingItem } from "../types";
import { buildGraph, layoutNodes } from "../utils/graphBuilder";
import type { ItemNodeData, HighlightState } from "../utils/graphBuilder";
import ItemNode from "./ItemNode";

const nodeTypes = { itemNode: ItemNode };

interface CraftingGraphProps {
  items: CraftingItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNodeSelect: (name: string | null) => void;
}

function getMatchingNames(
  allNames: string[],
  query: string
): Set<string> {
  if (!query.trim()) return new Set();
  const q = query.toLowerCase();
  return new Set(allNames.filter((name) => name.toLowerCase() === q));
}

/** Walk edges in both directions to collect the full connected subtree. */
function collectConnected(
  seeds: Set<string>,
  edges: Edge[]
): Set<string> {
  const ingredientOf = new Map<string, Set<string>>();
  const madeFrom = new Map<string, Set<string>>();

  for (const edge of edges) {
    if (!ingredientOf.has(edge.source)) ingredientOf.set(edge.source, new Set());
    ingredientOf.get(edge.source)!.add(edge.target);
    if (!madeFrom.has(edge.target)) madeFrom.set(edge.target, new Set());
    madeFrom.get(edge.target)!.add(edge.source);
  }

  const visible = new Set<string>();
  const visitedDown = new Set<string>();
  const visitedUp = new Set<string>();

  function walkDown(name: string) {
    if (visitedDown.has(name)) return;
    visitedDown.add(name);
    visible.add(name);
    const children = ingredientOf.get(name);
    if (children) for (const child of children) walkDown(child);
  }

  function walkUp(name: string) {
    if (visitedUp.has(name)) return;
    visitedUp.add(name);
    visible.add(name);
    const parents = madeFrom.get(name);
    if (parents) for (const parent of parents) walkUp(parent);
  }

  for (const seed of seeds) {
    walkDown(seed);
    walkUp(seed);
  }

  return visible;
}

/** Collect connected nodes and edges for highlighting. */
function collectConnectedEdges(
  seeds: Set<string>,
  edges: Edge[]
): { nodes: Set<string>; edges: Set<string> } {
  const ingredientOf = new Map<string, { node: string; edgeId: string }[]>();
  const madeFrom = new Map<string, { node: string; edgeId: string }[]>();

  for (const edge of edges) {
    if (!ingredientOf.has(edge.source)) ingredientOf.set(edge.source, []);
    ingredientOf.get(edge.source)!.push({ node: edge.target, edgeId: edge.id });
    if (!madeFrom.has(edge.target)) madeFrom.set(edge.target, []);
    madeFrom.get(edge.target)!.push({ node: edge.source, edgeId: edge.id });
  }

  const highlightedNodes = new Set<string>();
  const highlightedEdges = new Set<string>();
  const visitedDown = new Set<string>();
  const visitedUp = new Set<string>();

  function walkDown(name: string) {
    if (visitedDown.has(name)) return;
    visitedDown.add(name);
    highlightedNodes.add(name);
    const children = ingredientOf.get(name);
    if (children) {
      for (const { node, edgeId } of children) {
        highlightedEdges.add(edgeId);
        walkDown(node);
      }
    }
  }

  function walkUp(name: string) {
    if (visitedUp.has(name)) return;
    visitedUp.add(name);
    highlightedNodes.add(name);
    const parents = madeFrom.get(name);
    if (parents) {
      for (const { node, edgeId } of parents) {
        highlightedEdges.add(edgeId);
        walkUp(node);
      }
    }
  }

  for (const seed of seeds) {
    walkDown(seed);
    walkUp(seed);
  }

  return { nodes: highlightedNodes, edges: highlightedEdges };
}

function CraftingGraphInner({
  items,
  searchQuery,
  onSearchChange,
  onNodeSelect,
}: CraftingGraphProps) {
  const { fitView } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { allNodes, allEdges } = useMemo(() => {
    const { nodes, edges } = buildGraph(items);
    return { allNodes: nodes, allEdges: edges };
  }, [items]);

  const allNames = useMemo(() => allNodes.map((n) => n.id), [allNodes]);

  // Compute visible nodes + edges based on search, re-laid-out
  const { layoutedNodes, layoutedEdges, matchCount } = useMemo(() => {
    const hasSearch = searchQuery.trim().length > 0;

    if (!hasSearch) {
      return { layoutedNodes: allNodes, layoutedEdges: allEdges, matchCount: 0 };
    }

    const matches = getMatchingNames(allNames, searchQuery);
    const connected = collectConnected(matches, allEdges);

    const filteredNodes = allNodes
      .filter((n) => connected.has(n.id))
      .map((n) => ({
        ...n,
        data: { ...n.data, searchMatch: matches.has(n.id) },
      }));
    const filteredEdges = allEdges.filter(
      (e) => connected.has(e.source) && connected.has(e.target)
    );

    return {
      layoutedNodes: layoutNodes(filteredNodes, filteredEdges),
      layoutedEdges: filteredEdges,
      matchCount: matches.size,
    };
  }, [searchQuery, allNodes, allEdges, allNames]);

  // Use state hooks so nodes are draggable
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Sync when layout changes (search/filter)
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  // Clear selection when search changes
  useEffect(() => {
    setSelectedNode(null);
  }, [searchQuery]);

  // Apply click highlighting to nodes and edges
  const displayNodes = useMemo(() => {
    if (!selectedNode) return nodes;

    const { nodes: hlNodes } = collectConnectedEdges(
      new Set([selectedNode]),
      edges
    );

    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        highlight: (hlNodes.has(node.id) ? "highlighted" : "dimmed") as HighlightState,
      },
    }));
  }, [nodes, edges, selectedNode]);

  const displayEdges = useMemo(() => {
    if (!selectedNode) return edges;

    const { edges: hlEdges } = collectConnectedEdges(
      new Set([selectedNode]),
      edges
    );

    return edges.map((edge) => ({
      ...edge,
      style: hlEdges.has(edge.id)
        ? { stroke: "#94a3b8", strokeWidth: 1.5, pointerEvents: "none" as const }
        : { stroke: "#4b5563", strokeWidth: 1, opacity: 0.08, pointerEvents: "none" as const },
    }));
  }, [edges, selectedNode]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode((prev) => {
        const next = prev === node.id ? null : node.id;
        onNodeSelect(next);
        return next;
      });
    },
    [onNodeSelect]
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSearchChange(node.id);
      setSelectedNode(null);
    },
    [onSearchChange]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    onNodeSelect(null);
  }, [onNodeSelect]);

  // Fit view when layout changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      fitView({ duration: 300, padding: 0.2 });
    }, 50);
    return () => clearTimeout(timeout);
  }, [layoutedNodes, fitView]);

  return (
    <ReactFlow
      nodes={displayNodes}
      edges={displayEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      onNodeDoubleClick={onNodeDoubleClick}
      onPaneClick={onPaneClick}
      fitView
      minZoom={0.05}
      maxZoom={2}
      edgesFocusable={false}
      edgesReconnectable={false}
      defaultEdgeOptions={{
        style: { stroke: "#4b5563", strokeWidth: 1, pointerEvents: "none" },
      }}
    >
      <Background color="#374151" gap={20} />
    </ReactFlow>
  );
}

export default function CraftingGraph(props: CraftingGraphProps) {
  return <CraftingGraphInner {...props} />;
}
