export const money = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(value) ? value : 0,
  );
export const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
export const lineTotal = (l) =>
  round(Math.max(0, Number(l.qty) || 0) * Math.max(0, Number(l.unit) || 0));
export function totals(lines, fee = 0, tax = 0) {
  const subtotal = round(lines.reduce((s, l) => s + lineTotal(l), 0));
  const direct = round(
    lines.filter((l) => l.direct).reduce((s, l) => s + lineTotal(l), 0),
  );
  const agency = round(subtotal - direct);
  const feeValue = round((agency * Math.max(0, Number(fee) || 0)) / 100);
  const taxValue = round(Math.max(0, Number(tax) || 0));
  return {
    subtotal,
    direct,
    agency,
    fee: feeValue,
    tax: taxValue,
    invoice: round(agency + feeValue + taxValue),
    total: round(subtotal + feeValue + taxValue),
  };
}
export function selectedLines(quotes) {
  return quotes
    .filter((q) => q.selected && q.status === "received")
    .flatMap((q) => {
      if (q.adjustmentPending) return [];
      const selection = q.selection;
      // Legacy selections remain usable; new options require an explicit composition.
      if (
        q.options?.length &&
        (!selection || selection.revision !== (q.revision || 1))
      )
        return [];
      const option = q.options?.find((o) => o.id === selection?.optionId);
      if (q.options?.length && !option) return [];
      if (selection && selection.revision !== (q.revision || 1)) return [];
      const lines = selection
        ? (option?.lines || q.lines).filter((l) =>
            selection.lineIds.includes(l.id),
          )
        : q.lines;
      return lines.map((l) => ({
        ...l,
        id: `${q.id}-${l.id}`,
        supplier: q.supplierId,
        ...(selection
          ? {
              sourceQuote: q.id,
              sourceRevision: selection.revision,
              sourceSelection: selection.id,
            }
          : {}),
      }));
    });
}
export function escapeCSV(v) {
  const s = String(v ?? "");
  return (
    '"' + (/^[=+\-@\t\r]/.test(s) ? "'" : "") + s.replaceAll('"', '""') + '"'
  );
}
export function extractBriefing(text) {
  const m = text.match(
    /(?:R\$\s*|orçamento\s*(?:de|:)?\s*)([\d.]+(?:,\d{1,2})?)/i,
  );
  const budget = m ? Number(m[1].replaceAll(".", "").replace(",", ".")) : 0;
  const guests = Number(
    text.match(
      /(\d+)\s*(?:pessoas|convidados|participantes|colaboradores)/i,
    )?.[1] || 0,
  );
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  const br = text.match(/\b(\d{2})\/(\d{2})\/(20\d{2})\b/);
  const date = iso?.[1] || (br ? `${br[3]}-${br[2]}-${br[1]}` : "");
  const location =
    text
      .match(/(?:^|[\n.;])\s*(?:cidade|local)\s*:\s*([^\n.;]+)/i)?.[1]
      ?.trim() || "";
  const title =
    text.match(/(?:^|\n)\s*(?:evento|assunto)\s*:\s*([^\n.]+)/i)?.[1]?.trim() ||
    "";
  const objective =
    text.match(/(?:^|\n)\s*objetivo\s*:\s*([^\n.]+)/i)?.[1]?.trim() || "";
  const questions = [];
  if (!date)
    questions.push(
      "Qual é a data prevista e quais horários devemos considerar?",
    );
  if (!guests) questions.push("Quantas pessoas participarão do evento?");
  if (!budget) questions.push("Qual é a faixa de investimento disponível?");
  if (!location)
    questions.push("Em qual cidade ou local o evento deve acontecer?");
  if (!objective)
    questions.push("Qual é o principal objetivo e a mensagem do encontro?");
  questions.push(
    "Há restrições alimentares, de acessibilidade ou de contratação?",
  );
  return {
    title,
    date,
    guests,
    budget,
    location,
    objective,
    questions,
    evidence: [
      date ? `Data identificada: ${date}` : "Data não identificada",
      guests
        ? `Público identificado: ${guests} pessoas`
        : "Público não identificado",
      budget
        ? "Investimento identificado na mensagem"
        : "Investimento não identificado",
    ],
  };
}
