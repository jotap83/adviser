import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Module transformation only: no listening HTTP server or browser is started.
const compiler = await createServer({
  server: { middlewareMode: true, hmr: false, watch: null },
});
after(async () => {
  await compiler.close();
  delete globalThis.localStorage;
});
const {
  supplierNeeds,
  sameSupplierCity,
  eligibleSupplierIds,
  prepareSupplierRequests,
} = await compiler.ssrLoadModule("/src/supplier-matching.ts");
const { seed, createDemand } = await compiler.ssrLoadModule("/src/data.ts");
const { Store } = await compiler.ssrLoadModule("/src/store.tsx");
const { SupplierSuggestions } = await compiler.ssrLoadModule(
  "/src/components/SupplierSuggestions.tsx",
);
const { Quotes } = await compiler.ssrLoadModule("/src/pages/Quotes.tsx");
const { Briefing } = await compiler.ssrLoadModule("/src/pages/Briefing.tsx");
const fixture = () => ({
  ...createDemand("c1", "Evento de teste"),
  id: "supplier-test",
  briefingValid: true,
  message: "Precisamos de buffet e banda.",
  location: "Rio de Janeiro",
  date: "2027-02-12",
  guests: 80,
  objective: "Integração da equipe",
  supplierShortlist: [],
});

test("sugere categorias a partir da mensagem e respeita a inclusão dos anexos", () => {
  const d = fixture();
  d.attachments = [
    {
      id: "a",
      name: "Briefing.pdf",
      included: true,
      text: "Audiovisual com microfone e iluminação.",
    },
    {
      id: "b",
      name: "Ignorado.docx",
      included: false,
      text: "Cenografia e decoração.",
    },
  ];
  const needs = supplierNeeds(d);
  assert.deepEqual(
    needs.map((n) => n.category),
    ["food", "tech", "music"],
  );
  assert.equal(needs.find((n) => n.category === "tech").source, "Briefing.pdf");
  assert.ok(needs.every((n) => !n.confirmedScope));
  assert.deepEqual(
    supplierNeeds({
      ...d,
      message: "Olá, podemos conversar?",
      attachments: [],
    }),
    [],
  );
});

test("escopo editado pelo atendimento prevalece sobre os textos anteriores", () => {
  const d = {
    ...fixture(),
    scope: {
      music: { included: false, answers: {} },
      tech: { included: true, answers: { equipment: "Dois microfones" } },
    },
  };
  d.conversation = [
    { id: "m", direction: "in", contact: "Ana", text: "Queremos uma banda." },
  ];
  const needs = supplierNeeds(d);
  assert.equal(
    needs.some((n) => n.category === "music"),
    false,
  );
  assert.equal(needs.find((n) => n.category === "tech").confirmedScope, true);
  assert.equal(
    needs.find((n) => n.category === "tech").evidence,
    "Dois microfones",
  );
});

test("cidade usa dado do cadastro sem presumir área de cobertura", () => {
  assert.equal(sameSupplierCity({ city: "Niterói" }, "Niteroi, RJ"), true);
  assert.equal(sameSupplierCity({ city: "Rio" }, "Rio Claro"), false);
  assert.equal(
    sameSupplierCity({ city: "Rio de Janeiro" }, "Centro, Rio de Janeiro - RJ"),
    true,
  );
  assert.equal(sameSupplierCity({ city: "Rio de Janeiro" }, "Niterói"), false);
  assert.equal(sameSupplierCity({ city: "" }, "Rio de Janeiro"), false);
});

test("seleção aceita vários fornecedores por categoria e escolhas manuais de outra cidade", () => {
  const state = seed();
  const d = {
    ...fixture(),
    supplierShortlist: ["s1", "s2", "s5", "s1", "missing"],
  };
  assert.deepEqual(eligibleSupplierIds(d, state.suppliers, state.templates), [
    "s1",
    "s2",
    "s5",
  ]);
  assert.equal(d.supplierShortlist.length, 5);
});

