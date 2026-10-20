import test from "node:test";
import assert from "node:assert/strict";
import {
  totals,
  lineTotal,
  selectedLines,
  extractBriefing,
} from "../src/domain.mjs";
test("separa pagamento direto, aplica fee apenas à base Adviser e mantém soma do investimento", () => {
  const t = totals(
    [
      { qty: 2, unit: 3000, direct: false },
      { qty: 1, unit: 800, direct: true },
    ],
    10,
    150,
  );
  assert.deepEqual(t, {
    subtotal: 6800,
    direct: 800,
    agency: 6000,
    fee: 600,
    tax: 150,
    invoice: 6750,
    total: 7550,
  });
  assert.equal(t.invoice + t.direct, t.total);
});
test("arredonda linhas monetárias e impede valores negativos", () => {
  assert.equal(lineTotal({ qty: 3, unit: 0.1 }), 0.3);
  assert.equal(lineTotal({ qty: 2, unit: -50 }), 0);
});
test("apenas cotações recebidas e selecionadas entram na proposta sem modificar a fonte", () => {
  const q = [
    {
      id: "q",
      supplierId: "s",
      status: "received",
      selected: true,
      lines: [{ id: "l", qty: 1, unit: 20 }],
    },
    {
      id: "x",
      status: "requested",
      selected: true,
      lines: [{ id: "l", qty: 1, unit: 999 }],
    },
  ];
  const lines = selectedLines(q);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].supplier, "s");
  lines[0].unit = 400;
  assert.equal(q[0].lines[0].unit, 20);
});
test("simulação extrai somente padrões presentes e explicita informações ausentes", () => {
  const a = extractBriefing(
    "Evento: Encontro fictício\nPúblico de 75 pessoas em 12/02/2027. Cidade: Niterói\nOrçamento: R$ 28.500,50\nObjetivo: integrar as equipes.",
  );
  assert.equal(a.guests, 75);
  assert.equal(a.budget, 28500.5);
  assert.equal(a.date, "2027-02-12");
  assert.equal(a.location, "Niterói");
  const b = extractBriefing(
    "Precisamos organizar um evento, vocês podem nos ajudar?",
  );
  assert.equal(b.guests, 0);
  assert.equal(b.budget, 0);
  assert.equal(b.date, "");
  assert.ok(b.questions.length > 3);
});
