import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: "pt-BR",
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const base = process.env.DEMO_URL || "http://127.0.0.1:4173/";
const state = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("adviser-demo-v1")));
const go = async (path) => {
  await page.goto(base + "#" + path);
  await page.locator("h1").waitFor();
};
const capture = async (name) => {
  const close = page.getByRole("button", { name: "Fechar aviso", exact: true });
  if (await close.count()) await close.click();
  await page.evaluate(async () => {
    document.activeElement?.blur();
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
    `Horizontal overflow: ${name}`,
  );
  await page.screenshot({
    path: `.impeccable/review/${name}.png`,
    fullPage: true,
  });
};
const fields = (d) => ({
  title: d.title,
  date: d.date,
  guests: d.guests,
  budget: d.budget,
  location: d.location,
  objective: d.objective,
  lines: d.lines,
  versions: d.versions,
  decision: d.decision,
  reference: d.reference,
});
try {
  await fs.mkdir(".impeccable/review", { recursive: true });
  await go("/");
  await page
    .getByRole("button", { name: "Revisar e-mails", exact: true })
    .waitFor();
  const initial = await state();
  assert.equal(initial.inbox.filter((m) => m.status === "pending").length, 4);
  assert.equal(
    initial.inbox.find((m) => m.id === "mail-identified").method,
    "reference",
  );
  assert.equal(
    new Set(initial.demands.map((d) => d.reference)).size,
    initial.demands.length,
  );
  await capture("inbox-home-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("inbox-home-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("button", { name: "Revisar e-mails", exact: true })
    .click();
  await page.getByRole("heading", { name: "E-mails do atendimento" }).waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Confirmar vínculo", exact: true })
      .isDisabled(),
    true,
  );
  await page.getByRole("radio", { name: /Encontro Horizonte/ }).check();
  await capture("inbox-review-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("inbox-review-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("button", { name: "Confirmar vínculo", exact: true })
    .click();
  await page.getByRole("heading", { name: "Mensagem associada" }).waitFor();
  let current = await state();
  const d1Before = initial.demands.find((d) => d.id === "d1");
  assert.deepEqual(
    fields(current.demands.find((d) => d.id === "d1")),
    fields(d1Before),
  );
  assert.equal(
    current.demands
      .find((d) => d.id === "d1")
      .conversation.filter((m) => m.inboxEmailId === "mail-horizonte").length,
    1,
  );
  assert.equal(
    current.demands
      .find((d) => d.id === "d1")
      .attachments.filter((a) => a.messageId === "inbox-mail-horizonte").length,
    1,
  );
  await capture("inbox-linked-desktop");
  await page
    .getByRole("button", { name: "Abrir briefing", exact: true })
    .click();
  const reference = initial.demands.find((d) => d.id === "d1").reference;
  assert.match(
    await page.getByLabel("Assunto com referência do atendimento").inputValue(),
    new RegExp(reference),
  );
  assert.match(
    await page.getByLabel("Texto sugerido de formalização").inputValue(),
    new RegExp(reference),
  );
  await page.getByRole("button", { name: "Ver associação do e-mail" }).click();
  await page
    .getByRole("button", { name: "Corrigir vínculo", exact: true })
    .click();
  await page
    .getByLabel("Atendimento para associar", { exact: true })
    .selectOption("d2");
  await page
    .getByRole("button", { name: "Salvar correção", exact: true })
    .click();
  current = await state();
  assert.equal(
    current.inbox.find((m) => m.id === "mail-horizonte").demandId,
    "d2",
  );
  assert.equal(
    current.inbox.find((m) => m.id === "mail-horizonte").history.length,
    2,
  );
  assert.equal(
    current.demands
      .find((d) => d.id === "d1")
      .conversation.some((m) => m.inboxEmailId === "mail-horizonte"),
    false,
  );
  assert.equal(
    current.demands.find((d) => d.id === "d1").attachments.length,
    0,
  );
  assert.deepEqual(
    fields(current.demands.find((d) => d.id === "d1")),
    fields(d1Before),
  );
  await page
    .getByRole("button", { name: "Simular nova resposta", exact: true })
    .click();
  current = await state();
  const latest = current.inbox.at(-1);
  assert.equal(latest.method, "thread");
  assert.equal(latest.demandId, "d2");
  // A correction can split an account/thread across two demands. The next
  // response must remain visible in the pending queue, with no success claim.
  await go("/emails/mail-horizonte");
  await page
    .getByRole("button", { name: "Corrigir vínculo", exact: true })
    .click();
  await page
    .getByLabel("Atendimento para associar", { exact: true })
    .selectOption("d1");
  await page
    .getByRole("button", { name: "Salvar correção", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Simular nova resposta", exact: true })
    .click();
  current = await state();
  const conflictedReply = current.inbox.at(-1);
  assert.equal(conflictedReply.status, "pending");
  assert.equal(conflictedReply.demandId, undefined);
  assert.equal(
    await page
      .getByRole("button", { name: /Para identificar/ })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page
      .locator('.inbox-list-item[aria-current="true"] strong')
      .textContent(),
    conflictedReply.subject,
  );
  await page
    .getByText(
      "Resposta fictícia recebida e pendente de identificação. Revise os indícios e confirme o vínculo.",
      { exact: true },
    )
    .waitFor();
  await page
    .getByText("Esta conversa está associada a mais de um atendimento.", {
      exact: false,
    })
    .waitFor();
  assert.equal(
    await page.getByRole("heading", { name: "Mensagem associada" }).count(),
    0,
  );
  await capture("inbox-thread-conflict-desktop");
  await page.getByRole("button", { name: /Para identificar/ }).click();
  await page
    .getByRole("button", { name: /Retorno sobre os nossos eventos/ })
    .click();
  assert.ok((await page.getByRole("radio").count()) >= 2);
  await capture("inbox-ambiguous-desktop");
  await page.getByLabel("Simular IA indisponível").check();
  assert.equal(await page.getByRole("radio").count(), 0);
  await page
    .getByLabel("Atendimento para associar", { exact: true })
    .selectOption("d1");
  await page
    .getByRole("button", { name: "Confirmar vínculo", exact: true })
    .click();
  current = await state();
  assert.equal(
    current.inbox.find((m) => m.id === "mail-ambiguous").method,
    "manual",
  );
  await page.getByLabel("Simular IA indisponível").uncheck();
  await page.getByRole("button", { name: /Para identificar/ }).click();
  await page
    .getByRole("button", { name: /Encaminhamento: qual é a proposta atual/ })
    .click();
  assert.ok(
    await page
      .getByText("O e-mail menciona mais de um código.", { exact: false })
      .count(),
  );
  await capture("inbox-conflict-desktop");
  await page
    .getByRole("button", { name: "Ignorar nesta fila", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restaurar para identificação", exact: true })
    .click();
  assert.equal(
    (await state()).inbox.find((m) => m.id === "mail-conflict").status,
    "pending",
  );
  await page
    .getByRole("button", { name: /Pedido de evento para a equipe/ })
    .click();
  assert.equal(await page.getByRole("radio").count(), 0);
  await page
    .getByRole("heading", { name: "Sem indícios suficientes" })
    .waitFor();
  await capture("inbox-new-desktop");
  await page
    .getByRole("button", { name: "Criar nova demanda", exact: true })
    .click();
  await page.getByLabel("Nome da nova demanda").fill("Confraternização Vereda");
  await page.getByLabel("Cliente da nova demanda").selectOption("new");
  await page.getByLabel("Nome da empresa", { exact: true }).fill("Vereda");
  await page.getByLabel("Nome do contato", { exact: true }).fill("Carolina");
  await page
    .getByRole("button", { name: "Criar e associar", exact: true })
    .click();
  current = await state();
  const newDemand = current.demands.find(
    (d) => d.title === "Confraternização Vereda",
  );
  assert.ok(newDemand.reference);
  assert.equal(newDemand.conversation[0].inboxEmailId, "mail-new");
  assert.equal(newDemand.guests, 0);
  assert.equal(
    current.clients.find((c) => c.id === newDemand.clientId).name,
    "Vereda",
  );
  await page.reload();
  await page.locator("h1").waitFor();
  assert.equal(
    (await state()).demands.find((d) => d.id === newDemand.id).reference,
    newDemand.reference,
  );
  assert.equal(
    (await state()).inbox.filter((m) => m.id === "mail-new").length,
    1,
  );
  // Guard contracts not exposed by the fixed demonstration fixtures.
  const guards = await page.evaluate(async () => {
    const { directAssociation, receiveMail, linkMail } =
      await import("/src/inbox-model.ts");
    const { withReferences } = await import("/src/mail-reference.ts");
    const s = JSON.parse(localStorage.getItem("adviser-demo-v1"));
    const prior = s.inbox.find((m) => m.id === "mail-horizonte");
    const d1 = s.demands.find((d) => d.id === "d1");
    const sample = {
      ...prior,
      id: "guard-mail",
      status: "pending",
      demandId: undefined,
      subject: `[${d1.reference}] Contradição`,
      text: "Mensagem de teste",
      attachments: [],
    };
    const conflict = directAssociation(sample, s);
    const otherAccount = directAssociation(
      {
        ...sample,
        subject: "Sem código",
        account: "outra@adviser.example.com",
      },
      s,
    );
    const unchanged = linkMail(s, prior.id, prior.demandId, "manual");
    const duplicate = receiveMail(s, [prior]);
    const normalized = withReferences(s);
    return {
      conflict,
      otherAccount,
      idempotent: JSON.stringify(unchanged) === JSON.stringify(s),
      duplicateCount: duplicate.inbox.length === s.inbox.length,
      referencesStable: normalized.demands.every(
        (d, i) => d.reference === s.demands[i].reference,
      ),
    };
  });
  assert.ok(guards.conflict.warning);
  assert.equal(guards.conflict.demandId, undefined);
  assert.equal(guards.otherAccount.demandId, undefined);
  assert.ok(
    guards.idempotent && guards.duplicateCount && guards.referencesStable,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: migration and stable references; manual review; source attachment; reversible association; learned thread; correction-induced thread conflict stays visible and pending; code conflict; offline fallback; ignore/restore; new demand/client; reload; idempotency; account isolation; desktop/mobile overflow.",
  );
} finally {
  await browser.close();
}
