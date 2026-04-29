import { Zap } from "lucide-react";

const items: { label: string; cls: string; description: string }[] = [
  {
    label: "IF",
    cls: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-900",
    description: "Instruction Fetch",
  },
  {
    label: "ID",
    cls: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-900",
    description: "Decode / Register Read",
  },
  {
    label: "EX",
    cls: "bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-900",
    description: "Execute / ALU",
  },
  {
    label: "MEM",
    cls: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/60 dark:text-green-200 dark:border-green-900",
    description: "Memory Access",
  },
  {
    label: "WB",
    cls: "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    description: "Write Back",
  },
  {
    label: "STALL",
    cls: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-900",
    description: "Pipeline stall / bubble",
  },
  {
    label: "FLUSH",
    cls: "bg-rose-50 text-rose-700 border-rose-400 border-dashed dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700",
    description: "Speculatively-fetched & flushed",
  },
];

export function Legend() {
  return (
    <section className="flex-shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Legend
        </span>
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className={`inline-flex h-5 min-w-[2rem] items-center justify-center rounded border px-1 text-[9px] font-semibold ${item.cls}`}
            >
              {item.label}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400">
              {item.description}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="relative inline-flex h-5 w-8 items-center justify-center rounded border border-slate-200 bg-white text-[9px] font-semibold ring-2 ring-amber-400 ring-offset-1 ring-offset-white dark:border-slate-700 dark:bg-slate-900 dark:ring-offset-slate-900">
            <Zap className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" />
          </span>
          <span className="text-[10px] text-slate-600 dark:text-slate-400">
            Forwarding
          </span>
        </div>
      </div>
    </section>
  );
}
