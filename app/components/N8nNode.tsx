"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";

export default function N8nNode(props: NodeProps) {
  const { data } = props;

  const label = data?.label ?? "Node";
  const type = data?.type ?? "unknown";
  const disabled = !!data?.disabled;
  const icon = data?.icon as string | null | undefined;

  // outputCount를 data에서 받아서 여러 출력 포트도 흉내 가능
  const outputCount = Math.max(1, Number(data?.outputCount ?? 1));
  const accent = getAccentColor(type);
  const accentSoft = tint(accent, 0.88);
  const handleBaseTop = 40;
  const handleGap = 16;
  const targetTop = handleBaseTop + ((outputCount - 1) * handleGap) / 2;

  return (
    <div
      style={{
        width: 220,
        borderRadius: 12,
        border: `1px solid ${accentSoft}`,
        background: "white",
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
        overflow: "hidden",
        opacity: disabled ? 0.6 : 1,
        pointerEvents: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 12,
          background: accentSoft,
        }}
      >
        {icon ? (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: `1px solid ${accent}`,
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
            title={type}
          >
            <img src={icon} alt={type} style={{ width: 18, height: 18 }} />
          </div>
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: `1px solid ${accent}`,
              background: accent,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
            }}
            title={type}
          >
            {type.split(".").pop()?.slice(0, 2)?.toUpperCase()}
          </div>
        )}

        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {label}
          </div>
          <div style={{ fontSize: 11, opacity: 0.65, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {type}
          </div>
        </div>

        {disabled && (
          <div
            style={{
              marginLeft: "auto",
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 999,
              border: `1px solid ${accent}`,
              opacity: 0.8,
            }}
          >
            disabled
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #f2f2f2", padding: "8px 12px", fontSize: 11, opacity: 0.7 }}>
        main
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 10,
          height: 10,
          top: targetTop,
          background: accent,
          border: `1px solid ${accent}`,
        }}
      />
      {Array.from({ length: outputCount }).map((_, i) => (
        <Handle
          key={i}
          type="source"
          position={Position.Right}
          id={`main-${i}`}
          style={{
            width: 10,
            height: 10,
            top: handleBaseTop + i * handleGap, // 출력이 여러 개면 아래로 쌓이게
            background: accent,
            border: `1px solid ${accent}`,
          }}
        />
      ))}
    </div>
  );
}

const COLOR_MAP: Array<[RegExp, string]> = [
  [/webhook/i, "#2D9CDB"],
  [/http|request|api/i, "#4C6FFF"],
  [/if|switch|condition/i, "#FF9F1C"],
  [/code|function|script/i, "#6C5CE7"],
  [/merge|combine|aggregate/i, "#00B894"],
  [/database|sql|postgres|mysql|mongodb/i, "#27AE60"],
  [/email|smtp|gmail/i, "#EB5757"],
  [/slack|discord|teams|chat/i, "#00A3FF"],
  [/google|sheet|drive|docs/i, "#27AE60"],
  [/github|gitlab/i, "#24292E"],
];

const PALETTE = [
  "#4C6FFF",
  "#00B894",
  "#FF9F1C",
  "#E76F51",
  "#2D9CDB",
  "#27AE60",
  "#EB5757",
  "#6C5CE7",
  "#F2994A",
  "#16A085",
];

function getAccentColor(type: string): string {
  for (const [re, color] of COLOR_MAP) {
    if (re.test(type)) return color;
  }
  let hash = 0;
  for (let i = 0; i < type.length; i += 1) {
    hash = (hash * 31 + type.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % PALETTE.length;
  return PALETTE[idx];
}

function tint(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(rgb.r)}, ${mix(rgb.g)}, ${mix(rgb.b)})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const value = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  const num = parseInt(value, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}
