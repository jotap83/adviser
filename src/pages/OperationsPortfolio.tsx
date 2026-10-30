import { projectMatchesSearch, taskMatchesSearch } from "../portfolio-search";
import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { useStore, go } from "../store";
import { Button, Badge, Empty, Label, Title } from "../components/UI";
import {
  isTaskLate,
  projectFromHandoff,
  taskStatuses,
} from "../production-model";
export function OperationsPortfolio() {
  const { state, setState, notify } = useStore();
  const [query, setQuery] = useState(""),
    [owner, setOwner] = useState(""),
    [view, setView] = useState("projects"),
    [attention, setAttention] = useState("");
  const projects = state.productionProjects || [];
  const ready = state.demands.filter(
    (d) =>
      d.handoff &&
      d.decision === "accepted" &&
      d.versions.some((v) => v.id === d.acceptedVersion) &&
      !projects.some((p) => p.source?.demandId === d.id),
  );
  const tasks = projects.flatMap((p) =>
    p.tasks.map((t) => ({ ...t, project: p })),
  );
  const rows = projects.filter(
    (p) =>
      projectMatchesSearch(p, query) &&
      (!owner || p.owner === owner || p.tasks.some((t) => t.owner === owner)),
  );
  const visibleTasks = tasks.filter(
    (t) =>
      taskMatchesSearch(t.project, t, query) &&
      (!owner || t.owner === owner) &&
      (!attention ||
        (attention === "late" && isTaskLate(t)) ||
        (attention === "blocked" && !!t.blockedReason && t.status !== "done") ||
        (attention === "open" && t.status !== "done")),
  );
  const receive = (id: string) => {
    const d = state.demands.find((d) => d.id === id),
      p = d && projectFromHandoff(d, state);
    if (!p) return;
    setState((s) =>
      s.productionProjects?.some((x) => x.source?.demandId === id)
        ? s
        : { ...s, productionProjects: [...(s.productionProjects || []), p] },
    );
    go(`/operacoes/${p.id}`);
    notify("Evento recebido da proposta aprovada. Revise o plano operacional.");
  };
  return (
    <>
      <Title
        title="Operações"
        sub="Uma visão de todos os eventos: equipe, execução, prazos e pendências. Abra um evento para trabalhar no seu quadro."
        actions={
          <Button onClick={() => go("/gestao")}>Painel Gerencial</Button>
        }
      />
      <div className="global-summary">
        <span>
          <strong>{projects.length}</strong> eventos em operação
        </span>
        <span>
          <strong>{tasks.filter((t) => t.status !== "done").length}</strong>{" "}
          tarefas abertas
        </span>
        <span>
          <strong>{tasks.filter(isTaskLate).length}</strong> atrasadas
        </span>
        <span>
          <strong>
            {tasks.filter((t) => t.status !== "done" && t.blockedReason).length}
          </strong>{" "}
          bloqueadas
        </span>
      </div>
      <div className="workspace-filter-row">
        <Label label="Visão de operações">
          <select value={view} onChange={(e) => setView(e.target.value)}>
            <option value="projects">Todos os eventos</option>
            <option value="tasks">Tarefas entre eventos</option>
          </select>
        </Label>
        <Label label="Buscar em operações">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Evento, cliente ou tarefa"
          />
        </Label>
        <Label label="Responsável em operações">
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">Toda a equipe</option>
            {[
              ...new Set([
                ...projects.map((p) => p.owner),
                ...tasks.map((t) => t.owner),
              ]),
            ]
              .filter(Boolean)
              .map((n) => (
                <option key={n}>{n}</option>
              ))}
          </select>
        </Label>
        {view === "tasks" && (
          <Label label="Pendência operacional">
            <select
              value={attention}
              onChange={(e) => setAttention(e.target.value)}
            >
              <option value="">Todas as tarefas</option>
              <option value="open">Em aberto</option>
              <option value="late">Atrasadas</option>
              <option value="blocked">Bloqueadas</option>
            </select>
          </Label>
        )}
      </div>
      <section className="panel portfolio-panel">
        <div className="section-heading">
          <h2>
            {view === "projects" ? "Carteira de eventos" : "Fila operacional"}
          </h2>
          <Badge>
            {view === "projects" ? rows.length : visibleTasks.length} registros
          </Badge>
        </div>
        {view === "projects"
          ? rows.map((p) => {
              const pending = p.tasks.filter((t) => t.status !== "done");
              return (
                <article className="portfolio-event" key={p.id}>
                  <div>
                    <h3>{p.title}</h3>
                    <p>
                      {p.client} ·{" "}
                      {p.date
                        ? p.date.split("-").reverse().join("/")
                        : "Data a definir"}{" "}
                      · {p.owner || "A distribuir"}
                    </p>
                    <p>
                      {pending.length} de {p.tasks.length} tarefas abertas ·{" "}
                      {pending.filter((t) => t.blockedReason).length} bloqueadas
                    </p>
                  </div>
                  <div className="actions">
                    <Button onClick={() => go(`/financeiro/${p.id}`)}>
                      Financeiro do evento
                    </Button>
                    <Button
                      icon={ArrowRight}
                      onClick={() => go(`/operacoes/${p.id}`)}
                    >
                      Abrir operação
                    </Button>
                  </div>
                </article>
              );
            })
          : visibleTasks.map((t) => (
              <article
                className="portfolio-event"
                key={`${t.project.id}-${t.id}`}
              >
                <div>
                  <h3>{t.title}</h3>
                  <p>
                    {t.project.title} · {t.owner || "A distribuir"} ·{" "}
                    {t.due ? t.due.split("-").reverse().join("/") : "Sem prazo"}
                  </p>
                  <Badge
                    tone={
                      isTaskLate(t) ? "red" : t.blockedReason ? "amber" : "gray"
                    }
                  >
                    {taskStatuses.find((x) => x.id === t.status)?.label}
                    {isTaskLate(t) ? " · atrasada" : ""}
                    {t.blockedReason ? ` · ${t.blockedReason}` : ""}
                  </Badge>
                </div>
                <Button onClick={() => go(`/operacoes/${t.project.id}`)}>
                  Abrir quadro do evento
                </Button>
              </article>
            ))}
        {(view === "projects" ? !rows.length : !visibleTasks.length) && (
          <Empty
            title="Nenhum registro neste recorte"
            text="Ajuste os filtros ou receba abaixo um evento com o repasse concluído."
          />
        )}
      </section>
      <section className="panel handoff-queue">
        <div className="section-heading">
          <div>
            <h2>Receber do atendimento</h2>
            <p>
              Somente propostas aceitas com repasse preparado. A versão aprovada
              fica preservada.
            </p>
          </div>
          <Badge>{ready.length} disponíveis</Badge>
        </div>
        {ready.map((d) => (
          <div className="portfolio-event" key={d.id}>
            <div>
              <h3>{d.title}</h3>
              <p>
                {d.reference} · {d.owner || "A distribuir"}
              </p>
            </div>
            <div className="actions">
              <Button onClick={() => go(`/demandas/${d.id}/handoff`)}>
                Conferir repasse
              </Button>
              <Button icon={Plus} onClick={() => receive(d.id)}>
                Receber evento
              </Button>
            </div>
          </div>
        ))}
        {!ready.length && (
          <p className="muted">
            Nenhum novo repasse disponível. Conclua o aceite e prepare o repasse
            no Atendimento.
          </p>
        )}
      </section>
    </>
  );
}
