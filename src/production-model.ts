import type {
  AppState,
  Demand,
  ProductionProject,
  ProductionTask,
  TaskStatus,
} from "./types";

export const taskStatuses: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "A fazer" },
  { id: "doing", label: "Em andamento" },
  { id: "waiting", label: "Aguardando" },
  { id: "done", label: "Concluído" },
];
export const productionPhases = [
  "Pré-produção",
  "Montagem",
  "Evento",
  "Desmontagem",
  "Pós-evento",
];
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function relativeDay(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDay(d);
}
export const isTaskLate = (task: ProductionTask) =>
  task.status !== "done" && !!task.due && task.due < localDay();
export function taskTransitionError(task: ProductionTask, next: TaskStatus) {
  if (next !== "done") return "";
  if (task.blockedReason.trim())
    return "Resolva o bloqueio antes de concluir esta tarefa.";
  if (task.checklist.some((item) => !item.done))
    return "Conclua os itens do checklist antes de finalizar a tarefa.";
  return "";
}
const task = (
  id: string,
  title: string,
  status: TaskStatus,
  owner: string,
  days: number,
  phase: string,
  checks: string[],
  patch: Partial<ProductionTask> = {},
): ProductionTask => ({
  id,
  title,
  status,
  owner,
  due: relativeDay(days),
  phase,
  description:
    "Alinhar os detalhes com os envolvidos e registrar a confirmação nesta tarefa.",
  priority: "normal",
  supplier: "",
  blockedReason: "",
  checklist: checks.map((text, i) => ({
    id: `${id}-${i}`,
    text,
    done: status === "done",
  })),
  comments: [],
  activity: [
    {
      text: "Tarefa criada no exemplo fictício.",
      at: new Date().toISOString(),
    },
  ],
  ...patch,
});
export function withProductionDemo(state: AppState): AppState {
  if (state.productionDemo) return state;
  return {
    ...state,
    productionDemo: true,
    productionProjects: state.productionProjects || [
      {
        id: "ops-horizonte",
        title: "Encontro Horizonte",
        client: "Grupo Horizonte · fictício",
        date: relativeDay(12),
        location: "Espaço Jardim · Rio de Janeiro",
        owner: "Marina Costa",
        tasks: [
          task(
            "ops-1",
            "Confirmar janela de montagem",
            "todo",
            "Marina Costa",
            2,
            "Pré-produção",
            ["Validar acesso de veículos", "Confirmar horário com o espaço"],
            { supplier: "Espaço Jardim", priority: "high" },
          ),
          task(
            "ops-2",
            "Revisar roteiro do evento",
            "todo",
            "Lucas Almeida",
            4,
            "Evento",
            ["Conferir duração das falas", "Aprovar sequência com atendimento"],
          ),
          task(
            "ops-3",
            "Validar planta de montagem",
            "doing",
            "Lucas Almeida",
            1,
            "Montagem",
            [
              "Conferir circulação e acessos",
              "Validar posições de palco e buffet",
            ],
            {
              description:
                "Consolidar a planta com cenografia e equipe técnica antes de liberar a montagem.",
              priority: "high",
              comments: [
                {
                  id: "comment-demo",
                  author: "Marina Costa",
                  text: "Conferir o acesso ao backstage na próxima revisão. Comentário de demonstração.",
                  at: new Date().toISOString(),
                },
              ],
            },
          ),
          task(
            "ops-4",
            "Fechar escala da equipe",
            "doing",
            "Camila Rocha",
            3,
            "Evento",
            [
              "Confirmar responsáveis por turno",
              "Compartilhar contatos de apoio",
            ],
          ),
          task(
            "ops-5",
            "Receber documentação técnica",
            "waiting",
            "Lucas Almeida",
            -1,
            "Pré-produção",
            ["Receber documentação", "Conferir com o responsável técnico"],
            {
              supplier: "Luz & Cena · fictício",
              blockedReason:
                "Aguardando retorno do fornecedor sobre a documentação.",
              priority: "high",
            },
          ),
          task(
            "ops-6",
            "Confirmar retirada dos equipamentos",
            "waiting",
            "Camila Rocha",
            5,
            "Desmontagem",
            ["Alinhar retirada com o espaço"],
          ),
          task(
            "ops-7",
            "Revisar escopo com atendimento",
            "done",
            "Marina Costa",
            -2,
            "Pré-produção",
            ["Conferir proposta", "Registrar pendências do repasse"],
          ),
          task(
            "ops-8",
            "Agendar visita técnica",
            "done",
            "Lucas Almeida",
            -1,
            "Pré-produção",
            ["Confirmar participantes"],
          ),
          task(
            "ops-9",
            "Consolidar ocorrências e entregas",
            "todo",
            "Marina Costa",
            14,
            "Pós-evento",
            ["Registrar ocorrências", "Encaminhar informações para fechamento"],
          ),
        ],
      },
      {
        id: "ops-aurora",
        title: "Convenção Aurora",
        client: "Aurora · fictício",
        date: relativeDay(25),
        location: "Centro de Convenções · São Paulo",
        owner: "Camila Rocha",
        tasks: [
          task(
            "aurora-1",
            "Organizar reunião de repasse",
            "todo",
            "Camila Rocha",
            4,
            "Pré-produção",
            ["Conferir o escopo do projeto"],
          ),
          task(
            "aurora-2",
            "Alinhar proposta de cenografia",
            "doing",
            "Lucas Almeida",
            6,
            "Pré-produção",
            ["Revisar conceito com criação"],
          ),
        ],
      },
    ],
    financeEntries: state.financeEntries || [
      {
        id: "fin-1",
        projectId: "ops-horizonte",
        description: "Sinal do cliente",
        direction: "receive",
        amount: 18000,
        due: relativeDay(-3),
        settled: true,
      },
      {
        id: "fin-2",
        projectId: "ops-horizonte",
        description: "Saldo do cliente",
        direction: "receive",
        amount: 27000,
        due: relativeDay(8),
        settled: false,
      },
      {
        id: "fin-3",
        projectId: "ops-horizonte",
        description: "Reserva do espaço",
        direction: "pay",
        amount: 8500,
        due: relativeDay(-2),
        settled: true,
      },
      {
        id: "fin-4",
        projectId: "ops-horizonte",
        description: "Estrutura e operação técnica",
        direction: "pay",
        amount: 12000,
        due: relativeDay(4),
        settled: false,
      },
      {
        id: "fin-5",
        projectId: "ops-aurora",
        description: "Sinal do cliente",
        direction: "receive",
        amount: 22000,
        due: relativeDay(7),
        settled: false,
      },
    ],
  };
}
export function projectFromHandoff(
  d: Demand,
  state: AppState,
): ProductionProject | null {
  const version = d.versions.find((v) => v.id === d.acceptedVersion);
  if (!d.handoff || d.decision !== "accepted" || !version) return null;
  return {
    id: `project-${d.id}`,
    title: version.title,
    client: version.client,
    date: version.date,
    location: version.location,
    owner: d.owner,
    source: {
      demandId: d.id,
      reference: d.reference || d.id,
      version: structuredClone(version),
      briefing: d.message,
      evidence: d.evidence,
      suppliers: d.quotes
        .filter((q) => q.selected)
        .map((q) => ({
          name:
            state.suppliers.find((s) => s.id === q.supplierId)?.name ||
            "Fornecedor",
          terms: q.terms,
        })),
      at: new Date().toISOString(),
    },
    tasks: [
      task(
        `handoff-${d.id}`,
        "Revisar o repasse com atendimento",
        "todo",
        d.owner,
        1,
        "Pré-produção",
        [
          "Conferir versão aprovada e aceite",
          "Revisar fornecedores e condições",
          "Definir cronograma e responsáveis",
        ],
        {
          description:
            "Revise os dados recebidos antes de planejar a execução. A criação do projeto não contrata fornecedores.",
        },
      ),
    ],
  };
}
