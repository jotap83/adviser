import { chromium } from "playwright";
import assert from "node:assert/strict";
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
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.DEMO_URL || "http://127.0.0.1:4173/";
const go = async (path) => {
  await page.goto(base + "#" + path);
  await page.locator("h1").waitFor();
};
const capture = async (p, name) => {
  const close = p.getByRole("button", { name: "Fechar aviso", exact: true });
  if (await close.count()) await close.click();
  await p.evaluate(() => {
    window.scrollTo(0, 0);
    document.activeElement?.blur();
  });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({
    path: ".impeccable/review/" + name + ".png",
    fullPage: true,
  });
};
await go("/gestao");
await page.getByRole("heading", { name: "Painel Gerencial" }).waitFor();
await capture(page, "management-desktop");
await page.getByLabel("Núcleo", { exact: true }).selectOption("Núcleo 4");
assert.equal(await page.locator(".management-table tbody tr").count(), 2);
await page.getByLabel("Núcleo", { exact: true }).selectOption("all");
await page
  .getByLabel("Responsável", { exact: true })
  .selectOption("Rafael Lima");
assert.equal(await page.locator(".management-table tbody tr").count(), 2);
await page.getByLabel("Responsável", { exact: true }).selectOption("all");
await page.getByLabel("Próxima entrega de Encontro Horizonte").fill("");
await page
  .getByRole("heading", { name: "Próxima entrega sem prazo" })
  .waitFor();
await capture(page, "management-missing-deadline");
await go("/alertas");
await page
  .getByRole("button", { name: "Marcar retornos como lidos", exact: true })
  .click();
assert.equal(
  await page
    .getByRole("heading", { name: "Fornecedor com retorno atrasado" })
    .count(),
  1,
);
await page
  .getByRole("button", { name: "Simular retorno", exact: true })
  .click();
await page.getByLabel("Demanda do retorno").selectOption("d1");
await page.getByRole("button", { name: "Registrar retorno fictício" }).click();
await page
  .getByRole("heading", { name: "Retorno do cliente registrado" })
  .waitFor();
assert.equal(
  await page
    .getByRole("button", { name: "Abrir central de alertas, 1 novos retornos" })
    .count(),
  1,
);
await page.reload();
await page
  .getByRole("button", { name: "Novos retornos (1)", exact: true })
  .click();
await page
  .getByRole("button", { name: "Marcar como lido", exact: true })
  .click();
assert.equal(
  await page
    .getByRole("button", { name: "Abrir central de alertas, 0 novos retornos" })
    .count(),
  1,
);
await page
  .getByRole("button", { name: "Simular retorno", exact: true })
  .click();
await page.getByLabel("Demanda do retorno").selectOption("d2");
await page.getByLabel("Tipo de retorno").selectOption("supplier");
await page.getByRole("button", { name: "Registrar retorno fictício" }).click();
await page.getByRole("heading", { name: "Nova cotação recebida" }).waitFor();
let state = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("adviser-demo-v1")),
);
assert.equal(
  state.demands.find((d) => d.id === "d2").quotes[0].status,
  "received",
);
assert.equal(state.demands.find((d) => d.id === "d2").decision, "pending");
await page.getByRole("button", { name: "A acompanhar", exact: true }).click();
assert.equal(
  await page
    .getByRole("heading", { name: "Fornecedor com retorno atrasado" })
    .count(),
  0,
);
await capture(page, "alerts-desktop");
await go("/demandas/d1/briefing");
await page
  .getByRole("button", { name: "Organizar com IA", exact: true })
  .click();
await page
  .getByRole("button", { name: "Aplicar e revisar nos campos" })
  .click();
await page
  .getByRole("button", { name: "Analisar escopo com IA", exact: true })
  .click();
