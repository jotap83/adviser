import type {
  AppState,
  Demand,
  Line,
  ManagementEvent,
  Quote,
  Version,
} from "./types";
import { createDemand } from "./data";
import { totals } from "./domain.mjs";
import { managementDefaults } from "./management-model";

/** Add historical fictional cases once, without replacing earlier local work. */
export function withManagementInsightsDemo(
  state: AppState,
  now = Date.now(),
): AppState {
  if (state.managementInsightsDemo) return state;
  const at = (daysAgo: number) =>
    new Date(now - daysAgo * 86_400_000).toISOString();
  const date = (daysAgo: number) => at(daysAgo).slice(0, 10);
  const clients = state.clients.length
    ? state.clients
    : [
        {
          id: "insight-client",
          name: "Estúdio Horizonte — exemplo",
          contact: "Ana",
          email: "ana@example.com",
          nucleus: "",
        },
      ];
  const names = [
    "Encontro Essência",
    "Convenção Pontes",
    "Fórum Amanhã",
    "Jornada Conexões",
    "Encontro Inspira",
    "Convenção Perspectivas",
    "Fórum Horizontes",
    "Jornada Presença",
    "Encontro Origens",
    "Convenção Movimento",
    "Encontro Caminhos",
    "Jornada Equilíbrio",
  ];
  const specs: {
    ago: number;
    cycle: number;
    decision: Demand["decision"];
    reason?: string;
  }[] = [
    { ago: 3, cycle: 10, decision: "accepted" },
    { ago: 8, cycle: 12, decision: "accepted" },
    { ago: 15, cycle: 14, decision: "accepted" },
    { ago: 35, cycle: 12, decision: "accepted" },
    { ago: 42, cycle: 15, decision: "accepted" },
    { ago: 50, cycle: 18, decision: "accepted" },
    { ago: 75, cycle: 18, decision: "accepted" },
    { ago: 6, cycle: 12, decision: "declined", reason: "Preço" },
    { ago: 20, cycle: 15, decision: "declined", reason: "Evento adiado" },
    { ago: 40, cycle: 16, decision: "declined", reason: "Concorrência" },
    { ago: 0, cycle: 19, decision: "pending" },
    { ago: 0, cycle: 8, decision: "changes" },
  ];
  const samples = specs.map((spec, i): Demand => {
    const id = `insight-${i + 1}`;
    const client = clients[i % clients.length];
    const contactAgo = spec.ago + spec.cycle;
    const sentAgo = contactAgo - Math.round(spec.cycle * 0.6);
    const owner =
      state.users.filter((u) => u.active)[
        i % Math.max(1, state.users.filter((u) => u.active).length)
      ]?.name || "Equipe Adviser";
    const lines: Line[] = [
      {
        id: `${id}-local`,
        category: "local",
        description: "Espaço e montagem — exemplo",
        qty: 1,
        unit: 18000 + i * 1000,
        direct: false,
        supplier: "Espaço Alameda",
      },
      {
        id: `${id}-food`,
        category: "food",
        description: "Alimentação dos participantes — exemplo",
        qty: 100,
        unit: 140,
        direct: false,
      },
      {
        id: `${id}-tech`,
        category: "tech",
        description: "Audiovisual contratado diretamente — exemplo",
        qty: 1,
        unit: 6000,
        direct: true,
      },
    ];
    const fee = 15;
    const version: Version = {
      id: `${id}-v1`,
      number: 1,
      at: new Date(at(sentAgo + 0.2)).toLocaleString("pt-BR"),
      lines: structuredClone(lines),
      fee,
      tax: 0,
      total: totals(lines, fee, 0).total,
      terms: "Condições ilustrativas; validar antes de contratar.",
      title: names[i],
      client: client.name,
      date: date(-35),
      guests: 100,
      location: "Rio de Janeiro",
    };
    const events: ManagementEvent[] = [
      {
        kind: "proposal_sent",
        at: at(sentAgo),
        versionId: version.id,
        dueAt: date(sentAgo + (i % 3 === 0 ? 1 : -1)),
      },
    ];
    if (i % 3 === 1 || spec.decision === "changes")
      events.push({
        kind: "revision",
        at: at(Math.max(spec.ago + 1, sentAgo - 1)),
        versionId: version.id,
        reason: i === 1 ? "Informação incompleta" : "Mudança do cliente",
      });
    if (spec.decision === "accepted" || spec.decision === "declined")
      events.push({
        kind: spec.decision,
        at: at(spec.ago),
        versionId: version.id,
        reason: spec.reason,
      });
    const remuneration = totals(lines, fee, 0).fee;
    const supplier = state.suppliers[i % Math.max(1, state.suppliers.length)];
    const template = state.templates.find((t) => t.id === supplier?.category);
    const qSentAgo = contactAgo - 1;
    const responseDays = 1 + (i % 3);
    const quotes: Quote[] =
      supplier && template
        ? [
            {
              id: `${id}-q`,
              supplierId: supplier.id,
              template: structuredClone(template),
              status: i === 10 ? "requested" : "received",
              deadline: date(qSentAgo - 2),
              fields: Object.fromEntries(
                template.fields.map((f) => [f.id, "Informado no exemplo"]),
              ),
              lines: [structuredClone(lines[0])],
              terms: "Condição demonstrativa",
              attachment: "",
              selected: i !== 10,
              sentAt: at(qSentAgo),
              ...(i !== 10
                ? {
                    receivedAt: at(qSentAgo - responseDays),
                    firstReceivedAt: at(qSentAgo - responseDays),
                    firstResponseComplete: i % 4 !== 0,
                  }
                : {}),
            },
          ]
        : [];
    return {
      ...createDemand(client.id, names[i]),
      id,
      owner,
      stage:
        spec.decision === "accepted"
          ? "handoff"
          : spec.decision === "changes"
            ? "proposal"
            : "approval",
      source: i % 2 ? "WhatsApp" : "Gmail",
      message:
        "Exemplo fictício para demonstrar indicadores de atendimento. Precisamos organizar um encontro corporativo para 100 pessoas, com espaço, alimentação e audiovisual.",
      date: date(-35),
      guests: 100,
      location: "Rio de Janeiro",
      budget: version.total,
      objective: "Alinhar equipes e apresentar resultados",
      briefingValid: true,
      lines,
      fee,
      versions: [version],
      sentVersion: version.id,
      acceptedVersion: spec.decision === "accepted" ? version.id : undefined,
      decision: spec.decision,
      evidence:
        spec.decision === "accepted" || spec.decision === "declined"
          ? "Decisão fictícia para a demonstração do painel."
          : "",
      handoff: spec.decision === "accepted",
      createdAt: at(contactAgo - 1),
      updatedAt: at(spec.ago),
      stageEnteredAt: at(spec.ago),
      dueAt: date(i === 10 ? 2 : -4),
      quotes,
      conversation: [
        {
          id: `${id}-in`,
          direction: "in",
          text: "Gostaríamos de receber uma proposta para nosso encontro corporativo.",
          at: at(contactAgo),
          contact: client.contact,
          channel: i % 2 ? "WhatsApp" : "Gmail",
        },
        {
          id: `${id}-out`,
          direction: "out",
          text: "Recebemos o briefing e vamos confirmar o escopo e o orçamento com vocês.",
          at: at(contactAgo - (2 + (i % 5)) / 24),
          contact: client.contact,
          channel: i % 2 ? "WhatsApp" : "Gmail",
          author: owner,
          delivery: "simulated",
        },
      ],
      management: {
        firstContactAt: at(contactAgo),
        proposalDueAt: events[0].dueAt,
        complexity: i % 3 === 0 ? "high" : "standard",
        waitingOn: i === 10 ? "supplier" : "client",
        lossReason: spec.reason,
        revisionReason: events.find((e) => e.kind === "revision")?.reason,
        events,
        forecast: {
          versionId: version.id,
          internalCost: Math.round(remuneration * (i === 10 ? 0.75 : 0.45)),
          otherCost: Math.round(remuneration * 0.15),
        },
      },
      history: [
        {
          at: new Date(now).toLocaleString("pt-BR"),
          text: "Histórico fictício adicionado para explorar o Painel Gerencial.",
        },
      ],
    };
  });
  const ids = new Set(state.demands.map((d) => d.id));
  return {
    ...state,
    clients,
    managementInsightsDemo: true,
    managementTargets: state.managementTargets || { ...managementDefaults },
    demands: [...state.demands, ...samples.filter((d) => !ids.has(d.id))],
  };
}
