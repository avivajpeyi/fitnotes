import Link from "next/link";

export default function RoutineCard({
  id,
  name,
  exerciseCount,
}: {
  id: string;
  name: string;
  exerciseCount: number;
}) {
  return (
    <Link
      href={`/session/${id}`}
      className="block w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left transition active:scale-[0.98] active:bg-zinc-800"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-50">{name}</h2>
          <p className="mt-1 text-sm text-zinc-400">{exerciseCount} exercises</p>
        </div>
        <span className="text-2xl text-zinc-600">→</span>
      </div>
    </Link>
  );
}
