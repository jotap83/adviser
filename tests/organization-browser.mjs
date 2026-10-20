import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer } from "vite";

const server = await createServer({
  server: { host: "127.0.0.1", port: 4173, strictPort: true },
});
await server.listen();
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
let page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  locale: "pt-BR",
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = "http://127.0.0.1:4173/";
const state = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("adviser-demo-v1")));
const go = async (path) => {
  await page.goto(base + "#" + path);
  await page.locator("h1").waitFor();
};
const button = (name) => page.getByRole("button", { name, exact: true });
const label = (name) => page.getByLabel(name, { exact: true });
async function saved(predicate, arg) {
  await page.waitForFunction(predicate, arg);
  return state();
}
async function capture(name) {
  if (process.env.CAPTURE === "0") return;
  if (await button("Fechar aviso").count())
    await button("Fechar aviso").click();
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
    `page overflow: ${name}`,
  );
  await page.screenshot({
    path: `.impeccable/review/nuclei-${name}.png`,
    fullPage: true,
  });
}
try {
  const org = await server.ssrLoadModule("/src/organization.ts");
  const { seed } = await server.ssrLoadModule("/src/data.ts");
  const legacy = seed();
  legacy.clients.push({
    id: "custom",
    name: "Teste legado",
    contact: "",
    email: "",
    nucleus: "Núcleo customizado",
  });
  const migrated = org.withOrganization(legacy);
  assert.equal(
    migrated.demands,
    legacy.demands,
    "Migration must preserve demands",
  );
  assert.equal(
    org.nucleusLabel(migrated, migrated.clients.at(-1)),
    "Núcleo customizado",
  );
  assert.equal(migrated.clients.at(-1).accountOwnerId, "");
  const unassigned = {
    ...migrated,
    users: migrated.users.map((u) => ({
      ...u,
      primaryNucleusId: "",
      nucleusIds: [],
    })),
  };
  assert.equal(
    org.withOrganization(unassigned),
    unassigned,
    "Reload must not undo manual removal of memberships",
  );
  const renamed = org.saveNucleus(
    migrated,
    { ...migrated.nuclei[0], name: "Renomeado" },
    ["u1"],
  );
  assert.equal(renamed.clients.find((c) => c.id === "c1").nucleus, "Renomeado");
  assert.equal(
    renamed.demands,
    migrated.demands,
    "Renaming a nucleus must not reassign work",
  );
  const inactive = org.savePerson(migrated, {
    ...migrated.users[0],
    active: false,
  });
  assert.equal(
    org.suggestedOwner(inactive, "c1"),
    "",
    "Inactive account owners must not be suggested",
  );
  assert.equal(inactive.nuclei[0].coordinatorId, "");

  await go("/configuracoes/nucleos");
  const baseline = await state();
  assert.equal(baseline.nuclei.length, 4);
  await button("Novo núcleo").click();
  await label("Nome do núcleo").fill("Relacionamento especial");
  await label("Coordenação").selectOption("u3");
  await label("Rafael Lima").check();
  await button("Salvar núcleo").click();
  let s = await saved(
    () =>
      JSON.parse(localStorage.getItem("adviser-demo-v1")).nuclei.length === 5,
  );
  const nucleus = s.nuclei.find((n) => n.name === "Relacionamento especial");
  assert.ok(s.users.find((u) => u.id === "u3").nucleusIds.includes(nucleus.id));
  assert.equal(
    s.users.find((u) => u.id === "u2").primaryNucleusId,
    "n2",
    "Adding support must preserve principal nucleus",
  );
  await page.getByRole("tab", { name: /^Pessoas/ }).click();
  await button("Editar Rafael Lima").click();
  await label("Núcleo principal").selectOption(nucleus.id);
  await button("Salvar pessoa").click();

  await go("/clientes/c2");
  await label("Núcleo responsável").selectOption(nucleus.id);
  await label("Responsável pela conta").selectOption("u3");
  await button("Salvar cadastro").click();
  s = await saved(
    (id) =>
      JSON.parse(localStorage.getItem("adviser-demo-v1")).clients.find(
        (c) => c.id === "c2",
      ).nucleusId === id,
    nucleus.id,
  );
  assert.equal(
    s.demands.find((d) => d.id === "d2").owner,
    baseline.demands.find((d) => d.id === "d2").owner,
    "Portfolio transfer preserves existing event owner",
  );
  await go("/nova-demanda");
  await label("Cliente").selectOption("c2");
  assert.equal(
    await label("Responsável pelo atendimento").inputValue(),
    "Joana Alves",
  );
  await label("Nome da demanda").fill("Convenção de teste da carteira");
  await label("Responsável pelo atendimento").selectOption("Rafael Lima");
  await button("Criar demanda").click();
  s = await saved(() =>
    JSON.parse(localStorage.getItem("adviser-demo-v1")).demands.some(
      (d) => d.title === "Convenção de teste da carteira",
    ),
  );
  assert.equal(
    s.demands.find((d) => d.title === "Convenção de teste da carteira").owner,
    "Rafael Lima",
  );
  assert.equal(s.clients.find((c) => c.id === "c2").accountOwnerId, "u3");
  await label("Responsável pela demanda").selectOption("Marina Costa");
  await page.reload();
  assert.equal(
    await label("Responsável pela demanda").inputValue(),
    "Marina Costa",
    "Demand assignment persists",
  );

  await go("/nova-demanda");
  await label("Cliente").selectOption("new");
  assert.equal(await label("Responsável pelo atendimento").inputValue(), "");
  await label("Nome da demanda").fill("Pedido sem carteira");
  await label("Nome da empresa").fill("Empresa fictícia sem núcleo");
  await label("Nome do contato").fill("Pessoa de teste");
  await button("Criar demanda").click();
  s = await saved(() =>
    JSON.parse(localStorage.getItem("adviser-demo-v1")).demands.some(
      (d) => d.title === "Pedido sem carteira",
    ),
  );
  const pending = s.demands.find((d) => d.title === "Pedido sem carteira");
  assert.equal(pending.owner, "");
  assert.equal(s.clients.find((c) => c.id === pending.clientId).nucleusId, "");
  assert.equal(
    s.clients.find((c) => c.id === pending.clientId).accountOwnerId,
    "",
  );

  await go("/");
  await label("Visualizar como · demonstração").selectOption("u2");
  await page.getByRole("button", { name: /^Meu núcleo/ }).click();
  s = await state();
  const expected = s.demands.filter(
    (d) => org.demandNucleusId(s, d) === nucleus.id,
  );
  assert.equal(await page.locator(".demand-row").count(), expected.length);
  await page.getByRole("button", { name: /^Meus atendimentos/ }).click();
  assert.equal(
    await page.locator(".demand-row").count(),
    s.demands.filter((d) => d.owner === "Rafael Lima").length,
  );
  await page.getByRole("button", { name: /^A distribuir/ }).click();
  assert.ok(
    await page
      .locator(".demand-row")
      .filter({ hasText: "Pedido sem carteira" })
      .count(),
  );
  await page.getByRole("button", { name: /^Todos/ }).click();
  assert.equal(
    await page.locator(".demand-row").count(),
    s.demands.length,
    "All teams remain visible",
  );
  await go(`/clientes/carteira/${nucleus.id}`);
  assert.equal(await page.locator("tbody tr").count(), 1);
  assert.ok(
    await page
      .locator("tbody")
      .getByText("Joana Alves", { exact: false })
      .count(),
  );

  s = await state();
  const incoming = s.inbox.find(
    (m) => m.status === "pending" && (!m.channel || m.channel === "email"),
  );
  assert.ok(incoming, "Seed must contain a pending email");
  await go(`/mensagens/${incoming.id}`);
  await button("Criar nova demanda").click();
  await label("Cliente da nova demanda").selectOption("c2");
  assert.equal(
    await label("Responsável pela nova demanda").inputValue(),
    "Joana Alves",
  );
  await label("Nome da nova demanda").fill("Pedido por Gmail com carteira");
  await button("Criar e associar").click();
  s = await saved(() =>
    JSON.parse(localStorage.getItem("adviser-demo-v1")).demands.some(
      (d) => d.title === "Pedido por Gmail com carteira",
    ),
  );
  assert.equal(
    s.demands.find((d) => d.title === "Pedido por Gmail com carteira").owner,
    "Joana Alves",
  );

  await go("/mensagens/wa-ambiguous");
  await button("Criar nova demanda").click();
  await label("Cliente da nova demanda").selectOption("new");
  await label("Nome da nova demanda").fill("Pedido por WhatsApp sem carteira");
  await label("Nome da empresa").fill("Outra empresa fictícia");
  await label("Nome do contato").fill("Outro contato");
  assert.equal(await label("Responsável pela nova demanda").inputValue(), "");
  await button("Criar e associar").click();
  s = await saved(() =>
    JSON.parse(localStorage.getItem("adviser-demo-v1")).demands.some(
      (d) => d.title === "Pedido por WhatsApp sem carteira",
    ),
  );
  const whatsapp = s.demands.find(
    (d) => d.title === "Pedido por WhatsApp sem carteira",
  );
  assert.equal(s.clients.find((c) => c.id === whatsapp.clientId).nucleusId, "");
  assert.equal(whatsapp.owner, "");
  assert.equal(
    s.demands.find((d) => d.id === "d1").owner,
    baseline.demands.find((d) => d.id === "d1").owner,
    "Existing automatic channel association preserves owner",
  );

  await go("/gestao");
  await label("Núcleo").selectOption(nucleus.id);
  assert.equal(await page.locator(".nucleus-grid button").count(), 1);
  assert.ok(
    await page
      .locator(".nucleus-grid")
      .getByText("Coordenação: Joana Alves")
      .count(),
  );
  await page.reload();
  assert.equal(
    (await state()).clients.find((c) => c.id === "c2").accountOwnerId,
    "u3",
  );
  assert.deepEqual(errors, []);

  // One bounded screenshot matrix, with synthetic defaults rather than test residue.
  if (process.env.CAPTURE !== "0") {
    await page.close();
    page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      locale: "pt-BR",
      reducedMotion: "reduce",
    });
    await fs.mkdir(".impeccable/review", { recursive: true });
    for (const [device, width, height] of [
      ["desktop", 1440, 1000],
      ["mobile", 390, 844],
    ]) {
      await page.setViewportSize({ width, height });
      await go("/configuracoes/nucleos");
      await button("Editar Núcleo 1").click();
      await capture(`settings-${device}`);
      await go("/clientes/c1");
      await capture(`portfolio-${device}`);
      await go("/");
      await capture(`home-${device}`);
      await go("/gestao");
      await capture(`management-${device}`);
    }
  }
  console.log(
    "PASS organization: legacy migration, memberships, account transfer, demand ownership, manual/Gmail/WhatsApp intake, filters, shared visibility, persistence and responsive overflow.",
  );
} finally {
  await browser.close();
  await server.close();
}
