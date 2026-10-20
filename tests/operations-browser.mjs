import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
const base = process.env.DEMO_URL || "http://127.0.0.1:4173";
const errors = [];
await fs.mkdir(".impeccable/review", { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/#/operacoes`);
  await page.locator(".production-task").first().waitFor();
  assert.equal(await page.locator(".production-task").count(), 9);
  await page.getByLabel("Mover tarefa Confirmar janela de montagem", { exact: true }).selectOption("done");
  assert.equal(await page.getByLabel("Mover tarefa Confirmar janela de montagem", { exact: true }).inputValue(), "todo");
  await page.getByRole("button", { name: "Confirmar janela de montagem", exact: true }).click();
  await page.getByLabel("Validar acesso de veículos", { exact: true }).check();
  await page.getByLabel("Confirmar horário com o espaço", { exact: true }).check();
  await page.getByLabel("Comentário", { exact: true }).fill("Janela confirmada no teste de demonstração.");
  await page.getByRole("button", { name: "Registrar comentário", exact: true }).click();
  await page.getByLabel("Status da tarefa", { exact: true }).selectOption("done");
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("adviser-demo-v1")).productionProjects[0].tasks[0].status === "done");
  await page.reload();
  assert.equal(await page.getByLabel("Mover tarefa Confirmar janela de montagem", { exact: true }).inputValue(), "done");
  await page.getByLabel("Mover tarefa Receber documentação técnica", { exact: true }).selectOption("done");
  assert.equal(await page.getByLabel("Mover tarefa Receber documentação técnica", { exact: true }).inputValue(), "waiting");
  await page.getByRole("button", { name: "Nova tarefa", exact: true }).click();
  await page.getByLabel("Título da tarefa", { exact: true }).fill("Conferir kit de produção");
  await page.locator('input[name="owner"]').fill("Equipe de produção");
  await page.getByRole("button", { name: "Criar tarefa", exact: true }).click();
  assert.equal(await page.locator(".production-task").count(), 10);
  await page.goto(`${base}/#/demandas/mg-handoff/handoff`);
  await page.getByRole("button", { name: "Concluir atendimento", exact: true }).click();
  await page.goto(`${base}/#/operacoes`);
  await page.getByRole("button", { name: "Receber do atendimento", exact: true }).click();
  await page.getByRole("button", { name: "Criar projeto de demonstração", exact: true }).click();
  await page.waitForURL(/project-mg-handoff/);
  const created = await page.evaluate(() => JSON.parse(localStorage.getItem("adviser-demo-v1")).productionProjects.find((p) => p.id === "project-mg-handoff"));
  assert.equal(created.source.demandId, "mg-handoff"); assert.ok(created.source.version.id);
  await page.getByRole("button", { name: "Receber do atendimento", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Criar projeto de demonstração", exact: true }).count(), 0);
  await page.goto(`${base}/#/financeiro/project-mg-handoff`);
  assert.equal(await page.getByRole("heading", { name: "Sem lançamentos neste recorte" }).count(), 1);
  await page.goto(`${base}/#/financeiro/ops-horizonte`);
  await page.getByRole("button", { name: "Simular baixa", exact: true }).first().click();
  assert.equal(await page.getByRole("button", { name: "Desfazer baixa", exact: true }).count(), 3);
  const drag = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await drag.goto(`${base}/#/operacoes`);
  await drag.locator(".production-task").filter({ has: drag.getByRole("button", { name: "Revisar roteiro do evento", exact: true }) }).dragTo(drag.getByRole("region", { name: "Em andamento", exact: true }));
  assert.equal(await drag.getByLabel("Mover tarefa Revisar roteiro do evento", { exact: true }).inputValue(), "doing");
  await drag.close(); await page.close();
  for (const [size, width, height] of [["desktop", 1440, 1000], ["mobile", 390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height } }); const p = await context.newPage();
    p.on("pageerror", (error) => errors.push(error.message));
    for (const [name, route] of [["operations", "operacoes"], ["scope", "escopo"], ["finance", "financeiro"]]) {
      await p.goto(`${base}/#/${route}`); await p.locator("h1").waitFor(); await p.evaluate(() => document.fonts.ready);
      assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} overflows at ${width}`);
      await p.evaluate(() => scrollTo(0, 0));
      await p.screenshot({ path: `.impeccable/review/${name}-${size}.png`, fullPage: true });
    }
    await p.goto(`${base}/#/operacoes`);
    await p.getByRole("button", { name: "Confirmar janela de montagem", exact: true }).click();
    await p.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
    await p.waitForFunction(() => scrollY === 0);
    await p.screenshot({ path: `.impeccable/review/task-${size}.png`, fullPage: true });
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log("Passed: completion guards, checklist/comments, persistence, task creation, handoff snapshot, duplicate prevention, finance preview, drag/drop, desktop/mobile routes.");
} finally { await browser.close(); }
