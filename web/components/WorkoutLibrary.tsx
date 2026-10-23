"use client";

import Link from "next/link";
import { useState } from "react";
import type { LibraryManifest, LibraryProgram } from "@/lib/catalog-types";

export default function WorkoutLibrary({ manifest, definitions, raw, base }: {
  manifest: LibraryManifest; definitions: Record<string, LibraryProgram>; raw: Record<string, string>; base: string;
}) {
  const [query, setQuery] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [days, setDays] = useState("");
  const [minutes, setMinutes] = useState("");
  const [gear, setGear] = useState<string[]>([]);
  const [copy, setCopy] = useState("");
  const [copyId, setCopyId] = useState("");
  const [fallback, setFallback] = useState("");
  const programs = manifest.programs;
  const equipment = [...new Set(programs.flatMap(p => p.equipment))].sort();
  const visible = programs.filter(p => (!query || `${p.title} ${p.description}`.toLowerCase().includes(query.toLowerCase())) &&
    (!goal || p.goal === goal) && (!level || p.level === level) && (!days || p.daysPerWeek === Number(days)) &&
    (!minutes || p.minutesPerDay <= Number(minutes)) && (!gear.length || p.equipment.every(g => gear.includes(g))));
  const field = "rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 w-full";
  const button = "inline-block rounded-lg border border-zinc-600 px-4 py-3 text-sm font-medium hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-blue-300";
  async function copyProgram(id: string) {
    setCopyId(id);
    try { await navigator.clipboard.writeText(raw[id]); setCopy("Program JSON copied. In Android, choose Import program → Paste → Preview program."); setFallback(""); }
    catch { setFallback(raw[id]); setCopy("Clipboard unavailable. Select and copy the JSON below, or download the file."); }
  }
  return <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
    <header className="space-y-3">
      <Link href="/" className="text-sm text-blue-300 underline">Workout Hub</Link>
      <p className="text-sm uppercase tracking-widest text-blue-300">FitNotes</p>
      <h1 className="text-3xl font-bold">Workout Library</h1>
      <p className="max-w-2xl text-zinc-300">Eight original programs to browse, adapt and follow. Review the whole week before choosing. Personal weight suggestions come from your actual history on your device.</p>
      <p className="text-sm text-zinc-400">Catalog {manifest.catalogVersion} · No account or workout uploads. Three starter programs are bundled in Android for offline use.</p>
    </header>
    <section aria-label="Program filters" className="grid gap-4 rounded-xl border border-zinc-800 p-4 sm:grid-cols-2">
      <label className="sm:col-span-2">Search programs<input className={`${field} mt-2`} value={query} onChange={e => setQuery(e.target.value)} placeholder="Name or description" /></label>
      <label>Goal<select className={`${field} mt-2`} value={goal} onChange={e => setGoal(e.target.value)}><option value="">Any goal</option>{[...new Set(programs.map(p => p.goal))].map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Experience<select className={`${field} mt-2`} value={level} onChange={e => setLevel(e.target.value)}><option value="">Any experience</option>{[...new Set(programs.map(p => p.level))].map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Days per week<select className={`${field} mt-2`} value={days} onChange={e => setDays(e.target.value)}><option value="">Any frequency</option>{[...new Set(programs.map(p => p.daysPerWeek))].sort().map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Maximum minutes per day<select className={`${field} mt-2`} value={minutes} onChange={e => setMinutes(e.target.value)}><option value="">Any duration</option>{[35, 45, 60].map(v => <option key={v}>{v}</option>)}</select></label>
      <fieldset className="sm:col-span-2"><legend className="mb-2">Available equipment</legend><p className="mb-3 text-sm text-zinc-400">Select everything you have. Leave clear to show all programs.</p><div className="flex flex-wrap gap-3">{equipment.map(g => <label key={g} className="flex min-h-11 items-center gap-2 rounded-lg border border-zinc-700 px-3"><input type="checkbox" checked={gear.includes(g)} onChange={e => setGear(e.target.checked ? [...gear, g] : gear.filter(x => x !== g))} />{g}</label>)}</div></fieldset>
      <button className={button} onClick={() => { setQuery(""); setGoal(""); setLevel(""); setDays(""); setMinutes(""); setGear([]); }}>Clear filters</button>
    </section>
    <p role="status" className="text-zinc-300">{visible.length} {visible.length === 1 ? "program" : "programs"}</p>
    {visible.length === 0 && <p>No programs match. Clear or broaden the filters.</p>}
    {visible.map(e => { const p = definitions[e.id]; return <article key={e.id} id={e.id} className="space-y-4 rounded-xl border border-zinc-700 bg-zinc-900/50 p-5">
      <div className="space-y-2"><h2 className="text-2xl font-semibold">{e.title}</h2><p className="text-blue-300">{e.daysPerWeek} days/week · about {e.minutesPerDay} min/day · {e.level}</p><p>{e.description}</p><p className="text-sm text-zinc-400">{e.goal} · {e.equipment.join(", ")}{e.starter ? " · Android offline starter" : ""}</p></div>
      <details className="space-y-4"><summary className="cursor-pointer py-3 font-medium text-blue-300">Preview all {e.daysPerWeek} workout days</summary>
        <p>{p.weeks} weeks · {p.schedule}</p><p className="text-zinc-300">{p.notes}</p>
        {p.days.map((d, i) => <section key={d.id} className="space-y-3 rounded-lg border border-zinc-700 p-4"><h3 className="text-xl font-semibold">{i + 1}. {d.name}</h3><p className="text-sm text-zinc-400">{d.notes}</p>{d.exercises.map(m => <div key={m.name} className="space-y-1"><h4 className="font-semibold">{m.name}</h4><ul className="ml-5 list-disc text-sm text-zinc-300">{m.sets.map((s, j) => <li key={j}>Set {j + 1}: {s.repsMin}–{s.repsMax} reps · {s.restSeconds}s rest · RIR {s.rir}</li>)}</ul><p className="text-sm text-zinc-400">{m.notes}</p>{m.substitutions && <p className="text-sm text-zinc-400">Optional alternative: {m.substitutions.join(", ")} (resolve explicitly when importing).</p>}</div>)}</section>)}
        <p className="text-sm text-zinc-300">{p.progression}</p>
      </details>
      <div className="flex flex-wrap gap-3"><a className={button} href={`${base}/catalog/${e.path}`} download>Download program JSON</a><button className={button} onClick={() => copyProgram(e.id)}>Copy for Android import</button></div>
      {copyId === e.id && <p role="status" className="text-sm text-blue-300">{copy}</p>}
      {copyId === e.id && fallback && <label>Program JSON<textarea className={`${field} mt-2 h-64 font-mono text-xs`} readOnly value={fallback} onFocus={event => event.target.select()} /></label>}
      <p className="text-xs text-zinc-400">Version {e.programVersion} · <a href={p.license.url} className="underline">{p.license.id}</a> · {p.license.attribution}</p>
    </article>; })}
    <aside className="space-y-3 rounded-xl border border-zinc-700 p-5"><h2 className="text-xl font-semibold">Use in Android</h2><p>Train → Explore programs / Import → Workout Library. Preview, then Review installation to match exercises and save one editable program. Or download/copy JSON here and use Import program. Installation never records performed sets.</p><p className="text-sm text-zinc-400">RIR means reps you think you could still perform. Leave the prescribed spare reps and adapt to your equipment and recovery. Numeric load advice stays optional and local.</p><a className="text-sm text-blue-300 underline" href={`${base}/catalog/schema-v1.json`}>Shared import schema</a> · <a className="text-sm text-blue-300 underline" href={`${base}/catalog/manifest.json`}>Versioned catalog manifest</a></aside>
    <footer className="text-sm text-zinc-400">Original generic routines and descriptions by FitNotes contributors, licensed CC BY 4.0. No copied routine articles or images. Suggestions are starting prescriptions to personalize, without promised outcomes.</footer>
  </main>;
}
