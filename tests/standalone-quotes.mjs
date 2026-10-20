import { chromium } from "playwright";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
const context = await browser.newContext({ offline: true, locale: "pt-BR" });
const page = await context.newPage();
const errors = [], requests = [];
page.on("pageerror", e => errors.push(e.message));
page.on("request", r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
const base = pathToFileURL(resolve("standalone/adviser-prototipo.html")).href;
try {
  await page.goto(base + "#/fornecedor/d1/q3");
  await page.getByRole("button", { name: "Exemplo com duas opções", exact: true }).click();
  await page.getByRole("button", { name: "Enviar cotação simulada", exact: true }).click();
  await page.goto(base + "#/demandas/d1/compare");
  const card = page.locator("#quote-q3");
  await card.getByRole("radio", { name: /Menu Celebração/ }).check();
  await card.getByRole("button", { name: "Confirmar composição escolhida", exact: true }).click();
  await page.goto(base + "#/fornecedor/d1/q3");
  await page.getByRole("button", { name: "Confirmar valores e disponibilidade", exact: true }).click();
  await page.reload();
  const q = await page.evaluate(() => JSON.parse(localStorage.getItem("adviser-demo-v1")).demands.find(d => d.id === "d1").quotes.find(q => q.id === "q3"));
  assert.equal(q.options.length, 2); assert.equal(q.selection.lineIds.length, 2); assert.ok(q.selection.confirmedAt);
  assert.deepEqual(requests, []); assert.deepEqual(errors, []);
  console.log("PASS: standalone offline, supplier alternatives, selected composition, confirmation and persistence; zero external requests/page errors.");
} finally { await browser.close(); }
