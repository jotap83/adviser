import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: "pt-BR",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

async function capture(p, path) {
  if (process.env.SKIP_SCREENSHOTS === "1") return;
  const close = p.getByRole("button", { name: "Fechar aviso", exact: true });
  if (await close.count()) await close.click();
  await p.evaluate(() => {
    document.activeElement?.blur();
    window.scrollTo(0, 0);
  });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path, fullPage: true });
}

const base = process.env.DEMO_URL || "http://127.0.0.1:4173/";
const goto = async (hash) => {
  await page.goto(base + "#" + hash);
  await page.waitForSelector("h1");
  await page.evaluate(() => document.fonts.ready);
};
await goto("/");
await capture(page, ".impeccable/review/desktop.png");
await goto("/configuracoes");
await page.getByLabel("Comportamento da simulação").selectOption("offline");
await goto("/demandas/d1/briefing");
await page
  .getByRole("button", { name: "Organizar com IA", exact: true })
  .click();
await page.getByRole("alert").waitFor();
assert.match(await page.getByRole("alert").innerText(), /indisponível/);
assert.equal(
  await page.getByLabel("Nome do evento *", { exact: true }).isEditable(),
  true,
);
await goto("/configuracoes");
await page.getByLabel("Comportamento da simulação").selectOption("available");
await goto("/demandas/d1/briefing");
await page
  .getByRole("button", { name: "Organizar com IA", exact: true })
  .click();
await page
  .getByRole("button", { name: "Aplicar e revisar nos campos" })
  .click();
assert.equal(
  await page.getByLabel("Participantes *", { exact: true }).inputValue(),
  "200",
);
assert.equal(
  await page.getByLabel("Data prevista *", { exact: true }).inputValue(),
  "2026-12-04",
);
await page
  .getByLabel(
    "Confirmo que o briefing está alinhado com o cliente e pronto para cotação.",
  )
  .check();
await page
  .getByRole("button", { name: "Validar briefing", exact: true })
  .click();
await capture(page, ".impeccable/review/desktop-briefing.png");
await goto("/fornecedor/d1/q3");
await page.getByRole("button", { name: "Preencher exemplo" }).click();
await page.getByRole("button", { name: "Enviar cotação simulada" }).click();
await page
  .getByRole("heading", { name: "Cotação registrada na demonstração." })
  .waitFor();
await goto("/demandas/d1/compare");
for (const name of ["Espaço Orla", "Mesa & Afeto", "Sinal Eventos"])
  await page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name, exact: true }) })
    .getByRole("button", { name: "Confirmar composição escolhida" })
    .click();
await page.getByRole("button", { name: "Levar seleção para proposta" }).click();
await page
  .getByRole("heading", { name: "Uma proposta, todos os detalhes." })
  .waitFor();
let state = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("adviser-demo-v1")),
);
let demand = state.demands.find((d) => d.id === "d1");
assert.equal(demand.lines.length, 6);
await page
  .getByLabel("Pagamento do item 6", { exact: true })
  .selectOption("direct");
await page.getByRole("button", { name: "Salvar nova versão" }).click();
state = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("adviser-demo-v1")),
);
demand = state.demands.find((d) => d.id === "d1");
assert.equal(demand.versions.length, 1);
assert.equal(demand.versions[0].total, 44750);
await page.getByLabel("Valor unitário do item 1", { exact: true }).fill("8000");
state = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("adviser-demo-v1")),
);
assert.equal(state.demands[0].versions[0].lines[0].unit, 7800);
await page.getByRole("button", { name: "Salvar nova versão" }).click();
await page.getByRole("button", { name: "Prévia do cliente" }).click();
await capture(page, ".impeccable/review/desktop-proposal.png");
const dlPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "Excel", exact: true }).click();
const dl = await dlPromise;
await dl.saveAs(".impeccable/review/export-test.xlsx");
assert.match(dl.suggestedFilename(), /\.xlsx$/);
await goto("/demandas/d1/approval");
await page.getByRole("button", { name: "Simular registro de envio" }).click();
await page
  .getByLabel("Evidência ou observação do retorno *")
  .fill(
    "Exemplo fictício: cliente aprovou por e-mail a versão 2 e suas condições.",
  );
await page
  .getByRole("button", { name: "Registrar aprovação", exact: true })
  .click();
await page
  .getByRole("button", { name: "Preparar repasse", exact: true })
  .click();
