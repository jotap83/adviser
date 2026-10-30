import type {
  AppState,
  Demand,
  DocumentKind,
  EventDocument,
  EventRequest,
  ProductionProject,
  ApprovalRequest,
  FinanceEntry,
} from "./types";
import { createDemand, uid } from "./data";
import { totals } from "./domain.mjs";
import { approvalFingerprint, isApproved } from "./approval-model";

export const documentLabels: Record<DocumentKind, string> = {
  contract: "Contrato com o cliente",
  supplier_contract: "Contrato com fornecedor",
  schedule: "Cronograma",
  material: "Material criativo",
  extra: "Orçamento extra",
  supplier_over_budget: "Fornecedor acima do orçamento",
  report: "Relatório pós-evento",
  accountability: "Prestação de contas",
};
export const requestLabels = {
  initial: "Pedido inicial",
  change: "Alteração de escopo",
  creative: "Criação",
  technical: "Produção / visita técnica",
  finance: "Financeiro",
};
export const executionLabels = {
  planning: "Pré-produção",
  setup: "Montagem",
  live: "Execução do evento",
  teardown: "Desmontagem",
  post: "Pós-evento",
  closed: "Encerrado",
};
export const phaseSteps = [
  {
    id: "briefing",
    label: "Entrada e briefing",
    tab: "briefing",
    detail:
      "Pedido, fontes, necessidades e validação do cliente e atendimento.",
  },
  {
    id: "proposal",
    label: "Elaboração da proposta",
    tab: "proposal",
    detail: "Cotações, comparação, orçamento e apresentação criativa.",
  },
  {
    id: "negotiation",
    label: "Apresentação e negociação",
    tab: "approval",
    detail: "Revisão interna, envio ao cliente, ajustes e aceite da versão.",
  },
  {
    id: "contract",
    label: "Contratos e fechamento",
    tab: "contracts",
    detail:
      "Análise, aprovação e evidências dos contratos de cliente e fornecedores.",
  },
  {
    id: "production",
    label: "Produção e execução",
    tab: "production",
    detail: "Visitas técnicas, cronograma, materiais, montagem e execução.",
  },
  {
    id: "post",
    label: "Pós-evento e prestação de contas",
    tab: "post",
    detail: "Resultados, satisfação, custos reais e continuidade comercial.",
  },
] as const;
export function eventProject(s: AppState, id: string) {
  return s.productionProjects?.find(
    (p) => (p.eventId || p.source?.demandId) === id,
  );
}
export function ensureEventProject(s: AppState, id: string): AppState {
  if (eventProject(s, id)) return s;
  const d = s.demands.find((d) => d.id === id);
  if (!d) return s;
  const p: ProductionProject = {
    id: `project-${id}`,
    eventId: id,
    title: d.title,
    client: s.clients.find((c) => c.id === d.clientId)?.name || "",
    date: d.date,
    location: d.location,
    owner: d.owner,
    tasks: [],
  };
  return { ...s, productionProjects: [...(s.productionProjects || []), p] };
}
/** Additive migration: saved messages, versions, operations and finance keep their IDs. */
export function withEventLifecycle(input: AppState): AppState {
  let s = input;
  if (!s.lifecycleVersion) {
    let demands = [...s.demands],
      clients = [...s.clients];
    const productionProjects = (s.productionProjects || []).map((p) => {
      let eventId = p.eventId || p.source?.demandId;
      if (!eventId) {
        const matches = demands.filter((d) => d.title === p.title);
        if (matches.length === 1) eventId = matches[0].id;
        else {
          const existing = clients.find((c) => p.client.startsWith(c.name));
          const clientId = existing?.id || `client-${p.id}`;
          if (!existing)
            clients.push({
              id: clientId,
              name: p.client,
              contact: "",
              email: "",
              nucleus: "",
            });
          const d = {
            ...createDemand(clientId, p.title),
            id: `event-${p.id}`,
            owner: p.owner,
            date: p.date,
            location: p.location,
            source: "Demonstração operacional",
            message:
              "Evento de exemplo preservado da carteira de operações. Os documentos comerciais ainda precisam ser registrados.",
          };
          demands.push(d);
          eventId = d.id;
        }
      }
      return { ...p, eventId };
    });
    const added = [
      {
        id: "demo-manager",
        name: "Beatriz Nunes",
        role: "Gerente de Atendimento",
      },
      {
        id: "demo-director",
        name: "Clara Duarte",
        role: "Diretora de Atendimento",
      },
      {
        id: "demo-creative",
        name: "Diego Martins",
        role: "Gerente de Criação",
      },
      { id: "demo-finance", name: "Henrique Reis", role: "Gerente Financeiro" },
      {
        id: "demo-partner-a",
        name: "Paula Freitas",
        role: "Sócia-Diretora · Comercial",
      },
      {
        id: "demo-partner-b",
        name: "Gustavo Ribeiro",
        role: "Sócio-Diretor · Administrativo",
      },
    ]
      .filter((u) => !s.users.some((old) => old.id === u.id))
      .map((u) => ({ ...u, email: "", active: true }));
    s = {
      ...s,
      demands,
      clients,
      productionProjects,
      users: [...s.users, ...added],
      lifecycleVersion: 1,
    };
  }
  let requests = [...(s.eventRequests || [])];
  for (const d of s.demands) {
    if (!requests.some((r) => r.id === `initial-${d.id}`))
      requests.push({
        id: `initial-${d.id}`,
        eventId: d.id,
        title: "Pedido inicial",
        description: d.message || "Preencher o pedido e organizar o briefing.",
        kind: "initial",
        owner: d.owner,
        due: "",
        status: "new",
        createdAt: d.createdAt || new Date().toISOString(),
        history: [],
      });
  }
  // An association preserves the source. It never applies scope, approvals or money.
  for (const m of s.inbox || []) {
    if (m.status !== "linked" || !m.demandId || m.method === "new") continue;
    const existing = requests.find((r) => r.sourceMessageId === m.id);
    if (existing) {
      requests = requests.map((r) =>
        r.id === existing.id ? { ...r, eventId: m.demandId! } : r,
      );
      continue;
    }
    const d = s.demands.find((d) => d.id === m.demandId);
    if (!d) continue;
    requests.push({
      id: `message-${m.id}`,
      eventId: d.id,
      sourceMessageId: m.id,
      title: m.subject || "Solicitação recebida",
      description: m.text,
      kind: m.classification?.kind === "billing" ? "finance" : "change",
      owner: d.owner,
      due: "",
      status: "new",
      createdAt: m.receivedAt,
      history: [],
    });
  }
  const linked: AppState = {
    ...s,
    eventRequests: requests,
    productionProjects: s.productionProjects?.map((p) => {
      const d = s.demands.find(
        (d) => d.id === (p.eventId || p.source?.demandId),
      );
      return d
        ? {
            ...p,
            eventId: d.id,
            title: d.title,
            date: d.date,
            location: d.location,
            owner: d.owner,
            client:
              s.clients.find((c) => c.id === d.clientId)?.name || p.client,
          }
        : p;
    }),
  };
  return {
    ...linked,
    demands: linked.demands.map((d) =>
      d.executionPhase === "closed" && closureIssues(linked, d).length
        ? {
            ...d,
            executionPhase: "post",
            history: [
              {
                text: "Pós-evento reaberto: novas pendências exigem conferência antes de encerrar.",
                at: new Date().toISOString(),
              },
              ...d.history,
            ],
          }
        : d,
    ),
  };
}
export function latestDocument(s: AppState, id: string, kind: DocumentKind) {
  return s.eventDocuments
    ?.filter((d) => d.eventId === id && d.kind === kind)
    .at(-1);
}
export function documentTarget(doc: EventDocument) {
  return { kind: doc.kind, targetId: doc.eventId, versionId: doc.id };
}
export function needsClientDecision(kind: DocumentKind) {
  return [
    "contract",
    "schedule",
    "material",
    "report",
    "accountability",
  ].includes(kind);
}
export function documentReady(s: AppState, doc?: EventDocument) {
  if (!doc || !isApproved(s, documentTarget(doc))) return false;
  return (
    !needsClientDecision(doc.kind) ||
    (doc.clientDecision?.decision === "approved" &&
      doc.clientDecision.fingerprint ===
        approvalFingerprint(s, documentTarget(doc)))
  );
}
export function contractReady(s: AppState, d: Demand) {
  const doc = latestDocument(s, d.id, "contract");
  return (
    !!d.acceptedVersion &&
    d.decision === "accepted" &&
    doc?.proposalVersionId === d.acceptedVersion &&
    documentReady(s, doc)
  );
}
export function canValidateBriefing(s: AppState, d: Demand) {
  const target = { kind: "briefing" as const, targetId: d.id };
  return !!(
    d.title.trim() &&
    d.date &&
    d.guests > 0 &&
    d.location.trim() &&
    d.objective.trim() &&
    isApproved(s, target) &&
    d.briefingClientApproval?.decision === "approved" &&
    d.briefingClientApproval.fingerprint === approvalFingerprint(s, target)
  );
}
export function eventPhase(s: AppState, d: Demand) {
  if (d.executionPhase === "closed") return "closed";
  if (d.executionPhase === "post") return "post";
  if (d.executionPhase || contractReady(s, d)) return "production";
  if (d.decision === "declined") return "declined";
  if (d.decision === "accepted") return "contract";
  if (d.sentVersion || d.stage === "approval") return "negotiation";
  if (d.briefingValid || d.stage !== "briefing") return "proposal";
  return "briefing";
}
export function eventPhaseLabel(s: AppState, d: Demand) {
  const phase = eventPhase(s, d);
  return phase === "closed"
    ? "Encerrado"
    : phase === "declined"
      ? "Não aprovado"
      : phaseSteps.find((p) => p.id === phase)?.label || "";
}
export function approvalPolicy(
  s: AppState,
  t: Pick<ApprovalRequest, "kind" | "targetId">,
) {
  const category =
    s.financeEntries?.find((e) => e.id === t.targetId)?.category || "event";
  const policies: Record<
    string,
    { roles: string[]; client: boolean; note: string }
  > = {
    briefing: {
      roles: ["Gerente de Atendimento", "Diretora de Atendimento"],
      client: true,
      note: "Cliente valida o entendimento antes de orçar. Gerência e diretoria revisam internamente.",
    },
    proposal: {
      roles: [
        "Gerente de Atendimento",
        "Diretora de Atendimento",
        "Sócio-Diretor",
      ],
      client: true,
      note: "Gerência e diretoria e/ou sócios revisam conteúdo e margem; o cliente decide depois do envio.",
    },
    creative: {
      roles: [
        "Gerente de Criação",
        "Gerente de Atendimento",
        "Diretora de Atendimento",
      ],
      client: true,
      note: "Criação e atendimento revisam o conceito antes da apresentação ao cliente.",
    },
    contract: {
      roles: ["Sócio-Diretor"],
      client: true,
      note: "Sócio-diretor revisa; a assinatura do cliente é registrada com evidência.",
    },
    supplier_contract: {
      roles: ["Gerente de Atendimento", "Sócio-Diretor"],
      client: false,
      note: "Revisar condições, prazo e evidência de assinatura do fornecedor antes de confirmar contratação.",
    },
    schedule: {
      roles: ["Gerente de Atendimento"],
      client: true,
      note: "Atendimento revisa o cronograma; o cliente valida as datas.",
    },
    material: {
      roles: [
        "Gerente de Criação",
        "Gerente de Atendimento",
        "Diretora de Atendimento",
      ],
      client: true,
      note: "Arte, roteiro e layout têm revisão interna e aprovação do cliente por versão.",
    },
    extra: {
      roles: ["Sócio-Diretor", "Diretora de Atendimento"],
      client: false,
      note: "Diretoria e sócio revisam estouros. Se alterar o preço do cliente, gerar nova versão comercial e obter novo aceite.",
    },
    supplier_over_budget: {
      roles: ["Sócio-Diretor"],
      client: false,
      note: "Fornecedor acima do orçamento exige revisão do sócio-diretor.",
    },
    report: {
      roles: ["Gerente de Atendimento", "Diretora de Atendimento"],
      client: true,
      note: "Atendimento revisa os resultados; registrar recebimento e validação do cliente.",
    },
    accountability: {
      roles: ["Gerente Financeiro", "Gerente de Atendimento"],
      client: true,
      note: "Financeiro e atendimento conferem custos reais; registrar validação do cliente.",
    },
    payment: {
      roles:
        category === "event" || category === "reimbursement"
          ? ["Gerente de Atendimento"]
          : ["Sócio-Diretor"],
      client: false,
      note:
        category === "event"
          ? "Fornecedor dentro do orçamento: gerente do núcleo. Extras devem ser classificados para revisão dos sócios."
          : category === "fixed"
            ? "Despesa fixa: sócio da área administrativa."
            : category === "payroll"
              ? "Salários e pró-labore: ambos os sócios."
              : "Extra ou estouro: sócio-diretor. Conferir documento e orçamento antes de pagar.",
    },
  };
  return policies[t.kind];
}
export function suggestedReviewers(
  s: AppState,
  t: Pick<ApprovalRequest, "kind" | "targetId">,
  requester: string,
) {
  const policy = approvalPolicy(s, t);
  return s.users
    .filter(
      (u) =>
        u.active &&
        u.id !== requester &&
        policy.roles.some((role) =>
          role.startsWith("Sócio")
            ? /S[óo]ci[oa]-Diretor/i.test(u.role)
            : u.role === role,
        ),
    )
    .map((u) => u.id);
}
export function closureIssues(s: AppState, d: Demand) {
  const p = eventProject(s, d.id),
    issues: string[] = [];
  if (d.executionPhase !== "post" && d.executionPhase !== "closed")
    issues.push("Registrar a fase de pós-evento após a execução.");
  if (!contractReady(s, d))
    issues.push("Conferir a proposta aceita e o contrato vigente.");
  if (!documentReady(s, latestDocument(s, d.id, "report")))
    issues.push(
      "Aprovar o relatório pós-evento e registrar a validação do cliente.",
    );
  if (!documentReady(s, latestDocument(s, d.id, "accountability")))
    issues.push(
      "Concluir a prestação de contas com financeiro, atendimento e cliente.",
    );
  if (p?.tasks.some((t) => t.status !== "done"))
    issues.push("Concluir as tarefas operacionais em aberto.");
  if (s.financeEntries?.some((e) => e.projectId === p?.id && !e.settled))
    issues.push("Resolver as contas a pagar e receber em aberto.");
  if (s.eventRequests?.some((r) => r.eventId === d.id && r.status !== "done"))
    issues.push("Concluir as solicitações do evento.");
  for (const doc of s.eventDocuments || []) {
    if (
      doc.eventId === d.id &&
      !["contract", "report", "accountability"].includes(doc.kind) &&
      !(s.eventDocuments || []).some((next) => next.previousId === doc.id) &&
      !documentReady(s, doc)
    )
      issues.push(`Concluir a revisão de ${doc.title}.`);
  }
  return issues;
}
export function receivablesFromContract(
  s: AppState,
  id: string,
  deposit: number,
  due: string,
  balanceDue: string,
): AppState {
  const d = s.demands.find((d) => d.id === id),
    p = eventProject(s, id),
    v = d?.versions.find((v) => v.id === d.acceptedVersion);
  if (
    !d ||
    !p ||
    !v ||
    !contractReady(s, d) ||
    !Number.isFinite(deposit) ||
    deposit < 0 ||
    deposit > 100 ||
    !due ||
    !balanceDue
  )
    return s;
  const sourceKey = `contract:${id}:${v.id}`;
  if (s.financeEntries?.some((e) => e.sourceKey?.startsWith(`contract:${id}:`)))
    return s;
  const invoice = totals(v.lines, v.fee, v.tax).invoice,
    first = Math.round(invoice * deposit) / 100;
  const entries: FinanceEntry[] = [
    {
      id: uid(),
      projectId: p.id,
      description: `Sinal · proposta v${v.number}`,
      direction: "receive",
      amount: first,
      due,
      settled: false,
      sourceKey,
    },
    {
      id: uid(),
      projectId: p.id,
      description: `Saldo · proposta v${v.number}`,
      direction: "receive",
      amount: Math.round((invoice - first) * 100) / 100,
      due: balanceDue,
      settled: false,
      sourceKey,
    },
  ].filter((e) => e.amount > 0) as FinanceEntry[];
  return { ...s, financeEntries: [...(s.financeEntries || []), ...entries] };
}
