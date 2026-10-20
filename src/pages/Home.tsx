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
import { stages, createDemand, uid } from "../data";
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
export function Home({
  all = false,
  newDemand = false,
}: {
  all?: boolean;
  newDemand?: boolean;
}) {
  const { state, setState, notify } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(newDemand);
  const [newClient, setNewClient] = useState(state.clients.length === 0);
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
    const title = String(f.get("title") || "").trim();
    if (!title) return;
    const clientId = newClient ? uid() : String(f.get("client"));
    if (
      newClient &&
      (!String(f.get("company") || "").trim() ||
        !String(f.get("person") || "").trim())
    )
      return;
    const d = createDemand(clientId, title);
    d.source = String(f.get("source"));
    d.message = String(f.get("message") || "").trim();
    d.owner = String(f.get("owner") || "Marina Costa");
    setState((s) => ({
      ...s,
      demands: [d, ...s.demands],
      clients: newClient
        ? [
            ...s.clients,
            {
              id: clientId,
              name: String(f.get("company")).trim(),
              contact: String(f.get("person")).trim(),
              email: String(f.get("email") || "").trim(),
              phone: String(f.get("phone") || "").trim(),
              nucleus: "Núcleo 1",
            },
          ]
        : s.clients,
    }));
    notify(
      "Demanda cadastrada. Preencha o briefing e adicione os arquivos diretamente, com ou sem IA.",
    );
    go(`/demandas/${d.id}/briefing`);
  }
  return (
    <>
      <Title
        title={all ? "Demandas" : "Atendimento"}
        sub={
          all
            ? "Do primeiro contato ao aceite, com todo o histórico reunido."
            : "Cadastre diretamente ou receba por Gmail e WhatsApp. Tudo segue no mesmo atendimento."
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
            <h2>Cadastrar demanda diretamente</h2>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
          </div>
          <p className="muted">
            Comece aqui mesmo sem mensagem recebida. O briefing, os anexos e os
            demais cadastros podem ser preenchidos manualmente.
          </p>
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
              <select
                name="client"
                defaultValue={newClient ? "new" : state.clients[0]?.id}
                onChange={(e) => setNewClient(e.target.value === "new")}
              >
                {state.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="new">Cadastrar novo cliente</option>
              </select>
            </Label>
            <Label label="Canal de entrada">
              <select name="source">
                <option>Cadastro direto</option>
                <option>E-mail</option>
                <option>WhatsApp</option>
                <option>Ligação</option>
                <option>Reunião</option>
                <option>Outro</option>
              </select>
            </Label>
          </div>
          {newClient && (
            <div className="form-grid">
              <Label label="Nome da empresa">
                <input required name="company" />
              </Label>
              <Label label="Nome do contato">
                <input required name="person" />
              </Label>
              <Label label="E-mail do contato (opcional)">
                <input name="email" type="email" />
              </Label>
              <Label label="WhatsApp do contato (opcional)">
                <input name="phone" type="tel" />
              </Label>
            </div>
          )}
          <Label label="Responsável pelo atendimento">
            <select name="owner">
              {state.users
                .filter((u) => u.active)
                .map((u) => (
                  <option key={u.id}>{u.name}</option>
                ))}
            </select>
          </Label>
          <Label label="Pedido ou anotações iniciais">
            <textarea
              name="message"
              rows={4}
              placeholder="Descreva o que já sabe. Também pode deixar para preencher os campos do briefing na próxima tela."
            />
          </Label>
          <p className="field-hint">
            Depois de criar, adicione PDF, DOCX ou XLSX e complete os campos do
            evento. Gmail, WhatsApp e IA são opcionais para este cadastro.
          </p>
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
                        {c?.name} <span className="dot-sep">·</span> {d.source}{" "}
                        <span className="dot-sep">·</span>{" "}
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
