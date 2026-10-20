import { ArrowRight, Mail } from "lucide-react";
import { useStore, go } from "../store";
import { Badge, Button } from "./UI";

export function InboxSummary() {
  const { state } = useStore();
  const pending = (state.inbox || []).filter((m) => m.status === "pending");
  const linked = (state.inbox || []).filter(
    (m) => m.status === "linked",
  ).length;
  return (
    <section className="inbox-summary" aria-label="Triagem dos e-mails">
      <Mail size={24} aria-hidden="true" />
      <div className="inbox-summary-content">
        <h2>
          E-mails para identificar{" "}
          <span className="count">{pending.length}</span>
        </h2>
        <p>
          {pending.length
            ? "Confira os atendimentos sugeridos antes de associar cada mensagem."
            : "Nenhuma mensagem aguardando associação. A fila está em dia."}
        </p>
        <span className="inbox-summary-meta">
          <Badge>Simulação</Badge> {linked}{" "}
          {linked === 1 ? "mensagem associada" : "mensagens associadas"} · Gmail
          ainda não conectado
        </span>
      </div>
      <Button icon={ArrowRight} onClick={() => go("/emails")}>
        {pending.length ? "Revisar e-mails" : "Ver e-mails"}
      </Button>
    </section>
  );
}
