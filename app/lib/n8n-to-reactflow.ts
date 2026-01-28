// lib/n8n-to-reactflow.ts
import type { Edge, Node } from "reactflow";

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

export function n8nToReactFlow(wf: N8NWorkflow): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] =
    (wf.nodes || []).map((n) => {
      const [x, y] = n.position ?? [0, 0];
      return {
        id: n.name, // name is unique in n8n workflow
        position: { x, y },
        data: {
          label: n.name,
          type: n.type,
          typeVersion: n.typeVersion,
          parameters: n.parameters,
          raw: n,
        },
      };
    });

  const edges: Edge[] = [];
  const conns = wf.connections || {};

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
            // 핸들은 일단 문자열로만 둬도 됨(노드 커스텀 핸들 만들면 활용 가능)
            sourceHandle: `${connType}-${outIndex}`,
            targetHandle: `${t.type ?? connType}-${targetIndex}`,
          });
        });
      });
    }
  }

  return { nodes, edges };
}
