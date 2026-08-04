import type { ExerciseStatus } from "@/lib/types";

const STYLES: Record<ExerciseStatus, string> = {
  progressing: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  hold: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  plateau: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  new: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const LABELS: Record<ExerciseStatus, string> = {
  progressing: "↑ Progressing",
  hold: "→ Hold",
  plateau: "⚠ Plateau",
  new: "• New",
};

export default function StatusBadge({ status }: { status: ExerciseStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
