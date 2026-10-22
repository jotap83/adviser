import type { AppState, Demand, ProductionProject } from "./types";
import { money, totals } from "./domain.mjs";
import { quoteOptions, optionTotal, currentSelection } from "./quote-model";
import { managementAnalytics, riskRows } from "./management-model";

export const opportunities = [
  {
    id: "quotes",
    title: "Comparar cotações",
    area: "Cotações",
    benefit: "Enxergar diferenças de escopo antes de escolher pelo preço.",
    action: "Analisar cotações",
    measure: "Tempo para comparar fornecedores e pendências identificadas.",
  },
  {
    id: "review",
    title: "Revisar a proposta",
    area: "Proposta",
    benefit: "Conferir o que foi pedido, cotado e preparado para o cliente.",
    action: "Revisar proposta",
    measure: "Correções antes do envio e revisões por erro interno.",
  },
  {
    id: "changes",
    title: "Entender uma mudança",
    area: "Atendimento",
    benefit:
      "Identificar o que precisa ser revisto quando o cliente muda o pedido.",
    action: "Avaliar impacto",
    measure: "Tempo entre receber a alteração e preparar a nova versão.",
  },
  {
    id: "summary",
    title: "Retomar o atendimento",
    area: "Atendimento",
    benefit: "Dar continuidade à conversa com decisões e pendências à mão.",
    action: "Preparar resumo",
    measure: "Tempo para retomar ou transferir um atendimento.",
  },
  {
    id: "management",
    title: "Consultar a gestão",
    area: "Painel Gerencial",
    benefit:
      "Entender os indicadores e localizar demandas que merecem intervenção.",
    action: "Consultar registros",
    measure: "Tempo até agir nos alertas e evolução do ciclo até o aceite.",
  },
  {
    id: "memory",
    title: "Consultar a memória",
    area: "Conhecimento",
    benefit: "Encontrar referências no histórico de eventos da Adviser.",
    action: "Buscar referências",
    measure: "Reutilização de conhecimento e tempo de pesquisa.",
  },
  {
    id: "creative",
    title: "Explorar o criativo",
    area: "Criação",
    benefit:
      "Partir do briefing para discutir conceitos e estruturar a apresentação.",
    action: "Preparar caminhos criativos",
    measure: "Tempo para chegar à primeira direção criativa.",
  },
  {
    id: "operations",
    title: "Planejar a operação",
    area: "Operações",
    benefit:
      "Transformar o escopo disponível em tarefas revisadas pela equipe.",
    action: "Sugerir plano de trabalho",
    measure: "Tempo de preparação do quadro e pendências no repasse.",
  },
  {
    id: "finance",
    title: "Conferir cobrança do fornecedor",
    area: "Financeiro",
    benefit:
      "Receber a cobrança, revisar os dados e comparar com o lançamento do evento.",
    action: "Conferir com o valor previsto",
    measure: "Tempo de conferência e divergências antes do pagamento.",
  },
] as const;
export type OpportunityId = (typeof opportunities)[number]["id"];
export type AIInputs = {
  guests: string;
  date: string;
  question: string;
  query: string;
  direction: string;
  document: string;
  documentOrigin?: string;
  entryId: string;
  category: string;
};
export type Evidence = {
  title: string;
  detail: string;
  source: string;
  path?: string;
  tone?: string;
};
export type SuggestedTask = {
  key: string;
  title: string;
  description: string;
  due: string;
  phase: string;
  owner: string;
  checks: string[];
};
export type IntelligenceResult = {
  title: string;
  summary: string;
  findings: Evidence[];
  draft: string;
  limitation: string;
  tasks?: SuggestedTask[];
  columns?: string[];
  rows?: string[][];
  blocked?: string;
};
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const dateLabel = (s?: string) =>
  s ? s.split("-").reverse().join("/") : "Não informada";
const decimal = (n?: number) =>
  n === undefined
    ? "Sem base suficiente"
    : n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
export const demandPath = (d: Demand, tab = "briefing") =>
  `/demandas/${d.id}/${tab}`;
export const contextFingerprint = (s: AppState) =>
  JSON.stringify([
    s.demands,
    s.suppliers,
    s.clients,
    s.productionProjects,
    s.financeEntries,
    s.managementTargets,
    s.alertRules,
  ]);

