import type { Node, Edge } from "@xyflow/react";
import type { CraftingItem } from "../types";

export type HighlightState = "none" | "highlighted" | "dimmed";

export interface ItemNodeData {
  label: string;
  id: string;
  isCraftable: boolean;
  highlight: HighlightState;
  searchMatch: boolean;
  hasParents: boolean;
  hasChildren: boolean;
  [key: string]: unknown;
}

const NODE_WIDTH = 90;
const NODE_HEIGHT = 90;
const H_GAP = 20;
const V_GAP = 60;

/** Layout a set of nodes hierarchically based on the edges between them. */
export function layoutNodes(
  nodes: Node<ItemNodeData>[],
  edges: Edge[]
): Node<ItemNodeData>[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const relevantEdges = edges.filter(
    (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
  );

  // Build adjacency maps (only among visible nodes)
  const parents = new Map<string, Set<string>>();
  const children = new Map<string, Set<string>>();
  for (const edge of relevantEdges) {
    if (!parents.has(edge.target)) parents.set(edge.target, new Set());
    parents.get(edge.target)!.add(edge.source);
    if (!children.has(edge.source)) children.set(edge.source, new Set());
    children.get(edge.source)!.add(edge.target);
  }

  // Assign ranks via longest-path from roots (bottom-up)
  const rank = new Map<string, number>();

  function getRank(name: string, visited: Set<string>): number {
    if (rank.has(name)) return rank.get(name)!;
    if (visited.has(name)) return 0;
    visited.add(name);
    const deps = parents.get(name);
    if (!deps || deps.size === 0) {
      rank.set(name, 0);
      return 0;
    }
    let maxParentRank = 0;
    for (const dep of deps) {
      maxParentRank = Math.max(maxParentRank, getRank(dep, visited));
    }
    const r = maxParentRank + 1;
    rank.set(name, r);
    return r;
  }

  for (const node of nodes) {
    getRank(node.id, new Set());
  }

  // Pull up leaf nodes: place them just above their lowest child
  // so edges don't span many ranks through unrelated nodes
  for (const node of nodes) {
    const kids = children.get(node.id);
    if (!kids || kids.size === 0) continue;
    const myRank = rank.get(node.id) ?? 0;
    const minChildRank = Math.min(...[...kids].map((c) => rank.get(c) ?? 0));
    const idealRank = minChildRank - 1;
    if (idealRank > myRank) {
      rank.set(node.id, idealRank);
    }
  }

  // Group by rank
  const rankGroups = new Map<number, Node<ItemNodeData>[]>();
  for (const node of nodes) {
    const r = rank.get(node.id) ?? 0;
    if (!rankGroups.has(r)) rankGroups.set(r, []);
    rankGroups.get(r)!.push(node);
  }

  // Order nodes within ranks using barycenter heuristic to minimize crossings
  const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);

  // Initial ordering: alphabetical
  for (const r of sortedRanks) {
    rankGroups.get(r)!.sort((a, b) => a.id.localeCompare(b.id));
  }

  // Assign initial positions (index within rank) for barycenter calculation
  const pos = new Map<string, number>();
  function assignPositions() {
    for (const r of sortedRanks) {
      const group = rankGroups.get(r)!;
      for (let i = 0; i < group.length; i++) {
        pos.set(group[i].id, i);
      }
    }
  }
  assignPositions();

  // Barycenter: average position of connected nodes in adjacent rank
  function barycenter(nodeId: string, neighbors: Set<string> | undefined): number {
    if (!neighbors || neighbors.size === 0) return pos.get(nodeId) ?? 0;
    let sum = 0;
    let count = 0;
    for (const n of neighbors) {
      if (pos.has(n)) {
        sum += pos.get(n)!;
        count++;
      }
    }
    return count > 0 ? sum / count : (pos.get(nodeId) ?? 0);
  }

  // Sweep down then up, repeat several times
  for (let iter = 0; iter < 4; iter++) {
    // Sweep down: order each rank by barycenter of parents
    for (let i = 1; i < sortedRanks.length; i++) {
      const group = rankGroups.get(sortedRanks[i])!;
      group.sort((a, b) => barycenter(a.id, parents.get(a.id)) - barycenter(b.id, parents.get(b.id)));
      for (let j = 0; j < group.length; j++) {
        pos.set(group[j].id, j);
      }
    }
    // Sweep up: order each rank by barycenter of children
    for (let i = sortedRanks.length - 2; i >= 0; i--) {
      const group = rankGroups.get(sortedRanks[i])!;
      group.sort((a, b) => barycenter(a.id, children.get(a.id)) - barycenter(b.id, children.get(b.id)));
      for (let j = 0; j < group.length; j++) {
        pos.set(group[j].id, j);
      }
    }
  }

  // Position nodes row by row
  const positioned: Node<ItemNodeData>[] = [];

  for (const r of sortedRanks) {
    const group = rankGroups.get(r)!;
    const rowWidth = group.length * (NODE_WIDTH + H_GAP) - H_GAP;
    const startX = -rowWidth / 2;
    const y = r * (NODE_HEIGHT + V_GAP);
    for (let i = 0; i < group.length; i++) {
      positioned.push({
        ...group[i],
        position: { x: startX + i * (NODE_WIDTH + H_GAP), y },
      });
    }
  }

  return positioned;
}

export function buildGraph(items: CraftingItem[]): {
  nodes: Node<ItemNodeData>[];
  edges: Edge[];
} {
  const craftableNames = new Set(
    items.filter((i) => Object.keys(i.recipe).length > 0).map((i) => i.name)
  );
  const allNames = new Set<string>();

  for (const item of items) {
    allNames.add(item.name);
    for (const ingredient of Object.keys(item.recipe)) {
      allNames.add(ingredient);
    }
  }

  const edges: Edge[] = [];
  for (const item of items) {
    for (const [ingredient, qty] of Object.entries(item.recipe)) {
      edges.push({
        id: `${ingredient}->${item.name}`,
        source: ingredient,
        target: item.name,
        type: "default",
      });
    }
  }

  // Build name → id lookup
  const nameToId = new Map(items.map((i) => [i.name, i.id]));
  function toId(name: string): string {
    return nameToId.get(name) ?? name.toLowerCase().replace(/[' ]/g, "-").replace(/--+/g, "-");
  }

  // Track which nodes have incoming/outgoing edges
  const hasParentsSet = new Set<string>();
  const hasChildrenSet = new Set<string>();
  for (const edge of edges) {
    hasParentsSet.add(edge.target);
    hasChildrenSet.add(edge.source);
  }

  const nodes: Node<ItemNodeData>[] = Array.from(allNames).map((name) => ({
    id: name,
    type: "itemNode",
    position: { x: 0, y: 0 },
    data: {
      label: name,
      id: toId(name),
      isCraftable: craftableNames.has(name),
      highlight: "none" as HighlightState,
      searchMatch: false,
      hasParents: hasParentsSet.has(name),
      hasChildren: hasChildrenSet.has(name),
    },
  }));

  return { nodes: layoutNodes(nodes, edges), edges };
}
