import Link from "next/link";
import { notFound } from "next/navigation";
import { readActiveTargets } from "@/lib/data-server";
import ExerciseLogger from "@/components/ExerciseLogger";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ routineId: string }>;
}) {
  const { routineId } = await params;
  const { routines, generatedAt } = await readActiveTargets();
  const routine = routines.find((r) => r.id === routineId);

  if (!routine) notFound();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-500 active:text-zinc-300">
            ← Routines
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-zinc-50">{routine.name}</h1>
          <p className="mt-0.5 text-xs text-zinc-500">Targets generated {generatedAt ?? "—"}</p>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {routine.exercises.map((ex) => (
          <ExerciseLogger
            key={ex.name}
            routineId={routine.id}
            routineName={routine.name}
            target={ex}
          />
        ))}
      </div>

      <Link
        href="/history"
        className="mt-2 rounded-2xl border border-zinc-800 bg-zinc-900 py-3 text-center text-sm font-medium text-zinc-300 active:bg-zinc-800"
      >
        Finish &amp; view history
      </Link>
    </main>
  );
}
