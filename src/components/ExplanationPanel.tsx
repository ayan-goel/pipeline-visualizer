import { AlertTriangle, BookOpen, Zap } from "lucide-react";
import type { HazardInfo, SimulationResult } from "../engine/types";

function dedupeHazards(hs: HazardInfo[]): HazardInfo[] {
  const seen = new Set<string>();
  const out: HazardInfo[] = [];
  for (const h of hs) {
    const key = `${h.type}:${h.producerInstructionId}:${h.consumerInstructionId}:${h.register ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(h);
  }
  return out;
}

interface Props {
  result: SimulationResult | null;
  selectedCycle: number;
}

export function ExplanationPanel({ result, selectedCycle }: Props) {
  if (!result) return null;

  const cellsAtCycle = result.cells.filter((c) => c.cycle === selectedCycle);
  const hazardsAtCycle = dedupeHazards(
    cellsAtCycle
      .map((c) => c.hazard)
      .filter((h): h is NonNullable<typeof h> => Boolean(h))
  );
  // All forwardings active when a consumer's EX is in this cycle.
  const forwardingsAtCycle = cellsAtCycle.flatMap((c) =>
    c.stage === "EX"
      ? result.forwardings.filter((f) => f.toInstructionId === c.instructionId)
      : []
  );

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
          <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Cycle {selectedCycle}
          </h2>
        </div>
        <p className="hidden text-[10px] text-slate-500 dark:text-slate-400 xl:block">
          Click a column to switch
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {cellsAtCycle.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No instructions are active in this cycle.
          </p>
        ) : (
          <div>
            <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Active instructions
            </h3>
            <ul className="space-y-1">
              {cellsAtCycle.map((cell) => {
                const inst = result.instructions.find(
                  (i) => i.id === cell.instructionId
                );
                if (!inst) return null;
                return (
                  <li
                    key={cell.instructionId}
                    className="flex items-start gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-xs dark:bg-slate-800/50"
                  >
                    <span className="mt-0.5 inline-flex h-4 min-w-[2.25rem] items-center justify-center rounded border border-slate-200 bg-white px-1 font-mono text-[9px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      {cell.stage}
                    </span>
                    <div className="min-w-0 flex-1">
                      <code className="block truncate font-mono text-[11px] text-slate-800 dark:text-slate-200">
                        {inst.raw}
                      </code>
                      {cell.explanation && (
                        <p className="mt-0.5 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
                          {cell.explanation}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {hazardsAtCycle.length > 0 && (
          <div>
            <h3 className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              Hazards this cycle
            </h3>
            <ul className="space-y-1">
              {hazardsAtCycle.map((h, i) => (
                <li
                  key={i}
                  className="rounded-md border-l-2 border-amber-400 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-snug text-amber-900 dark:border-amber-500 dark:bg-amber-950/30 dark:text-amber-200"
                >
                  <span className="font-semibold">{h.type}:</span> {h.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {forwardingsAtCycle.length > 0 && (
          <div>
            <h3 className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              <Zap className="h-3 w-3" />
              Forwarding active
            </h3>
            <ul className="space-y-1">
              {forwardingsAtCycle.map((f, i) => (
                <li
                  key={i}
                  className="rounded-md border-l-2 border-amber-400 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-snug text-amber-900 dark:border-amber-500 dark:bg-amber-950/30 dark:text-amber-200"
                >
                  {f.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
