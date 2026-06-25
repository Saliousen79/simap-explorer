"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CantonCode, CantonSelectionMode } from "@/lib/agents/types";
import { CANTONS } from "@/lib/config/cantons";
import { SWISS_CANTON_PATHS, SWISS_CANTON_VIEWBOX } from "@/lib/config/swiss-canton-paths";

interface CantonSelectorProps {
  selected: CantonCode[];
  mode: CantonSelectionMode;
  onChange: (selected: CantonCode[], mode: CantonSelectionMode) => void;
  invalid?: boolean;
}

export function CantonSelector({ selected, mode, onChange, invalid = false }: CantonSelectorProps) {
  const [search, setSearch] = useState("");
  const [hovered, setHovered] = useState<CantonCode | null>(null);
  const cantonByCode = useMemo(() => new Map(CANTONS.map((canton) => [canton.code, canton])), []);
  const sortedCantons = useMemo(() => [...CANTONS].sort((first, second) => first.name.localeCompare(second.name, "de-CH")), []);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? sortedCantons.filter((canton) => canton.name.toLowerCase().includes(query) || canton.code.toLowerCase().includes(query)) : sortedCantons;
  }, [search, sortedCantons]);

  const toggle = (code: CantonCode) => {
    if (mode === "all") return onChange([code], "specific");
    const next = selected.includes(code) ? selected.filter((item) => item !== code) : [...selected, code];
    onChange(next, "specific");
  };

  return (
    <section className={`w-full ${invalid ? "rounded-2xl border border-red-400/60 p-3" : ""}`} aria-labelledby="canton-filter-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="canton-filter-title" className="text-base font-semibold text-foreground">Kantonsfilter</h2>
          <p className="text-sm text-muted-foreground">Wähle die Region für deine Analyse.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onChange([], "all")} className={`rounded-full px-4 py-2 text-sm transition ${mode === "all" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}>Ganze Schweiz</button>
          <button type="button" onClick={() => onChange([], "specific")} className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground">Alle löschen</button>
        </div>
      </div>

      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,2.4fr)_minmax(270px,0.75fr)]">
        <div className="relative flex min-h-[210px] items-center justify-center overflow-visible p-1 lg:h-[24vh] lg:min-h-[220px] lg:max-h-[270px]">
          <svg viewBox={SWISS_CANTON_VIEWBOX} className="h-full w-full drop-shadow-sm" role="group" aria-label="Interaktive Karte der Schweizer Kantone">
            <g className="opacity-70">
              {SWISS_CANTON_PATHS.map((canton) => (
                <path key={`outline-${canton.code}`} d={canton.d} className="fill-muted/10 stroke-background/90" strokeWidth="4" strokeLinejoin="round" />
              ))}
            </g>
            <g className="[filter:drop-shadow(0_0_1px_rgba(250,204,21,0.95))_drop-shadow(0_0_8px_rgba(250,204,21,0.42))]">
              {SWISS_CANTON_PATHS.map((canton) => (
                <path key={`swiss-border-${canton.code}`} d={canton.d} className="fill-card/80 stroke-yellow-300/80" strokeWidth="2.4" strokeLinejoin="round" />
              ))}
            </g>
            {SWISS_CANTON_PATHS.map((canton) => {
              const definition = cantonByCode.get(canton.code);
              const active = mode === "all" || selected.includes(canton.code);
              const highlighted = hovered === canton.code || active;
              return (
                <g key={canton.code} role="button" tabIndex={0} aria-label={`${definition?.name ?? canton.code} ${active ? "abwählen" : "auswählen"}`} aria-pressed={active}
                  onClick={() => toggle(canton.code)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(canton.code); } }}
                  onMouseEnter={() => setHovered(canton.code)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(canton.code)}
                  onBlur={() => setHovered(null)}
                  className="group cursor-pointer outline-none">
                  <path
                    d={canton.d}
                    fillRule="evenodd"
                    clipRule="evenodd"
                    className={`stroke-background/90 transition-all duration-200 ease-out group-focus-visible:stroke-primary ${active ? "fill-primary stroke-primary drop-shadow-md" : highlighted ? "fill-primary/40 stroke-primary/70" : "fill-card/80 hover:fill-primary/25"}`}
                    strokeWidth={active ? 3.4 : highlighted ? 2.9 : 1.9}
                    strokeLinejoin="round"
                  />
                  <text x={canton.labelX} y={canton.labelY + 4} textAnchor="middle" className={`pointer-events-none select-none text-[14px] font-bold transition-colors duration-200 ${active ? "fill-primary-foreground" : highlighted ? "fill-primary" : "fill-foreground/85"}`}>{canton.code}</text>
                  <title>{definition?.name ?? canton.code}</title>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex min-h-[210px] flex-col rounded-2xl border border-border/70 bg-card/45 p-3 backdrop-blur-md lg:h-[24vh] lg:min-h-[220px] lg:max-h-[270px]">
          <label className="mb-3 flex items-center gap-2 rounded-xl border border-border/60 bg-background/45 px-3 py-2.5 shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kanton suchen" className="min-w-0 flex-1 bg-transparent text-sm outline-none" aria-label="Kanton suchen" />
          </label>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1" aria-label="Kantonsliste">
            {filtered.map((canton) => {
              const active = mode === "all" || selected.includes(canton.code);
              return <button key={canton.code} type="button" onClick={() => toggle(canton.code)} aria-pressed={active} className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${active ? "border-primary/35 bg-primary/15 text-primary shadow-sm" : "border-transparent text-foreground/90 hover:border-border/60 hover:bg-muted/50"}`}><span className="min-w-0 truncate">{canton.name}</span><span className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${active ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground"}`}>{canton.code}</span></button>;
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex min-h-7 flex-wrap items-center gap-2">
        {mode === "specific" && !selected.length ? <span className="text-sm text-red-300">Bitte mindestens einen Kanton auswählen.</span> : null}
        {mode === "specific" ? selected.map((code) => {
          const canton = CANTONS.find((item) => item.code === code);
          return <button key={code} type="button" onClick={() => toggle(code)} className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-sm text-primary" aria-label={`${canton?.name ?? code} entfernen`}>{canton?.name ?? code}<X className="h-3.5 w-3.5" /></button>;
        }) : null}
      </div>
    </section>
  );
}
