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
const { seed } = await compiler.ssrLoadModule("/src/data.ts");
const { prepareDemoState } = await compiler.ssrLoadModule("/src/demo-state.ts");
const { Store } = await compiler.ssrLoadModule("/src/store.tsx");
const { AtendimentoHome, attendanceNextAction } = await compiler.ssrLoadModule(
  "/src/pages/AtendimentoHome.tsx",
);
const { Home } = await compiler.ssrLoadModule("/src/pages/Home.tsx");
const { Inbox } = await compiler.ssrLoadModule("/src/pages/Inbox.tsx");
const { Briefing } = await compiler.ssrLoadModule("/src/pages/Briefing.tsx");
function render(Component, state, props = {}) {
  const before = JSON.stringify(state);
  globalThis.localStorage = { getItem: () => before };
  const html = renderToStaticMarkup(
    createElement(Store, null, createElement(Component, props)),
  );
  assert.equal(
    JSON.stringify(state),
    before,
    "Renderizar não altera os dados salvos",
  );
  return html;
}
function messageState(reviewed = false, offline = false) {
  const state = prepareDemoState(seed());
  state.aiMode = offline ? "offline" : "available";
  state.inbox = [
    {
      ...state.inbox[0],
      id: "guided-request",
      subject: "Primeiro contato: organizar novo evento",
      text: "Gostaríamos de organizar um novo evento.",
      status: "pending",
      demandId: undefined,
      classification: reviewed
        ? {
            kind: "new",
            reason: "Pedido inicial revisado",
            reviewed: true,
            urgent: false,
          }
        : undefined,
    },
  ];
  return state;
}
test("abertura do atendimento destaca a fila sem funil, filtros avançados ou tarefas fixas de exemplo", () => {
  const html = render(AtendimentoHome, messageState());
  assert.match(html, /Atender mensagens/);
  assert.match(html, /Continuar um evento/);
  assert.match(html, /Ver carteira completa/);
  assert.doesNotMatch(
    html,
    /Funil de atendimento|Visualizar como|Entender o briefing|Núcleo da carteira/,
  );
  assert.ok((html.match(/class="service-event-next"/g) || []).length <= 6);
});
test("mensagem nova começa pela revisão da IA, sem formulário de criação e vínculo concorrentes", () => {
  const html = render(Inbox, messageState(), { emailId: "guided-request" });
  assert.match(html, /Confirmar e continuar/);
  assert.match(html, /<option value="new" selected="">Novo evento/);
  assert.doesNotMatch(
    html,
    /Vincular a evento existente|Criar evento e abrir briefing|Confirmar vínculo/,
  );
  assert.match(html, /class="service-disclosure inbox-demo-tools"><summary>/);
});
test("classificação revisada libera a escolha explícita entre evento novo e existente", () => {
  const html = render(Inbox, messageState(true), { emailId: "guided-request" });
  assert.match(html, /Criar novo evento/);
  assert.match(html, /Vincular a evento existente/);
  assert.doesNotMatch(
    html,
    /Confirmar e continuar|Criar evento e abrir briefing/,
  );
});
test("IA indisponível mantém classificação manual e ação de continuar", () => {
  const html = render(Inbox, messageState(false, true), {
    emailId: "guided-request",
  });
  assert.match(html, /A classificação manual continua disponível/);
  assert.match(html, /Confirmar e continuar/);
  assert.match(html, /<option value="other" selected="">Revisar manualmente/);
});
test("cadastro direto ocupa uma tela dedicada sem carteira e lista por baixo", () => {
  const html = render(Home, messageState(), { newDemand: true });
  assert.match(html, /Cadastrar evento diretamente/);
  assert.match(html, /Criar evento/);
  assert.doesNotMatch(
    html,
    /Funil de atendimento|Sua fila de trabalho|Explorar ciclo completo/,
  );
});
test("briefing mantém dados e revisão montados, mas começa somente pelo pedido", () => {
  const state = messageState();
  const d = { ...state.demands[0], briefingValid: false };
  const html = render(Briefing, state, { d });
  assert.match(html, /id="briefing-entrada" data-briefing-step="0">/);
  assert.match(html, /id="briefing-dados" data-briefing-step="1" hidden=""/);
  assert.match(html, /data-briefing-step="2" hidden=""/);
  assert.match(html, /Continuar para dados e escopo/);
  assert.doesNotMatch(html, /supplier-suggestions/);
});

test("retomar evento aponta à ação de trabalho e respeita o ciclo após o aceite", () => {
  const state = messageState();
  const base = {
    ...state.demands[0],
    id: "resume-example",
    briefingValid: true,
    sentVersion: undefined,
    decision: "pending",
    executionPhase: undefined,
  };
  const compare = attendanceNextAction(state, { ...base, stage: "compare" });
  assert.equal(compare.tab, "compare");
  assert.equal(compare.label, "Comparar cotações");
  const proposal = attendanceNextAction(state, { ...base, stage: "proposal" });
  assert.equal(proposal.tab, "proposal");
  assert.notEqual(proposal.label, compare.label);
  assert.equal(
    attendanceNextAction(state, {
      ...base,
      stage: "proposal",
      sentVersion: "old",
      decision: "changes",
    }).tab,
    "proposal",
  );
  assert.equal(
    attendanceNextAction(state, {
      ...base,
      stage: "approval",
      decision: "accepted",
    }).tab,
    "contracts",
  );
  assert.equal(
    attendanceNextAction(state, {
      ...base,
      stage: "handoff",
      decision: "accepted",
      executionPhase: "planning",
    }).tab,
    "production",
  );
  assert.equal(
    attendanceNextAction(state, {
      ...base,
      stage: "handoff",
      decision: "accepted",
      executionPhase: "post",
    }).tab,
    "post",
  );
});
