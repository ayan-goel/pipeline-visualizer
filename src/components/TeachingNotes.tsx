import { Lightbulb } from "lucide-react";

const NOTES = [
  "Pipelining improves throughput, not individual instruction latency.",
  "RAW hazards occur when a later instruction needs a value before it is written back.",
  "Forwarding bypasses the register file by sending results directly to EX.",
  "Load-use hazards still need a bubble because loaded data is only available after MEM.",
  "Branches cause control hazards because the next PC is uncertain until the branch resolves.",
];

export function TeachingNotes() {
  return (
    <section className="flex-shrink-0 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 px-3 py-2.5 dark:border-indigo-950 dark:from-indigo-950/40 dark:to-violet-950/40">
      <h3 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
        <Lightbulb className="h-3 w-3" />
        What students should notice
      </h3>
      <ul className="space-y-1">
        {NOTES.map((n, i) => (
          <li
            key={i}
            className="flex gap-1.5 text-[11px] leading-snug text-slate-700 dark:text-slate-300"
          >
            <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-indigo-400 dark:bg-indigo-500" />
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
