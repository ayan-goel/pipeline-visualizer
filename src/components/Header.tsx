import { Cpu, Moon, Sun } from "lucide-react";

interface Props {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Header({ darkMode, onToggleDarkMode }: Props) {
  return (
    <header className="flex-shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              CS 2200 Pipeline Visualizer
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visualize hazards, forwarding, stalls, and bubbles in a 5-stage pipeline
            </p>
          </div>
        </div>
        <button
          onClick={onToggleDarkMode}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