export function defaultInputs(
  _s: AppState,
  d?: Demand,
  _p?: ProductionProject,
): AIInputs {
  return {
    guests: String(d?.guests ? d.guests + 30 : 180),
    date: d?.date || "",
    question: "attention",
    query: "",
    direction: "conexoes",
    category: "",
    entryId: "",
    document: "",
    documentOrigin: "",
  };
}
export function financeDocument(text: string) {
  const rawAmount = text
    .match(/(?:^|\n)Valor:[ \t]*([^\n]*)/i)?.[1]
    ?.trim()
    .replace(/^R\$\s*/i, "");
  const amount =
    rawAmount && /^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(rawAmount)
      ? rawAmount
      : undefined;
  const due = text.match(/(?:^|\n)Vencimento:[ \t]*([^\n]*)/i)?.[1]?.trim();
  const description = text
    .match(/(?:^|\n)Descri[çc][ãa]o:[ \t]*([^\n]*)/i)?.[1]
    ?.trim();
  const value = amount
    ? Number(amount.replace(/\./g, "").replace(",", "."))
    : undefined;
  const validDue =
    due &&
    /^\d{4}-\d{2}-\d{2}$/.test(due) &&
    Number.isFinite(Date.parse(`${due}T12:00:00Z`)) &&
    new Date(`${due}T12:00:00Z`).toISOString().slice(0, 10) === due;
  return {
    value: value !== undefined && Number.isFinite(value) ? value : undefined,
    due: validDue ? due : undefined,
    description,
  };
}
const missing: IntelligenceResult = {
  title: "Selecione um contexto",
  summary: "Abra uma demanda ou um projeto para usar seus registros.",
  findings: [],
  draft: "",
  limitation: "A análise precisa de informações de origem.",
};
export function simulateIntelligence(
  s: AppState,
  id: OpportunityId,
  contextId: string,
  input: AIInputs,
  now = Date.now(),
): IntelligenceResult {
  const d = s.demands.find((x) => x.id === contextId);
  const p = (s.productionProjects || []).find((x) => x.id === contextId);
  const facts: Evidence[] = [];
  const base = (
    title: string,
    summary: string,
    draft = "",
    limitation = "Simulação baseada nos registros locais. Revise as fontes antes de usar a sugestão.",
  ): IntelligenceResult => ({
    title,
    summary,
    findings: facts,
    draft,
    limitation,
  });
  if (id === "management") {
    const a = managementAnalytics(s.demands, "30", now);
    if (input.question === "attention") {
      const risks = riskRows(s, s.demands, new Date(now));
      risks.slice(0, 5).forEach((r) =>
        facts.push({
          title: r.d.title,
          detail: `${r.detail} Responsável: ${r.d.owner || "A distribuir"}. Próxima ação sugerida: ${r.action}.`,
          source: r.d.reference || r.d.id,
          path: r.path,
          tone: r.urgent ? "amber" : "blue",
        }),
      );
      return base(
        "Onde agir hoje",
        `${risks.length} demanda(s) sinalizada(s) pelas regras do painel. ${risks.length > 5 ? "Exibindo as cinco primeiras." : "As evidências abaixo explicam cada sinal."}`,
        facts.map((f) => `${f.title}: ${f.detail}`).join("\n\n"),
        "Sinais atuais por prazo, inatividade e meta de margem; não são previsão de perda nem prova da causa do atraso. Carteira completa, sem os filtros do painel.",
      );
    }
    if (input.question === "cycle") {
      a.cycles.forEach((r) =>
        facts.push({
          title: r.d.title,
          detail: `${decimal(r.days)} dias entre primeiro contato e aceite.`,
          source: r.d.reference || r.d.id,
          path: demandPath(r.d, "approval"),
        }),
      );
      return base(
        "Como está o tempo até o aceite?",
        a.average === undefined
          ? "Não há aceites com marcos completos nos últimos 30 dias."
          : `Média de ${decimal(a.average)} dias em ${a.cycles.length} aceite(s) com marcos completos nos últimos 30 dias. ${a.previousAverage !== undefined ? `Nos 30 dias anteriores: ${decimal(a.previousAverage)} dias em ${a.previousCount} aceite(s).` : "Sem base comparável no período anterior."}`,
        "",
        "O sistema calcula a duração. A IA de produção poderá explicar a evolução consultando esses registros. Amostras diferentes não comprovam causa ou ganho de produtividade.",
      );
    }
    a.refused.forEach((x) =>
      facts.push({
        title: x.title,
        detail: `Motivo registrado: ${x.management?.lossReason || "Não classificado"}.`,
        source: x.reference || x.id,
        path: demandPath(x, "approval"),
      }),
    );
    return base(
      "O que sabemos sobre a conversão?",
      a.conversion === undefined
        ? "Nenhuma decisão registrada nos últimos 30 dias."
        : `${decimal(a.conversion)}% de conversão: ${a.accepted.length} aceite(s) entre ${a.decided.length} decisões nos últimos 30 dias. ${a.refused.length} recusa(s).`,
      "",
      "Propostas pendentes ficam fora do denominador. Motivos são registros da equipe, não causas inferidas automaticamente.",
    );
  }
  if (id === "operations") {
    if (!p) return missing;
    const sourceDemand = s.demands.find((x) => x.id === p.source?.demandId);
    const stale =
      p.source &&
      (!sourceDemand ||
        sourceDemand.decision !== "accepted" ||
        !sourceDemand.handoff ||
        sourceDemand.acceptedVersion !== p.source.version.id);
    const groups = [
      ...new Set(
        p.source?.version.lines.map((l) => l.category) ||
          p.tasks.map((t) => t.phase),
      ),
    ].filter(Boolean);
    const tasks: SuggestedTask[] = groups.map((group, i) => ({
      key: `ai-plan-${p.id}-${normalize(group)}`,
      title: p.source
        ? `Validar entrega de ${group}`
        : `Conferir pendências de ${group}`,
      description: p.source
        ? `Conferir escopo, responsáveis e condições de ${group} na proposta aprovada v${p.source.version.number}.`
        : `Revisar as tarefas existentes de ${group} e confirmar o que falta para ${p.title}.`,
      owner: p.owner,
      due: "",
      phase: "Pré-produção",
      checks: [
        "Conferir escopo e condições",
        "Validar prazo e responsável",
        "Registrar confirmação dos envolvidos",
      ],
    }));
    facts.push({
      title: p.title,
      detail: `${p.client} · ${dateLabel(p.date)} · ${p.location || "Local a definir"}.`,
      source: p.source
        ? `Repasse da proposta v${p.source.version.number}`
        : "Cadastro do projeto de demonstração",
      path: `/operacoes/${p.id}`,
    });
    if (stale)
      facts.push({
        title: "Repasse precisa de revisão",
        detail:
          "A versão ou o aceite mudou no atendimento. Atualize o repasse antes de criar novas tarefas baseadas nele.",
        source: "Proposta vinculada",
        tone: "amber",
        path: sourceDemand ? demandPath(sourceDemand, "handoff") : undefined,
      });
    return {
      ...base(
        "Um plano inicial para a equipe revisar",
        `${tasks.length} tarefa(s) candidata(s), sem prazo atribuído automaticamente. ${p.source ? "A proposta aceita é a referência do plano." : "Este projeto demonstrativo ainda não tem uma proposta aceita vinculada; a referência é o quadro atual."}`,
        tasks.map((t) => `${t.title}\n${t.description}`).join("\n\n"),
        "Dependências, prazos, responsáveis e necessidade de cada tarefa precisam de revisão. Criar tarefas não contrata fornecedores.",
      ),
      tasks,
      blocked: stale ? "Atualize o repasse para continuar." : undefined,
    };
  }
  if (id === "finance") {
    if (!p) return missing;
    const entry = (s.financeEntries || []).find(
      (e) =>
        e.id === input.entryId && e.projectId === p.id && e.direction === "pay",
    );
    if (!entry)
      return {
        ...base(
          "Escolha um lançamento a pagar",
          "A comparação precisa de um lançamento do projeto selecionado.",
        ),
        blocked: "Sem lançamento de referência.",
      };
    let document: ReturnType<typeof financeDocument>;
    try {
      document = financeDocument(input.document);
    } catch {
      document = { value: undefined, due: undefined, description: undefined };
    }
    if (document.value === undefined || !document.due || !document.description)
      return {
        ...base(
          "Documento incompleto para esta simulação",
          "Use as linhas Descrição:, Valor: (padrão brasileiro) e Vencimento: AAAA-MM-DD.",
          "",
          "O protótipo reconhece somente os campos demonstrados; leitura livre de documentos depende da implementação de IA.",
        ),
        blocked: "Confira os campos do documento.",
      };
    const difference = document.value - entry.amount;
    facts.push({
      title: difference ? "Valor divergente" : "Valores coincidem",
      detail: `Documento: ${money(document.value)}. Lançamento: ${money(entry.amount)}. Diferença: ${money(difference)}.`,
      source: `${input.documentOrigin || "Documento informado"} × lançamento selecionado`,
      tone: difference ? "amber" : "green",
      path: `/financeiro/${p.id}`,
    });
    facts.push({
      title: "Vencimento",
      detail: `Documento: ${dateLabel(document.due)}. Lançamento: ${dateLabel(entry.due)}.`,
      source: "Campo Vencimento e cadastro financeiro",
      tone: document.due === entry.due ? "gray" : "amber",
    });
    facts.push({
      title: "Descrição para conferência",
      detail: `Documento: ${document.description}. Lançamento: ${entry.description}.`,
      source:
        "Correspondência selecionada pela pessoa; identidade e duplicidade ainda precisam de conferência",
    });
    return base(
      "Conferência antes de qualquer pagamento",
      difference
        ? "Há uma diferença que precisa ser esclarecida."
        : "O valor coincide; confirme identidade, descrição e vencimento.",
      `Revisar documento de ${document.description} no evento ${p.title}.\nOrigem: ${input.documentOrigin || "Documento informado"}.\nValor informado: ${money(document.value)}; previsto: ${money(entry.amount)}; diferença: ${money(difference)}.\nConfirmar a origem do documento, eventuais adicionais e a autorização antes de alterar qualquer lançamento.`,
      "Conferência demonstrativa, sem validação fiscal ou bancária. Não cria lançamento, autoriza pagamento nem efetua baixa.",
    );
  }
  if (!d) return missing;
  const source = d.reference || d.id;
  if (id === "quotes") {
    const quotes = d.quotes.filter(
      (q) =>
        q.status === "received" &&
        (!input.category || q.template.id === input.category),
    );
    const rows = quotes.flatMap((q) =>
      quoteOptions(q).map((o) => {
        const missingFields = q.template.fields
          .filter((f) => f.required && !q.fields[f.id]?.trim())
          .map((f) => f.label);
        const supplier =
          s.suppliers.find((x) => x.id === q.supplierId)?.name ||
          "Fornecedor não cadastrado";
        facts.push({
          title: `${supplier} · ${o.name}`,
          detail: `${Object.entries(q.fields)
            .map(
              ([key, value]) =>
                `${q.template.fields.find((f) => f.id === key)?.label || key}: ${value}`,
            )
            .join(" · ")}${o.detail ? ` · ${o.detail}` : ""}`,
          source: `${q.template.name}, cotação v${q.revision || 1}`,
          path: demandPath(d, "compare"),
          tone: missingFields.length ? "amber" : "gray",
        });
        return [
          supplier,
          o.name,
          money(optionTotal(o)),
          o.lines
            .filter((l) => l.optional)
            .map((l) => `${l.description}: ${money(l.qty * l.unit)}`)
            .join("; ") || "Nenhum opcional informado",
          q.terms || "Condições não informadas",
          missingFields.join(", ") || "Campos obrigatórios preenchidos",
        ];
      }),
    );
    const groups = new Set(quotes.map((q) => q.template.id));
    for (const category of groups) {
      const group = quotes.filter((q) => q.template.id === category);
      const options = group
        .flatMap((q) =>
          quoteOptions(q)
            .filter((o) => o.lines.some((l) => !l.optional))
            .map((o) => ({ q, o, value: optionTotal(o) })),
        )
        .sort((a, b) => a.value - b.value);
      if (options.length > 1) {
        facts.unshift({
          title: `Diferenças em ${group[0].template.name}`,
          detail: `Bases entre ${money(options[0].value)} e ${money(options.at(-1)!.value)}. ${group.map((q) => `${s.suppliers.find((x) => x.id === q.supplierId)?.name || "Fornecedor"}: ${q.fields.included || Object.values(q.fields).join("; ") || "inclusões não informadas"}`).join(" | ")} Confira se as condições cobrem o mesmo escopo.`,
          source: "Valores calculados e campos das cotações desta categoria",
          path: demandPath(d, "compare"),
          tone: "amber",
        });
      }
    }
    quotes
      .filter(
        (q) =>
          d.guests > 0 &&
          /^\d+$/.test(q.fields.capacity || "") &&
          Number(q.fields.capacity) < d.guests,
      )
      .forEach((q) =>
        facts.unshift({
          title: "Capacidade abaixo do público registrado",
          detail: `${s.suppliers.find((x) => x.id === q.supplierId)?.name || "Fornecedor"} informa ${q.fields.capacity} pessoas; o briefing registra ${d.guests}. Confirme uma alternativa antes de selecionar.`,
          source: "Campo de capacidade × público do briefing",
          path: demandPath(d, "compare"),
          tone: "amber",
        }),
      );
    return {
      ...base(
        "O que comparar antes de escolher",
        rows.length
          ? `${rows.length} alternativa(s) em ${groups.size} categoria(s). Valores das linhas obrigatórias; opcionais aparecem separados.`
          : "Nenhuma cotação recebida nesta categoria. Registre o retorno do fornecedor para comparar.",
        quotes
          .map(
            (q) =>
              `Para ${s.suppliers.find((x) => x.id === q.supplierId)?.name || "o fornecedor"} (${q.template.name}): confirmar inclusões, adicionais e disponibilidade. Data do evento: ${dateLabel(d.date)}. Público: ${d.guests ? `${d.guests} pessoas` : "a definir"}. Condições registradas: ${q.terms || "não informadas"}`,
          )
          .join("\n\n"),
        "Compare alternativas da mesma categoria e confira inclusões nas fontes. Menor preço não significa escopo equivalente; disponibilidade não foi consultada.",
      ),
      columns: [
        "Fornecedor",
        "Alternativa",
        "Base obrigatória",
        "Opcionais",
        "Condições",
        "Campos a esclarecer",
      ],
      rows,
    };
  }
  if (id === "review") {
    const version = d.versions.find((v) => v.id === d.sentVersion);
    const add = (title: string, detail: string, tab = "briefing") =>
      facts.push({
        title,
        detail,
        source,
        path: demandPath(d, tab),
        tone: "amber",
      });
    if (!d.briefingValid)
      add(
        "Briefing ainda não validado",
        "Confirme o entendimento com o cliente antes de assumir o escopo.",
      );
    if (!d.date || !d.guests || !d.location)
      add(
        "Dados básicos incompletos",
        `Data: ${dateLabel(d.date)}; público: ${d.guests || "a definir"}; local: ${d.location || "a definir"}.`,
      );
    if (!d.lines.length)
      add(
        "Orçamento sem itens",
        "Escolha composições ou cadastre os itens na proposta.",
        "proposal",
      );
    if (d.questions.trim()) add("Perguntas registradas", d.questions);
    d.quotes
      .filter((q) => q.selected && !currentSelection(q)?.confirmedAt)
      .forEach((q) =>
        add(
          "Composição aguarda confirmação",
          `${q.template.name}: confirmar condições com o fornecedor.`,
          "compare",
        ),
      );
    const total = totals(d.lines, d.fee, d.tax).total;
    if (d.budget && total > d.budget)
      add(
        "Total acima da verba informada",
        `Total preparado: ${money(total)}. Verba: ${money(d.budget)}. Confirmar eventual ajuste.`,
        "proposal",
      );
    if (
      version &&
      (version.guests !== d.guests ||
        version.date !== d.date ||
        version.location !== d.location)
    )
      add(
        "Rascunho diferente da versão enviada",
        `A proposta v${version.number} registra ${version.guests} pessoas em ${dateLabel(version.date)}, ${version.location}. O briefing atual precisa ser conciliado com essa versão.`,
        "proposal",
      );
    if (!facts.length)
      facts.push({
        title: "Nenhum alerta nas verificações demonstradas",
        detail: "Conferir ainda o texto integral, anexos e regras comerciais.",
        source,
        path: demandPath(d, "proposal"),
        tone: "green",
      });
    return base(
      "Uma segunda conferência antes do envio",
      `${facts.length} observação(ões) para revisão. Total calculado do rascunho: ${money(total)}.`,
      facts.map((f) => `${f.title}: ${f.detail}`).join("\n\n"),
      "Verificações demonstrativas de consistência, não certificação de completude. Valores são calculados pelo sistema. Versões enviadas e aceitas são preservadas.",
    );
  }
  if (id === "changes") {
    const guests = Number(input.guests);
    if (!Number.isInteger(guests) || guests < 1 || guests > 100000)
      return {
        ...base(
          "Informe um público válido",
          "Use um número inteiro entre 1 e 100.000.",
        ),
        blocked: "Público inválido.",
      };
    const changedGuests = guests !== d.guests,
      changedDate = input.date !== d.date;
    facts.push({
      title: "Alteração em análise",
      detail: `Público: ${d.guests || "não definido"} → ${guests}. Data: ${dateLabel(d.date)} → ${dateLabel(input.date)}.`,
      source: "Briefing atual × alteração informada",
      path: demandPath(d),
    });
    const groups = [
      ...new Set([
        ...d.quotes.map((q) => q.template.name),
        ...d.lines.map((l) => l.category),
      ]),
    ];
    if (changedGuests || changedDate)
      groups.forEach((group) =>
        facts.push({
          title: `Revisar ${group}`,
          detail: changedDate
            ? "Reconfirmar disponibilidade, prazos, valores e condições para a nova data."
            : "Verificar capacidade, quantidades, equipe necessária e eventual revisão de preço.",
          source: "Categorias cotadas ou orçadas; impacto a confirmar",
          path: demandPath(d, "quotes"),
          tone: "amber",
        }),
      );
    if ((changedGuests || changedDate) && !groups.length)
      facts.push({
        title: "Escopo ainda sem categorias",
        detail: "Detalhe os serviços para localizar os fornecedores afetados.",
        source: "Demanda atual",
        path: demandPath(d),
      });
    return base(
      changedGuests || changedDate
        ? "O que precisa ser reavaliado"
        : "Nenhuma mudança nesses campos",
      "A análise prepara uma lista de revisão. O briefing, preços, versões e contratos permanecem como estão até a equipe registrar as decisões.",
      `Alteração em avaliação — ${source}\nPúblico solicitado: ${guests}. Data solicitada: ${dateLabel(input.date)}.\n${groups.map((g) => `• ${g}: confirmar impacto no escopo, valores e disponibilidade.`).join("\n")}\nPreparar nova versão somente após validar os retornos.`,
      "Esta demonstração cobre público e data informados nos campos. Na implementação, a IA poderá sugeri-los a partir da mensagem e pedir sua confirmação. Não extrapola preços por pessoa.",
    );
  }
  if (id === "summary") {
    const messages = [...(d.conversation || [])]
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, 3);
    facts.push({
      title: "Contexto registrado",
      detail: `${d.title} · ${dateLabel(d.date)} · ${d.guests ? `${d.guests} pessoas` : "Público a definir"} · responsável: ${d.owner || "A distribuir"}.`,
      source: "Campos do briefing",
      path: demandPath(d),
    });
    messages.forEach((m) =>
      facts.push({
        title: `${m.direction === "in" ? "Recebido" : "Registrado como enviado"} · ${m.contact}`,
        detail: m.text,
        source: `${m.channel} · ${m.at}`,
        path: demandPath(d),
      }),
    );
    facts.push({
      title: "Pendências conhecidas",
      detail: `${d.questions || "Sem perguntas pendentes registradas."} ${d.quotes.filter((q) => q.status === "requested").length} cotação(ões) aguardando retorno. Decisão: ${{ pending: "aguardando", changes: "ajustes solicitados", accepted: "aceita", declined: "recusada" }[d.decision]}.`,
      source: "Briefing, cotações e decisão",
      path: demandPath(d, "approval"),
    });
    return base(
      "O essencial para continuar o atendimento",
      "Contexto e últimas três mensagens registradas, com referências para retomar a conversa.",
      facts.map((f) => `${f.title}\n${f.detail}`).join("\n\n"),
      "Mensagens citadas são evidências. Uma mensagem recebida não muda automaticamente o briefing nem confirma um aceite. O resumo deve ser revisado pela pessoa responsável.",
    );
  }
  if (id === "memory") {
    const query = normalize(input.query)
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const candidates = s.demands
      .filter((x) => x.id !== d.id && x.decision === "accepted")
      .map((x) => ({
        x,
        score: query.filter((w) =>
          normalize(
            `${x.title} ${x.location} ${x.objective} ${x.lines.map((l) => l.category).join(" ")}`,
          ).includes(w),
        ).length,
      }))
      .filter((x) => !query.length || x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    candidates.forEach(({ x }) =>
      facts.push({
        title: x.title,
        detail: `${x.location || "Local não informado"} · ${x.guests || "Público não informado"} pessoas. ${x.objective || "Objetivo não registrado."}`,
        source: `${x.reference || x.id} · aceite registrado`,
        path: demandPath(x, "approval"),
      }),
    );
    return base(
      "Referências da carteira",
      `${facts.length} referência(s) aceita(s) encontrada(s) ${query.length ? "pelos termos informados" : "no histórico disponível"}.`,
      facts.map((f) => `${f.title}: ${f.detail}`).join("\n\n"),
      "Busca demonstrativa por termos nos registros locais. Um aceite não comprova execução ou qualidade do fornecedor. Preços anteriores exigem nova cotação. Busca semântica e documentos históricos serão uma evolução.",
    );
  }
  const creative =
    input.direction === "reconhecimento"
      ? {
          name: "Quem faz acontecer",
          idea: "Valorizar histórias e contribuições da equipe, com participação voluntária e aprovação dos homenageados.",
          chapters: [
            "Abertura: por que estamos juntos",
            "Histórias da equipe",
            "Reconhecimento e celebração",
            "O próximo capítulo",
          ],
        }
      : input.direction === "futuro"
        ? {
            name: "O próximo encontro",
            idea: "Conectar as conquistas do presente às possibilidades do próximo ciclo, com espaço para participação da equipe.",
            chapters: [
              "O que construímos",
              "O que vem pela frente",
              "Ideias em conjunto",
              "Convite à próxima etapa",
            ],
          }
        : {
            name: "Conexões que ficam",
            idea: "Criar oportunidades de encontro entre pessoas e áreas, combinando acolhimento e participação.",
            chapters: [
              "Boas-vindas e propósito",
              "Pontos de encontro",
              "Histórias compartilhadas",
              "Celebração e encerramento",
            ],
          };
  facts.push({
    title: "Ponto de partida",
    detail:
      d.objective ||
      "Objetivo ainda não confirmado no briefing. Valide-o antes de escolher um conceito.",
    source: "Objetivo do briefing",
    path: demandPath(d),
  });
  facts.push({
    title: creative.name,
    detail: creative.idea,
    source: "Sugestão criativa ilustrativa a partir da direção escolhida",
  });
  facts.push({
    title: "Cuidados para desenvolver",
    detail:
      "Validar tom da marca, acessibilidade, restrições do cliente, verba e viabilidade de produção.",
    source: "Checklist sugerido; requisitos ainda precisam de confirmação",
  });
  return base(
    "Um caminho para a equipe criativa desenvolver",
    `Direção escolhida para ${d.title}: ${creative.name}.`,
    `Conceito: ${creative.name}\n${creative.idea}\n\nObjetivo registrado: ${d.objective || "a confirmar"}\n\nEstrutura sugerida da apresentação:\n${creative.chapters.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nValidar com a criação e com o cliente antes de produzir.`,
    "Três caminhos demonstrativos, sem geração de imagens ou slides. A equipe criativa revisa e desenvolve a proposta; nenhuma aprovação do cliente é presumida.",
  );
}
