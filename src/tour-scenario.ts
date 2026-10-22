import { seed, createDemand } from "./data";
import { prepareDemoState } from "./demo-state";
import { completeBriefingExample } from "./briefing-example";
import { analyzeSources, applySuggestions } from "./briefing-analysis";
import {
  quoteOptions,
  selectComposition,
  confirmComposition,
} from "./quote-model";
import { selectedLines, totals } from "./domain.mjs";
import { projectFromHandoff } from "./production-model";
import type { AppState, Demand, Quote, Version } from "./types";

export const TOUR_DEMAND = "tour-horizonte";
export const TOUR_MESSAGE = "tour-primeiro-contato";
export const TOUR_PROJECT = `project-${TOUR_DEMAND}`;
export const tourPhases = [
  "entry",
  "created",
  "structured",
  "aligned",
  "validated",
  "requested",
  "returned",
  "selected",
  "saved",
  "sent",
  "changes",
  "revised",
  "accepted",
  "handoff",
] as const;
export type TourPhase = (typeof tourPhases)[number];
const at = "2026-10-21T12:00:00.000Z";
const line = (
  id: string,
  category: string,
  description: string,
  qty: number,
  unit: number,
) => ({ id, category, description, qty, unit, direct: false });

function version(d: Demand, number: number): Version {
  return structuredClone({
    id: `tour-version-${number}`,
    number,
    at: "21/10/2026, 09:00",
    lines: d.lines,
    fee: d.fee,
    tax: d.tax,
    total: totals(d.lines, d.fee, d.tax).total,
    terms: d.terms,
    title: d.title,
    client: "Horizonte",
    date: d.date,
    guests: d.guests,
    location: d.location,
  });
}

function returnedQuotes(s: AppState): Quote[] {
  const source = structuredClone(seed().demands[0].quotes);
  source[2] = {
    ...source[2],
    status: "received",
    fields: {
      menu: "Coquetel e jantar; opções vegetarianas e sem lactose.",
      hours: "4",
      restrictions: "18 vegetarianos e 8 sem lactose; equipe à parte.",
    },
    lines: [
      line(
        "food-main",
        "Alimentação",
        "Coquetel e jantar por participante",
        200,
        110,
      ),
    ],
    terms: "30% de sinal; saldo após o evento. Transporte e equipe incluídos.",
  };
  for (const [supplierId, category, title, amount] of [
    ["s5", "music", "Banda com apresentação de 60 minutos", 4500],
    ["s6", "decor", "Ambientação e fundo de palco", 5400],
  ] as const) {
    const template = s.templates.find((t) => t.id === category)!;
    source.push({
      id: `tour-${category}`,
      supplierId,
      template,
      status: "received",
      deadline: "2026-11-03",
      fields: Object.fromEntries(
        template.fields.map((f) => [
          f.id,
          "Escopo e condições confirmados para o exemplo de apresentação.",
        ]),
      ),
      lines: [line(`${category}-main`, template.name, title, 1, amount)],
      terms:
        "Escopo, logística e disponibilidade confirmados no cenário fictício.",
      attachment: "",
      selected: false,
    });
  }
  return source.map((q) => ({
    ...q,
    revision: 1,
    sentAt: at,
    receivedAt: at,
    options: [
      {
        id: `base-${q.id}`,
        name: "Opção essencial",
        detail: "Serviços e condições da composição base.",
        lines: q.lines,
      },
      ...(q.id === "q1"
        ? [
            {
              id: "orla-completa",
              name: "Opção com contingência",
              detail: "Inclui gerador e recepção ampliada.",
              lines: [
                ...q.lines,
                line("backup", "Local", "Gerador com operador", 1, 1500),
                {
                  ...line("welcome", "Local", "Recepção ampliada", 1, 600),
                  optional: true,
                },
              ],
            },
          ]
        : []),
    ],
    messages: [
      {
        id: `received-${q.id}`,
        author: "supplier",
        kind: "revision",
        text: "Enviamos a cotação para conferência. Valores fictícios da apresentação.",
        at,
        revision: 1,
      },
    ],
  }));
}

