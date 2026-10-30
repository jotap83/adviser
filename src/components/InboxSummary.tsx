import { ArrowRight } from "lucide-react";
import { useStore, go } from "../store";
import { Button } from "./UI";

export function InboxSummary() {
  const { state } = useStore();
  const pending = (state.inbox || []).filter((m) => m.status === "pending");
  return (
    <section className="inbox-summary" aria-label="Central de atendimento">
      <div className="inbox-summary-content">
        <h2>
          {pending.length ? "Mensagens para atender" : "Mensagens em dia"}{" "}
          <span className="count">{pending.length}</span>
        </h2>
        <p>
          {pending.length
            ? "Revise a sugestão da IA e escolha se o pedido inicia um evento ou pertence a um existente."
            : "Não há mensagens aguardando identificação. Continue um evento abaixo ou consulte o histórico."}
        </p>
      </div>
      <Button
        variant="primary"
        icon={ArrowRight}
        onClick={() => go("/mensagens")}
      >
        {pending.length ? "Atender mensagens" : "Ver mensagens"}
      </Button>
    </section>
  );
}
