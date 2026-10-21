import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
const compiler = await createServer({
  server: { middlewareMode: true, hmr: false, watch: null },
});
after(async () => {
  await compiler.close();
  delete globalThis.localStorage;
});
const model = await compiler.ssrLoadModule("/src/management-model.ts");
const { withManagementInsightsDemo } = await compiler.ssrLoadModule(
  "/src/management-demo.ts",
);
const { seed, createDemand } = await compiler.ssrLoadModule("/src/data.ts");
const { totals } = await compiler.ssrLoadModule("/src/domain.mjs");
const now = Date.parse("2026-10-21T12:00:00Z");
const day = (days) => new Date(now - days * 86400000).toISOString();
const demo = () => withManagementInsightsDemo(seed(), now);

test("primeiro contato usa a mensagem mais antiga, não a data de cadastro; correlação removida sai da base", () => {
  const d = {
    ...createDemand(),
    createdAt: day(1),
    management: {},
    conversation: [{ direction: "in", at: day(10) }],
  };
  assert.equal(model.firstContact(d), Date.parse(day(10)));
  assert.equal(model.firstContact({ ...d, conversation: [] }), undefined);
  assert.equal(
    model.firstContact({ ...d, management: { firstContactAt: day(12) } }),
    Date.parse(day(12)),
  );
});
test("conversão e ciclo usam decisões no período, com amostras e comparação coerentes", () => {
  const a = model.managementAnalytics(demo().demands, "30", now);
  assert.equal(a.average, 12);
  assert.equal(a.previousAverage, 15);
  assert.equal(a.improvement, 20);
  assert.equal(a.cycles.length, 3);
  assert.equal(a.previousCount, 3);
  assert.equal(a.accepted.length, 3);
  assert.equal(a.decided.length, 5);
  assert.equal(a.conversion, 60);
  assert.ok(Math.abs(a.preparation + a.negotiation - a.average) < 0.0001);
  const all = model.managementAnalytics(demo().demands, "all", now);
  assert.equal(all.improvement, undefined);
});
test("datas ausentes, invertidas e futuras não viram zero nem contaminam os indicadores", () => {
  const original = demo().demands.find((d) => d.id === "insight-1");
  const invalid = {
    ...original,
    management: { ...original.management, firstContactAt: day(1) },
    conversation: [],
  };
  assert.equal(
    model.managementAnalytics([invalid], "30", now).cycles.length,
    0,
  );
  const missing = {
    ...original,
    management: { ...original.management, events: [] },
  };
  assert.equal(
    model.managementAnalytics([missing], "30", now).missingDecision,
    1,
  );
  const future = {
    ...original,
    management: {
      ...original.management,
      events: [{ kind: "accepted", at: day(-1) }],
    },
  };
  assert.equal(
    model.managementAnalytics([future], "30", now).decided.length,
    0,
  );
  const empty = model.managementAnalytics([], "30", now);
  assert.equal(empty.average, undefined);
  assert.equal(empty.margin, undefined);
  assert.equal(empty.conversion, undefined);
});
test("envio e aceite capturam marcos sem duplicar e revisões preservam origem e prazo", () => {
  let d = {
    ...createDemand(),
    management: {
      firstContactAt: day(10),
      proposalDueAt: day(4).slice(0, 10),
      events: [],
    },
  };
  const v = { ...d, sentVersion: "v1", stage: "approval" };
  d = model.trackManagementChange(d, v, day(5));
  assert.equal(d.management.events.length, 1);
  let edited = model.trackManagementChange(
    d,
    {
      ...d,
      title: "Novo título",
      management: { ...d.management, proposalDueAt: day(1).slice(0, 10) },
    },
    day(4),
  );
  assert.equal(edited.management.events.length, 1);
  assert.equal(model.firstSent(edited).dueAt, day(4).slice(0, 10));
  let accepted = model.trackManagementChange(
    edited,
    { ...edited, decision: "accepted" },
    day(3),
  );
  let revised = model.trackManagementChange(
    accepted,
    {
      ...accepted,
      decision: "changes",
      management: {
        ...accepted.management,
        revisionReason: "Mudança do cliente",
      },
    },
    day(2),
  );
  let resent = model.trackManagementChange(
    revised,
    { ...revised, decision: "pending", sentVersion: "v2" },
    day(1),
  );
  let acceptedAgain = model.trackManagementChange(
    resent,
    { ...resent, decision: "accepted" },
    day(0),
  );
  assert.equal(model.firstContact(acceptedAgain), Date.parse(day(10)));
  assert.equal(model.firstSent(acceptedAgain).at, day(5));
  assert.equal(model.decisionEvent(acceptedAgain).at, day(0));
  assert.equal(
    acceptedAgain.management.events.filter((e) => e.kind === "accepted").length,
    2,
  );
  const explicit = {
    ...d,
    sentVersion: "v2",
    management: {
      ...d.management,
      events: [
        ...d.management.events,
        { kind: "proposal_sent", at: day(2), versionId: "v2" },
      ],
    },
  };
  assert.equal(
    model.trackManagementChange(d, explicit, day(2)).management.events.length,
    2,
  );
});
test("margem usa remuneração ponderada e exige custos revisados para a versão vigente", () => {
  const d = demo().demands.find((d) => d.id === "insight-1"),
    f = model.forecast(d);
  assert.equal(f.remuneration, 4800);
  assert.equal(f.contribution, 1920);
  assert.equal(f.margin, 40);
  const version = d.versions[0],
    changed = {
      ...version,
      lines: version.lines.map((l) => ({
        ...l,
        unit: l.direct ? l.unit * 20 : l.unit,
      })),
    };
  assert.equal(
    model.forecast({ ...d, versions: [changed] }).remuneration,
    4800,
  );
  assert.equal(
    model.forecast({
      ...d,
      management: { ...d.management, forecast: undefined },
    }),
    undefined,
  );
  assert.equal(
    model.forecast({
      ...d,
      management: {
        ...d.management,
        forecast: { ...d.management.forecast, versionId: "old" },
      },
    }),
    undefined,
  );
  const other = structuredClone(d);
  other.id = "b";
  other.versions[0].lines[0].unit *= 3;
  other.management.forecast.internalCost = 1000;
  other.management.forecast.otherCost = 0;
  const a = model.managementAnalytics([d, other], "30", now);
  const f2 = model.forecast(other);
  assert.equal(
    a.margin,
    ((f.contribution + f2.contribution) * 100) /
      (f.remuneration + f2.remuneration),
  );
});
test("primeira resposta do fornecedor é preservada nas revisões e mede completude original", () => {
  const d = demo().demands.find((d) => d.id === "insight-11");
  const q = {
    ...d.quotes[0],
    status: "received",
    receivedAt: day(2),
    fields: {},
  };
  const received = model.trackManagementChange(
    d,
    { ...d, quotes: [q] },
    day(2),
  );
  assert.equal(received.quotes[0].firstReceivedAt, day(2));
  assert.equal(received.quotes[0].firstResponseComplete, false);
  const revised = model.trackManagementChange(
    received,
    {
      ...received,
      quotes: [
        {
          ...received.quotes[0],
          receivedAt: day(1),
          firstReceivedAt: day(1),
          firstResponseComplete: true,
        },
      ],
    },
    day(1),
  );
  assert.equal(revised.quotes[0].firstReceivedAt, day(2));
  assert.equal(revised.quotes[0].firstResponseComplete, false);
});
test("migração é aditiva e idempotente e risco não duplica valor por sinal", () => {
  const state = seed();
  state.demands[0].title = "Meu trabalho preservado";
  const prepared = withManagementInsightsDemo(state, now);
  assert.equal(prepared.demands[0], state.demands[0]);
  assert.equal(withManagementInsightsDemo(prepared, now + 86400000), prepared);
  const r = model.riskRows(prepared, prepared.demands, new Date(now));
  assert.equal(new Set(r.map((x) => x.d.id)).size, r.length);
  const risky = r.find((r) => r.d.id === "insight-11");
  assert.equal(risky.lowMargin, true);
  assert.equal(risky.value, risky.d.versions[0].total);
});
test("painel renderiza indicadores auditáveis, decisões e fases futuras sem IA real", async () => {
  const { Store } = await compiler.ssrLoadModule("/src/store.tsx");
  const { ManagementDashboard } = await compiler.ssrLoadModule(
    "/src/components/ManagementDashboard.tsx",
  );
  globalThis.localStorage = {
    getItem: () => JSON.stringify(withManagementInsightsDemo(seed())),
  };
  const html = renderToStaticMarkup(
    createElement(Store, null, createElement(ManagementDashboard)),
  );
  for (const text of [
    "Painel Gerencial",
    "Decisões de hoje",
    "Ver base: Contato até o aceite",
    "Clientes e fornecedores",
    "Base dos indicadores",
    "Etapa 2 · Operações",
    "Etapa 3 · Financeiro",
    "sem análise de IA externa",
  ])
    assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /NaN|Infinity/);
});

