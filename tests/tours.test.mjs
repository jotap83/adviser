import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
const compiler = await createServer({
  server: { middlewareMode: true, hmr: false, watch: null },
});
after(() => compiler.close());
const { buildTourScenario, tourPhases, TOUR_DEMAND, TOUR_PROJECT } =
  await compiler.ssrLoadModule("/src/tour-scenario.ts");
const { tours, readTourProgress } =
  await compiler.ssrLoadModule("/src/tours.ts");
const { staleQuoteLines, currentSelection } = await compiler.ssrLoadModule(
  "/src/quote-model.ts",
);
const { totals } = await compiler.ssrLoadModule("/src/domain.mjs");
const demand = (s) => s.demands.find((d) => d.id === TOUR_DEMAND);

test("o roteiro nasce sem demanda e só valida o briefing na cena de validação", () => {
  const initial = buildTourScenario("entry");
  assert.equal(demand(initial), undefined);
  assert.equal(initial.inbox[0].status, "pending");
  assert.equal(initial.inbox[0].demandId, undefined);
  const created = demand(buildTourScenario("created"));
  assert.equal(created.quotes.length, 0);
  assert.equal(created.guests, 0);
  const aligned = demand(buildTourScenario("aligned"));
  assert.equal(aligned.guests, 200);
  assert.equal(aligned.briefingValid, false);
  assert.equal(aligned.conversation.length, 2);
  assert.equal(demand(buildTourScenario("validated")).briefingValid, true);
});
test("cotações, seleção e aceite respeitam a sequência das cenas", () => {
  const requested = demand(buildTourScenario("requested"));
  assert.ok(
    requested.quotes.every((q) => q.status === "requested" && !q.lines.length),
  );
  const returned = demand(buildTourScenario("returned"));
  assert.ok(returned.quotes.every((q) => q.status === "received"));
  assert.ok(
    returned.quotes.every((q) =>
      q.template.fields
        .filter((f) => f.required)
        .every((f) => Boolean(q.fields[f.id])),
    ),
  );
  assert.equal(returned.lines.length, 0);
  const selected = demand(buildTourScenario("selected"));
  assert.ok(
    selected.quotes
      .filter((q) => q.selected)
      .every((q) => currentSelection(q).confirmedAt),
  );
  assert.equal(staleQuoteLines(selected), false);
  assert.equal(selected.decision, "pending");
  assert.equal(selected.versions.length, 0);
});
test("a revisão preserva v1 e vincula o aceite apenas à v2 enviada", () => {
  const d = demand(buildTourScenario("accepted"));
  assert.equal(d.versions.length, 2);
  assert.equal(d.versions[0].guests, 200);
  assert.equal(d.versions[1].guests, 220);
  assert.ok(d.versions[1].total > d.versions[0].total);
  assert.equal(d.versions[1].total, totals(d.lines, d.fee, d.tax).total);
  assert.equal(d.sentVersion, d.acceptedVersion);
  assert.equal(d.acceptedVersion, d.versions[1].id);
  assert.equal(staleQuoteLines(d), false);
  assert.equal(d.handoff, false);
});
test("repasse e financeiro usam o mesmo evento e cópia da versão aceita", () => {
  const s = buildTourScenario("handoff"),
    d = demand(s);
  const p = s.productionProjects.find((p) => p.id === TOUR_PROJECT);
  assert.equal(p.source.demandId, d.id);
  assert.deepEqual(p.source.version, d.versions[1]);
  d.versions[1].lines[0].unit = 1;
  assert.notEqual(p.source.version.lines[0].unit, 1);
  const rows = s.financeEntries.filter((e) => e.projectId === p.id);
  assert.equal(
    rows.find((e) => e.direction === "receive").amount,
    p.source.version.total,
  );
  assert.ok(rows.every((e) => e.settled === false));
});
test("reabrir uma cena cria dados independentes das alterações feitas na anterior", () => {
  const one = buildTourScenario("selected"),
    snapshot = JSON.stringify(one);
  const two = buildTourScenario("selected");
  two.demands[0].quotes[0].lines[0].unit = 999;
  two.clients[0].name = "Alterado apenas neste cenário";
  assert.equal(JSON.stringify(one), snapshot);
  assert.notEqual(
    buildTourScenario("selected").clients[0].name,
    two.clients[0].name,
  );
});
test("todos os tours possuem cenas e vínculos válidos, e o progresso inválido é descartado", () => {
  assert.equal(new Set(tours.map((t) => t.id)).size, tours.length);
  for (const t of tours)
    for (const step of t.steps) {
      assert.ok(tourPhases.includes(step.phase), step.id);
      assert.ok(step.target && step.body && step.say && step.chapter);
      const s = buildTourScenario(step.phase);
      if (step.path.startsWith("/demandas/")) assert.ok(demand(s));
      if (step.path.startsWith("/fornecedor/"))
        assert.ok(
          demand(s).quotes.find((q) => q.id === step.path.split("/")[3]),
        );
      if (step.path.includes(TOUR_PROJECT))
        assert.ok(s.productionProjects.find((p) => p.id === TOUR_PROJECT));
    }
  assert.deepEqual(readTourProgress("bad JSON"), {});
  assert.deepEqual(
    readTourProgress('{"atendimento":{"index":-1},"inexistente":{"index":0}}'),
    {},
  );
  assert.deepEqual(
    readTourProgress('{"atendimento":{"index":2,"completed":false}}'),
    { atendimento: { index: 2, completed: false } },
  );
});
