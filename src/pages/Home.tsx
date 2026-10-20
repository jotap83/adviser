import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Search,
  Clock3,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { useStore, go } from "../store";
import { stages, createDemand } from "../data";
import { Title, Button, Badge, Label, Empty } from "../components/UI";
import { InboxSummary } from "../components/InboxSummary";
const stageNames = Object.fromEntries(stages.map((s) => [s.id, s.label]));
const nextAction: Record<string, string> = {
  briefing: "Revisar o briefing",
  quotes: "Acompanhar fornecedores",
  compare: "Comparar cotações",
  proposal: "Preparar a proposta",
  approval: "Registrar retorno",
  handoff: "Preparar o repasse",
};
export function Home({ all = false }: { all?: boolean }) {
  const { state, setState, notify } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const rows = state.demands.filter(
    (d) =>
      (filter === "all" || d.stage === filter) &&
      `${d.reference} ${d.title} ${state.clients.find((c) => c.id === d.clientId)?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const counts = stages.map((s) => ({
    ...s,
    n: state.demands.filter((d) => d.stage === s.id).length,
  }));
  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const d = createDemand(
      String(f.get("client")),
      String(f.get("title")).trim(),
    );
    d.source = String(f.get("source"));
    setState((s) => ({ ...s, demands: [d, ...s.demands] }));
    notify("Demanda criada. Registre o primeiro contato para começar.");
    go(`/demandas/${d.id}/briefing`);
  }
  return (
    <>
      <Title
        title={all ? "Demandas" : "Atendimento"}
        sub={
          all
            ? "Do primeiro contato ao aceite, com todo o histórico reunido."
            : "Uma visão clara do que precisa avançar."
        }
        actions={
          <>
            {!all && (
              <Button onClick={() => go("/gestao")}>Visão dos sócios</Button>
            )}
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setAdding((v) => !v)}
            >
              Nova demanda
            </Button>
          </>
        }
      />
      {adding && (
        <form className="panel new-form" onSubmit={add}>
          <div className="section-heading">
            <h2>Registrar um novo contato</h2>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
          </div>
          <div className="form-grid three">
            <Label label="Nome da demanda">
              <input
                name="title"
                required
                autoFocus
                placeholder="Ex.: Encontro de lideranças"
              />
            </Label>
            <Label label="Cliente">
              <select name="client">
                {state.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Label>
            <Label label="Canal de entrada">
              <select name="source">
                <option>E-mail</option>
                <option>Ligação</option>
                <option>Outro</option>
              </select>
            </Label>
          </div>
          <Button type="submit" variant="primary">
            Criar demanda
          </Button>
        </form>
      )}
      <div className="stage-summary" aria-label="Funil de atendimento">
        {counts.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setFilter(filter === s.id ? "all" : s.id)}
            className={filter === s.id ? "active" : ""}
          >
            <span className="stage-summary-label">
              <span className="stage-dot" />
              {s.label}
            </span>
            <span className="stage-summary-count">
              {String(s.n).padStart(2, "0")}
            </span>
            {i < counts.length - 1 && (
              <ArrowRight className="stage-arrow" size={15} />
            )}
          </button>
        ))}
      </div>
      {!all && <InboxSummary />}
      <div className={`home-columns ${all ? "full" : ""}`}>
        <section className="panel demand-panel">
          <div className="section-heading">
            <h2>
              {all ? "Todas as demandas" : "Sua fila de trabalho"}{" "}
              <span className="count">{rows.length}</span>
            </h2>
            <Badge>Dados fictícios</Badge>
          </div>
          <div className="table-toolbar">
            <div className="search">
              <Search size={17} />
              <input
                aria-label="Buscar demandas"
                placeholder="Buscar código, evento ou cliente"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              aria-label="Filtrar por etapa"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Todas as etapas</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="demand-list">
            {rows.length ? (
              rows.map((d) => {
                const c = state.clients.find((c) => c.id === d.clientId);
                return (
                  <button
                    key={d.id}
                    className="demand-row"
                    onClick={() => go(`/demandas/${d.id}/${d.stage}`)}
                  >
                    <span className="client-monogram">
                      {c?.name.slice(0, 1)}
                    </span>
                    <span className="demand-main">
                      <strong>{d.title}</strong>
                      <span>
                        {d.reference} <span className="dot-sep">·</span>{" "}
                        {c?.name} <span className="dot-sep">·</span>{" "}
                        {d.guests ? `${d.guests} pessoas` : "Público a definir"}
                      </span>
                    </span>
                    <span className="demand-status">
                      <Badge
                        tone={
                          d.decision === "accepted"
                            ? "green"
                            : d.stage === "briefing"
                              ? "blue"
                              : "amber"
                        }
                      >
                        {d.decision === "accepted"
                          ? "Aprovada"
                          : stageNames[d.stage]}
                      </Badge>
                      <small>{d.owner.split(" ")[0]}</small>
                    </span>
                    <span className="row-next">
                      <span>{nextAction[d.stage]}</span>
                      <ArrowUpRight size={18} />
                    </span>
                  </button>
                );
              })
            ) : (
              <Empty
                title="Nenhuma demanda por aqui"
                text="Ajuste a busca ou crie uma nova demanda."
              />
            )}
          </div>
          <div className="panel-foot">
            {state.demands.length} demandas na demonstração{" "}
            <span>Todos os núcleos</span>
          </div>
        </section>
        {!all && (
          <aside className="activity">
            <div className="section-heading">
              <h2>Próximos passos</h2>
              <Clock3 size={18} />
            </div>
            <button
              className="activity-item"
              onClick={() => go("/demandas/d1/briefing")}
            >
              <span className="activity-circle blue">
                <FileText size={16} />
              </span>
              <span>
                <strong>Entender o briefing</strong>
                <small>Horizonte · organizar com IA e revisar</small>
                <span className="text-link">
                  Abrir demanda <ArrowRight size={13} />
                </span>
              </span>
            </button>
            <button
              className="activity-item"
              onClick={() => go("/demandas/d1/quotes")}
            >
              <span className="activity-circle amber">
                <Clock3 size={16} />
              </span>
              <span>
                <strong>Receber uma cotação</strong>
                <small>Experimente o link do fornecedor</small>
                <span className="text-link">
                  Ver solicitações <ArrowRight size={13} />
                </span>
              </span>
            </button>
            <button className="activity-item" onClick={() => go("/fluxo")}>
              <span className="activity-circle green">
                <CheckCircle2 size={16} />
              </span>
              <span>
                <strong>Conhecer o processo</strong>
                <small>Início, fim e próximas etapas</small>
                <span className="text-link">
                  Ver fluxo completo <ArrowRight size={13} />
                </span>
              </span>
            </button>
            <div className="quiet-note">
              <strong>O atendimento continua no controle.</strong>
              <p>A IA sugere. A equipe revisa, negocia e decide.</p>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
