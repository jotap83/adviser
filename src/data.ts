import type { AppState, Demand, Quote, Template, Line } from "./types";
export const uid = () => crypto.randomUUID();
export const timestamp = () => new Date().toLocaleString("pt-BR");
export const stages = [
  { id: "briefing", label: "Briefing" },
  { id: "quotes", label: "Cotações" },
  { id: "compare", label: "Comparativo" },
  { id: "proposal", label: "Proposta" },
  { id: "approval", label: "Aprovação" },
  { id: "handoff", label: "Repasse" },
] as const;
const templates: Template[] = [
  {
    id: "local",
    name: "Local e infraestrutura",
    version: 1,
    fields: [
      {
        id: "capacity",
        label: "Capacidade de pessoas",
        type: "number",
        required: true,
      },
      {
        id: "setup",
        label: "Horários de montagem e desmontagem",
        type: "text",
        required: true,
      },
      {
        id: "included",
        label: "O que está incluído na locação?",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    id: "food",
    name: "Alimentação e bebidas",
    version: 1,
    fields: [
      {
        id: "menu",
        label: "Descrição do cardápio",
        type: "textarea",
        required: true,
      },
      {
        id: "hours",
        label: "Duração do serviço (horas)",
        type: "number",
        required: true,
      },
      {
        id: "restrictions",
        label: "Opções para restrições alimentares",
        type: "text",
        required: false,
      },
    ],
  },
  {
    id: "tech",
    name: "Audiovisual",
    version: 1,
    fields: [
      {
        id: "equipment",
        label: "Relação de equipamentos",
        type: "textarea",
        required: true,
      },
      {
        id: "staff",
        label: "Equipe técnica incluída",
        type: "text",
        required: true,
      },
    ],
  },
  {
    id: "music",
    name: "Atrações e música",
    version: 1,
    fields: [
      {
        id: "duration",
        label: "Duração da apresentação",
        type: "text",
        required: true,
      },
      {
        id: "rider",
        label: "Necessidades técnicas",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    id: "decor",
    name: "Cenografia e ambientação",
    version: 1,
    fields: [
      {
        id: "concept",
        label: "Descrição da ambientação",
        type: "textarea",
        required: true,
      },
      {
        id: "assembly",
        label: "Tempo necessário para montagem",
        type: "text",
        required: true,
      },
    ],
  },
];
const suppliers = [
  {
    id: "s1",
    name: "Espaço Orla",
    category: "local",
    contact: "Lia Prado",
    email: "lia@espacoorla.example.com",
    city: "Rio de Janeiro",
  },
  {
    id: "s2",
    name: "Casa do Mirante",
    category: "local",
    contact: "Caio Reis",
    email: "caio@casamirante.example.com",
    city: "Rio de Janeiro",
  },
  {
    id: "s3",
    name: "Mesa & Afeto",
    category: "food",
    contact: "Bia Luz",
    email: "bia@mesaafeto.example.com",
    city: "Rio de Janeiro",
  },
  {
    id: "s4",
    name: "Sinal Eventos",
    category: "tech",
    contact: "Rui Campos",
    email: "rui@sinal.example.com",
    city: "Rio de Janeiro",
  },
  {
    id: "s5",
    name: "Trio Primavera",
    category: "music",
    contact: "Eva Moura",
    email: "eva@trioprimavera.example.com",
    city: "Niterói",
  },
  {
    id: "s6",
    name: "Ateliê Traço",
    category: "decor",
    contact: "Nina Melo",
    email: "nina@atelietraco.example.com",
    city: "Rio de Janeiro",
  },
];
export function createDemand(clientId = "c1", title = "Nova demanda"): Demand {
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stageEnteredAt: new Date().toISOString(),
    title,
    clientId,
    owner: "Marina Costa",
    stage: "briefing",
    source: "E-mail",
    message: "",
    date: "",
    guests: 0,
    budget: 0,
    location: "",
    objective: "",
    questions: "",
    briefingValid: false,
    briefingLog: [],
    creative: "",
    quotes: [],
    lines: [],
    fee: 10,
    tax: 0,
    terms:
      "Proposta sujeita à disponibilidade dos fornecedores. Condições finais mediante confirmação.",
    versions: [],
    decision: "pending",
    evidence: "",
    handoff: false,
    history: [{ at: timestamp(), text: "Demanda registrada." }],
  };
}
const line = (
  id: string,
  category: string,
  description: string,
  qty: number,
  unit: number,
): Line => ({ id, category, description, qty, unit, direct: false });
const quotes: Quote[] = [
  {
    id: "q1",
    supplierId: "s1",
    template: templates[0],
    status: "received",
    deadline: "2026-11-03",
    fields: {
      capacity: "240",
      setup: "Montagem às 12h; saída até 2h.",
      included: "Salão, mobiliário, apoio e energia.",
    },
    lines: [
      line("l1", "Local", "Locação do salão por 6 horas", 1, 7800),
      line("l2", "Local", "Equipe de apoio e limpeza", 1, 900),
    ],
    terms: "30% de sinal. Saldo até 7 dias antes. Validade: 10 dias.",
    attachment: "",
    selected: false,
  },
  {
    id: "q2",
    supplierId: "s2",
    template: templates[0],
    status: "received",
    deadline: "2026-11-03",
    fields: {
      capacity: "220",
      setup: "Montagem a partir das 10h.",
      included: "Salão e estacionamento. Limpeza à parte.",
    },
    lines: [
      line("l1", "Local", "Locação do espaço e estacionamento", 1, 8300),
      line("l2", "Local", "Limpeza após o evento", 1, 1100),
    ],
    terms: "50% de sinal. Cancelamento até 30 dias antes.",
    attachment: "",
    selected: false,
  },
  {
    id: "q3",
    supplierId: "s3",
    template: templates[1],
    status: "requested",
    deadline: "2026-11-03",
    fields: {},
    lines: [],
    terms: "",
    attachment: "",
    selected: false,
  },
  {
    id: "q4",
    supplierId: "s4",
    template: templates[2],
    status: "received",
    deadline: "2026-11-03",
    fields: {
      equipment: "Som, 2 microfones e iluminação ambiente.",
      staff: "2 técnicos durante todo o evento.",
    },
    lines: [
      line("l1", "Audiovisual", "Som e microfones", 1, 3600),
      line("l2", "Audiovisual", "Iluminação ambiente e operação", 1, 2400),
    ],
    terms: "Pagamento 10 dias após o evento. Transporte incluído.",
    attachment: "",
    selected: false,
  },
];
export function seed(): AppState {
  const main = {
    ...createDemand(),
    id: "d1",
    title: "Encontro Horizonte",
    message:
      "Olá, Marina!\n\nEvento: Encontro Horizonte\nQueremos reunir 200 colaboradores em 04/12/2026, das 18h às 23h.\nCidade: Rio de Janeiro\nOrçamento: R$ 65.000\nObjetivo: celebrar as conquistas do ano e aproximar as equipes.\n\nPrecisamos de espaço, alimentação, som e uma atração musical. Ainda estamos definindo o tema. Pode nos ajudar com uma proposta?\n\nObrigada,\nAna — Horizonte (empresa fictícia)",
    quotes: structuredClone(quotes),
    history: [
      {
        at: "20/10/2026, 09:20",
        text: "Mensagem de exemplo recebida. Dados inteiramente fictícios.",
      },
      {
        at: "20/10/2026, 10:00",
        text: "Cotações de exemplo adicionadas para explorar a demonstração.",
      },
    ],
  };
  return {
    schema: 1,
    clients: [
      {
        id: "c1",
        name: "Horizonte",
        contact: "Ana Duarte",
        email: "ana@horizonte.example.com",
        nucleus: "Núcleo 1",
      },
      {
        id: "c2",
        name: "Vértice Digital",
        contact: "Leo Barros",
        email: "leo@vertice.example.com",
        nucleus: "Núcleo 2",
      },
      {
        id: "c3",
        name: "Nascente",
        contact: "Clara Vale",
        email: "clara@nascente.example.com",
        nucleus: "Núcleo 3",
      },
    ],
    suppliers,
    templates,
    users: [
      {
        id: "u1",
        name: "Marina Costa",
        email: "marina@adviser.example.com",
        role: "Atendimento",
        active: true,
      },
      {
        id: "u2",
        name: "Rafael Lima",
        email: "rafael@adviser.example.com",
        role: "Atendimento",
        active: true,
      },
      {
        id: "u3",
        name: "Joana Alves",
        email: "joana@adviser.example.com",
        role: "Administrador",
        active: true,
      },
    ],
    demands: [
      main,
      {
        ...createDemand("c2", "Convenção Conexões"),
        id: "d2",
        owner: "Rafael Lima",
        date: "2027-02-12",
        guests: 120,
        stage: "quotes",
        briefingValid: true,
        location: "São Paulo",
        objective: "Encontro de lideranças",
        budget: 48000,
      },
      {
        ...createDemand("c3", "Fórum Novos Caminhos"),
        id: "d3",
        owner: "Marina Costa",
        date: "2027-03-18",
        guests: 80,
        stage: "briefing",
        location: "Belo Horizonte",
      },
    ],
    aiMode: "available",
    provider: "Simulador",
  };
}
