import { uid } from "./data";
import type { AppState, Demand, InboxEmail } from "./types";

const normalized = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const emailAddress = (text: string) =>
  text.match(/[\w.+-]+@[\w.-]+/i)?.[0].toLowerCase() || "";
const domain = (text: string) => emailAddress(text).split("@")[1] || "";
const mailContent = (email: InboxEmail) =>
  `${email.subject}\n${email.text}\n${email.attachments.map((a) => a.text).join("\n")}`;
const codes = (email: InboxEmail) => [
  ...new Set(
    mailContent(email)
      .toUpperCase()
      .match(/\bADV-\d{4}-\d{4,}\b/g) || [],
  ),
];
const actor = "Marina Costa";
export const messageChannel = (message: InboxEmail) =>
  message.channel || "email";
export const channelName = (message: InboxEmail) =>
  messageChannel(message) === "whatsapp" ? "WhatsApp" : "Gmail";
export const phoneNumber = (value: string) => value.replace(/\D/g, "");

export type MailCandidate = {
  demandId: string;
  score: number;
  reasons: string[];
  cautions: string[];
};
export function directAssociation(
  email: InboxEmail,
  state: AppState,
): { demandId?: string; method?: "reference" | "thread"; warning?: string } {
  const references = codes(email);
  const targets = [
    ...new Set(
      (state.inbox || [])
        .filter(
          (m) =>
            m.id !== email.id &&
            m.status === "linked" &&
            messageChannel(m) === messageChannel(email) &&
            m.account === email.account &&
            (messageChannel(email) === "whatsapp"
              ? Boolean(email.replyToMessageId) &&
                (m.id === email.replyToMessageId ||
                  `inbox-${m.id}` === email.replyToMessageId) &&
                phoneNumber(m.from) === phoneNumber(email.from)
              : Boolean(email.threadId) && m.threadId === email.threadId) &&
            state.demands.some((d) => d.id === m.demandId),
        )
        .map((m) => m.demandId!),
    ),
  ];
  if (references.length > 1)
    return {
      warning:
        "A mensagem menciona mais de um código. Confira qual atendimento recebe esta mensagem.",
    };
  if (targets.length > 1)
    return {
      warning:
        "Esta conversa está associada a mais de um atendimento. A mensagem precisa de revisão.",
    };
  if (references.length === 1) {
    const target = state.demands.find((d) => d.reference === references[0]);
    if (!target)
      return {
        warning:
          "O código mencionado não foi encontrado. Procure o atendimento ou crie uma nova demanda.",
      };
    if (targets[0] && targets[0] !== target.id)
      return {
        warning:
          "O código e o histórico desta conversa apontam para atendimentos diferentes.",
      };
    return { demandId: target.id, method: "reference" };
  }
  return targets.length === 1 ? { demandId: targets[0], method: "thread" } : {};
}

const dates = (text: string) =>
  [
    ...text.matchAll(
      /\b(\d{2})\/(\d{2})\/(20\d{2})\b|\b(20\d{2}-\d{2}-\d{2})\b/g,
    ),
  ].map((m) => m[4] || `${m[3]}-${m[2]}-${m[1]}`);
const words = (text: string) => normalized(text).match(/[a-z0-9]{4,}/g) || [];
const common = new Set([
  "para",
  "sobre",
  "evento",
  "eventos",
  "pessoas",
  "equipe",
  "equipes",
  "adviser",
  "confirmar",
  "proposta",
  "propostas",
  "cliente",
  "referencia",
  "atendimento",
  "encontro",
  "precisamos",
  "local",
  "data",
]);

