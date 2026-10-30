import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
const c = await createServer({
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true },
});
after(() => c.close());
const { totals } = await c.ssrLoadModule("/src/domain.mjs");
const { seed, createDemand } = await c.ssrLoadModule("/src/data.ts");
const { prepareDemoState } = await c.ssrLoadModule("/src/demo-state.ts");
const {
  withEventLifecycle,
  ensureEventProject,
  eventProject,
  canValidateBriefing,
  contractReady,
  closureIssues,
  receivablesFromContract,
  documentReady,
  latestDocument,
} = await c.ssrLoadModule("/src/event-lifecycle.ts");
const {
  requestApproval,
  decideApproval,
  latestApproval,
  isApproved,
  approvalFingerprint,
  approvalStatus,
  approvalNotifications,
} = await c.ssrLoadModule("/src/approval-model.ts");
const { withLifecycleExample, LIFECYCLE_EVENT, approveExampleDocument } =
  await c.ssrLoadModule("/src/lifecycle-example.ts");
const base = () => prepareDemoState(seed());
const example = () => withLifecycleExample(base());
function approve(s, t) {
  s = requestApproval(s, t, "u1", ["demo-manager", "demo-director"]);
  const r = latestApproval(s, t);
  for (const u of r.reviewers)
    s = decideApproval(s, r.id, u.userId, "approved", "Conferido");
  return s;
}
test("migração aditiva liga operações a eventos e mantém IDs financeiros; idempotência", () => {
  const old = seed(),
    s = prepareDemoState(old),
    again = withEventLifecycle(s);
  assert.equal(again.demands.length, s.demands.length);
  assert.deepEqual(again.eventRequests, s.eventRequests);
  assert.equal(
    new Set(s.productionProjects.map((p) => p.eventId)).size,
    s.productionProjects.length,
  );
  assert.ok(
    s.productionProjects.every((p) =>
      s.demands.some((d) => d.id === p.eventId),
    ),
  );
  assert.ok(
    s.financeEntries.every((e) =>
      s.productionProjects.some((p) => p.id === e.projectId),
    ),
  );
});
test("visita técnica pode nascer antes da venda sem criar outro evento ou recebíveis", () => {
  let s = base();
  const d = createDemand(s.clients[0].id, "Primeiro pedido");
  s = withEventLifecycle({ ...s, demands: [d] });
  const count = s.financeEntries.length;
  s = ensureEventProject(s, d.id);
  assert.ok(eventProject(s, d.id));
  assert.equal(s.demands.length, 1);
  assert.equal(s.financeEntries.length, count);
  assert.equal(ensureEventProject(s, d.id), s);
  assert.equal(contractReady(s, d), false);
});
test("briefing exige revisão interna e evidência do cliente; alteração invalida ambas", () => {
  let s = base(),
    d = {
      ...s.demands[0],
      date: "2026-12-04",
      guests: 100,
      location: "Rio",
      objective: "Objetivo",
    };
  s = { ...s, demands: [d] };
  const t = { kind: "briefing", targetId: d.id };
  assert.equal(canValidateBriefing(s, d), false);
  s = approve(s, t);
  assert.equal(canValidateBriefing(s, d), false);
  d = {
    ...d,
    briefingClientApproval: {
      decision: "approved",
      by: "Cliente",
      evidence: "E-mail",
      at: "2026-10-30",
      fingerprint: approvalFingerprint(s, t),
    },
  };
  s = { ...s, demands: [d] };
  assert.equal(canValidateBriefing(s, d), true);
  d = { ...d, guests: 150 };
  s = { ...s, demands: [d] };
  assert.equal(canValidateBriefing(s, d), false);
  assert.equal(approvalStatus(s, latestApproval(s, t)), "outdated");
});
test("todos os tipos de documento avisam revisores, preservam snapshot e exigem nova revisão após mudança", () => {
  for (const kind of [
    "contract",
    "supplier_contract",
    "schedule",
    "material",
    "extra",
    "supplier_over_budget",
    "report",
    "accountability",
  ]) {
    let s = base(),
      d = s.demands[0];
    s = approveExampleDocument(
      s,
      d,
      kind,
      "Documento de teste",
      "Conteúdo",
      false,
    );
    const doc = latestDocument(s, d.id, kind),
      t = { kind, targetId: d.id, versionId: doc.id },
      a = latestApproval(s, t);
    assert.ok(
      approvalNotifications(s, a.reviewers[0].userId).some(
        (n) => n.request.id === a.id,
      ),
      kind,
    );
    const original = a.fingerprint;
    s = {
      ...s,
      eventDocuments: s.eventDocuments.map((x) =>
        x.id === doc.id ? { ...x, content: "Alterado" } : x,
      ),
    };
    assert.equal(approvalStatus(s, a), "outdated", kind);
    assert.equal(a.fingerprint, original);
  }
});
test("contrato é vinculado à versão comercial aceita; não libera novo aceite", () => {
  let s = example(),
    d = s.demands.find((d) => d.id === LIFECYCLE_EVENT);
  assert.ok(contractReady(s, d));
  d = { ...d, acceptedVersion: "outra-versao" };
  s = { ...s, demands: s.demands.map((x) => (x.id === d.id ? d : x)) };
  assert.equal(contractReady(s, d), false);
});
test("cronograma aprovado perde validade com mudança de data de tarefa; status de execução não altera planejamento", () => {
  let s = example(),
    d = s.demands.find((d) => d.id === LIFECYCLE_EVENT),
    doc = latestDocument(s, d.id, "schedule"),
    p = eventProject(s, d.id);
  assert.ok(documentReady(s, doc));
  s = {
    ...s,
    productionProjects: s.productionProjects.map((x) =>
      x.id === p.id
        ? { ...x, tasks: x.tasks.map((t) => ({ ...t, status: "doing" })) }
        : x,
    ),
  };
  assert.ok(documentReady(s, doc));
  s = {
    ...s,
    productionProjects: s.productionProjects.map((x) =>
      x.id === p.id
        ? { ...x, tasks: x.tasks.map((t) => ({ ...t, due: "2027-01-01" })) }
        : x,
    ),
  };
  assert.equal(documentReady(s, doc), false);
});
test("parcelas preservam valor via agência, excluem pagamento direto e não duplicam", () => {
  let s = example(),
    d = s.demands.find((d) => d.id === LIFECYCLE_EVENT),
    p = eventProject(s, d.id);
  s = {
    ...s,
    financeEntries: s.financeEntries.filter((e) => e.projectId !== p.id),
  };
  const v = {
    ...d.versions[0],
    lines: d.versions[0].lines.map((l, i) =>
      i === 0 ? { ...l, direct: true } : l,
    ),
  };
  d = { ...d, versions: [v] };
  s = { ...s, demands: s.demands.map((x) => (x.id === d.id ? d : x)) };
  s = receivablesFromContract(s, d.id, 33, "2026-11-01", "2026-12-01");
  const entries = s.financeEntries.filter((e) => e.projectId === p.id);
  assert.equal(entries.length, 2);
  assert.equal(
    Math.round(entries.reduce((n, e) => n + e.amount, 0) * 100),
    Math.round(totals(v.lines, v.fee, v.tax).invoice * 100),
  );
  assert.equal(
    receivablesFromContract(s, d.id, 50, "2026-11-01", "2026-12-01"),
    s,
  );
});
test("novo exemplo é coerente, reutilizável e mantém demandas distintas do evento", () => {
  const s = example(),
    d = s.demands.find((d) => d.id === LIFECYCLE_EVENT);
  assert.equal(withLifecycleExample(s), s);
  assert.equal(s.eventRequests.filter((r) => r.eventId === d.id).length, 2);
  assert.equal(s.demands.filter((x) => x.id === d.id).length, 1);
  assert.ok(closureIssues(s, d).length);
  assert.equal(
    closureIssues(s, d).some((x) => x.includes("relatório")),
    true,
  );
});
test("alterar contas invalida a prestação de contas aprovada", () => {
  let s = example(),
    d = s.demands.find((d) => d.id === LIFECYCLE_EVENT);
  s = {
    ...s,
    eventDocuments: s.eventDocuments.filter(
      (doc) => !(doc.eventId === d.id && doc.kind === "accountability"),
    ),
    approvals: s.approvals.filter(
      (a) => !(a.targetId === d.id && a.kind === "accountability"),
    ),
  };
  s = approveExampleDocument(
    s,
    d,
    "accountability",
    "Prestação de contas",
    "Conferência completa",
  );
  const doc = latestDocument(s, d.id, "accountability");
  assert.ok(documentReady(s, doc));
  s = {
    ...s,
    financeEntries: s.financeEntries.map((e) =>
      e.id === "example-pay" ? { ...e, amount: e.amount + 1 } : e,
    ),
  };
  assert.equal(documentReady(s, doc), false);
});

