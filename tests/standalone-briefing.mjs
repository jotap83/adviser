import { chromium } from "playwright";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { briefingFixtures, demoPDF } from "./briefing-fixtures.mjs";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({ offline: true });
const page = await context.newPage();
const errors = [],
  requests = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (/^https?:/.test(r.url())) requests.push(r.url());
});
try {
  await page.goto(
    pathToFileURL(resolve("standalone/adviser-prototipo.html")).href +
      "#/demandas/d1/briefing",
  );
  await page
    .getByLabel("Arquivos do briefing")
    .setInputFiles(await briefingFixtures());
  await page
    .getByRole("button", { name: "Adicionar PDF, DOCX ou XLSX" })
    .waitFor({ timeout: 30000 });
  const attachments = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("adviser-demo-v1")).demands.find(
        (d) => d.id === "d1",
      ).attachments,
  );
  assert.equal(attachments.length, 3);
  assert.ok(attachments.every((a) => a.status === "ready"));
  await page
    .getByRole("button", { name: "Organizar com IA", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aplicar e revisar nos campos" })
    .click();
  assert.equal(
    await page.getByLabel("Participantes *", { exact: true }).inputValue(),
    "240",
  );
  await page.getByRole("button", { name: "Nova versão", exact: true }).click();
  await page.getByLabel("Origem da apresentação").selectOption("file");
  await page.getByLabel("Arquivo da apresentação").setInputFiles(demoPDF());
  await page.getByRole("button", { name: "Salvar nova versão" }).click();
  await page.getByRole("link", { name: /Baixar briefing-ficticio/ }).waitFor();
  await page.reload();
  await page.getByRole("link", { name: /Baixar briefing-ficticio/ }).waitFor();
  await page.goto(page.url().split("#")[0] + "#/configuracoes");
  await page
    .getByRole("button", { name: "Reiniciar demonstração", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Sim, reiniciar os exemplos", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Sim, reiniciar os exemplos", exact: true })
    .waitFor({ state: "hidden" });
  const fileCount = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("adviser-demo-files", 1);
        request.onsuccess = () => {
          const db = request.result;
          const count = db
            .transaction("presentations")
            .objectStore("presentations")
            .count();
          count.onsuccess = () => {
            db.close();
            resolve(count.result);
          };
          count.onerror = () => reject(count.error);
        };
        request.onerror = () => reject(request.error);
      }),
  );
  assert.equal(fileCount, 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  console.log(
    "PASS: standalone offline, PDF/DOCX/XLSX extraction, AI suggestions, presentation file persistence; zero HTTP requests and page errors.",
  );
} finally {
  await browser.close();
}
