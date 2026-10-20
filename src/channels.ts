import type { AppState, Demand, InboxEmail } from "./types";
import { receiveMail, phoneNumber, messageChannel } from "./inbox-model";

export type ReplyChannel = "Gmail" | "WhatsApp" | "Registro manual";
export const demoBusinessPhone = "+55 (21) 90000-0000";

export function incomingExample(
  state: AppState,
  channel: "email" | "whatsapp",
  scenario = "reference",
): InboxEmail {
  const d = state.demands.find((item) => item.id === "d1") || state.demands[0];
  const client = state.clients.find((c) => c.id === d?.clientId);
  const reference =
    scenario === "reference" && d?.reference
      ? `Referência: ${d.reference}\n\n`
      : "";
  return {
    id: crypto.randomUUID(),
    channel,
    account:
      channel === "email" ? "marina@adviser.example.com" : demoBusinessPhone,
    threadId: `conversation-${crypto.randomUUID()}`,
    from:
      channel === "email"
        ? client?.email || "ana@horizonte.example.com"
        : client?.phone || "+55 (21) 90000-0101",
    to: [
      channel === "email" ? "marina@adviser.example.com" : demoBusinessPhone,
    ],
    subject:
      scenario === "reference"
        ? `Atualização · ${d?.title || "Novo evento"}`
        : "Dúvida sobre os próximos eventos",
    text:
      scenario === "reference"
        ? `${reference}Olá! Sobre ${d?.title || "nosso evento"}, o público passou para 250 pessoas. Precisamos de um espaço no Rio de Janeiro, recepção às 8h e encerramento às 18h. Incluir duas opções vegetarianas no almoço, um palco, dois microfones sem fio e transporte de ida e volta. O orçamento de referência é R$ 150.000. A data ainda precisa ser confirmada. Segue o documento atualizado. Podem revisar o planejamento?`
        : `Olá! Aqui é ${client?.contact || "Ana"}, da ${client?.name || "Horizonte"}. Sobre nossos próximos eventos, podemos rever a alimentação e o transporte? Ainda preciso confirmar a qual data a diretoria se refere.`,
    receivedAt: new Date().toISOString(),
    attachments:
      scenario === "reference"
        ? [
            {
              name: "briefing-atualizado.pdf",
              kind: "pdf",
              text: "Público: 250 pessoas\nLocal: Rio de Janeiro\nInvestimento: R$ 150.000\nRecepção às 8h; encerramento às 18h.\nAlmoço com duas opções vegetarianas. Palco, dois microfones sem fio e transporte de ida e volta. Data a confirmar.",
            },
          ]
        : [],
    status: "pending",
    history: [],
  };
}

export function withChannelsDemo(state: AppState): AppState {
  if (state.channelsDemo) return state;
  // Add examples once, without resetting the user's existing local work.
  const clients = state.clients.map((c) =>
    c.id === "c1" && !c.phone ? { ...c, phone: "+55 (21) 90000-0101" } : c,
  );
  const next = { ...state, clients, channelsDemo: true };
  if (!next.demands.some((d) => d.id === "d1")) return next;
  const identified = incomingExample(next, "whatsapp");
  identified.id = "wa-horizonte";
  identified.receivedAt = new Date(Date.now() - 45 * 60000).toISOString();
  const ambiguous = incomingExample(next, "whatsapp", "ambiguous");
  ambiguous.id = "wa-ambiguous";
  ambiguous.threadId = identified.threadId;
  ambiguous.receivedAt = new Date(Date.now() - 12 * 60000).toISOString();
  return receiveMail(next, [identified, ambiguous]);
}

export function whatsappWindowOpen(
  state: AppState,
  contact: string,
  now = Date.now(),
) {
  const phone = phoneNumber(contact);
  if (phone.length < 10) return false;
  const incoming = (state.inbox || []).filter(
    (m) => messageChannel(m) === "whatsapp" && phoneNumber(m.from) === phone,
  );
  return incoming.some((m) => {
    const age = now - Date.parse(m.receivedAt);
    return age >= 0 && age < 24 * 60 * 60 * 1000;
  });
}

export function acknowledgement(d: Demand, contact: string) {
  return `Olá${contact && !contact.includes("@") && !/\d/.test(contact) ? `, ${contact}` : ""}!\n\nRecebemos suas informações sobre ${d.title}. Nossa equipe está revisando os detalhes.\n\n${d.questions ? `Para avançar, precisamos confirmar:\n${d.questions}\n\n` : "Você pode confirmar a data prevista e os pontos ainda pendentes do briefing?\n\n"}${d.owner} · Adviser\nReferência: ${d.reference}`;
}

export function contactIsValid(channel: ReplyChannel, contact: string) {
  if (channel === "WhatsApp")
    return (
      phoneNumber(contact).length >= 10 && phoneNumber(contact).length <= 15
    );
  if (channel === "Gmail")
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim());
  return Boolean(contact.trim());
}
