import type { Demand } from "./types";

export type BriefField = {
  id: string;
  label: string;
  question: string;
  example: string;
};
export type ScopeBlock = {
  id: string;
  name: string;
  output: string;
  fields: BriefField[];
};
const field = (
  id: string,
  label: string,
  question: string,
  example: string,
): BriefField => ({ id, label, question, example });
export const briefingFields = [
  field(
    "format",
    "Formato e perfil do público",
    "Qual é o formato do evento e quem participa?",
    "Ex.: encontro interno; colaboradores e lideranças",
  ),
  field(
    "hours",
    "Horários do evento",
    "Qual é o horário de início e término do evento?",
    "Ex.: recepção às 17h; evento das 18h às 22h",
  ),
  field(
    "setup",
    "Montagem e desmontagem",
    "Quais são as janelas de montagem e desmontagem?",
    "Ex.: montagem na véspera; retirada na manhã seguinte",
  ),
  field(
    "approval",
    "Aprovação e regras de contratação",
    "Quem aprova a proposta e quais são as regras de contratação?",
    "Ex.: marketing valida; compras aprova; cadastro prévio de fornecedores",
  ),
  field(
    "budgetScope",
    "O que o orçamento precisa incluir",
    "O investimento informado inclui serviços, fee e tributos?",
    "Ex.: teto global a confirmar com compras",
  ),
];
export const scopeBlocks: ScopeBlock[] = [
  {
    id: "local",
    name: "Local e infraestrutura",
    output: "Locação, serviços incluídos e adicionais separados.",
    fields: [
      field(
        "space",
        "Ambientes e capacidade",
        "O local está definido? Quais ambientes e capacidade precisamos considerar?",
        "Ex.: espaço coberto para o público informado",
      ),
      field(
        "inclusions",
        "Inclusões e cobranças à parte",
        "Energia, climatização, cozinha, limpeza e mobiliário estão incluídos?",
        "Ex.: discriminar o que está dentro e fora da locação",
      ),
      field(
        "access",
        "Acessibilidade e contingência",
        "Há requisitos de acessibilidade e alternativa para chuva ou falta de energia?",
        "Ex.: acesso sem degraus; verificar área coberta",
      ),
    ],
  },
  {
    id: "food",
    name: "Alimentação e bebidas",
    output: "Preço por pessoa, duração, bebidas e taxas adicionais.",
    fields: [
      field(
        "service",
        "Formato e duração do serviço",
        "Qual formato de alimentação e por quantas horas?",
        "Ex.: coquetel e jantar durante o evento",
      ),
      field(
        "restrictions",
        "Dietas e público atendido",
        "Há restrições alimentares? A equipe de trabalho entra na quantidade?",
        "Ex.: levantar vegetarianos, alergias e alimentação de staff",
      ),
      field(
        "drinks",
        "Bebidas, consumo e taxas",
        "Quais bebidas, formato de consumo e eventuais taxas devem ser considerados?",
        "Ex.: pacote por pessoa; discriminar rolha e transporte",
      ),
    ],
  },
  {
    id: "tech",
    name: "Audiovisual e estrutura",
    output: "Equipamentos, dimensões, operação, frete e montagem.",
    fields: [
      field(
        "usage",
        "Programação e necessidades técnicas",
        "Teremos apresentações, vídeos, transmissão ou show?",
        "Ex.: fala de abertura e vídeo institucional",
      ),
      field(
        "equipment",
        "Som, imagem, palco e iluminação",
        "Quais equipamentos, dimensões e ambientes devem ser atendidos?",
        "Ex.: dimensionamento sujeito à visita técnica",
      ),
      field(
        "operation",
        "Equipe, energia e logística",
        "A cotação inclui operação, energia, montagem e transporte?",
        "Ex.: separar equipamentos, equipe e frete",
      ),
    ],
  },
  {
    id: "decor",
    name: "Cenografia e ambientação",
    output: "Conceito, áreas, peças, quantidades e montagem.",
    fields: [
      field(
        "concept",
        "Tema e referências",
        "Existe tema, identidade visual ou referência aprovada?",
        "Ex.: celebrar conexões; conceito a desenvolver",
      ),
      field(
        "areas",
        "Ambientes e mobiliário",
        "Quais áreas precisam de ambientação e com que mobiliário?",
        "Ex.: entrada, palco, mesas e área de convivência",
      ),
      field(
        "delivery",
        "Entregas e responsabilidades",
        "Quem fornece artes, aprova peças e responde pela montagem?",
        "Ex.: criação apresenta; cliente aprova; fornecedor produz",
      ),
    ],
  },
  {
    id: "activation",
    name: "Ativações e experiências",
    output: "Ativação, capacidade de atendimento e materiais.",
    fields: [
      field(
        "experience",
        "Experiência e objetivo",
        "Que experiência queremos oferecer e qual seu objetivo?",
        "Ex.: interação entre equipes",
      ),
      field(
        "capacity",
        "Duração e capacidade",
        "Quantas pessoas devem ser atendidas e durante quanto tempo?",
        "Ex.: dimensionar filas e tempo por participante",
      ),
      field(
        "materials",
        "Materiais, equipe e infraestrutura",
        "Quais materiais, operadores, energia e espaço são necessários?",
        "Ex.: pedir composição completa ao fornecedor",
      ),
    ],
  },
  {
    id: "music",
    name: "Atrações e música",
    output: "Cachê, duração, necessidades técnicas e logística.",
    fields: [
      field(
        "show",
        "Perfil e duração da atração",
        "Qual perfil de atração, duração e horário desejados?",
        "Ex.: banda local; apresentação após o jantar",
      ),
      field(
        "rider",
        "Necessidades técnicas e camarim",
        "O rider técnico e as necessidades de camarim já foram recebidos?",
        "Ex.: solicitar à atração e validar com audiovisual",
      ),
      field(
        "logistics",
        "Deslocamento e despesas",
        "O valor inclui transporte, hospedagem e alimentação da equipe?",
        "Ex.: discriminar o que fica por conta do contratante",
      ),
    ],
  },
  {
    id: "staff",
    name: "Equipe e operação",
    output: "Funções, profissionais, turnos e horas adicionais.",
    fields: [
      field(
        "roles",
        "Funções e dimensionamento",
        "Quais funções e quantidades serão necessárias?",
        "Ex.: recepção, limpeza, segurança e coordenação",
      ),
      field(
        "shifts",
        "Turnos e duração",
        "A equipe cobre montagem, evento e desmontagem?",
        "Ex.: indicar início, término e política de hora adicional",
      ),
      field(
        "support",
        "Apoio à equipe",
        "Quem fornece alimentação, transporte e equipamentos de trabalho?",
        "Ex.: rádio, uniforme e refeição por turno",
      ),
    ],
  },
  {
    id: "legal",
    name: "Documentação e responsabilidades",
    output: "Documentos, responsáveis e custos sujeitos à confirmação.",
    fields: [
      field(
        "requirements",
        "Exigências do local e do cliente",
        "Quais documentos, seguros e autorizações precisam ser verificados?",
        "Ex.: confirmar exigências com local, cliente e responsáveis técnicos",
      ),
      field(
        "owner",
        "Responsável e prazo",
        "Quem providencia cada documento e até quando?",
        "Ex.: fornecedor apresenta; atendimento acompanha",
      ),
      field(
        "cost",
        "Custos e premissas",
        "Quais custos são estimados e quais já estão confirmados?",
        "Ex.: identificar estimativas que dependem de validação",
      ),
    ],
  },
  {
    id: "logistics",
    name: "Logística e serviços de apoio",
    output: "Viagens, materiais, transporte e serviços complementares.",
    fields: [
      field(
        "transport",
        "Pessoas e materiais",
        "Precisamos de transporte, hospedagem ou movimentação de materiais?",
        "Ex.: trajeto, quantidade e horários",
      ),
      field(
        "services",
        "Serviços complementares",
        "Há foto, vídeo, chapelaria, brindes ou outros serviços?",
        "Ex.: listar cada entrega e sua quantidade",
      ),
      field(
        "payer",
        "Contratação e pagamento",
        "Quais itens serão pagos via Adviser e quais diretamente pelo cliente?",
        "Ex.: confirmar a modalidade por fornecedor",
      ),
    ],
  },
];
export function briefingGaps(d: Demand) {
  const base: { group: string; question: string }[] = [];
  if (!d.date)
    base.push({ group: "Evento", question: "Qual é a data prevista?" });
  if (!d.guests)
    base.push({ group: "Evento", question: "Quantas pessoas participarão?" });
  if (!d.location.trim())
    base.push({
      group: "Evento",
      question: "Em qual cidade ou local acontecerá?",
    });
  if (!d.objective.trim())
    base.push({ group: "Evento", question: "Qual é o objetivo do evento?" });
  for (const f of briefingFields)
    if (!d.briefingDetails?.[f.id]?.trim())
      base.push({ group: "Planejamento", question: f.question });
  for (const b of scopeBlocks)
    if (d.scope?.[b.id]?.included)
      for (const f of b.fields)
        if (!d.scope[b.id].answers[f.id]?.trim())
          base.push({ group: b.name, question: f.question });
  return base;
}
export function scopeSummary(d: Demand, category?: string) {
  return scopeBlocks
    .filter(
      (b) => d.scope?.[b.id]?.included && (!category || b.id === category),
    )
    .map(
      (b) =>
        `${b.name}:\n${b.fields.map((f) => `${f.label}: ${d.scope?.[b.id].answers[f.id] || "A confirmar"}`).join("\n")}`,
    )
    .join("\n\n");
}
export function scopeSuggestions(text: string) {
  const patterns: Record<string, RegExp> = {
    local: /espaço|local|sal[aã]o/i,
    food: /alimenta[cç][aã]o|buffet|coquetel|jantar/i,
    tech: /som|microfone|audiovisual|ilumina[cç][aã]o|palco/i,
    decor: /tema|decora[cç][aã]o|cenografia/i,
    activation: /ativa[cç][aã]o|experi[eê]ncia interativa/i,
    music: /banda|m[uú]sica|atra[cç][aã]o musical|show/i,
    staff: /recep[cç][aã]o|seguran[cç]a|equipe de apoio/i,
    legal: /seguro|documenta[cç][aã]o|autoriza[cç][aã]o/i,
    logistics: /transporte|log[ií]stica|hospedagem|fot[oó]grafo/i,
  };
  return scopeBlocks.flatMap((b) => {
    const match = text.match(patterns[b.id]);
    return match
      ? [
          {
            block: b,
            evidence: text
              .slice(
                Math.max(0, match.index! - 28),
                match.index! + match[0].length + 48,
              )
              .replace(/\n/g, " "),
          },
        ]
      : [];
  });
}