test("revisão contratual não duplica recebíveis de uma versão anterior", () => {
  let s = example();
  let d = s.demands.find((x) => x.id === LIFECYCLE_EVENT);
  const previous = d.versions[0];
  const revised = { ...previous, id: "revised-accepted", number: 2 };
  d = { ...d, acceptedVersion: revised.id, versions: [previous, revised] };
  s = {
    ...s,
    demands: s.demands.map((x) => (x.id === d.id ? d : x)),
    eventDocuments: s.eventDocuments.filter(
      (doc) => !(doc.eventId === d.id && doc.kind === "contract"),
    ),
    approvals: s.approvals.filter(
      (a) => !(a.targetId === d.id && a.kind === "contract"),
    ),
  };
  s = approveExampleDocument(
    s,
    d,
    "contract",
    "Contrato revisado",
    "Nova versão aceita",
  );
  assert.ok(contractReady(s, d));
  assert.equal(
    receivablesFromContract(s, d.id, 50, "2026-11-01", "2026-12-01"),
    s,
  );
});

test("cronograma vincula descrição, fornecedor e checklist, sem invalidar ao concluir um item", () => {
  const s = example(),
    d = s.demands.find((d) => d.id === LIFECYCLE_EVENT),
    p = eventProject(s, d.id),
    doc = latestDocument(s, d.id, "schedule");
  const mutate = (fn) => ({
    ...s,
    productionProjects: s.productionProjects.map((x) =>
      x.id === p.id ? { ...x, tasks: x.tasks.map(fn) } : x,
    ),
  });
  for (const edit of [
    (t) => ({ ...t, description: "Escopo alterado" }),
    (t) => ({ ...t, supplier: "Outro fornecedor" }),
    (t) => ({
      ...t,
      checklist: [
        ...t.checklist,
        { id: "new-check", text: "Novo requisito", done: false },
      ],
    }),
  ]) {
    assert.equal(documentReady(mutate(edit), doc), false);
  }
  assert.ok(
    documentReady(
      mutate((t) => ({
        ...t,
        checklist: t.checklist.map((c) => ({ ...c, done: true })),
      })),
      doc,
    ),
  );
});

