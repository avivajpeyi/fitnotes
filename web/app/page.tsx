import Link from "next/link";
import { readRoutines } from "@/lib/data-server";
import RoutineCard from "@/components/RoutineCard";

export default async function Home() {
  const { routines } = await readRoutines();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-50">Workout Hub</h1>
        <p className="mt-1 text-sm text-zinc-400">Pick today&apos;s routine.</p>
      </header>

      <div className="flex flex-col gap-3">
        {routines.map((r) => (
          <RoutineCard key={r.id} id={r.id} name={r.name} exerciseCount={r.exercises.length} />
        ))}
      </div>

      <Link
        href="/history"
        className="mt-auto text-center text-sm text-zinc-500 underline underline-offset-4 active:text-zinc-300"
      >
        View history &amp; export backup
      </Link>
    </main>
  );
}