/** A fresh demonstration on the real screens, never derived from personal browser records. */
export function buildTourScenario(phase: TourPhase): AppState {
  const s = prepareDemoState(seed());
  const n = tourPhases.indexOf(phase);
  const after = (p: TourPhase) => n >= tourPhases.indexOf(p);
  let d: Demand = {
    ...createDemand("c1", "Encontro Horizonte · apresentação"),
    id: TOUR_DEMAND,
    reference: "ADV-2026-0901",
    source: "Gmail",
    message: completeBriefingExample,
    quotes: [],
    management: { firstContactAt: "2026-10-12T12:00:00.000Z", events: [] },
    attachments: [
      {
        id: "tour-briefing-anexo",
        name: "briefing-horizonte-exemplo.pdf",
        size: 24000,
        kind: "pdf",
        text: "Anexo fictício: espaço coberto e acessível; testar o audiovisual às 16h30. O conteúdo é ilustrativo, não é um arquivo enviado por cliente.",
        included: true,
        at,
        status: "ready",
        detail:
          "Texto fictício preparado para o tour. Você também pode anexar PDF, DOCX ou XLSX reais no fluxo normal.",
      },
    ],
    history: [
      {
        at: "12/10/2026, 09:00",
        text: "Cenário fictício preparado para a apresentação guiada.",
      },
    ],
  };
  if (after("structured")) {
    const result = analyzeSources([
      { name: "Mensagem inicial", text: completeBriefingExample },
    ]);
    d = {
      ...d,
      ...applySuggestions(d, result.suggestions || []),
      title: "Encontro Horizonte · apresentação",
      questions:
        "Confirmar dietas especiais e pagamento do espaço. Qual é o prazo para compras aprovar?",
    };
  }
  if (after("aligned")) {
    d.conversation = [
      {
        id: "tour-entendimento",
        direction: "out",
        text: "Entendemos que será um encontro para 200 colaboradores em 04/12, no Rio, até R$ 65 mil. Precisamos confirmar dietas, pagamento do espaço e prazo de compras.",
        at: "2026-10-13T12:00:00Z",
        contact: "ana@horizonte.example.com",
        channel: "Gmail",
        subject: "[ADV-2026-0901] Alinhamento do Encontro Horizonte",
        delivery: "simulated",
      },
      {
        id: "tour-retorno",
        direction: "in",
        text: "Confirmamos as premissas. Considerem 18 vegetarianos e 8 sem lactose; o espaço também será pago via Adviser. Compras analisa a proposta até 30/10. O rider e as condições dos fornecedores devem acompanhar as cotações.",
        at: "2026-10-14T12:00:00Z",
        contact: "compras@horizonte.example.com",
        channel: "Gmail",
        subject: "Re: [ADV-2026-0901] Alinhamento do Encontro Horizonte",
        reviewedAt: at,
      },
    ];
    d.questions = "";
    d.creative =
      "Conexões que ficam: celebrar as equipes com uma ambientação acolhedora. Direção fictícia para discussão.";
    d.presentations = [
      {
        id: "tour-creative",
        number: 1,
        title: "Conexões que ficam",
        concept: d.creative,
        changes: "Primeira direção para conversa com o cliente.",
        source: "demo",
        at,
        status: "draft",
      },
    ];
  }
  if (after("validated")) {
    d.briefingValid = true;
    d.stage = "quotes";
  }
  if (after("requested")) {
    d.quotes = returnedQuotes(s).map((q) => ({
      ...q,
      status: "requested",
      fields: {},
      lines: [],
      options: [],
      messages: [],
      receivedAt: undefined,
    }));
    d.supplierShortlist = d.quotes.map((q) => q.supplierId);
  }
  if (after("returned")) {
    d.quotes = returnedQuotes(s);
    d.stage = "compare";
  }
  if (after("selected")) {
    d.quotes = d.quotes.map((q) => {
      if (q.id === "q2") return q;
      const selected = selectComposition(q, quoteOptions(q)[0].id, []);
      return confirmComposition(selected, selected.selection!.id);
    });
    d.lines = [
      ...selectedLines(d.quotes),
      line("team", "Equipe", "Coordenação e recepção", 1, 2500),
      line("photo", "Logística", "Fotografia por 4 horas", 1, 2200),
    ];
    d.stage = "proposal";
  }
  if (after("saved")) d.versions = [version(d, 1)];
  if (after("sent")) {
    d.sentVersion = d.versions[0].id;
    d.stage = "approval";
    d.management!.events = [
      {
        kind: "proposal_sent",
        at: "2026-10-18T12:00:00Z",
        versionId: d.sentVersion,
      },
    ];
  }
  if (after("changes")) {
    d.decision = "changes";
    d.stage = "proposal";
    d.evidence =
      "Ana · 20/10 · Gmail: podem revisar para 220 colaboradores? O restante do escopo permanece. Retorno fictício da apresentação.";
    d.management!.events!.push({
      kind: "revision",
      at: "2026-10-20T12:00:00Z",
      versionId: d.sentVersion,
      reason: "Alteração de público",
    });
  }
  if (after("revised")) {
    d.guests = 220;
    d.quotes = d.quotes.map((q) => {
      if (q.id !== "q3") return q;
      const options = quoteOptions(q).map((o) => ({
        ...o,
        lines: o.lines.map((l) => ({ ...l, qty: 220 })),
      }));
      const changed = {
        ...q,
        revision: 2,
        options,
        lines: options[0].lines,
        selected: false,
        selection: undefined,
      };
      const selected = selectComposition(changed, options[0].id, []);
      return confirmComposition(selected, selected.selection!.id);
    });
    d.lines = [
      ...selectedLines(d.quotes),
      ...d.lines.filter((l) => ["team", "photo"].includes(l.id)),
    ];
    d.versions.push(version(d, 2));
    d.sentVersion = d.versions[1].id;
    d.decision = "pending";
    d.stage = "approval";
    d.evidence =
      "Ana Duarte · 21/10 · Gmail: aprovamos a proposta v2 para 220 participantes, conforme valores e condições enviados. Aceite fictício para demonstrar o registro.";
    d.management!.events!.push({
      kind: "proposal_sent",
      at,
      versionId: d.sentVersion,
    });
  }
  if (after("accepted")) {
    d.decision = "accepted";
    d.acceptedVersion = d.sentVersion;
    d.stage = "handoff";
    d.management!.events!.push({
      kind: "accepted",
      at,
      versionId: d.acceptedVersion,
    });
  }
  if (after("handoff")) d.handoff = true;
  s.demands = [d, ...s.demands.filter((x) => x.id !== "d1")];
  s.inbox = [
    {
      id: TOUR_MESSAGE,
      account: "atendimento@adviser.example.com",
      threadId: "tour-thread",
      channel: "email",
      from: "ana@horizonte.example.com",
      to: ["atendimento@adviser.example.com"],
      subject: "Proposta para encontro de fim de ano · Horizonte",
      text: completeBriefingExample,
      receivedAt: "2026-10-12T12:00:00.000Z",
      attachments: [
        {
          name: "briefing-horizonte-exemplo.pdf",
          kind: "pdf",
          text: d.attachments![0].text,
        },
      ],
      status: after("created") ? "linked" : "pending",
      demandId: after("created") ? d.id : undefined,
      method: after("created") ? "new" : undefined,
      history: [],
    },
    ...(s.inbox || []).filter((m) => m.demandId !== "d1"),
  ];
  if (!after("created")) s.demands = s.demands.filter((x) => x.id !== d.id);
  if (after("handoff")) {
    const p = projectFromHandoff(d, s)!;
    const example = s.productionProjects![0];
    p.tasks = [
      ...p.tasks,
      ...structuredClone(example.tasks)
        .slice(0, 5)
        .map((t, i) => ({ ...t, id: `tour-task-${i}` })),
    ];
    s.productionProjects = [p, ...(s.productionProjects || [])];
    s.financeEntries = [
      {
        id: "tour-fin-receive",
        projectId: p.id,
        direction: "receive",
        description: "Recebimento do cliente · proposta v2",
        amount: d.versions[1].total,
        due: "2026-11-03",
        settled: false,
      },
      ...d.lines.map((l, i) => ({
        id: `tour-fin-pay-${i}`,
        projectId: p.id,
        direction: "pay" as const,
        description: l.description,
        amount: l.qty * l.unit,
        due: "2026-11-02",
        settled: false,
      })),
      ...(s.financeEntries || []),
    ];
  }
  return s;
}
