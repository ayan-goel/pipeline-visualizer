import { useEffect, useMemo, useState } from "react";
import type { PipelineCell, SimulationResult } from "../engine/types";
import { PipelineCellView } from "./PipelineCell";

interface Props {
  result: SimulationResult | null;
  selectedCycle: number;
  onSelectCycle: (n: number) => void;
  visibleCycle: number;
}

interface TooltipState {
  x: number;
  y: number;
  lines: string[];
}

const TOOLTIP_WIDTH = 280;

export function PipelineDiagram({
  result,
  selectedCycle,
  onSelectCycle,
  visibleCycle,
}: Props) {
  const grid = useMemo(() => buildGrid(result), [result]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Hide the tooltip if anything else changes that might invalidate its target.
  useEffect(() => {
    setTooltip(null);
  }, [result, selectedCycle, visibleCycle]);

  const showTooltip = (rect: DOMRect, lines: string[]) => {
    if (lines.length === 0) return;
    // Center horizontally on the cell, clamped to the viewport.
    const desiredX = rect.left + rect.width / 2;
    const halfWidth = TOOLTIP_WIDTH / 2;
    const clampedX = Math.max(
      halfWidth + 8,
      Math.min(window.innerWidth - halfWidth - 8, desiredX)
    );
    setTooltip({ x: clampedX, y: rect.top - 8, lines });
  };
  const hideTooltip = () => setTooltip(null);

  if (!result || result.instructions.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
        Enter instructions on the left to see the pipeline diagram.
      </div>
    );
  }

  const { instructions, totalCycles } = result;
  const cycleArr = Array.from({ length: totalCycles }, (_, i) => i + 1);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          Pipeline diagram
        </h2>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {instructions.length} instruction{instructions.length === 1 ? "" : "s"} ·{" "}
          {totalCycles} cycle{totalCycles === 1 ? "" : "s"}
        </p>
      </header>

      <div
        className="scroll-smooth-x min-h-0 flex-1 overflow-auto"
        onMouseLeave={hideTooltip}
        onScroll={hideTooltip}
      >
        <table className="border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                Instruction
              </th>
              {cycleArr.map((c) => (
                <th
                  key={c}
                  onClick={() => onSelectCycle(c)}
                  className={`h-9 w-16 cursor-pointer border-b border-slate-200 text-center font-mono text-xs font-medium transition dark:border-slate-700 ${
                    c === selectedCycle
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900"
                  }`}
                  title={`Cycle ${c}`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {instructions.map((inst, idx) => (
              <tr key={inst.id}>
                <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {idx + 1}
                    </span>
                    <code className="whitespace-nowrap font-mono text-xs text-slate-700 dark:text-slate-200">
                      {inst.raw}
                    </code>
                  </div>
                </td>
                {cycleArr.map((c) => (
                  <PipelineCellView
                    key={c}
                    cell={grid.get(`${inst.id}:${c}`)}
                    hidden={c > visibleCycle}
                    selected={c === selectedCycle}
                    onShowTooltip={showTooltip}
                    onHideTooltip={hideTooltip}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tooltip && (
        <div
          role="tooltip"
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            width: TOOLTIP_WIDTH,
            transform: "translate(-50%, -100%)",
          }}
          className="pointer-events-none z-50 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {tooltip.lines.map((l, i) => (
            <p key={i} className={i > 0 ? "mt-1" : ""}>
              {l}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function buildGrid(result: SimulationResult | null): Map<string, PipelineCell> {
  const map = new Map<string, PipelineCell>();
  if (!result) return map;
  for (const cell of result.cells) {
    map.set(`${cell.instructionId}:${cell.cycle}`, cell);
  }
  return map;
}