await page
  .getByRole("button", { name: "Concluir atendimento", exact: true })
  .click();
state = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("adviser-demo-v1")),
);
demand = state.demands[0];
assert.equal(demand.handoff, true);
assert.equal(demand.acceptedVersion, demand.versions[1].id);
assert.equal(demand.versions[1].total, 44970);
const packP = page.waitForEvent("download");
await page
  .getByRole("button", { name: "Exportar pacote", exact: true })
  .click();
const pack = await packP;
await pack.saveAs(".impeccable/review/handoff-test.json");
const data = JSON.parse(
  await fs.readFile(".impeccable/review/handoff-test.json", "utf8"),
);
assert.equal(data.resumo.invoice + data.resumo.direct, data.resumo.total);
await page.reload();
await page
  .getByRole("heading", { name: "Da proposta aprovada ao financeiro." })
  .waitFor();
assert.equal(
  await page
    .getByRole("button", { name: "Repasse preparado", exact: true })
    .isDisabled(),
  true,
);
await goto("/modelos");
await page
  .getByRole("button", { name: "Adicionar campo", exact: true })
  .click();
const inputs = page.getByLabel("Nome do campo", { exact: true });
await inputs.last().fill("Acessibilidade do local");
await page
  .getByRole("button", { name: "Salvar nova versão do modelo" })
  .click();
state = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("adviser-demo-v1")),
);
assert.equal(state.templates[0].version, 2);
assert.equal(state.demands[0].quotes[0].template.version, 1);
await goto("/clientes");
await page.getByRole("button", { name: "Novo cliente" }).click();
await page.getByLabel("Empresa *", { exact: true }).fill("Empresa Teste");
await page
  .getByLabel("Pessoa de contato *", { exact: true })
  .fill("Pessoa Teste");
await page
  .getByLabel("E-mail *", { exact: true })
  .fill("teste@empresa.example.com");
await page.getByRole("button", { name: "Salvar cadastro" }).click();
await page.getByRole("cell", { name: "Empresa Teste", exact: true }).waitFor();
await goto("/fluxo");
await capture(page, ".impeccable/review/desktop-flow.png");
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: "pt-BR",
  isMobile: true,
  hasTouch: true,
});
const mp = await mobile.newPage();
mp.on("pageerror", (e) => errors.push(e.message));
await mp.goto(base);
await mp.evaluate(() => document.fonts.ready);
await capture(mp, ".impeccable/review/mobile.png");
assert.equal(
  await mp.evaluate(
    () =>
      document.documentElement.scrollWidth <=
      document.documentElement.clientWidth,
  ),
  true,
);
await mp.locator(".demand-row").filter({ hasText: "Encontro Horizonte" }).click();
await mp.getByRole("button", { name: "Organizar com IA", exact: true }).click();
await mp.getByRole("button", { name: "Aplicar e revisar nos campos" }).click();
await capture(mp, ".impeccable/review/mobile-briefing.png");
assert.equal(
  await mp.evaluate(
    () =>
      document.documentElement.scrollWidth <=
      document.documentElement.clientWidth,
  ),
  true,
);
await mp.getByRole("button", { name: "Abrir menu", exact: true }).click();
await mp.getByRole("link", { name: "Fluxo do sistema", exact: true }).click();
await mp
  .getByRole("heading", { name: "Do primeiro contato ao fechamento" })
  .waitFor();
assert.equal(
  await mp.evaluate(
    () =>
      document.documentElement.scrollWidth <=
      document.documentElement.clientWidth,
  ),
  true,
);
await mp.goto(base + "#/fornecedor/d1/q3");
await mp.getByRole("button", { name: "Preencher exemplo" }).click();
await capture(mp, ".impeccable/review/mobile-supplier.png");
assert.equal(
  await mp.evaluate(
    () =>
      document.documentElement.scrollWidth <=
      document.documentElement.clientWidth,
  ),
  true,
);
assert.deepEqual(errors, []);
console.log(
  JSON.stringify({
    passed: true,
    checks: [
      "IA offline com preenchimento manual",
      "extração e revisão",
      "cotação do fornecedor",
      "comparação e importação",
      "pagamento direto e fee",
      "imutabilidade de versões",
      "Excel",
      "aceite vinculado à versão",
      "repasse exportado",
      "persistência",
      "versionamento de template",
      "cadastro de cliente",
      "menu móvel",
    ],
    screenshots: 7,
    pageErrors: errors,
  }),
);
await browser.close();
