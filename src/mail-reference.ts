import type { AppState, Demand } from "./types";

// Allocation belongs to the state transaction. References survive all stages.
export function withReferences(state: AppState): AppState {
  const counters = { ...state.referenceCounters };
  for (const d of state.demands) {
    const match = d.reference?.match(/^ADV-(\d{4})-(\d+)$/);
    if (match)
      counters[match[1]] = Math.max(counters[match[1]] || 0, Number(match[2]));
  }
  const seen = new Set<string>();
  const demands = state.demands.map((d) => {
    if (d.reference && !seen.has(d.reference)) {
      seen.add(d.reference);
      return d;
    }
    const year =
      /^\d{4}/.exec(d.createdAt || "")?.[0] || String(new Date().getFullYear());
    counters[year] = (counters[year] || 0) + 1;
    const reference = `ADV-${year}-${String(counters[year]).padStart(4, "0")}`;
    seen.add(reference);
    return { ...d, reference };
  });
  return { ...state, demands, referenceCounters: counters };
}

export const mailSubject = (d: Demand, purpose: string) =>
  `[${d.reference}] ${d.title} — ${purpose}`;

export function referenceText(text: string, d: Demand): string {
  const footer = `Referência do atendimento: ${d.reference}`;
  return text.trimEnd().endsWith(footer)
    ? text
    : `${text.trimEnd()}\n\n${footer}`;
}