test("encerramento considera documentos vigentes e reabre uma única vez diante de novas pendências", () => {
  let s = example(),
    d = s.demands.find((x) => x.id === LIFECYCLE_EVENT),
    p = eventProject(s, d.id);
  d = { ...d, executionPhase: "post" };
  s = {
    ...s,
    demands: s.demands.map((x) => (x.id === d.id ? d : x)),
    eventRequests: s.eventRequests.map((r) =>
      r.eventId === d.id ? { ...r, status: "done" } : r,
    ),
    financeEntries: s.financeEntries.map((e) =>
      e.projectId === p.id ? { ...e, settled: true } : e,
    ),
    productionProjects: s.productionProjects.map((x) =>
      x.id === p.id
        ? { ...x, tasks: x.tasks.map((t) => ({ ...t, status: "done" })) }
        : x,
    ),
  };
  function validate(doc) {
    const target = { kind: doc.kind, targetId: d.id, versionId: doc.id };
    s = approve(s, target);
    s = {
      ...s,
      eventDocuments: s.eventDocuments.map((x) =>
        x.id === doc.id
          ? {
              ...x,
              clientDecision: {
                decision: "approved",
                by: "Cliente fictício",
                evidence: "Teste",
                at: "2026-10-30",
                fingerprint: approvalFingerprint(s, target),
              },
            }
          : x,
      ),
    };
  }
  for (const doc of s.eventDocuments.filter(
    (x) => x.eventId === d.id && x.kind !== "material",
  ))
    validate(doc);
  assert.ok(closureIssues(s, d).some((x) => x.includes("Roteiro de abertura")));
  validate(latestDocument(s, d.id, "material"));
  assert.deepEqual(closureIssues(s, d), []);
  d = { ...d, executionPhase: "closed" };
  s = { ...s, demands: s.demands.map((x) => (x.id === d.id ? d : x)) };
  assert.equal(
    withEventLifecycle(s).demands.find((x) => x.id === d.id).executionPhase,
    "closed",
  );
  const changed = {
    ...s,
    eventRequests: [
      ...s.eventRequests,
      {
        ...s.eventRequests.find((r) => r.eventId === d.id),
        id: "new-request",
        status: "new",
      },
    ],
  };
  const reopened = withEventLifecycle(changed),
    event = reopened.demands.find((x) => x.id === d.id);
  assert.equal(event.executionPhase, "post");
  assert.equal(event.history.length, d.history.length + 1);
  assert.deepEqual(
    withEventLifecycle(reopened).demands.find((x) => x.id === d.id).history,
    event.history,
  );
});