await page.getByRole("button", { name: "Aplicar blocos selecionados" }).click();
assert.equal(
  await page.getByLabel("Alimentação e bebidas", { exact: true }).isChecked(),
  true,
);
await page.getByRole("button", { name: /^Alimentação e bebidas/ }).click();
await page
  .getByLabel("Formato e duração do serviço", { exact: true })
  .fill("Coquetel e jantar por 4 horas; dados fictícios.");
await page.getByLabel("Horários do evento", { exact: true }).fill("18h às 22h");
await page.getByLabel("Ativações e experiências", { exact: true }).check();
assert.equal(
  await page.getByText("Modelo de cotação a validar", { exact: true }).count(),
  1,
);
await page
  .locator(".scope-main")
  .screenshot({ path: ".impeccable/review/briefing-unmapped-block.png" });
await page.getByRole("button", { name: /^Alimentação e bebidas/ }).click();
await page.getByLabel("Bebidas, consumo e taxas", { exact: true }).fill("");
await page
  .getByRole("button", { name: "Adicionar perguntas ao rascunho" })
  .click();
assert.match(
  await page
    .getByLabel("Perguntas para o cliente", { exact: true })
    .inputValue(),
  /bebidas/i,
);
await page
  .getByLabel(
    "Confirmo que o briefing está alinhado com o cliente e pronto para cotação.",
  )
  .check();
await page
  .getByRole("button", { name: "Validar briefing", exact: true })
  .click();
await page.evaluate(() => window.scrollTo(0, 0));
await capture(page, "briefing-detailed-desktop");
await go("/fornecedor/d1/q3");
assert.match(
  await page.locator(".supplier-scope").innerText(),
  /Coquetel e jantar por 4 horas/,
);
await go("/alertas");
await page
  .getByRole("button", { name: "Marcar retornos como lidos", exact: true })
  .click();
const supplierTab = await context.newPage();
await supplierTab.goto(base + "#/fornecedor/d1/q3");
await supplierTab.getByRole("button", { name: "Preencher exemplo" }).click();
await supplierTab
  .getByRole("button", { name: "Enviar cotação simulada" })
  .click();
await page
  .getByRole("button", { name: "Abrir central de alertas, 1 novos retornos" })
  .waitFor();
await supplierTab.close();
await go("/configuracoes");
await page.getByLabel("Comportamento da simulação").selectOption("offline");
await go("/demandas/d1/briefing");
await page
  .getByRole("button", { name: "Analisar escopo com IA", exact: true })
  .click();
assert.match(await page.getByRole("alert").innerText(), /indisponível/);
assert.equal(
  await page.getByLabel("Horários do evento", { exact: true }).isEditable(),
  true,
);
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: "pt-BR",
  isMobile: true,
  hasTouch: true,
  reducedMotion: "reduce",
});
const mp = await mobile.newPage();
mp.on("pageerror", (e) => errors.push(e.message));
for (const [route, name] of [
  ["/gestao", "management-mobile"],
  ["/alertas", "alerts-mobile"],
  ["/demandas/d1/briefing", "briefing-detailed-mobile"],
]) {
  await mp.goto(base + "#" + route);
  await mp.locator("h1").waitFor();
  await capture(mp, name);
  assert.equal(
    await mp.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
    true,
    route + " overflow",
  );
}
await mp.getByRole("button", { name: "Abrir menu", exact: true }).click();
await mp.getByRole("link", { name: "Painel Gerencial", exact: true }).click();
await mp.getByRole("heading", { name: "Painel Gerencial" }).waitFor();
assert.deepEqual(errors, []);
console.log(
  JSON.stringify({
    passed: true,
    checks: [
      "filtros gerenciais",
      "leitura persistente de retornos",
      "atraso não apagado por leitura",
      "simulação de retorno cliente",
      "cotação recebida remove atraso",
      "sem aprovação automática",
      "sugestões de escopo revisáveis",
      "perguntas por lacuna",
      "escopo enviado ao fornecedor",
      "IA offline manual",
      "mobile sem overflow",
    ],
    pageErrors: errors,
  }),
);
await browser.close();
