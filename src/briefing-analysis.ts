import { extractBriefing } from "./domain.mjs";
import { briefingFields, scopeBlocks, briefingGaps } from "./briefing-model";
import type { AIResult, BriefingSuggestion, Demand } from "./types";

export type BriefingSource = { name: string; text: string };
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export function briefingSources(d: Demand): BriefingSource[] {
  const attachments = d.attachments || [];
  const ready = (messageId?: string) =>
    attachments
      .filter((a) => a.included && a.text.trim() && a.messageId === messageId)
      .map((a) => ({ name: a.name, text: a.text }));
  const incoming = (d.conversation || []).filter((m) => m.direction === "in");
  return [
    { name: "Mensagem inicial do cliente", text: d.message },
    ...ready(),
    ...d.briefingLog
      .filter((t) => !incoming.some((m) => m.text === t))
      .map((text, i) => ({ name: `Retorno anterior ${i + 1}`, text })),
    ...incoming.flatMap((m, i) => [
      { name: `Retorno ${i + 1} · ${m.contact}`, text: m.text },
      ...ready(m.id),
    ]),
  ];
}
export function analyzeSources(sources: BriefingSource[]): AIResult {
  const changes = new Map<string, BriefingSuggestion>();
  const fields = [
    ...briefingFields.map((f) => ({ ...f, path: `briefingDetails.${f.id}` })),
    ...scopeBlocks.flatMap((b) =>
      b.fields.map((f) => ({ ...f, path: `scope.${b.id}.${f.id}` })),
    ),
  ];
  const core: Record<string, string> = {
    title: "Nome do evento",
    date: "Data prevista",
    guests: "Participantes",
    budget: "Investimento de referência",
    location: "Cidade ou local",
    objective: "Objetivo do evento",
  };
  const pending: string[] = [];
  for (const source of sources) {
    const parsed = extractBriefing(source.text);
    for (const [path, label] of Object.entries(core)) {
      const value = parsed[path as keyof typeof parsed];
      if (
        (typeof value === "string" && value) ||
        (typeof value === "number" && value > 0)
      ) {
        const patterns: Record<string, RegExp> = {
          title: /(?:evento|assunto)\s*:/i,
          date: /\b\d{2}\/\d{2}\/20\d{2}|20\d{2}-\d{2}-\d{2}/,
          guests: /\d+\s*(?:pessoas|colaboradores|convidados|participantes)/i,
          budget: /R\$|orçamento/i,
          location: /(?:cidade|local)\s*:/i,
          objective: /objetivo\s*:/i,
        };
        const excerpt =
          source.text.split(/\n/).find((l) => patterns[path].test(l)) ||
          String(value);
        changes.set(path, { path, label, value, source: source.name, excerpt });
      }
    }
    for (const line of source.text.split(/\n/)) {
      const split = line.indexOf(":");
      if (split < 0) continue;
      const label = normalize(line.slice(0, split));
      const value = line.slice(split + 1).trim();
      const field = fields.find((f) => normalize(f.label) === label);
      if (field && value)
        changes.set(field.path, {
          path: field.path,
          label: field.label,
          value,
          source: source.name,
          excerpt: line.trim(),
        });
      if (label === "pendencias" && value) pending.push(value);
    }
  }
  const result = extractBriefing(
    sources.map((s) => s.text).join("\n"),
  ) as AIResult;
  for (const key of Object.keys(core)) {
    if (changes.has(key))
      Object.assign(result, { [key]: changes.get(key)!.value });
  }
  // Only explicit statements are suggested. Open questions remain human decisions.
  result.suggestions = [...changes.values()];
  result.questions = pending;
  result.evidence = [...new Set(result.suggestions.map((c) => c.source))];
  return result;
}
export function currentSuggestionValue(
  d: Demand,
  path: string,
): string | number {
  const [group, block, field] = path.split(".");
  if (group === "briefingDetails") return d.briefingDetails?.[block] || "";
  if (group === "scope") return d.scope?.[block]?.answers[field] || "";
  const value = d[group as keyof Demand];
  return typeof value === "string" || typeof value === "number" ? value : "";
}
export function applySuggestions(
  d: Demand,
  suggestions: BriefingSuggestion[],
): Partial<Demand> {
  const patch: Partial<Demand> = {
    briefingDetails: { ...d.briefingDetails },
    scope: structuredClone(d.scope || {}),
  };
  for (const suggestion of suggestions) {
    const [group, block, field] = suggestion.path.split(".");
    if (group === "briefingDetails")
      patch.briefingDetails![block] = String(suggestion.value);
    else if (group === "scope") {
      const entry = patch.scope![block] || { included: true, answers: {} };
      patch.scope![block] = {
        included: true,
        answers: { ...entry.answers, [field]: String(suggestion.value) },
      };
    } else Object.assign(patch, { [group]: suggestion.value });
  }
  return patch;
}
export function questionsAfterReview(
  d: Demand,
  result: AIResult,
  selected: string[],
) {
  const chosen = (result.suggestions || []).filter((s) =>
    selected.includes(s.path),
  );
  const consolidated: Demand = { ...d, ...applySuggestions(d, chosen) };
  const gaps = briefingGaps(consolidated).map(
    (g) => `[${g.group}] ${g.question}`,
  );
  if (!consolidated.budget)
    gaps.push("Qual é a faixa de investimento disponível?");
  return [...new Set([...result.questions, ...gaps])];
}