// Deliberately deterministic prototype adapter. No LLM or external request.
export function suggestMailCandidates(
  email: InboxEmail,
  state: AppState,
): MailCandidate[] {
  if (state.aiMode === "offline") return [];
  const text = normalized(mailContent(email));
  const incomingDates = dates(mailContent(email));
  const mentions = codes(email);
  const sender = emailAddress(email.from);
  const incomingWords = new Set(words(text));
  const personalDomains = new Set([
    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "yahoo.com",
    "yahoo.com.br",
    "icloud.com",
  ]);
  return state.demands
    .map((d): MailCandidate => {
      const client = state.clients.find((c) => c.id === d.clientId);
      const reasons: string[] = [];
      const cautions: string[] = [];
      let score = 0;
      const contacts = [
        client?.email || "",
        client?.phone || "",
        ...(d.conversation || []).map((m) => m.contact),
      ];
      if (
        messageChannel(email) === "whatsapp" &&
        phoneNumber(email.from).length >= 10 &&
        contacts.some((c) => phoneNumber(c) === phoneNumber(email.from))
      ) {
        score += 3;
        reasons.push("Telefone presente no cadastro ou no histórico.");
        cautions.push(
          "O mesmo contato pode tratar de vários eventos. Confirme o vínculo.",
        );
      } else if (
        messageChannel(email) === "email" &&
        contacts.some((c) => emailAddress(c) === sender && sender)
      ) {
        score += 3;
        reasons.push(
          "Remetente já cadastrado no cliente ou presente no histórico.",
        );
      } else if (
        messageChannel(email) === "email" &&
        domain(client?.email || "") &&
        !personalDomains.has(domain(client!.email)) &&
        domain(email.from) === domain(client!.email)
      ) {
        score += 2;
        reasons.push("Mesmo domínio de e-mail do cliente.");
        cautions.push(
          "Este remetente ainda não aparece no histórico do atendimento.",
        );
      }
      if (client?.name && text.includes(normalized(client.name))) {
        score += 2;
        reasons.push(`A mensagem menciona ${client.name}.`);
      }
      if (d.reference && mentions.includes(d.reference)) {
        score += 8;
        reasons.push(`Código ${d.reference} presente na mensagem.`);
      }
      if (d.title.length > 5 && text.includes(normalized(d.title))) {
        score += 6;
        reasons.push("Nome do evento coincide com o atendimento.");
      }
      const knownDates = d.date ? [d.date] : dates(d.message);
      if (knownDates.some((day) => incomingDates.includes(day))) {
        score += 3;
        reasons.push("Data do evento coincide com o briefing.");
      } else if (incomingDates.length && knownDates.length)
        cautions.push(
          "Há uma data diferente da registrada; pode ser uma alteração ou outro evento.",
        );
      if (d.location.length > 4 && text.includes(normalized(d.location))) {
        score += 2;
        reasons.push("Local informado coincide com o briefing.");
      }
      const previous = words(
        `${d.objective} ${d.questions} ${d.message} ${(d.conversation || []).map((m) => m.text).join(" ")}`,
      ).filter((w) => !common.has(w));
      const shared = [...new Set(previous)].filter((w) => incomingWords.has(w));
      // Common language alone must not nominate an unrelated client's event.
      if (score > 0 && shared.length >= 4) {
        score += 2;
        reasons.push(
          `Termos também presentes no histórico: ${shared.slice(0, 4).join(", ")}.`,
        );
      }
      if (d.handoff || d.decision === "declined")
        cautions.push(
          "Atendimento encerrado ou recusado. Confira se é uma retomada.",
        );
      if (d.decision === "accepted")
        cautions.push(
          "A proposta já foi aceita. O vínculo não altera o aceite registrado.",
        );
      return { demandId: d.id, score, reasons, cautions };
    })
    .filter((c) => c.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function linkMail(
  state: AppState,
  emailId: string,
  demandId: string,
  method: NonNullable<InboxEmail["method"]>,
  at = new Date().toISOString(),
): AppState {
  const email = state.inbox?.find((m) => m.id === emailId);
  const demand = state.demands.find((d) => d.id === demandId);
  if (
    !email ||
    !demand ||
    (email.status === "linked" && email.demandId === demandId)
  )
    return state;
  const messageId = `inbox-${email.id}`;
  const automatic = method === "reference" || method === "thread";
  const by = automatic ? "Sistema · simulação" : actor;
  const action =
    email.status === "linked"
      ? "Vínculo corrigido"
      : automatic
        ? "Associação automática simulada"
        : "Vínculo confirmado";
  return {
    ...state,
    inbox: state.inbox!.map((m) =>
      m.id === emailId
        ? {
            ...m,
            status: "linked",
            demandId,
            method,
            history: [...m.history, { at, actor: by, action, demandId }],
          }
        : m,
    ),
    demands: state.demands.map((d) => {
      const hasMessage = d.conversation?.some(
        (m) => m.inboxEmailId === email.id,
      );
      if (d.id !== demandId && !hasMessage) return d;
      const conversation = (d.conversation || []).filter(
        (m) => m.inboxEmailId !== email.id,
      );
      const attachments = (d.attachments || []).filter(
        (a) => a.messageId !== messageId,
      );
      if (d.id === demandId) {
        conversation.push({
          id: messageId,
          inboxEmailId: email.id,
          direction: "in",
          text: email.text,
          subject: email.subject,
          at: email.receivedAt,
          contact: email.from,
          channel: `${channelName(email)} · simulado`,
          delivery: "simulated",
          replyToMessageId: email.replyToMessageId,
        });
        attachments.push(
          ...email.attachments.map((a, i) => ({
            ...a,
            id: `${messageId}-a${i}`,
            size: 0,
            included: true,
            at: email.receivedAt,
            messageId,
            status: "ready" as const,
            detail:
              "Texto fictício de anexo para demonstrar o recebimento. Nenhum arquivo foi recebido de um serviço externo.",
          })),
        );
      }
      return {
        ...d,
        conversation: conversation.sort((a, b) => a.at.localeCompare(b.at)),
        attachments,
        updatedAt: at,
        history: [
          {
            at: new Date(at).toLocaleString("pt-BR"),
            text:
              d.id === demandId
                ? `${action} por ${by}: “${email.subject}”. Conteúdo aguardando revisão.`
                : `Vínculo da mensagem “${email.subject}” corrigido por ${by}. Os campos preenchidos anteriormente foram preservados; confira eventuais ajustes.`,
          },
          ...d.history,
        ],
      };
    }),
  };
}

export function changeMailStatus(
  state: AppState,
  emailId: string,
  status: "pending" | "ignored",
  at = new Date().toISOString(),
): AppState {
  const email = state.inbox?.find((m) => m.id === emailId);
  if (!email || email.status === "linked") return state;
  return {
    ...state,
    inbox: state.inbox!.map((m) =>
      m.id === emailId
        ? {
            ...m,
            status,
            history: [
              ...m.history,
              {
                at,
                actor,
                action:
                  status === "ignored"
                    ? "Ignorado nesta fila"
                    : "Devolvido para identificação",
              },
            ],
          }
        : m,
    ),
  };
}

export function receiveMail(state: AppState, emails: InboxEmail[]): AppState {
  let next = { ...state, inbox: [...(state.inbox || [])] };
  for (const email of emails) {
    if (next.inbox.some((m) => m.id === email.id)) continue;
    next.inbox.push(email);
    const match = directAssociation(email, next);
    if (match.demandId && match.method)
      next = linkMail(
        next,
        email.id,
        match.demandId,
        match.method,
      ) as typeof next;
  }
  return next;
}

export function withInboxDemo(state: AppState): AppState {
  if (state.inboxDemo || state.inbox) return state;
  const main = state.demands.find((d) => d.id === "d1");
  const other = state.demands.find((d) => d.id === "d2");
  const at = (minutes: number) =>
    new Date(Date.now() - minutes * 60000).toISOString();
  const email = (
    id: string,
    subject: string,
    from: string,
    text: string,
    minutes: number,
  ): InboxEmail => ({
    id,
    account: "marina@adviser.example.com",
    threadId: `thread-${id}`,
    from,
    to: ["marina@adviser.example.com"],
    subject,
    text,
    receivedAt: at(minutes),
    attachments: [],
    status: "pending",
    history: [],
  });
  const messages = [
    email(
      "mail-horizonte",
      "Atualização do Encontro Horizonte",
      "financeiro@horizonte.example.com",
      "Olá, Marina!\n\nSobre o Encontro Horizonte, precisamos atualizar a quantidade de participantes.\nPúblico: 250 pessoas\n\nPodemos manter a mesma proposta de alimentação? O anexo traz os pontos que precisamos revisar.\n\nObrigada,\nBia · Horizonte",
      18,
    ),
    email(
      "mail-ambiguous",
      "Retorno sobre os nossos eventos",
      "luna@aurora.example.com",
      "Olá! A diretoria da Aurora quer conversar sobre o orçamento dos nossos eventos. Podemos rever a ambientação? Ainda não recebemos a data da reunião.\n\nLuna",
      40,
    ),
    email(
      "mail-new",
      "Pedido de evento para a equipe",
      "carolina@vereda.example.com",
      "Olá, Adviser! Somos da empresa Vereda e gostaríamos de conversar sobre uma confraternização. Ainda estamos definindo a data e o local. Podemos agendar uma conversa?\n\nCarolina",
      65,
    ),
  ];
  messages[0].attachments = [
    {
      name: "ajustes-do-encontro.pdf",
      kind: "pdf",
      text: "Evento: Encontro Horizonte\nPúblico: 250 pessoas\nPendências: confirmar alimentação para o público atualizado e disponibilidade de transporte.",
    },
  ];
  if (main && other) {
    messages.push(
      email(
        "mail-conflict",
        "Encaminhamento: qual é a proposta atual?",
        "leo@vertice.example.com",
        `Olá, recebi referências diferentes no encaminhamento: ${main.reference} e ${other.reference}. Poderiam conferir a qual evento pertence este material antes de atualizar?`,
        90,
      ),
    );
    messages.push(
      email(
        "mail-identified",
        `[${other.reference}] Confirmação de recebimento`,
        "leo@vertice.example.com",
        "Olá! Recebemos o material e vamos conferir com a equipe. Voltamos com os ajustes.\n\nLeo",
        120,
      ),
    );
  }
  return receiveMail({ ...state, inboxDemo: true, inbox: [] }, messages);
}

export function demoFollowUp(state: AppState): InboxEmail | undefined {
  const prior = state.inbox?.find(
    (m) =>
      m.status === "linked" &&
      m.demandId &&
      state.demands.some((d) => d.id === m.demandId),
  );
  if (!prior) return;
  return {
    ...prior,
    id: uid(),
    subject: "Re: Retorno da equipe",
    text: "Olá, recebemos o retorno. Vamos revisar o material e confirmar os pontos pendentes.\n\nEquipe do cliente",
    attachments: [],
    receivedAt: new Date().toISOString(),
    status: "pending",
    demandId: undefined,
    method: undefined,
    history: [],
  };
}
