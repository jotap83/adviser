import type { InboxEmail, MessageClassification, MessageKind } from "./types";
export const messageKinds: Record<MessageKind, string> = {
  new: "Novo evento",
  update: "Complemento ou alteração",
  quote: "Cotação de fornecedor",
  approval: "Retorno de aprovação",
  billing: "Cobrança / financeiro",
  other: "Revisar manualmente",
};
/** Deterministic demonstration; no external model, confidence percentage or automatic decision. */
export function classifyMessage(email: InboxEmail): MessageClassification {
  const text = `${email.subject}\n${email.text}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const rules: [MessageKind, RegExp, string][] = [
    [
      "billing",
      /boleto|nota fiscal|fatura|cobranca|vencimento/,
      "Há termos de cobrança no assunto ou no texto.",
    ],
    [
      "approval",
      /aprovad|aprovamos|aceitamos|de acordo com a proposta/,
      "A mensagem menciona aprovação. A evidência e a versão ainda precisam ser conferidas.",
    ],
    [
      "quote",
      /cotacao|orcamento em anexo|proposta comercial/,
      "Há referência a uma cotação; confirme se o remetente é fornecedor.",
    ],
    [
      "update",
      /alterar|alteracao|ajuste|complement|nova data/,
      "Há indicação de alteração ou complemento do pedido.",
    ],
    [
      "new",
      /primeiro contato|novo evento|organizar|gostaria|gostariamos|planejando/,
      "O texto descreve um pedido inicial; verifique se já há atendimento para ele.",
    ],
  ];
  const matched = rules.find(([, rule]) => rule.test(text));
  return {
    kind: matched?.[0] || "other",
    urgent: /urgente|hoje|amanha/.test(text),
    reason:
      matched?.[2] ||
      "Não há indício suficiente para classificar com segurança neste exemplo.",
    reviewed: false,
  };
}
