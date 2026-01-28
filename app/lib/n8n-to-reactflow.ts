// lib/n8n-to-reactflow.ts
import type { Edge, Node } from "reactflow";
import dagre from "dagre";

type N8NNode = {
  id?: string;
  name: string;
  type?: string;
  typeVersion?: number;
  position?: [number, number];
  parameters?: any;
};

type N8NConnectionItem = {
  node: string;      // target node name
  type?: string;     // usually "main"
  index?: number;    // target input index
};

type N8NWorkflow = {
  nodes?: N8NNode[];
  connections?: Record<
    string,
    Record<string, Array<Array<N8NConnectionItem>>>
  >;
};

export function n8nToReactFlow(
  wf: N8NWorkflow,
  iconMap: Record<string, string> = {},
): { nodes: Node[]; edges: Edge[] } {
  const conns = wf.connections || {};
  const nodeWidth = 220;
  const nodeHeight = 96;

  // 1) source별 outputCount 계산 (main-0, main-1… 포트 개수)
  const outputCountMap = new Map<string, number>();
  for (const sourceName of Object.keys(conns)) {
    const byType = conns[sourceName] || {};
    let maxOut = 0;

    for (const connType of Object.keys(byType)) {
      const outputs = byType[connType] || [];
      // outputs 인덱스 자체가 outIndex
      maxOut = Math.max(maxOut, Math.max(0, outputs.length - 1));
    }
    outputCountMap.set(sourceName, Math.max(1, maxOut + 1));
  }

  // 2) nodes 변환 (커스텀 노드 타입 지정 + outputCount 넣기)
  const nodes: Node[] = (wf.nodes || []).map((n) => {
    const [x, y] = n.position ?? [0, 0];
    return {
      id: n.name,
      type: "n8n", // ⭐️ 커스텀 노드 사용
      position: { x, y },
      data: {
        label: n.name,
        type: n.type,
        typeVersion: n.typeVersion,
        parameters: n.parameters,
        disabled: (n as any).disabled ?? false,
        outputCount: outputCountMap.get(n.name) ?? 1, // ⭐️ 포트 개수
        icon: iconMap[n.type || ""] || null,
        raw: n,
      },
    };
  });

   // 3) edges 변환 (sourceHandle을 커스텀 노드의 Handle id와 맞추기)
  const edges: Edge[] = [];
  for (const sourceName of Object.keys(conns)) {
    const byType = conns[sourceName] || {};
    for (const connType of Object.keys(byType)) {
      const outputs = byType[connType] || [];
      outputs.forEach((targets, outIndex) => {
        (targets || []).forEach((t, idx) => {
          const targetName = t.node;
          const targetIndex = typeof t.index === "number" ? t.index : 0;

          edges.push({
            id: `${sourceName}:${connType}:${outIndex}:${idx}->${targetName}:${targetIndex}`,
            source: sourceName,
            target: targetName,
            // ⭐️ N8nNode.tsx에서 id={`main-${i}`}로 만든 것과 맞춤
            sourceHandle: `main-${outIndex}`,
            // targetHandle은 지금은 의미만 두고, 커스텀 노드에서 target handle을 여러 개로 늘리면 활용 가능
            targetHandle: `${connType}-${targetIndex}`,
            type: "smoothstep",
          });
        });
      });
    }
  }

  const layouted = layoutNodes(nodes, edges, nodeWidth, nodeHeight);
  return { nodes: layouted, edges };
}

function layoutNodes(nodes: Node[], edges: Edge[], width: number, height: number): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 56, ranksep: 110, marginx: 32, marginy: 32 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width, height });
  });
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    if (!pos) return node;
    return {
      ...node,
      position: { x: pos.x - width / 2, y: pos.y - height / 2 },
    };
  });
}