test("corrigir motivo atual recalcula os indicadores e preserva decisões e revisões anteriores", () => {
  const lost = demo().demands.find((d) => d.id === "insight-8");
  const corrected = model.withManagementReason(lost, "lossReason", "Prazo");
  assert.equal(model.decisionEvent(corrected).reason, "Prazo");
  assert.equal(
    model.managementAnalytics([corrected], "30", now).refused[0].management
      .lossReason,
    "Prazo",
  );
  assert.equal(model.decisionEvent(lost).reason, "Preço");
  const revised = {
    ...lost,
    decision: "changes",
    management: {
      ...lost.management,
      events: [
        { kind: "revision", at: day(12), reason: "Informação incompleta" },
        { kind: "revision", at: day(5), reason: "Mudança do cliente" },
      ],
    },
  };
  const changed = model.withManagementReason(
    revised,
    "revisionReason",
    "Ajuste de fornecedor",
  );
  assert.deepEqual(
    model
      .managementAnalytics([changed], "30", now)
      .revisions.map((r) => r.reason),
    ["Informação incompleta", "Ajuste de fornecedor"],
  );
  const nextReason = model.withManagementReason(
    { ...changed, decision: "pending" },
    "revisionReason",
    "Correção interna",
  );
  assert.deepEqual(nextReason.management.events, changed.management.events);
  const noReason = model.withManagementReason(corrected, "lossReason", "");
  assert.equal(model.decisionEvent(noReason).reason, "");
});
