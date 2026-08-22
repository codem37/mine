import type { JSX } from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./tokens.css";
import "./dash.css";

function nodePosition(index: number, total: number, radius: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (index / Math.max(1, total)) * Math.PI * 2;
  return { x: 200 + radius * Math.cos(angle), y: 190 + radius * Math.sin(angle) };
}

interface DashNode {
  readonly label: string;
  readonly hint?: string;
  readonly phase?: string;
  readonly action?: () => void;
}

const LIVE_NODES: readonly DashNode[] = [
  { label: "new tab", hint: "opens a fresh tab", action: (): void => { void window.mine.newTab(); } },
];

const FUTURE_NODES: readonly DashNode[] = [
  { label: "downloads", phase: "P4" },
  { label: "search", phase: "P6" },
  { label: "safety", phase: "P7" },
  { label: "ipfs", phase: "P8" },
];

export function NewTabDashboard(): JSX.Element {
  const all = [...LIVE_NODES, ...FUTURE_NODES];
  return (
    <main className="dash">
      <svg viewBox="0 0 400 380" className="dash__radial" role="group" aria-label="feature nodes">
        <circle cx="200" cy="190" r="150" className="dash__orbit" />
        <circle cx="200" cy="190" r="90" className="dash__orbit dash__orbit--inner" />
        <text x="200" y="185" textAnchor="middle" className="dash__core">
          mine
        </text>
        <text x="200" y="203" textAnchor="middle" className="dash__core-sub">
          privacy browser
        </text>
        {all.map((node, i) => {
          const pos = nodePosition(i, all.length, 150);
          const live = i < LIVE_NODES.length && node.action !== undefined;
          return live ? (
            <g
              key={node.label}
              className="dash__node"
              tabIndex={0}
              role="button"
              aria-label={node.label}
              onClick={node.action}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") node.action?.();
              }}
            >
              <circle cx={pos.x} cy={pos.y} r="34" />
              <text x={pos.x} y={pos.y + 4} textAnchor="middle">
                {node.label}
              </text>
            </g>
          ) : (
            <g key={node.label} className="dash__node dash__node--future">
              <circle cx={pos.x} cy={pos.y} r="30" />
              <text x={pos.x} y={pos.y - 2} textAnchor="middle">
                {node.label}
              </text>
              <text x={pos.x} y={pos.y + 14} textAnchor="middle" className="dash__phase">
                {node.phase}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="dash__note">type an address in the bar above — dimmed nodes arrive in later phases</p>
    </main>
  );
}

const root = document.getElementById("root");
if (root !== null) {
  createRoot(root).render(
    <StrictMode>
      <NewTabDashboard />
    </StrictMode>,
  );
}
