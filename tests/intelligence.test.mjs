import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
const compiler = await createServer({
  server: { middlewareMode: true, hmr: false, watch: null },
});
after(() => compiler.close());
const { seed } = await compiler.ssrLoadModule("/src/data.ts");
const { withProductionDemo } = await compiler.ssrLoadModule(
  "/src/production-model.ts",
);
const { withManagementInsightsDemo } = await compiler.ssrLoadModule(
  "/src/management-demo.ts",
);
const {
  simulateIntelligence,
  defaultInputs,
  financeDocument,
  contextFingerprint,
} = await compiler.ssrLoadModule("/src/intelligence-model.ts");
const { billingExample } = await compiler.ssrLoadModule(
  "/src/billing-example.ts",
);
const now = Date.parse("2026-10-21T12:00:00Z");
const demo = () => withManagementInsightsDemo(withProductionDemo(seed()), now);

test("comparação usa alternativas e opcionais separados, sinaliza capacidade e não modifica escolhas", () => {
  const s = demo(),
    d = s.demands[0];
  d.guests = 230;
  d.quotes[0].lines.push({
    id: "opt",
    category: "Local",
    description: "Opcional extra",
    qty: 1,
    unit: 500,
    optional: true,
    direct: false,
  });
  const before = structuredClone(s),
    inputs = { ...defaultInputs(s, d), category: "local" };
  const result = simulateIntelligence(s, "quotes", d.id, inputs, now);
  assert.equal(result.rows.length, 2);
  assert.match(result.rows[0][2], /8.700,00/);
  assert.match(result.rows[0][3], /500,00/);
  assert.ok(result.findings.some((f) => /Capacidade abaixo/.test(f.title)));
  assert.deepEqual(s, before);
});
test("mudança é hipótese: não recalcula valores nem altera briefing ou proposta aceita", () => {
  const s = demo(),
    d = s.demands.find((x) => x.decision === "accepted"),
    before = structuredClone(s);
  const result = simulateIntelligence(
    s,
    "changes",
    d.id,
    { ...defaultInputs(s, d), guests: "180", date: "2026-12-11" },
    now,
  );
  assert.match(result.findings[0].detail, /180/);
  assert.deepEqual(s, before);
  assert.ok(
    simulateIntelligence(
      s,
      "changes",
      d.id,
      { ...defaultInputs(s, d), guests: "-1" },
      now,
    ).blocked,
  );
});
test("documento recusa formatos monetários ambíguos e datas impossíveis sem interpretar valores parciais", () => {
  const doc = (value) =>
    `Descrição: Buffet\nValor: ${value}\nVencimento: 2026-12-10`;
  assert.equal(financeDocument(doc("R$ 1.234,56")).value, 1234.56);
  assert.ok(
    !financeDocument(doc("100").replace("Descrição: Buffet", "Descrição: "))
      .description,
  );
  for (const text of [
    "1,234.56",
    "1.23",
    "-100",
    "12.345,678",
    "500 reais",
    "",
  ])
    assert.equal(financeDocument(doc(text)).value, undefined);
  assert.equal(
    financeDocument(doc("100").replace("2026-12-10", "2026-02-31")).due,
    undefined,
  );
  assert.equal(
    financeDocument(doc("100").replace("2026-12-10", "2026-99-99")).due,
    undefined,
  );
});
test("conferência não cruza projetos e não cria baixas ou lançamentos", () => {
  const s = demo(),
    p = s.productionProjects[0],
    example = billingExample(s, p.id, "gmail"),
    input = {
      ...defaultInputs(s, undefined, p),
      document: example.text,
      documentOrigin: example.origin,
      entryId: example.entryId,
    },
    before = structuredClone(s);
  const result = simulateIntelligence(s, "finance", p.id, input, now);
  assert.ok(!result.blocked);
  assert.match(result.findings[0].detail, /450,00/);
  assert.match(result.findings[0].source, /Gmail/);
  assert.deepEqual(s, before);
  s.financeEntries.find((e) => e.id === input.entryId).projectId =
    "another-project";
  assert.ok(simulateIntelligence(s, "finance", p.id, input, now).blocked);
});
test("planejamento operacional bloqueia repasse obsoleto e nunca cria tarefas durante a análise", () => {
  const s = demo(),
    p = s.productionProjects[0];
  p.source = {
    demandId: "gone",
    version: { id: "old", number: 1, lines: [{ category: "Buffet" }] },
  };
  const before = structuredClone(s);
  const result = simulateIntelligence(
    s,
    "operations",
    p.id,
    defaultInputs(s, undefined, p),
    now,
  );
  assert.ok(result.blocked);
  assert.deepEqual(s, before);
});
test("consulta gerencial usa base do painel e memória admite ausência de resultados", () => {
  const s = demo(),
    d = s.demands[0],
    input = defaultInputs(s, d);
  const result = simulateIntelligence(
    s,
    "management",
    "portfolio",
    { ...input, question: "cycle" },
    now,
  );
  assert.match(result.summary, /Média de 12 dias em 3 aceite/);
  const empty = simulateIntelligence(
    s,
    "memory",
    d.id,
    { ...input, query: "inexistente-nesta-carteira" },
    now,
  );
  assert.equal(empty.findings.length, 0);
});
test("alterar registros invalida análise; guardar notas e priorizar não invalida fontes", () => {
  const s = demo(),
    key = contextFingerprint(s);
  s.intelligencePriorities = { quotes: true };
  s.intelligenceNotes = [];
  assert.equal(contextFingerprint(s), key);
  s.demands[0].guests = 999;
  assert.notEqual(contextFingerprint(s), key);
});

test("a conferência começa sem cobrança inventada ou lançamento pré-associado", () => {
  const s = demo(),
    p = s.productionProjects[0];
  const input = defaultInputs(s, undefined, p);
  assert.equal(input.document, "");
  assert.equal(input.entryId, "");
  assert.ok(simulateIntelligence(s, "finance", p.id, input, now).blocked);
  const first = s.financeEntries.find(
    (e) => e.projectId === p.id && e.direction === "pay",
  );
  assert.ok(
    simulateIntelligence(
      s,
      "finance",
      p.id,
      { ...input, entryId: first.id },
      now,
    ).blocked,
  );
});

test("exemplo recebido é explícito, preserva origem e não segue mudanças no lançamento", () => {
  const s = demo(),
    p = s.productionProjects[0],
    before = structuredClone(s);
  const receipt = billingExample(s, p.id, "whatsapp");
  assert.match(receipt.origin, /WhatsApp.*simulado/);
  const entry = s.financeEntries.find((e) => e.id === receipt.entryId);
  const receivedValue = financeDocument(receipt.text).value;
  assert.equal(receivedValue, entry.amount + 450);
  assert.deepEqual(s, before);
  entry.amount += 1000;
  assert.equal(financeDocument(receipt.text).value, receivedValue);
  assert.equal(billingExample(s, "evento-inexistente", "gmail"), undefined);
  s.financeEntries = s.financeEntries.filter(
    (e) => e.projectId !== p.id || e.direction !== "pay",
  );
  assert.equal(billingExample(s, p.id, "gmail"), undefined);
});
