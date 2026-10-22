import type { AppState } from "./types";
import { money } from "./domain.mjs";

// Generated only after an explicit example action. Never an actual inbox message.
export function billingExample(
  state: AppState,
  projectId: string,
  channel: "gmail" | "whatsapp",
) {
  const project = state.productionProjects?.find((p) => p.id === projectId);
  const entry = state.financeEntries?.find(
    (e) => e.projectId === projectId && e.direction === "pay",
  );
  if (!project || !entry) return undefined;
  return {
    origin:
      channel === "gmail"
        ? "Gmail · recebimento simulado"
        : "WhatsApp · recebimento simulado",
    sender:
      channel === "gmail"
        ? "Fornecedor de exemplo <cobrancas@fornecedor.example.com>"
        : "Fornecedor de exemplo · contato fictício",
    title: `Cobrança de ${entry.description}`,
    text: `Olá, equipe Adviser!\n\nSegue a cobrança do serviço para ${project.title}.\n\nDescrição: ${entry.description}\nValor: ${money(entry.amount + 450)}\nVencimento: ${entry.due}\n\nIncluímos um adicional de R$ 450,00, sujeito à confirmação de vocês.\n\nMensagem fictícia para apresentação.`,
    entryId: entry.id,
  };
}
