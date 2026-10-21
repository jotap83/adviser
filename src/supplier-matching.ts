import type { Demand, Quote, Supplier, Template } from "./types";
import { briefingSources } from "./briefing-analysis";
import { scopeBlocks, scopeSuggestions } from "./briefing-model";
import { uid } from "./data";

export type SupplierNeed = {
  category: string;
  name: string;
  source: string;
  evidence: string;
  confirmedScope: boolean;
};

export const normalizeSupplierText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// Demonstration only: match existing categories, never infer availability or price.
export function supplierNeeds(d: Demand): SupplierNeed[] {
  const inferred = new Map<string, SupplierNeed>();
  for (const source of briefingSources(d)) {
    for (const { block, evidence } of scopeSuggestions(source.text)) {
      inferred.set(block.id, {
        category: block.id,
        name: block.name,
        source: source.name,
        evidence,
        confirmedScope: false,
      });
    }
  }
  return scopeBlocks.flatMap((block) => {
    const scope = d.scope?.[block.id];
    // An explicit manual exclusion always overrides an old message or attachment.
    if (scope) {
      return scope.included
        ? [
            {
              category: block.id,
              name: block.name,
              source: "Escopo do evento",
              evidence: Object.values(scope.answers)
                .filter(Boolean)
                .join(" · "),
              confirmedScope: true,
            },
          ]
        : [];
    }
    const suggestion = inferred.get(block.id);
    return suggestion ? [suggestion] : [];
  });
}

export function sameSupplierCity(supplier: Supplier, location: string) {
  const city = normalizeSupplierText(supplier.city);
  const eventLocation = normalizeSupplierText(location).replace(
    /^(?:cidade|local)\s*:\s*/,
    "",
  );
  return (
    !!city &&
    eventLocation.split(/[,/;|]|\s[-–—]\s/).some((part) => part.trim() === city)
  );
}

export function eligibleSupplierIds(
  d: Demand,
  suppliers: Supplier[],
  templates: Template[],
  ids = d.supplierShortlist || [],
) {
  return [...new Set(ids)].filter((id) => {
    const supplier = suppliers.find((s) => s.id === id);
    return (
      supplier &&
      templates.some((t) => t.id === supplier.category) &&
      !d.quotes.some((q) => q.supplierId === id)
    );
  });
}

export function prepareSupplierRequests(
  d: Demand,
  suppliers: Supplier[],
  templates: Template[],
  ids = d.supplierShortlist || [],
  makeId = uid,
  now = Date.now(),
): Demand {
  if (
    !d.briefingValid ||
    d.decision === "accepted" ||
    d.decision === "declined" ||
    d.handoff
  )
    return d;
  const eligible = eligibleSupplierIds(d, suppliers, templates, ids);
  if (!eligible.length) return d;
  const quotes: Quote[] = eligible.map((id) => {
    const supplier = suppliers.find((s) => s.id === id)!;
    const template = templates.find((t) => t.id === supplier.category)!;
    return {
      id: makeId(),
      supplierId: id,
      template: structuredClone(template),
      status: "draft",
      deadline: new Date(now + 7 * 86400000).toISOString().slice(0, 10),
      fields: {},
      lines: [],
      terms: "",
      attachment: "",
      selected: false,
    };
  });
  return {
    ...d,
    quotes: [...d.quotes, ...quotes],
    supplierShortlist: (d.supplierShortlist || []).filter(
      (id) => !eligible.includes(id),
    ),
  };
}
