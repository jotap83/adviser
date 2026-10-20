import { chromium } from "playwright";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--no-sandbox"],
});
try {
  const context = await browser.newContext({
    offline: true,
    locale: "pt-BR",
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const requests = [],
    errors = [];
  page.on("request", (request) => {
    if (/^https?:/.test(request.url())) requests.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    pathToFileURL(path.resolve("standalone/adviser-prototipo.html")).href,
  );
  await page
    .getByRole("button", { name: "Abrir central", exact: true })
    .click();
  await page.getByRole("button", { name: "Gmail", exact: true }).click();
  await page.getByRole("radio", { name: /Encontro Horizonte/ }).check();
  await page
    .getByRole("button", { name: "Confirmar vínculo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Abrir briefing", exact: true })
    .click();
  const subject = await page
    .getByLabel("Assunto com referência do atendimento")
    .inputValue();
  assert.match(subject, /ADV-\d{4}-\d{4}/);
  await page.reload();
  assert.equal(
    await page.getByLabel("Assunto com referência do atendimento").inputValue(),
    subject,
  );
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("adviser-demo-v1")),
  );
  assert.equal(
    saved.inbox.find((m) => m.id === "mail-horizonte").demandId,
    "d1",
  );
  assert.equal(saved.demands.find((d) => d.id === "d1").guests, 0);
  assert.deepEqual(requests, []);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: standalone file opens offline, triage links message, briefing fields preserved, permanent reference persists, zero HTTP requests and browser errors.",
  );
} finally {
  await browser.close();
}
