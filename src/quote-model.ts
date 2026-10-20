import type {
  Demand,
  Quote,
  QuoteMessage,
  QuoteOption,
  QuoteRevision,
} from "./types";
import { uid } from "./data";
import { lineTotal, money } from "./domain.mjs";

export const quoteRevision = (q: Quote) => q.revision || 1;
export const quoteOptions = (q: Quote): QuoteOption[] =>
  q.options?.length
    ? q.options
    : [
        {
          id: `base-${q.id}`,
          name: "Cotação principal",
          detail: "",
          lines: q.lines,
        },
      ];
export const optionTotal = (o: QuoteOption, ids?: string[]) =>
  o.lines
    .filter((l) => (ids ? ids.includes(l.id) : !l.optional))
    .reduce((n, l) => n + lineTotal(l), 0);
export const quoteRange = (q: Quote) => {
  const prices = quoteOptions(q).map((o) => optionTotal(o));
  const min = Math.min(...prices),
    max = Math.max(...prices);
  return min === max ? money(min) : `${money(min)} a ${money(max)}`;
};
export const currentSelection = (q: Quote) =>
  q.selection &&
  q.selection.revision === quoteRevision(q) &&
  !q.adjustmentPending
    ? q.selection
    : undefined;
export function selectionSummary(q: Quote) {
  const selection = currentSelection(q);
  const option = quoteOptions(q).find((o) => o.id === selection?.optionId);
  if (!option || !selection) return "Sem composição selecionada.";
  return `${option.name} · cotação v${selection.revision}\n${option.lines
    .filter((l) => selection.lineIds.includes(l.id))
    .map(
      (l) =>
        `${l.description}: ${l.qty} × ${money(l.unit)} = ${money(lineTotal(l))}`,
    )
    .join(
      "\n",
    )}\nTotal escolhido: ${money(optionTotal(option, selection.lineIds))}\nCondições: ${q.terms}${option.detail ? `\nCondições da opção: ${option.detail}` : ""}\nSeleção para orçamento; não autoriza contratação ou execução.`;
}
export function addQuoteMessage(
  q: Quote,
  author: QuoteMessage["author"],
  kind: QuoteMessage["kind"],
  text: string,
): Quote {
  return {
    ...q,
    messages: [
      ...(q.messages || []),
      {
        id: uid(),
        author,
        kind,
        text: text.trim(),
        at: new Date().toISOString(),
        revision: quoteRevision(q),
      },
    ],
  };
}
export function selectComposition(
  q: Quote,
  optionId: string,
  requestedIds: string[],
): Quote {
  const option = quoteOptions(q).find((o) => o.id === optionId);
  if (!option || q.status !== "received" || q.adjustmentPending) return q;
  const lineIds = option.lines
    .filter((l) => !l.optional || requestedIds.includes(l.id))
    .map((l) => l.id);
  if (!lineIds.length) return q;
  const next: Quote = {
    ...q,
    selected: true,
    selection: {
      id: uid(),
      revision: quoteRevision(q),
      optionId,
      lineIds,
      at: new Date().toISOString(),
    },
  };
  return addQuoteMessage(
    next,
    "adviser",
    "selection",
    `Solicitamos a confirmação de valores e disponibilidade para esta composição:\n${selectionSummary(next)}`,
  );
}
export function confirmComposition(q: Quote, selectionId: string): Quote {
  const selection = currentSelection(q);
  if (!selection || selection.id !== selectionId || selection.confirmedAt)
    return q;
  return addQuoteMessage(
    {
      ...q,
      selection: { ...selection, confirmedAt: new Date().toISOString() },
    },
    "supplier",
    "confirmation",
    `Valores, condições e disponibilidade confirmados para:\n${selectionSummary(q)}\nA contratação dependerá de autorização específica.`,
  );
}
export function requestQuoteAdjustment(q: Quote, text: string): Quote {
  return addQuoteMessage(
    { ...q, selected: false, selection: undefined, adjustmentPending: true },
    "adviser",
    "adjustment",
    text,
  );
}
export function revisionSnapshot(q: Quote): QuoteRevision {
  return structuredClone({
    number: quoteRevision(q),
    at: q.receivedAt || new Date().toISOString(),
    options: quoteOptions(q),
    fields: q.fields,
    terms: q.terms,
    attachment: q.attachment,
  });
}
export function submitQuoteRevision(
  q: Quote,
  data: Pick<QuoteRevision, "options" | "fields" | "terms" | "attachment">,
): Quote {
  const past = q.revisions?.length
    ? q.revisions
    : q.status === "received"
      ? [revisionSnapshot(q)]
      : [];
  const number = q.status === "received" ? quoteRevision(q) + 1 : 1;
  const at = new Date().toISOString();
  const revision = structuredClone({ ...data, number, at });
  return addQuoteMessage(
    {
      ...q,
      ...structuredClone(data),
      lines: structuredClone(data.options[0].lines),
      status: "received",
      revision: number,
      receivedAt: at,
      revisions: [...past, revision],
      selected: false,
      selection: undefined,
      adjustmentPending: false,
    },
    "supplier",
    "revision",
    `Cotação v${number} enviada com ${data.options.length} ${data.options.length === 1 ? "opção" : "opções"}. ${number > 1 ? "Revise a nova versão e confirme novamente a composição desejada." : "Escolha uma opção e os adicionais desejados."}`,
  );
}
export const staleQuoteLines = (d: Demand) =>
  d.lines.some((l) => {
    if (!l.sourceQuote) return false;
    const q = d.quotes.find((q) => q.id === l.sourceQuote);
    return (
      !q ||
      !q.selected ||
      l.sourceRevision !== quoteRevision(q) ||
      l.sourceSelection !== currentSelection(q)?.id
    );
  });
