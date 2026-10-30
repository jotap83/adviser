import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { useStore, go } from "../store";
import { demoPerson, inScope } from "../organization";
import { eventPhase } from "../event-lifecycle";
import type { AppState, Demand } from "../types";
import { withLifecycleExample, LIFECYCLE_EVENT } from "../lifecycle-example";
import { Title, Button, Empty, Label } from "../components/UI";
import { InboxSummary } from "../components/InboxSummary";

export function attendanceNextAction(state: AppState, d: Demand) {
  const phase = eventPhase(state, d);
  if (phase === "post") return { tab: "post", label: "Preparar fechamento" };
  if (phase === "production")
    return { tab: "production", label: "Acompanhar produção" };
  if (phase === "contract")
    return { tab: "contracts", label: "Revisar contrato" };
  if (phase === "closed" || phase === "declined")
    return { tab: "overview", label: "Consultar histórico" };
  if (d.decision === "changes")
    return { tab: "proposal", label: "Revisar proposta" };
  if (phase === "negotiation")
    return { tab: "approval", label: "Registrar retorno do cliente" };
  const actions = {
    briefing: d.briefingValid
      ? { tab: "quotes", label: "Solicitar cotações" }
      : { tab: "briefing", label: "Completar briefing" },
    quotes: { tab: "quotes", label: "Acompanhar cotações" },
    compare: { tab: "compare", label: "Comparar cotações" },
    proposal: { tab: "proposal", label: "Preparar proposta" },
    approval: { tab: "approval", label: "Registrar retorno do cliente" },
    handoff: { tab: "contracts", label: "Preparar repasse" },
  };
  return actions[d.stage];
}

export function AtendimentoHome() {
  const { state, setState } = useStore();
  const [scope, setScope] = useState("mine");
  const person = demoPerson(state);
  const events = state.demands.filter(
    (d) =>
      !["closed", "declined"].includes(eventPhase(state, d)) &&
      inScope(state, d, scope),
  );
  return (
    <div className="service-home">
      <Title
        title="Atendimento"
        sub="Comece pelas mensagens recebidas ou continue um evento em andamento."
        actions={
          <Button icon={Plus} onClick={() => go("/novo-evento")}>
            Novo evento
          </Button>
        }
      />
      <InboxSummary />
      <section
        className="panel service-events"
        aria-label="Continuar atendimento"
      >
        <div className="section-heading">
          <h2>Continuar um evento</h2>
          <Label label="Mostrar eventos">
            <select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="mine">Meus eventos</option>
              <option value="all">Todos os eventos</option>
            </select>
          </Label>
        </div>
        <p className="muted">
          {scope === "mine"
            ? `Responsável: ${person?.name || "não definido"}.`
            : "Eventos de toda a equipe."}{" "}
          Abra um evento para retomar o trabalho.
        </p>
        <div className="service-event-list">
          {events.slice(0, 6).map((d) => {
            const next = attendanceNextAction(state, d);
            return (
              <a key={d.id} href={`#/eventos/${d.id}/${next.tab}`}>
                <span>
                  <strong>{d.title}</strong>
                  <small>
                    {state.clients.find((c) => c.id === d.clientId)?.name} ·{" "}
                    {d.reference}
                  </small>
                </span>
                <span className="service-event-next">
                  {next.label}
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </a>
            );
          })}
        </div>
        {!events.length && (
          <Empty
            title="Nenhum evento em andamento nesta visão"
            text="Você pode consultar a equipe ou começar um novo evento."
            action={
              <Button
                onClick={() =>
                  scope === "mine" ? setScope("all") : go("/novo-evento")
                }
              >
                {scope === "mine" ? "Ver eventos da equipe" : "Novo evento"}
              </Button>
            }
          />
        )}
        <a className="service-text-link" href="#/eventos">
          Ver carteira completa
          {events.length > 6 ? ` · ${events.length} nesta visão` : ""}
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </section>
      <details className="service-disclosure">
        <summary>Conhecer o protótipo</summary>
        <p>Exemplos fictícios para explorar as etapas e a IA simulada.</p>
        <div className="actions">
          <Button
            onClick={() => {
              setState((s) => withLifecycleExample(s));
              go(`/eventos/${LIFECYCLE_EVENT}/overview`);
            }}
          >
            Explorar ciclo completo
          </Button>
          <Button onClick={() => go("/fluxo")}>Ver fluxo do sistema</Button>
        </div>
      </details>
    </div>
  );
}
