import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
const compiler = await createServer({
  server: { middlewareMode: true, hmr: false, watch: null },
});
after(() => compiler.close());
const { seed, createDemand } = await compiler.ssrLoadModule("/src/data.ts");
const { prepareDemoState } = await compiler.ssrLoadModule("/src/demo-state.ts");
const {
  requestApproval,
  decideApproval,
  latestApproval,
  isApproved,
  approvalStatus,
  approvalNotifications,
} = await compiler.ssrLoadModule("/src/approval-model.ts");
const { linkMail } = await compiler.ssrLoadModule("/src/inbox-model.ts");
const { withReferences } = await compiler.ssrLoadModule(
  "/src/mail-reference.ts",
);
const { classifyMessage } = await compiler.ssrLoadModule(
  "/src/message-classification.ts",
);
const { projectFromHandoff } = await compiler.ssrLoadModule(
  "/src/production-model.ts",
);
const { approveExampleDocument } = await compiler.ssrLoadModule(
  "/src/lifecycle-example.ts",
);
function setup() {
  const s = prepareDemoState(seed()),
    d = s.demands.find((d) => d.versions.length);
  return {
    s,
    d,
    t: { kind: "proposal", targetId: d.id, versionId: d.versions[0].id },
  };
}
test("proposta exige todos os revisores, notifica destinatários e devolve resultado ao solicitante", () => {
  let { s, t } = setup();
  s = requestApproval(s, t, "u1", ["u2", "u3"]);
  const r = latestApproval(s, t);
  assert.equal(r.reviewers.length, 2);
  assert.equal(approvalNotifications(s, "u2").length, 1);
  assert.equal(approvalNotifications(s, "u1").length, 0);
  s = decideApproval(s, r.id, "u2", "approved", "Conferido");
  assert.equal(isApproved(s, t), false);
  assert.equal(approvalNotifications(s, "u2").length, 0);
  s = decideApproval(s, r.id, "u3", "approved", "");
  assert.equal(isApproved(s, t), true);
  assert.equal(approvalNotifications(s, "u1")[0].pending, false);
});
test("solicitante, pessoa não designada ou inativa não aprova; não duplica solicitação", () => {
  let { s, t } = setup();
  assert.equal(requestApproval(s, t, "u1", ["u1"]), s);
  s = requestApproval(s, t, "u1", ["u2", "u2"]);
  const r = latestApproval(s, t);
  assert.equal(r.reviewers.length, 1);
  assert.equal(requestApproval(s, t, "u1", ["u3"]), s);
  assert.equal(decideApproval(s, r.id, "u3", "approved", ""), s);
  assert.equal(decideApproval(s, r.id, "u1", "approved", ""), s);
  s = {
    ...s,
    users: s.users.map((u) => (u.id === "u2" ? { ...u, active: false } : u)),
  };
  assert.equal(decideApproval(s, r.id, "u2", "approved", ""), s);
});
test("pedido de ajustes exige motivo; nova rodada preserva histórico", () => {
  let { s, t } = setup();
  s = requestApproval(s, t, "u1", ["u2"]);
  let r = latestApproval(s, t);
  assert.equal(decideApproval(s, r.id, "u2", "changes", "  "), s);
  s = decideApproval(s, r.id, "u2", "changes", "Rever condições");
  assert.equal(approvalStatus(s, s.approvals[0]), "changes");
  assert.equal(isApproved(s, t), false);
  s = requestApproval(s, t, "u1", ["u2"]);
  assert.equal(s.approvals.length, 2);
  assert.equal(s.approvals[1].reviewers[0].comment, "Rever condições");
  assert.notEqual(s.approvals[0].id, r.id);
});
test("nova versão ou mudança de valor não herda aprovação de outra versão", () => {
  let { s, t, d } = setup();
  s = requestApproval(s, t, "u1", ["u2"]);
  const r = latestApproval(s, t);
  s = decideApproval(s, r.id, "u2", "approved", "");
  assert.ok(isApproved(s, t));
  assert.equal(isApproved(s, { ...t, versionId: "future" }), false);
  s = {
    ...s,
    demands: s.demands.map((x) =>
      x.id === d.id
        ? {
            ...x,
            versions: x.versions.map((v) =>
              v.id === t.versionId ? { ...v, total: v.total + 1 } : v,
            ),
          }
        : x,
    ),
  };
  assert.equal(approvalStatus(s, s.approvals[0]), "outdated");
  assert.equal(isApproved(s, t), false);
});
test("pagamento tem aprovação própria e alterações invalidam a revisão", () => {
  let { s } = setup();
  const e = s.financeEntries.find((e) => e.direction === "pay" && !e.settled),
    t = { kind: "payment", targetId: e.id };
  s = requestApproval(s, t, "u1", ["u2"]);
  s = decideApproval(s, latestApproval(s, t).id, "u2", "approved", "Conferido");
  assert.ok(isApproved(s, t));
  s = {
    ...s,
    financeEntries: s.financeEntries.map((x) =>
      x.id === e.id ? { ...x, due: "2030-01-01" } : x,
    ),
  };
  assert.equal(isApproved(s, t), false);
});
test("primeira mensagem cria evento sem nenhum evento existente, conserva origem, mensagem e anexos", () => {
  let { s } = setup();
  const email = {
    ...s.inbox.find((m) => m.status === "pending"),
    id: "first-message",
    demandId: undefined,
    method: undefined,
    threadId: "new-thread",
    attachments: [
      { name: "pedido.pdf", kind: "pdf", text: "Evento para 100 pessoas" },
    ],
  };
  s = { ...s, demands: [], inbox: [email] };
  const d = createDemand(s.clients[0].id, "Primeiro evento");
  s = withReferences({ ...s, demands: [d] });
  s = linkMail(s, email.id, d.id, "new");
  assert.equal(s.inbox[0].demandId, d.id);
  assert.equal(s.inbox[0].status, "linked");
  const created = s.demands[0];
  assert.ok(created.reference);
  assert.ok(created.conversation.some((m) => m.text.includes(email.text)));
  assert.ok(created.attachments.some((a) => a.name === "pedido.pdf"));
  assert.equal(created.briefingValid, false);
});
test("classificação é sugestão com evidência; não confirma aprovação nem modifica mensagem", () => {
  const { s } = setup();
  const m = {
      ...s.inbox[0],
      subject: "Nota fiscal",
      text: "Segue cobrança com vencimento amanhã.",
    },
    copy = structuredClone(m),
    r = classifyMessage(m);
  assert.equal(r.kind, "billing");
  assert.equal(r.urgent, true);
  assert.equal(r.reviewed, false);
  assert.deepEqual(m, copy);
  assert.equal(
    classifyMessage({
      ...m,
      subject: "Primeiro contato",
      text: "Gostaríamos de organizar um novo evento.",
    }).kind,
    "new",
  );
});
test("repasse só cria operação de uma versão aceita e não cria contas por efeito colateral", () => {
  const { s, d } = setup(),
    before = structuredClone(s.financeEntries);
  assert.equal(projectFromHandoff({ ...d, handoff: false }, s), null);
  const ready = {
    ...d,
    handoff: true,
    decision: "accepted",
    acceptedVersion: d.versions[0].id,
  };
  assert.equal(
    projectFromHandoff(ready, s),
    null,
    "sem contrato não libera execução",
  );
  const withContract = approveExampleDocument(
    s,
    ready,
    "contract",
    "Contrato de teste",
    "Condições e assinatura fictícias",
  );
  const p = projectFromHandoff(ready, withContract);
  assert.ok(p);
  assert.equal(p.source.version.id, ready.acceptedVersion);
  assert.deepEqual(s.financeEntries, before);
});

