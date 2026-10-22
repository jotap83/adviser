import { ArrowRight, Mail } from "lucide-react";
import { useStore, go } from "../store";
import { AIBadge, Badge, Button } from "./UI";

export function InboxSummary() {
  const { state } = useStore();
  const pending = (state.inbox || []).filter((m) => m.status === "pending");
  const linked = (state.inbox || []).filter(
    (m) => m.status === "linked",
  ).length;
  return (
    <section className="inbox-summary" aria-label="Central de atendimento">
      <Mail size={24} aria-hidden="true" />
      <div className="inbox-summary-content">
        <h2>
          Mensagens para identificar{" "}
          <span className="count">{pending.length}</span>
        </h2>
        <p>
          {pending.length
            ? "Confira os atendimentos sugeridos antes de associar cada mensagem."
            : "Nenhuma mensagem aguardando associação. A fila está em dia."}
        </p>
        <span className="inbox-summary-meta">
          <Badge tone="blue">MVP</Badge> <AIBadge /> {linked}{" "}
          {linked === 1 ? "mensagem associada" : "mensagens associadas"} · Gmail
          e WhatsApp simulados
        </span>
      </div>
      <Button icon={ArrowRight} onClick={() => go("/mensagens")}>
        Abrir central
      </Button>
    </section>
  );
}
