import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: "pt-BR",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.DEMO_URL || "http://127.0.0.1:4173/";
const goto = async (path) => {
  await page.goto(base + "#" + path);
  await page.locator("h1").waitFor();
};
const state = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("adviser-demo-v1")));
const demand = async () => (await state()).demands.find((d) => d.id === "d1");
const quote = async () => (await demand()).quotes.find((q) => q.id === "q3");
const click = (name) => page.getByRole("button", { name, exact: true }).click();
async function capture(name, target = page) {
  const close = page.getByRole("button", { name: "Fechar aviso", exact: true });
  if (await close.count()) await close.click();
  await page.evaluate(() => {
    document.activeElement?.blur();
    window.scrollTo(0, 0);
  });
  await page.evaluate(() => document.fonts.ready);
  if (target === page)
    await page.screenshot({
      path: `.impeccable/review/${name}.png`,
      fullPage: true,
    });
  else {
    const style = await page.addStyleTag({
      content: ".topbar { visibility: hidden !important; }",
    });
    await target.screenshot({ path: `.impeccable/review/${name}.png` });
    await style.evaluate((el) => el.remove());
  }
}
async function noOverflow() {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
}
try {
  await fs.mkdir(".impeccable/review", { recursive: true });
  await goto("/demandas/d1/briefing");
  await click("Organizar com IA");
  await click("Aplicar e revisar nos campos");
  await page
    .getByLabel(
      "Confirmo que o briefing está alinhado com o cliente e pronto para cotação.",
    )
    .check();
  await click("Validar briefing");
  await goto("/fornecedor/d1/q3");
  await click("Preencher exemplo");
  await click("Enviar cotação simulada");
  await click("Preparar nova versão");
  await click("Exemplo com duas opções");
  await capture("supplier-options-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await capture("supplier-options-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await click("Enviar nova versão simulada");
  assert.equal((await quote()).revision, 2);
  assert.equal((await quote()).revisions.length, 2);
  await goto("/demandas/d1/compare");
  let card = page.locator("#quote-q3");
  await card.getByRole("radio", { name: /Menu Celebração/ }).check();
  await card.getByRole("checkbox", { name: /Open bar/ }).check();
  assert.match(
    await card.locator(".composition-total").innerText(),
    /39.200,00/,
  );
  await card
    .getByRole("button", {
      name: "Confirmar composição escolhida",
      exact: true,
    })
    .click();
  assert.equal((await quote()).selection.lineIds.length, 3);
  assert.equal((await quote()).selection.confirmedAt, undefined);
  assert.equal((await demand()).decision, "pending");
  await capture("supplier-choice-desktop", card);
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await capture("supplier-choice-mobile", card);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await goto("/fornecedor/d1/q3");
  assert.match(
    await page.locator(".chosen-composition").innerText(),
    /Menu Celebração/,
  );
  assert.doesNotMatch(
    await page.locator(".chosen-composition").innerText(),
    /Menu Essencial/,
  );
  await click("Confirmar valores e disponibilidade");
  assert.ok((await quote()).selection.confirmedAt);
  await capture("supplier-confirmation-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await capture("supplier-confirmation-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await goto("/demandas/d1/compare");
  await click("Levar seleção para proposta");
  let d = await demand();
  assert.equal(d.lines.length, 3);
  assert.equal(
    d.lines.reduce((n, l) => n + l.qty * l.unit, 0),
    39200,
  );
  assert.ok(
    d.lines.every((l) => l.sourceQuote === "q3" && l.sourceRevision === 2),
  );
  await click("Salvar nova versão");
  const frozen = structuredClone((await demand()).versions[0]);
  await goto("/demandas/d1/compare");
  card = page.locator("#quote-q3");
  await card.getByLabel("Tipo de retorno").selectOption("adjustment");
  await card
    .getByLabel("Mensagem para o fornecedor")
    .fill(
      "Podemos manter o Menu Celebração e o open bar, mas rever o menu para R$ 140 por pessoa?",
    );
  await card
    .getByRole("button", { name: "Registrar retorno ao fornecedor" })
    .click();
  assert.equal((await quote()).adjustmentPending, true);
  assert.equal((await quote()).selected, false);
  await goto("/demandas/d1/proposal");
  assert.equal(
    await page.getByRole("button", { name: "Salvar nova versão" }).isDisabled(),
    true,
  );
  assert.match(
    await page.locator(".note.warning").innerText(),
    /cotação ou composição mudou/,
  );
  await goto("/fornecedor/d1/q3");
  await page
    .getByLabel("Resposta para a Adviser")
    .fill(
      "Conseguimos ajustar o menu para R$ 140. Enviaremos a nova versão mantendo o open bar como opcional.",
    );
  await click("Registrar resposta à Adviser");
  assert.equal((await quote()).adjustmentPending, true);
  await click("Preparar nova versão");
  await page
    .locator(".option-editor")
    .nth(1)
    .getByLabel("Valor unitário do item 1", { exact: true })
    .fill("140");
  await click("Enviar nova versão simulada");
  const revised = await quote();
  assert.equal(revised.revision, 3);
  assert.equal(revised.selected, false);
  assert.equal(revised.selection, undefined);
  assert.equal(revised.revisions[1].options[1].lines[0].unit, 155);
  assert.deepEqual((await demand()).versions[0], frozen);
  await goto("/demandas/d1/compare");
  card = page.locator("#quote-q3");
  await card.getByRole("radio", { name: /Menu Celebração/ }).check();
  assert.equal(
    await card.getByRole("checkbox", { name: /Open bar/ }).isChecked(),
    false,
  );
  await card
    .getByRole("button", { name: "Confirmar composição escolhida" })
    .click();
  await click("Levar seleção para proposta");
  d = await demand();
  assert.equal(d.lines.length, 2);
  assert.equal(
    d.lines.reduce((n, l) => n + l.qty * l.unit, 0),
    29200,
  );
  assert.equal(
    await page.getByRole("button", { name: "Salvar nova versão" }).isEnabled(),
    true,
  );
  await page.reload();
  assert.equal((await quote()).revision, 3);
  assert.deepEqual((await demand()).versions[0], frozen);
  assert.equal((await demand()).decision, "pending");
  assert.deepEqual(errors, []);
  console.log(
    "PASS: alternatives + optional items, exact selection, supplier confirmation, message/adjustment, immutable revisions, stale draft guard, reimport, persistence, desktop/mobile, no page errors.",
  );
} finally {
  await browser.close();
}
