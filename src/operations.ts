import type { AppState, Demand, Version } from "./types";
import { createDemand } from "./data";
import { totals } from "./domain.mjs";

export const isoDay = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const dayOffset = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoDay(d);
};
export const daysUntil = (date: string, now = new Date()) =>
  Math.round(
    (new Date(`${date}T12:00:00`).getTime() -
      new Date(`${isoDay(now)}T12:00:00`).getTime()) /
      86400000,
  );
export const ageDays = (date?: string, now = new Date()) =>
  date
    ? Math.max(
        0,
        Math.floor((now.getTime() - new Date(date).getTime()) / 86400000),
      )
    : 0;
export const activeDemand = (d: Demand) =>
  !d.handoff && d.decision !== "declined";
export const sentProposal = (d: Demand) =>
  d.versions.find((v) => v.id === d.sentVersion);
export const shortDate = (date?: string) =>
  date ? date.slice(0, 10).split("-").reverse().join("/") : "Sem prazo";

export type AlertItem = {
  id: string;
  demandId: string;
  title: string;
  detail: string;
  kind: "response" | "deadline" | "idle" | "decision";
  severity: "high" | "medium" | "info";
  action: string;
  path: string;
  read: boolean;
};
export function collectAlerts(state: AppState, now = new Date()): AlertItem[] {
  const alerts: AlertItem[] = [];
  const rules = state.alertRules || { idleDays: 3, dueDays: 2 };
  for (const d of state.demands) {
    if (!activeDemand(d)) continue;
    const add = (a: Omit<AlertItem, "demandId" | "read">) =>
      alerts.push({
        ...a,
        demandId: d.id,
        read: (state.readAlerts || []).includes(a.id),
      });
    const path = (tab = d.stage as string) => `/demandas/${d.id}/${tab}`;
    if (!d.dueAt) {
      add({
        id: `missing-due-${d.id}`,
        title: "Próxima entrega sem prazo",
        detail: "Defina quando será o próximo retorno ou entrega ao cliente.",
        kind: "deadline",
        severity: "medium",
        action: "Definir prazo",
        path: path("briefing"),
      });
    } else {
      const days = daysUntil(d.dueAt, now);
      if (days <= rules.dueDays)
        add({
          id: `due-${d.id}-${d.dueAt}`,
          title:
            days < 0
              ? "Prazo do atendimento vencido"
              : days === 0
                ? "Entrega prevista para hoje"
                : "Prazo do atendimento próximo",
          detail: `Próxima entrega: ${shortDate(d.dueAt)}. ${d.owner ? `${d.owner} acompanha a demanda.` : "Responsável a distribuir."}`,
          kind: "deadline",
          severity: days < 0 ? "high" : "medium",
          action: "Acompanhar demanda",
          path: path(),
        });
    }
    const lastMessage = d.conversation?.at(-1);
    for (const message of d.conversation || []) {
      if (
        message.direction === "in" &&
        message.inboxEmailId &&
        !message.reviewedAt
      )
        add({
          id: `inbox-reply-${message.inboxEmailId}-${d.id}`,
          title: "Mensagem associada, conteúdo a revisar",
          detail: `${message.contact} · ${message.subject || "Mensagem recebida"}`,
          kind: "response",
          severity: "info",
          action: "Revisar mensagem",
          path: path("briefing"),
        });
    }
    if (
      lastMessage?.direction === "out" &&
      d.clientResponseDue &&
      !d.briefingValid &&
      daysUntil(d.clientResponseDue, now) <= 0
    ) {
      add({
        id: `client-due-${d.id}-${lastMessage.id}-${d.clientResponseDue}`,
        title: "Acompanhar resposta do cliente",
        detail: `Entendimento enviado; acompanhamento previsto para ${shortDate(d.clientResponseDue)}.`,
        kind: "deadline",
        severity: daysUntil(d.clientResponseDue, now) < 0 ? "high" : "medium",
        action: "Ver conversa",
        path: path("briefing"),
      });
    }
    const idle = ageDays(d.updatedAt, now);
    if (idle >= rules.idleDays && d.decision !== "accepted")
      add({
        id: `idle-${d.id}-${d.updatedAt}`,
        title: `${idle} dias sem atualização`,
        detail:
          "Confirme se há dependência do cliente, do fornecedor ou da equipe.",
        kind: "idle",
        severity: "medium",
        action: "Retomar atendimento",
        path: path(),
      });
    for (const q of d.quotes) {
      const name =
        state.suppliers.find((s) => s.id === q.supplierId)?.name ||
        "Fornecedor";
      if (
        q.status === "requested" &&
        q.deadline &&
        daysUntil(q.deadline, now) < 0
      )
        add({
          id: `quote-late-${d.id}-${q.id}-${q.deadline}`,
          title: "Fornecedor com retorno atrasado",
          detail: `${name} · retorno previsto em ${shortDate(q.deadline)}.`,
          kind: "deadline",
          severity: "high",
          action: "Acompanhar cotação",
          path: path("quotes"),
        });
      if (q.status === "received")
        add({
          id: `quote-received-${d.id}-${q.id}-${q.receivedAt || "initial"}`,
          title: "Nova cotação recebida",
          detail: `${name} respondeu. Confira escopo, valores e condições.`,
          kind: "response",
          severity: "info",
          action: "Conferir cotação",
          path: path("compare"),
        });
      const supplierReply = q.messages
        ?.filter((m) => m.author === "supplier" && m.kind !== "revision")
        .at(-1);
      if (supplierReply)
        add({
          id: `supplier-reply-${d.id}-${q.id}-${supplierReply.id}`,
          title:
            supplierReply.kind === "confirmation"
              ? "Fornecedor confirmou a composição"
              : "Fornecedor respondeu à negociação",
          detail: `${name} · cotação v${supplierReply.revision}. Confira a conversa e as condições.`,
          kind: "response",
          severity: "info",
          action: "Ver conversa da cotação",
          path: path("compare"),
        });
    }
    d.briefingLog.forEach((_, i) =>
      add({
        id: `client-reply-${d.id}-${i}`,
        title: "Retorno do cliente registrado",
        detail:
          "A resposta foi inserida no sistema. Revise os esclarecimentos antes de atualizar o briefing.",
        kind: "response",
        severity: "info",
        action: "Revisar retorno",
        path: path("briefing"),
      }),
    );
    if (d.decision === "changes")
      add({
        id: `changes-${d.id}-${d.sentVersion}`,
        title: "Cliente pediu ajustes",
        detail: "Prepare uma nova versão preservando a proposta enviada.",
        kind: "decision",
        severity: "medium",
        action: "Revisar proposta",
        path: path("proposal"),
      });
    if (d.decision === "accepted" && !d.handoff)
      add({
        id: `handoff-${d.id}-${d.acceptedVersion}`,
        title: "Aprovada, aguardando repasse",
        detail:
          "Confira a versão aceita e prepare as informações para Operações.",
        kind: "decision",
        severity: "medium",
        action: "Preparar repasse",
        path: path("handoff"),
      });
  }
  const order = { high: 0, medium: 1, info: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}

// Additive migration: existing work is kept. Every new row below is synthetic.
export function withManagementDemo(state: AppState): AppState {
  if (state.managementDemo) return state;
  const at = (days: number) =>
    new Date(Date.now() - days * 86400000).toISOString();
  const demo = (
    id: string,
    client: string,
    title: string,
    stage: Demand["stage"],
    days: number,
  ): Demand => ({
    ...createDemand(client, title),
    id,
    stage,
    date: dayOffset(45 + days),
    location: "Rio de Janeiro",
    guests: 160,
    budget: 60000,
    objective: "Conectar equipes e compartilhar resultados.",
    briefingValid: true,
    createdAt: at(12 + days),
    updatedAt: at(days),
    stageEnteredAt: at(days + 1),
    dueAt: dayOffset(3),
    history: [
      {
        at: new Date(at(days)).toLocaleString("pt-BR"),
        text: "Cenário fictício para demonstração gerencial.",
      },
    ],
  });
  const proposal = (d: Demand, value: number, number = 1): Version => {
    const lines = [
      {
        id: `${d.id}-item`,
        category: "Produção",
        description: "Composição demonstrativa de serviços",
        qty: 1,
        unit: value,
        direct: false,
      },
    ];
    return {
      id: `${d.id}-v${number}`,
      number,
      at: new Date(at(3)).toLocaleString("pt-BR"),
      lines,
      fee: 10,
      tax: 0,
      total: totals(lines, 10).total,
      terms: d.terms,
      title: d.title,
      client: state.clients.find((c) => c.id === d.clientId)?.name || "Aurora",
      date: d.date,
      guests: d.guests,
      location: d.location,
    };
  };
  const p = demo("mg-proposal", "c4", "Jornada Aurora", "proposal", 1);
  p.owner = "Joana Alves";
  p.lines = proposal(p, 32000).lines;
  p.versions = [proposal(p, 32000)];
  const a = demo("mg-approval", "c2", "Encontro de Parceiros", "approval", 2);
  a.owner = "Rafael Lima";
  a.versions = [proposal(a, 42000)];
  a.lines = a.versions[0].lines;
  a.sentVersion = a.versions[0].id;
  const c = demo("mg-changes", "c4", "Conexão de Equipes", "approval", 1);
  c.owner = "Joana Alves";
  c.versions = [proposal(c, 28000)];
  c.lines = c.versions[0].lines;
  c.sentVersion = c.versions[0].id;
  c.decision = "changes";
  c.evidence = "Exemplo fictício: rever escopo da ambientação.";
  c.dueAt = dayOffset(1);
  const h = demo("mg-handoff", "c3", "Encontro de Lideranças", "handoff", 1);
  h.versions = [proposal(h, 36000)];
  h.lines = h.versions[0].lines;
  h.sentVersion = h.versions[0].id;
  h.acceptedVersion = h.sentVersion;
  h.decision = "accepted";
  h.evidence = "Aceite fictício para demonstração.";
  const lost = demo("mg-declined", "c1", "Ciclo de Conversas", "approval", 8);
  lost.versions = [proposal(lost, 18000)];
  lost.lines = lost.versions[0].lines;
  lost.sentVersion = lost.versions[0].id;
  lost.decision = "declined";
  lost.evidence = "Exemplo fictício: cliente adiou a iniciativa.";
  const rows = state.demands.map((d) => {
    if (d.id === "d2" && !d.quotes.length && d.stage === "quotes") {
      const original = state.demands
        .find((x) => x.id === "d1")
        ?.quotes.find((q) => q.status === "requested");
      return {
        ...d,
        updatedAt: at(4),
        stageEnteredAt: at(5),
        dueAt: dayOffset(-1),
        quotes: original
          ? [
              {
                ...structuredClone(original),
                id: "mg-pending-quote",
                deadline: dayOffset(-2),
              },
            ]
          : [],
      };
    }
    return {
      ...d,
      dueAt: d.dueAt || dayOffset(d.id === "d1" ? 1 : 5),
      updatedAt: d.updatedAt || at(1),
      stageEnteredAt: d.stageEnteredAt || at(1),
    };
  });
  return {
    ...state,
    managementDemo: true,
    readAlerts: state.readAlerts || [],
    alertRules: state.alertRules || { idleDays: 3, dueDays: 2 },
    clients: state.clients.some((c) => c.id === "c4")
      ? state.clients
      : [
          ...state.clients,
          {
            id: "c4",
            name: "Aurora",
            contact: "Luna Dias",
            email: "luna@aurora.example.com",
            nucleus: "Núcleo 4",
          },
        ],
    demands: [
      ...rows,
      ...[p, a, c, h, lost].filter(
        (d) => !state.demands.some((old) => old.id === d.id),
      ),
    ],
  };
}
