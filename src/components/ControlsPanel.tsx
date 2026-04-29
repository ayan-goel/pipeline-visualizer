import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Settings2,
} from "lucide-react";
import type { SimulationConfig } from "../engine/types";

interface Props {
  config: SimulationConfig;
  onConfigChange: (c: SimulationConfig) => void;
  showExplanations: boolean;
  onToggleExplanations: (b: boolean) => void;
  stepMode: boolean;
  onToggleStepMode: (b: boolean) => void;
  selectedCycle: number;
  totalCycles: number;
  onPrevCycle: () => void;
  onNextCycle: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  animationSpeed: number;
  onSpeedChange: (n: number) => void;
}

export function ControlsPanel({
  config,
  onConfigChange,
  showExplanations,
  onToggleExplanations,
  stepMode,
  onToggleStepMode,
  selectedCycle,
  totalCycles,
  onPrevCycle,
  onNextCycle,
  isPlaying,
  onTogglePlay,
  animationSpeed,
  onSpeedChange,
}: Props) {
  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <header className="flex flex-shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <Settings2 className="h-4 w-4 text-indigo-500" />
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Controls
        </h2>
      </header>

      <div className="space-y-3.5 p-4">
        <Toggle
          label="Enable forwarding"
          hint="Bypass the register file by forwarding ALU/LOAD results."
          checked={config.forwardingEnabled}
          onChange={(v) => onConfigChange({ ...config, forwardingEnabled: v })}
        />
        <Toggle
          label="Enable branch flushing"
          hint="Flush speculatively fetched instructions after a branch."
          checked={config.branchFlushEnabled}
          onChange={(v) => onConfigChange({ ...config, branchFlushEnabled: v })}
        />

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Branch resolution stage
          </label>
          <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
            {(["EX", "MEM"] as const).map((s) => (
              <button
                key={s}
                onClick={() =>
                  onConfigChange({ ...config, branchResolutionStage: s })
                }
                className={`flex-1 rounded-md px-3 py-1 text-xs font-medium transition ${
                  config.branchResolutionStage === s
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            EX flushes 1 instruction · MEM flushes 2
          </p>
        </div>

        <Toggle
          label="Show explanations"
          checked={showExplanations}
          onChange={onToggleExplanations}
        />

        <Toggle
          label="Step mode"
          hint="Reveal cycles one at a time."
          checked={stepMode}
          onChange={onToggleStepMode}
        />

        {stepMode && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Cycle
                </p>
                <p className="font-mono text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {selectedCycle}
                  <span className="text-sm font-normal text-slate-400"> / {totalCycles || 0}</span>
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={onPrevCycle}
                  disabled={selectedCycle <= 1}
                  className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Previous cycle"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={onTogglePlay}
                  className="rounded-md bg-indigo-500 p-1.5 text-white transition hover:bg-indigo-600"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={onNextCycle}
                  disabled={selectedCycle >= totalCycles}
                  className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Next cycle"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Speed</span>
                <span className="font-mono">{animationSpeed}ms</span>
              </div>
              <input
                type="range"
                min={100}
                max={1500}
                step={50}
                value={animationSpeed}
                onChange={(e) => onSpeedChange(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {label}
        </p>
        {hint && (
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            {hint}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full px-0.5 transition ${
          checked ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}