test("cria só rascunhos novos, preserva cotações e propostas e congela o modelo", () => {
  const state = seed();
  const existing = structuredClone(state.demands[0].quotes[0]);
  const d = {
    ...fixture(),
    quotes: [existing],
    supplierShortlist: ["s1", "s2", "s3", "s2", "missing"],
    versions: [{ id: "v1", title: "Proposta anterior" }],
  };
  let id = 0;
  const next = prepareSupplierRequests(
    d,
    state.suppliers,
    state.templates,
    undefined,
    () => `new-${++id}`,
    Date.UTC(2026, 9, 21),
  );
  assert.equal(next.quotes.length, 3);
  assert.equal(next.quotes[0], existing);
  assert.equal(next.versions, d.versions);
  assert.equal(d.quotes.length, 1);
  assert.deepEqual(next.supplierShortlist, ["s1", "missing"]);
  assert.deepEqual(
    next.quotes.slice(1).map((q) => q.supplierId),
    ["s2", "s3"],
  );
  for (const q of next.quotes.slice(1)) {
    assert.equal(q.status, "draft");
    assert.equal(q.selected, false);
    assert.equal(q.sentAt, undefined);
    assert.equal(q.selection, undefined);
    assert.equal(q.deadline, "2026-10-28");
    assert.equal(
      q.template.id,
      state.suppliers.find((s) => s.id === q.supplierId).category,
    );
    assert.notEqual(
      q.template,
      state.templates.find((t) => t.id === q.template.id),
    );
  }
  assert.equal(
    prepareSupplierRequests(next, state.suppliers, state.templates, [
      "s1",
      "s2",
      "s3",
    ]),
    next,
  );
});

test("não prepara solicitações com briefing inválido, demanda encerrada ou sem modelo", () => {
  const state = seed();
  for (const patch of [
    { briefingValid: false },
    { decision: "accepted" },
    { decision: "declined" },
    { handoff: true },
  ]) {
    const d = { ...fixture(), supplierShortlist: ["s2"], ...patch };
    assert.equal(
      prepareSupplierRequests(d, state.suppliers, state.templates),
      d,
    );
  }
  const d = { ...fixture(), supplierShortlist: ["unmapped", "missing"] };
  assert.deepEqual(
    eligibleSupplierIds(
      d,
      [{ id: "unmapped", category: "custom" }],
      state.templates,
    ),
    [],
  );
  assert.equal(
    prepareSupplierRequests(
      d,
      [{ id: "unmapped", category: "custom" }],
      state.templates,
    ),
    d,
  );
});

function render(Component, demand) {
  const state = { ...seed(), demands: [demand], aiMode: "offline" };
  globalThis.localStorage = { getItem: () => JSON.stringify(state) };
  return renderToStaticMarkup(
    createElement(Store, null, createElement(Component, { d: demand })),
  );
}

test("seleção persistida reaparece mesmo com IA offline e escopo alterado", () => {
  const d = JSON.parse(
    JSON.stringify({
      ...fixture(),
      supplierShortlist: ["s5"],
      briefingValid: false,
    }),
  );
  let html = render(SupplierSuggestions, d);
  assert.match(html, /aria-label="Selecionar Trio Primavera" checked=""/);
  assert.match(html, /Valide o briefing/);
  assert.match(html, /disabled=""[^>]*>.*?Preparar 1 solicitação/s);
  html = render(SupplierSuggestions, {
    ...d,
    scope: { music: { included: false, answers: {} } },
  });
  assert.match(html, /1 selecionado fora/);
  assert.match(html, /Remover Trio Primavera da seleção/);
});

test("briefing e cotações exibem o mesmo seletor e mantêm a revisão individual", () => {
  const d = { ...fixture(), supplierShortlist: ["s3"] };
  assert.match(render(Briefing, d), /id="briefing-fornecedores"/);
  assert.match(render(Briefing, d), /Fornecedores sugeridos/);
  const state = seed();
  const next = prepareSupplierRequests(d, state.suppliers, state.templates);
  const html = render(Quotes, next);
  assert.match(html, /Solicitação preparada/);
  assert.match(html, /Solicitações de cotação/);
  assert.match(html, /E-mail/);
  assert.match(html, /Abrir link/);
  assert.doesNotMatch(html, /<button[^>]*>Simular envio<\/button>/);
});
