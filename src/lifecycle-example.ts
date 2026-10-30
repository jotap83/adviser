import type {
  AppState,
  Demand,
  DocumentKind,
  EventDocument,
  Version,
} from "./types";
import { createDemand, seed } from "./data";
import { totals } from "./domain.mjs";
import {
  approvalFingerprint,
  requestApproval,
  decideApproval,
  latestApproval,
} from "./approval-model";
import {
  ensureEventProject,
  eventProject,
  documentTarget,
  needsClientDecision,
  withEventLifecycle,
} from "./event-lifecycle";
export const LIFECYCLE_EVENT = "demo-ciclo-completo";
export function approveExampleDocument(
  s: AppState,
  d: Demand,
  kind: DocumentKind,
  title: string,
  content: string,
  approved = true,
): AppState {
  const doc: EventDocument = {
    proposalVersionId: d.acceptedVersion,
    id: `example-${d.id}-${kind}`,
    eventId: d.id,
    kind,
    title,
    content,
    url: "",
    revision: 1,
    createdAt: "2026-10-29T12:00:00.000Z",
    createdBy: "u1",
  };
  let next: AppState = {
    ...s,
    eventDocuments: [...(s.eventDocuments || []), doc],
  };
  const target = documentTarget(doc),
    reviewer =
      kind === "accountability"
        ? "demo-finance"
        : kind === "material"
          ? "demo-creative"
          : kind === "contract"
            ? "demo-partner-a"
            : "demo-manager";
  next = requestApproval(next, target, "u1", [reviewer]);
  if (approved) {
    const r = latestApproval(next, target);
    if (r)
      next = decideApproval(
        next,
        r.id,
        reviewer,
        "approved",
        "Revisão fictícia preservada para demonstrar o fluxo.",
      );
    if (needsClientDecision(kind))
      next = {
        ...next,
        eventDocuments: next.eventDocuments?.map((x) =>
          x.id === doc.id
            ? {
                ...x,
                clientDecision: {
                  decision: "approved",
                  by: "Contato do cliente · exemplo",
                  evidence:
                    "Evidência fictícia de aprovação para navegação do protótipo.",
                  at: "2026-10-29T13:00:00.000Z",
                  fingerprint: approvalFingerprint(next, target),
                },
              }
            : x,
        ),
      };
  }
  return next;
}
export function withLifecycleExample(state: AppState): AppState {
  if (state.demands.some((d) => d.id === LIFECYCLE_EVENT)) return state;
  let s = withEventLifecycle(state);
  const client = s.clients[0];
  if (!client) return s;
  const d: Demand = {
    ...createDemand(client.id, "Convenção Conexões · ciclo completo"),
    id: LIFECYCLE_EVENT,
    owner: s.users.find((u) => u.id === "u1")?.name || "",
    source: "Gmail",
    origin: "Cliente recorrente",
    date: "2026-12-04",
    guests: 120,
    budget: 45000,
    location: "Rio de Janeiro",
    objective:
      "Reunir lideranças para apresentar resultados e o planejamento do próximo ano.",
    message:
      "Precisamos organizar a convenção para 120 pessoas em 4 de dezembro, no Rio. O orçamento de referência é R$ 45 mil. Precisamos de espaço, alimentação, audiovisual e conceito criativo. Podem estruturar uma proposta?",
    questions: "",
    briefingValid: true,
    stage: "handoff",
    decision: "accepted",
    evidence: "Aceite fictício por e-mail da proposta v1.",
    handoff: true,
    executionPhase: "planning",
    terms:
      "Sinal e saldo conforme contrato. Exemplo fictício; datas a conferir.",
    fee: 15,
    tax: 0,
    lines: [
      {
        id: "example-space",
        category: "Local",
        description: "Locação de espaço",
        qty: 1,
        unit: 10000,
        direct: false,
        supplier: "Espaço Jardim",
      },
      {
        id: "example-food",
        category: "Alimentação",
        description: "Serviço de alimentação",
        qty: 120,
        unit: 110,
        direct: false,
        supplier: "Mesa & Afeto",
      },
      {
        id: "example-tech",
        category: "Audiovisual",
        description: "Sonorização e projeção",
        qty: 1,
        unit: 7000,
        direct: false,
        supplier: "Luz & Cena",
      },
    ],
    presentations: [
      {
        id: "example-creative",
        number: 1,
        title: "Conexões que constroem o próximo ano",
        concept:
          "Encontro de lideranças com momentos de troca, reconhecimento e planejamento.",
        changes: "Primeiro conceito para a proposta.",
        source: "demo",
        at: "2026-10-28T12:00:00.000Z",
        status: "approved",
        sentAt: "2026-10-28T13:00:00.000Z",
        feedback: "Conceito aprovado na demonstração.",
        feedbackBy: "Contato fictício",
        feedbackAt: "2026-10-29T12:00:00.000Z",
      },
    ],
    history: [
      {
        at: "29/10/2026",
        text: "Exemplo completo: pedido, briefing, proposta, contratos e operação conectados. Todos os dados são fictícios.",
      },
    ],
  };
  d.quotes = structuredClone(seed().demands[0].quotes).map((q, i) => ({
    ...q,
    id: `lifecycle-quote-${i}`,
    status: "received",
    selected: i !== 2,
    lines:
      i === 0
        ? [structuredClone(d.lines[0])]
        : i === 1
          ? [structuredClone(d.lines[1])]
          : i === 3
            ? [structuredClone(d.lines[2])]
            : [
                {
                  ...structuredClone(d.lines[1]),
                  id: "alternative-food",
                  unit: 125,
                },
              ],
    fields: { ...q.fields, capacity: "160", hours: "6" },
    terms:
      i === 2
        ? "Alternativa com menu ampliado. Conferir diferença de escopo."
        : "Valores e condições fictícios para a demonstração de comparação.",
  }));
  const v: Version = {
    id: "example-proposal",
    number: 1,
    at: "29/10/2026",
    title: d.title,
    client: client.name,
    date: d.date,
    guests: d.guests,
    location: d.location,
    lines: structuredClone(d.lines),
    fee: d.fee,
    tax: d.tax,
    total: totals(d.lines, d.fee, d.tax).total,
    terms: d.terms,
    creative: {
      id: "example-creative",
      number: 1,
      title: d.presentations![0].title,
      concept: d.presentations![0].concept,
    },
  };
  d.versions = [v];
  d.acceptedVersion = v.id;
  d.sentVersion = v.id;
  s = { ...s, demands: [d, ...s.demands] };
  for (const kind of ["briefing", "proposal", "creative"] as const) {
    const target = {
      kind,
      targetId: d.id,
      versionId:
        kind === "proposal"
          ? v.id
          : kind === "creative"
            ? "example-creative"
            : undefined,
    };
    s = requestApproval(s, target, "u1", [
      kind === "creative" ? "demo-creative" : "demo-director",
    ]);
    const a = latestApproval(s, target);
    if (a)
      s = decideApproval(
        s,
        a.id,
        a.reviewers[0].userId,
        "approved",
        "Decisão fictícia para demonstração.",
      );
  }
  d.briefingClientApproval = {
    decision: "approved",
    by: "Contato do cliente · exemplo",
    evidence: "Briefing validado em resposta fictícia ao e-mail.",
    at: "2026-10-28T12:00:00.000Z",
    fingerprint: approvalFingerprint(s, { kind: "briefing", targetId: d.id }),
  };
  s = { ...s, demands: s.demands.map((x) => (x.id === d.id ? d : x)) };
  s = approveExampleDocument(
    s,
    d,
    "contract",
    "Contrato do evento · exemplo",
    "Escopo da proposta v1, responsabilidades e condições comerciais. Assinatura fictícia registrada para demonstrar a passagem à execução.",
  );
  s = approveExampleDocument(
    s,
    d,
    "supplier_contract",
    "Contrato do espaço · exemplo",
    "Espaço Jardim. Locação conforme proposta. Acesso e montagem em 03/12. Evidência fictícia da assinatura do parceiro registrada.",
  );
  s = approveExampleDocument(
    s,
    d,
    "material",
    "Roteiro de abertura · exemplo",
    "Recepção, boas-vindas, vídeo de abertura e fala de liderança. Duração proposta: 20 minutos. Aguardando revisão interna antes do cliente.",
    false,
  );
  s = approveExampleDocument(
    s,
    d,
    "report",
    "Relatório pós-evento · rascunho",
    "Modelo para preencher após a execução: público realizado, entregas, fotos, ocorrências e lições aprendidas.",
    false,
  );
  s = ensureEventProject(s, d.id);
  const p = eventProject(s, d.id)!;
  s = {
    ...s,
    productionProjects: s.productionProjects?.map((x) =>
      x.id === p.id
        ? {
            ...x,
            source: {
              demandId: d.id,
              reference: d.reference || "Exemplo",
              version: structuredClone(v),
              briefing: d.message,
              evidence: d.evidence,
              suppliers: d.quotes
                .filter((q) => q.selected)
                .map((q) => ({
                  name:
                    s.suppliers.find((x) => x.id === q.supplierId)?.name ||
                    "Fornecedor",
                  terms: q.terms,
                })),
              at: "2026-10-29T14:00:00.000Z",
            },
            tasks: [
              {
                id: "example-visit",
                title: "Visita técnica realizada antes do fechamento",
                description: "Conferência de acessos e capacidade do espaço.",
                status: "done",
                owner: d.owner,
                due: "2026-10-27",
                phase: "Visita técnica / viabilidade",
                priority: "normal",
                supplier: "Espaço Jardim",
                blockedReason: "",
                checklist: [
                  { id: "visit-check", text: "Confirmar acessos", done: true },
                ],
                comments: [],
                activity: [],
              },
              {
                id: "example-montagem",
                title: "Conferir montagem com fornecedor",
                description:
                  "Validar estrutura, projeção e acesso antes do evento.",
                status: "todo",
                owner: d.owner,
                due: "2026-12-03",
                phase: "Montagem",
                priority: "high",
                supplier: "Luz & Cena",
                blockedReason: "",
                checklist: [
                  {
                    id: "mount-check",
                    text: "Conferir teste de projeção",
                    done: false,
                  },
                ],
                comments: [],
                activity: [],
              },
            ],
          }
        : x,
    ),
    financeEntries: [
      ...(s.financeEntries || []),
      {
        id: "example-receive",
        projectId: p.id,
        description: "Sinal do cliente · exemplo",
        direction: "receive",
        amount: totals(d.lines, d.fee, d.tax).invoice / 2,
        due: "2026-11-10",
        settled: false,
        documentRef: "Contrato do evento · v1",
        sourceKey: `contract:${d.id}:${v.id}`,
      },
      {
        id: "example-balance",
        projectId: p.id,
        description: "Saldo do cliente · exemplo",
        direction: "receive",
        amount: totals(d.lines, d.fee, d.tax).invoice / 2,
        due: "2026-12-10",
        settled: false,
        sourceKey: `contract:${d.id}:${v.id}`,
      },
      {
        id: "example-pay",
        projectId: p.id,
        description: "Locação do espaço · exemplo",
        direction: "pay",
        amount: 10000,
        due: "2026-11-25",
        settled: false,
        category: "event",
        documentRef: "Contrato do espaço · v1",
      },
    ],
  };
  s = approveExampleDocument(
    s,
    d,
    "schedule",
    "Cronograma de produção · exemplo",
    "01/12: aprovação de materiais. 03/12: montagem e teste. 04/12: evento e desmontagem. Responsáveis: atendimento e produção.",
  );
  s = approveExampleDocument(
    s,
    d,
    "accountability",
    "Prestação de contas · rascunho",
    "Conferir notas, comprovantes, custos contratados e custos realizados. Documento ainda não liberado para o cliente.",
    false,
  );
  s = withEventLifecycle(s);
  return {
    ...s,
    eventRequests: s.eventRequests
      ?.map((r) => (r.eventId === d.id ? { ...r, status: "done" as const } : r))
      .concat([
        {
          id: "example-request-change",
          eventId: d.id,
          title: "Revisar o roteiro de abertura",
          description:
            "Solicitação fictícia recebida após o aceite: incluir uma fala de boas-vindas. Avaliar impacto antes de alterar escopo ou custo.",
          kind: "creative",
          owner: d.owner,
          due: "2026-11-20",
          status: "doing",
          createdAt: "2026-10-29T15:00:00.000Z",
          history: [],
        },
      ]),
  };
}
