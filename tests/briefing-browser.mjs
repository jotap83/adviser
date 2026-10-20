import { chromium } from "playwright";
import assert from "node:assert/strict";
import { briefingFixtures, demoPDF } from "./briefing-fixtures.mjs";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
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
const state = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("adviser-demo-v1")));
const capture = async (name, target) => {
  const close = page.getByRole("button", { name: "Fechar aviso", exact: true });
  if (await close.count()) await close.click();
  await page.evaluate(() => {
    document.activeElement?.blur();
    return document.fonts.ready;
  });
  if (target) {
    const viewport = page.viewportSize();
    const box = await page.locator(target).boundingBox();
    await page.setViewportSize({ width: viewport.width, height: Math.max(viewport.height, Math.ceil(box.height) + 150) });
    await page.locator(target).screenshot({
      path: `.impeccable/review/${name}.png`,
      style: ".topbar { visibility: hidden; }",
    });
    await page.setViewportSize(viewport);
  } else {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `.impeccable/review/${name}.png`,
      fullPage: false,
    });
  }
};
try {
  await go("/demandas/d1/briefing");
  await page.setViewportSize({ width: 1366, height: 768 });
  const nav = await page
    .locator(".sidebar nav")
    .evaluate((el) => ({ scroll: el.scrollHeight, height: el.clientHeight }));
  assert.ok(nav.scroll <= nav.height + 1, JSON.stringify(nav));
  await page.evaluate(() => window.scrollTo(0, 1800));
  assert.equal((await page.locator(".topbar").boundingBox()).y, 0);
  await page.getByRole("button", { name: "Recolher barra lateral" }).click();
  assert.equal(
    Math.round((await page.locator(".sidebar").boundingBox()).width),
    76,
  );
  await page.reload();
  await page.locator("h1").waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Expandir barra lateral" }).count(),
    1,
  );
  await capture("briefing-shell-collapsed");
  await page.getByRole("button", { name: "Expandir barra lateral" }).click();
  await capture("briefing-shell-desktop");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page
    .getByRole("button", { name: "Organizar com IA", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aplicar e revisar nos campos" })
    .waitFor();
  assert.ok((await page.locator(".ai-suggestion").count()) >= 30);
  await capture("briefing-ai-review", ".ai-review");
  await page
    .getByRole("button", { name: "Aplicar e revisar nos campos" })
    .click();
  let d = (await state()).demands.find((d) => d.id === "d1");
  assert.equal(d.guests, 200);
  const initialQuestions = d.questions;
  await page
    .getByLabel("Perguntas para o cliente", { exact: true })
    .fill(
      initialQuestions +
        "\nConfirmar prazo de entrega do manual da marca (pergunta humana).",
    );
  assert.match(d.briefingDetails.hours, /23h/);
  assert.match(d.scope.tech.answers.equipment, /microfones/);
  await page
    .getByRole("button", { name: "Registrar envio pelo Gmail" })
    .click();
  assert.equal(
    await page.getByText("Aguardando cliente", { exact: true }).count(),
    1,
  );
  await page.getByLabel("Quem respondeu").fill("compras@horizonte.example.com");
  await page
    .getByRole("button", { name: "Preencher retorno fictício" })
    .click();
  await page
    .getByRole("button", { name: "Salvar retorno", exact: true })
    .click();
  await page.getByRole("button", { name: "Analisar retorno com IA" }).click();
  await page
    .getByRole("button", { name: "Aplicar e revisar nos campos" })
    .click();
  d = (await state()).demands.find((d) => d.id === "d1");
  assert.equal(d.guests, 220);
  assert.equal(d.title, "Encontro Horizonte");
  assert.equal(d.budget, 65000);
  assert.match(d.scope.food.answers.restrictions, /18 vegetarianos/);
  assert.equal(
    d.questions,
    initialQuestions +
      "\nConfirmar prazo de entrega do manual da marca (pergunta humana).",
  );
  await page
    .getByRole("button", { name: "Devolver entendimento", exact: true })
    .click();
  const formalization = await page
    .getByLabel("Texto sugerido de formalização")
    .inputValue();
  assert.match(formalization, /Público: 220 pessoas/);
  assert.match(formalization, /pergunta humana/);
  assert.doesNotMatch(
    formalization,
    /Qual é a data prevista|Qual é a faixa de investimento disponível|Em qual cidade ou local|Qual é o objetivo do evento/,
  );
  await page
    .getByRole("button", { name: "Marcar como revisado", exact: true })
    .click();
  await capture("briefing-conversation", "#briefing-conversa");
  await page
    .getByRole("button", { name: "Experimentar apresentação fictícia" })
    .click();
  await page.getByRole("button", { name: "Salvar nova versão" }).click();
  await page.getByRole("button", { name: "Próximo", exact: true }).click();
  await page
    .getByRole("button", { name: "Registrar envio da apresentação" })
    .click();
  await page
    .getByLabel("Responsável pelo feedback")
    .fill("Ana, comunicação interna");
  await page
    .getByLabel("Feedback e evidência do retorno")
    .fill(
      "Gostamos do conceito. Ampliar a área de convivência; retorno fictício por e-mail.",
    );
  await page
    .getByRole("button", { name: "Registrar ajustes", exact: true })
    .click();
  await page.getByRole("button", { name: "Preparar próxima versão" }).click();
  await page
    .getByLabel("O que muda nesta versão")
    .fill("Área de convivência ampliada.");
  await page.getByRole("button", { name: "Salvar nova versão" }).click();
  await page
    .getByRole("button", { name: "Registrar envio da apresentação" })
    .click();
  await page.getByLabel("Responsável pelo feedback").fill("Ana");
  await page
    .getByLabel("Feedback e evidência do retorno")
    .fill("Conceito aprovado, conforme retorno fictício de hoje.");
  await page
    .getByRole("button", { name: "Registrar aprovação", exact: true })
    .click();
  d = (await state()).demands.find((d) => d.id === "d1");
  assert.equal(d.presentations.length, 2);
  assert.equal(d.presentations[0].status, "changes");
  assert.equal(d.presentations[1].status, "approved");
  assert.equal(d.decision, "pending");
  await capture("briefing-creative", "#briefing-criacao");
  await go("/demandas/d3/briefing");
  await page
    .getByLabel("Arquivos do briefing")
    .setInputFiles(await briefingFixtures());
  await page
    .getByRole("button", { name: "Adicionar PDF, DOCX ou XLSX" })
    .waitFor({ timeout: 30000 });
  d = (await state()).demands.find((d) => d.id === "d3");
  assert.equal(d.attachments.length, 3);
  assert.ok(
    d.attachments.every((a) => a.status === "ready"),
    JSON.stringify(
      d.attachments.map((a) => ({
        name: a.name,
        status: a.status,
        detail: a.detail,
      })),
    ),
  );
  assert.match(d.attachments[0].text, /Niteroi/);
  assert.match(d.attachments[1].text, /demonstração DOCX/);
  assert.match(d.attachments[2].text, /demonstração XLSX/);
  await page
    .getByRole("button", { name: "Organizar com IA", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aplicar e revisar nos campos" })
    .click();
  d = (await state()).demands.find((d) => d.id === "d3");
  assert.equal(d.guests, 240);
  assert.equal(d.title, "Briefing de teste");
  assert.match(d.briefingDetails.hours, /DOCX/);
  assert.match(d.scope.food.answers.service, /XLSX/);
  await capture("briefing-attachments", ".briefing-attachments");
  await page.getByLabel("Arquivos do briefing").setInputFiles({
    name: "digitalizado-ficticio.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("not a readable PDF"),
  });
  await page
    .getByRole("button", { name: "Adicionar PDF, DOCX ou XLSX" })
    .waitFor();
  await page
    .getByLabel("Texto de digitalizado-ficticio.pdf")
    .fill("Objetivo: complementar manualmente o briefing fictício");
  await page.getByRole("button", { name: "Nova versão", exact: true }).click();
  await page.getByLabel("Origem da apresentação").selectOption("file");
  await page.getByLabel("Arquivo da apresentação").setInputFiles(demoPDF());
  await page.getByRole("button", { name: "Salvar nova versão" }).click();
  await page.getByRole("link", { name: /Baixar briefing-ficticio/ }).waitFor();
  await page.reload();
  await page.getByRole("link", { name: /Baixar briefing-ficticio/ }).waitFor();
  await page
    .getByRole("button", { name: "Organizar com IA", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aplicar e revisar nos campos" })
    .waitFor();
  await page
    .getByLabel("Cidade ou local *", { exact: true })
    .fill("Cidade revisada manualmente");
  assert.ok(
    await page
      .getByRole("button", { name: "Aplicar e revisar nos campos" })
      .isDisabled(),
  );
  await go("/demandas/d1/briefing");
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("briefing-shell-mobile");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await capture("briefing-sidebar-mobile");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".sidebar.open").count(), 0);
  await capture("briefing-conversation-mobile", "#briefing-conversa");
  await capture("briefing-creative-mobile", "#briefing-criacao");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: ".impeccable/review/briefing-full-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: ".impeccable/review/briefing-full-desktop.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: fixed/collapsible shell; complete AI review; client conversation; three file readers; creative versions; persistence; mobile; no page errors.",
  );
} finally {
  await browser.close();
}
