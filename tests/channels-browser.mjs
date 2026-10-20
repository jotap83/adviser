import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer } from "vite";

const server = process.env.DEMO_URL
  ? null
  : await createServer({
      server: { host: "127.0.0.1", port: 4173, strictPort: true },
    });
if (server) await server.listen();

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  locale: "pt-BR",
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.DEMO_URL || "http://127.0.0.1:4173/";
const state = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("adviser-demo-v1")));
const go = async (path) => {
  await page.goto(base + "#" + path);
  await page.locator("h1").waitFor();
};
const button = (name) => page.getByRole("button", { name, exact: true });
async function capture(name) {
  if (process.env.CAPTURE === "0") return;
  const close = button("Fechar aviso");
  if (await close.count()) await close.click();
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.activeElement?.blur();
    window.scrollTo(0, 0);
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
    `Overflow: ${name}`,
  );
  await page.screenshot({
    path: `.impeccable/review/channels-${name}.png`,
    fullPage: true,
  });
}
try {
  await fs.mkdir(".impeccable/review", { recursive: true });
  await go("/mensagens");
  let s = await state();
  assert.equal(s.inbox.find((m) => m.id === "wa-horizonte").status, "linked");
  assert.equal(
    s.inbox.find((m) => m.id === "wa-ambiguous").status,
    "pending",
    "Same phone/thread is not enough for a WhatsApp link",
  );
  await capture("central-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("central-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByLabel("Simular IA indisponível").check();
  await button("Cadastrar demanda").click();
  await page
    .getByLabel("Nome da demanda", { exact: true })
    .fill("Encontro cadastrado diretamente");
  await page.getByLabel("Cliente", { exact: true }).selectOption("new");
  await page
    .getByLabel("Nome da empresa", { exact: true })
    .fill("Empresa Demonstração");
  await page
    .getByLabel("Nome do contato", { exact: true })
    .fill("Contato Demonstração");
  await page
    .getByLabel("Pedido ou anotações iniciais")
    .fill(
      "Pedido registrado após reunião presencial. Não há e-mail ou WhatsApp recebido.",
    );
  await capture("manual-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("manual-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await button("Criar demanda").click();
  await page.getByLabel("Nome do evento *", { exact: true }).waitFor();
  await button("Preencher sem IA").click();
  await page.getByLabel("Data prevista *", { exact: true }).fill("2026-12-10");
  await page.getByLabel("Participantes *", { exact: true }).fill("80");
  await page
    .getByLabel("Cidade ou local *", { exact: true })
    .fill("Rio de Janeiro");
  await page
    .getByLabel("Objetivo do evento *", { exact: true })
    .fill("Integração da equipe.");
  await page.getByLabel("Nome do evento *", { exact: true }).blur();
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem("adviser-demo-v1")).demands.some(
      (d) => d.title === "Encontro cadastrado diretamente" && d.guests === 80,
    ),
  );
  s = await state();
  const manual = s.demands.find(
    (d) => d.title === "Encontro cadastrado diretamente",
  );
  assert.equal(manual.source, "Cadastro direto");
  assert.equal(s.aiMode, "offline");
  assert.equal(s.clients.find((c) => c.id === manual.clientId).email, "");
  await go("/mensagens/wa-horizonte");
  await button("Responder pela plataforma").click();
  assert.ok(
    await page
      .getByLabel("Canal da resposta", { exact: true })
      .evaluate((el) => document.activeElement === el),
  );
  assert.ok(
    await page
      .locator(".inbox-reply")
      .evaluate((el) => el.getBoundingClientRect().top >= 72),
  );
  await page
    .getByLabel("Mensagem da resposta", { exact: true })
    .fill("Recebemos o ajuste e vamos revisar as opções de alimentação.");
  assert.ok(await button("Preparar resposta com IA").isDisabled());
  assert.ok(await button("Simular envio por WhatsApp").isDisabled());
  await page
    .getByLabel("Revisei o destinatário e o conteúdo da resposta.")
    .check();
  await button("Simular envio por WhatsApp").click();
  await page
    .getByText(
      "Resposta por WhatsApp simulada e salva no histórico. Nenhuma mensagem real foi enviada.",
      { exact: true },
    )
    .waitFor();
  s = await state();
  assert.equal(
    s.demands.find((d) => d.id === "d1").conversation.at(-1).delivery,
    "simulated",
  );
  await page.getByLabel("Demonstrar janela encerrada").check();
  assert.equal(
    await page.locator(".reply-saved").count(),
    0,
    "A new draft must not retain the previous send confirmation",
  );
  assert.ok(
    (await page
      .getByLabel("Mensagem da resposta", { exact: true })
      .getAttribute("readonly")) !== null,
  );
  await page
    .getByLabel("Modelo de WhatsApp", { exact: true })
    .selectOption("resume");
  await page
    .getByLabel("Revisei o destinatário e o conteúdo da resposta.")
    .check();
  assert.ok(await button("Simular envio por WhatsApp").isDisabled());
  await page
    .getByLabel("O contato autorizou receber mensagens da Adviser.")
    .check();
  await capture("whatsapp-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await button("Responder pela plataforma").click();
  assert.ok(
    await page
      .locator(".inbox-reply")
      .evaluate((el) => el.getBoundingClientRect().top >= 72),
  );
  await capture("whatsapp-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await button("Simular envio por WhatsApp").click();
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("adviser-demo-v1"))
        .demands.find((d) => d.id === "d1")
        .conversation.at(-1).template === "retomar_atendimento_demo",
  );
  await go("/mensagens/wa-ambiguous");
  await page
    .getByLabel("Atendimento para associar", { exact: true })
    .selectOption("d1");
  const before = (await state()).demands.find((d) => d.id === "d1");
  await button("Confirmar vínculo").click();
  await page
    .getByRole("heading", { name: "Mensagem associada", exact: true })
    .waitFor();
  const after = (await state()).demands.find((d) => d.id === "d1");
  assert.equal(
    after.guests,
    before.guests,
    "Association does not change briefing fields",
  );
  await page.getByLabel("Simular IA indisponível").uncheck();
  await button("Simular Gmail").click();
  await page
    .getByLabel("Mensagem recebida", { exact: true })
    .fill(
      `Referência: ${before.reference}\nPúblico: 320 pessoas\nData: 12/12/2026`,
    );
  await button("Receber mensagem simulada").click();
  await page
    .getByRole("heading", { name: "Mensagem associada", exact: true })
    .waitFor();
  const gmail = (await state()).inbox.at(-1);
  assert.equal(gmail.channel, "email");
  assert.equal(gmail.method, "reference");
  await button("Preparar resposta com IA").click();
  await page
    .getByLabel("Revisei o destinatário e o conteúdo da resposta.")
    .check();
  await button("Simular envio por Gmail").click();
  await go("/demandas/d1/briefing");
  await page
    .getByRole("heading", { name: "Conversa com o cliente", exact: true })
    .waitFor();
  assert.ok(await page.getByText("Gmail · simulado", { exact: false }).count());
  assert.ok(
    await page.getByText("WhatsApp · simulado", { exact: false }).count(),
  );
  await button("Registrar contato").click();
  await page
    .getByLabel("Registrar retorno do cliente", { exact: true })
    .fill("Na reunião, o cliente confirmou que a data está correta.");
  await button("Salvar retorno").click();
  await page.reload();
  await page.locator("h1").waitFor();
  s = await state();
  assert.equal(s.inbox.filter((m) => m.id === "wa-horizonte").length, 1);
  assert.ok(
    s.demands
      .find((d) => d.id === "d1")
      .conversation.some(
        (m) => m.text.includes("Na reunião") && m.delivery === "manual",
      ),
  );
  assert.ok(s.demands.some((d) => d.id === manual.id && d.guests === 80));
  assert.deepEqual(errors, []);
  console.log(
    "PASS: manual intake/new client without email/AI; Gmail and WhatsApp simulations; safe linkage; editable replies with human review; WhatsApp window/template/consent; shared history; manual contact; persistence; desktop/mobile overflow.",
  );
} finally {
  await browser.close();
  await server?.close();
}
