"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import { n8nToReactFlow } from "@/lib/n8n-to-reactflow";

type Team = { name: string; path: string };
type WorkflowFile = { name: string; path: string };

export default function FlowViewer() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [team, setTeam] = useState<string>("");
  const [workflows, setWorkflows] = useState<WorkflowFile[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>("");

  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/teams");
      const data = await res.json();
      setTeams(data.teams || []);
      if ((data.teams || []).length) setTeam(data.teams[0].name);
    })();
  }, []);

  useEffect(() => {
    if (!team) return;
    (async () => {
      const res = await fetch(`/api/workflows?team=${encodeURIComponent(team)}`);
      const data = await res.json();
      setWorkflows(data.workflows || []);
      setSelectedPath("");
      setRfNodes([]);
      setRfEdges([]);
      setSelectedNode(null);
    })();
  }, [team]);

  useEffect(() => {
    if (!selectedPath) return;
    (async () => {
      const res = await fetch(`/api/workflow?path=${encodeURIComponent(selectedPath)}`);
      const data = await res.json();
      const wf = data.workflow;
      const { nodes, edges } = n8nToReactFlow(wf);
      setRfNodes(nodes);
      setRfEdges(edges);
      setSelectedNode(null);
    })();
  }, [selectedPath]);

  const filteredWorkflows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workflows;
    return workflows.filter((w) => w.name.toLowerCase().includes(q));
  }, [workflows, search]);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      {/* Sidebar */}
      <div style={{ width: 320, borderRight: "1px solid #eee", padding: 12, overflow: "auto" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>n8n Workflow Viewer</div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Team</div>
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
            {teams.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <input
            placeholder="Search workflow..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
          Workflows ({filteredWorkflows.length})
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filteredWorkflows.map((w) => (
            <button
              key={w.path}
              onClick={() => setSelectedPath(w.path)}
              style={{
                textAlign: "left",
                padding: 10,
                border: "1px solid #ddd",
                background: selectedPath === w.path ? "#f5f5f5" : "white",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{w.name}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{w.path}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          fitView
          onNodeClick={(_, node) => setSelectedNode(node.data?.raw ?? node)}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>

        {/* Detail panel */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 360,
            maxHeight: "85vh",
            overflow: "auto",
            border: "1px solid #eee",
            background: "white",
            padding: 12,
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Node Details</div>
          {!selectedNode ? (
            <div style={{ fontSize: 13, opacity: 0.7 }}>노드를 클릭하면 상세가 표시돼.</div>
          ) : (
            <pre style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(selectedNode, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
