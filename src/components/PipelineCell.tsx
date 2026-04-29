import { Zap } from "lucide-react";
import type { PipelineCell, Stage } from "../engine/types";

interface Props {
  cell: PipelineCell | undefined;
  hidden?: boolean;
  selected?: boolean;
  onShowTooltip: (rect: DOMRect, lines: string[]) => void;
  onHideTooltip: () => void;
}

const stageStyles: Record<Stage, string> = {
  IF: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-900",
  ID: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-900",
  EX: "bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-900",
  MEM: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/60 dark:text-green-200 dark:border-green-900",
  WB: "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
  STALL:
    "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-900",
  BUBBLE:
    "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-900",
  FLUSH:
    "bg-rose-50 text-rose-700 border-rose-400 border-dashed dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700",
};

const stageLabels: Record<Stage, string> = {
  IF: "IF",
  ID: "ID",
  EX: "EX",
  MEM: "MEM",
  WB: "WB",
  STALL: "STALL",
  BUBBLE: "bubble",
  FLUSH: "FLUSH",
};

export function PipelineCellView({
  cell,
  hidden,
  selected,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  const baseClasses = `h-12 w-16 border-b border-slate-100 dark:border-slate-800 ${
    selected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
  }`;

  if (!cell || hidden) {
    return <td className={baseClasses} />;
  }

  const lines = buildTooltipLines(cell);

  return (
    <td className={`${baseClasses} p-1`}>
      <div
        onMouseEnter={(e) =>
          onShowTooltip(e.currentTarget.getBoundingClientRect(), lines)
        }
        onMouseLeave={onHideTooltip}
        className={`relative flex h-full w-full cursor-help items-center justify-center rounded-md border text-[11px] font-semibold transition ${
          stageStyles[cell.stage]
        } ${
          cell.forwarding
            ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-white dark:ring-amber-500 dark:ring-offset-slate-900"
            : ""
        }`}
      >
        <span>{stageLabels[cell.stage]}</span>
        {cell.forwarding && (
          <Zap className="absolute right-0.5 top-0.5 h-3 w-3 text-amber-600 dark:text-amber-400" />
        )}
      </div>
    </td>
  );
}

function buildTooltipLines(cell: PipelineCell): string[] {
  const lines: string[] = [];
  if (cell.explanation) lines.push(cell.explanation);
  if (cell.hazard) lines.push(`⚠ ${cell.hazard.message}`);
  if (cell.forwarding) lines.push(`⚡ ${cell.forwarding.message}`);
  return lines;
}