test("links de aprovação preservam a versão solicitada e abrem o resultado exato", async () => {
  const { approvalRoute, approvalNoticeRoute } = await compiler.ssrLoadModule(
    "/src/approval-model.ts",
  );
  let { s, d, t } = setup();
  const v = { ...d.versions[0], id: "v2-review", number: 2, total: 999 };
  s = {
    ...s,
    demands: s.demands.map((x) =>
      x.id === d.id
        ? { ...x, sentVersion: t.versionId, versions: [...x.versions, v] }
        : x,
    ),
  };
  s = requestApproval(s, { ...t, versionId: v.id }, "u1", ["u3"]);
  const r = s.approvals[0];
  assert.equal(approvalRoute(s, r), `/demandas/${d.id}/approval/v2-review`);
  assert.equal(JSON.parse(r.fingerprint).number, 2);
  for (const decision of ["approved", "changes"]) {
    const decided = decideApproval(s, r.id, "u3", decision, "Revisão de teste");
    const n = approvalNotifications(decided, "u1")[0];
    assert.equal(
      approvalNoticeRoute(n.request),
      `/aprovacoes/solicitacao/${r.id}`,
    );
  }
});
test("busca de operações encontra tarefas na carteira e clientes na fila transversal", async () => {
  const { projectMatchesSearch, taskMatchesSearch } =
    await compiler.ssrLoadModule("/src/portfolio-search.ts");
  const { s } = setup(),
    p = {
      ...s.productionProjects[0],
      title: "Evento de liderança",
      client: "Cliente Árvore",
    },
    t = { ...p.tasks[0], title: "Receber credenciais exclusivas" };
  p.tasks = [t];
  assert.equal(projectMatchesSearch(p, "credenciais exclusivas"), true);
  assert.equal(taskMatchesSearch(p, t, "cliente arvore"), true);
  assert.equal(projectMatchesSearch(p, "inexistente"), false);
});
