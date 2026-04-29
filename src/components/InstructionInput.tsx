import { Code2, Sparkles, Trash2 } from "lucide-react";
import { PRESETS } from "../data/presets";

interface Props {
  source: string;
  onChange: (s: string) => void;
  onClear: () => void;
  onLoadPreset: (id: string) => void;
  errorMessage: string | null;
}

export function InstructionInput({
  source,
  onChange,
  onClear,
  onLoadPreset,
  errorMessage,
}: Props) {
  return (
    <section className="flex flex-shrink-0 flex-col rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Instructions
          </h2>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Clear"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </header>

      <div className="p-3">
        <textarea
          value={source}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder="ADD R1, R2, R3"
          className="h-36 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[13px] leading-relaxed text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900 dark:focus:ring-indigo-900/40"
        />
        {errorMessage && (
          <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 font-mono text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            {errorMessage}
          </p>
        )}
      </div>

      <div className="border-t border-slate-100 px-3 py-2.5 dark:border-slate-800">
        <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Sparkles className="h-3 w-3" />
          Examples
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onLoadPreset(p.id)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"
              title={p.description}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
