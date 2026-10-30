import { useState } from "react";
import type { Demand, EventRequest, RequestKind } from "../types";
import { uid } from "../data";
import { useStore, go } from "../store";
import { requestLabels } from "../event-lifecycle";
import { Title, Button, Label, Badge, Empty } from "../components/UI";
const statuses = {
  new: "Nova",
  doing: "Em andamento",
  waiting: "Aguardando",
  done: "Concluída",
};
export function EventRequests({ d }: { d?: Demand }) {
  const { state, setState, notify } = useStore();
  const [adding, setAdding] = useState(false),
    [filter, setFilter] = useState("open"),
    [query, setQuery] = useState("");
  const rows = (state.eventRequests || []).filter(
    (r) =>
      (!d || r.eventId === d.id) &&
      (filter === "all" || r.status !== "done") &&
      `${r.title} ${r.description} ${r.owner} ${state.demands.find((d) => d.id === r.eventId)?.title}`
        .toLocaleLowerCase("pt-BR")
        .includes(query.toLocaleLowerCase("pt-BR")),
  );
  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      eventId = String(f.get("event")),
      title = String(f.get("title") || "").trim(),
      description = String(f.get("description") || "").trim();
    if (!title || !description || !state.demands.some((d) => d.id === eventId))
      return;
    const r: EventRequest = {
      id: uid(),
      eventId,
      title,
      description,
      kind: String(f.get("kind")) as RequestKind,
      owner: String(f.get("owner") || ""),
      due: String(f.get("due") || ""),
      status: "new",
      createdAt: new Date().toISOString(),
      history: [],
    };
    setState((s) => ({ ...s, eventRequests: [r, ...(s.eventRequests || [])] }));
    setAdding(false);
    notify(
      "Solicitação vinculada ao evento. O escopo aprovado permanece preservado.",
    );
  }
  return (
    <>
      <Title
        title={d ? "Solicitações deste evento" : "Solicitações"}
        sub="Pedidos e alterações vinculados a um evento, com responsável, prazo e acompanhamento."
        actions={
          <Button variant="primary" onClick={() => setAdding(!adding)}>
            {adding ? "Fechar cadastro" : "Nova solicitação"}
          </Button>
        }
      />
      {adding && (
        <form className="panel lifecycle-form" onSubmit={add}>
          <div className="form-grid">
            <Label label="Evento da solicitação">
              <select name="event" defaultValue={d?.id || ""} required>
                {!d && <option value="">Selecione o evento</option>}
                {(d ? [d] : state.demands).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </Label>
            <Label label="Tipo de solicitação">
              <select name="kind">
                {Object.entries(requestLabels).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </Label>
            <Label label="Título da solicitação">
              <input name="title" required />
            </Label>
            <Label label="Responsável pela solicitação">
              <select name="owner" defaultValue={d?.owner || ""}>
                <option value="">A distribuir</option>
                {state.users
                  .filter((u) => u.active)
                  .map((u) => (
                    <option key={u.id}>{u.name}</option>
                  ))}
              </select>
            </Label>
            <Label label="Prazo da solicitação">
              <input name="due" type="date" />
            </Label>
          </div>
          <Label label="Descrição e origem do pedido">
            <textarea name="description" rows={4} required />
          </Label>
          <Button type="submit" variant="primary">
            Salvar solicitação
          </Button>
        </form>
      )}
      <div className="workspace-filter-row">
        <Label label="Buscar solicitações">
          <input value={query} onChange={(e) => setQuery(e.target.value)} />
        </Label>
        <Label label="Situação das solicitações">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="open">Em aberto</option>
            <option value="all">Todas, incluindo concluídas</option>
          </select>
        </Label>
      </div>
      <section className="panel">
        {!rows.length && (
          <Empty
            title="Nenhuma solicitação nesta visão"
            text="Ajuste o filtro ou registre um pedido vinculado ao evento."
          />
        )}
        {rows.map((r) => (
          <article className="request-row" key={r.id}>
            <div>
              <h3>{r.title}</h3>
              <p>
                {state.demands.find((d) => d.id === r.eventId)?.title} ·{" "}
                {requestLabels[r.kind]} · {r.owner || "A distribuir"}
                {r.due ? ` · ${r.due.split("-").reverse().join("/")}` : ""}
              </p>
              <p className="document-content">{r.description}</p>
              {r.sourceMessageId && (
                <Button onClick={() => go(`/mensagens/${r.sourceMessageId}`)}>
                  Abrir mensagem de origem
                </Button>
              )}
              {!d && (
                <Button onClick={() => go(`/eventos/${r.eventId}/requests`)}>
                  Abrir evento
                </Button>
              )}
            </div>
            <div>
              <Badge tone={r.status === "done" ? "green" : "blue"}>
                {statuses[r.status]}
              </Badge>
              <Label label={`Situação de ${r.title}`}>
                <select
                  value={r.status}
                  onChange={(e) => {
                    const status = e.target.value as EventRequest["status"];
                    setState((s) => ({
                      ...s,
                      eventRequests: s.eventRequests?.map((x) =>
                        x.id === r.id
                          ? {
                              ...x,
                              status,
                              history: [
                                ...x.history,
                                {
                                  at: new Date().toISOString(),
                                  text: `Situação: ${statuses[status]}`,
                                },
                              ],
                            }
                          : x,
                      ),
                    }));
                  }}
                >
                  {Object.entries(statuses).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </Label>
              <details>
                <summary>Histórico</summary>
                {r.history.length ? (
                  r.history.map((h, i) => (
                    <p key={i}>
                      {new Date(h.at).toLocaleString("pt-BR")} · {h.text}
                    </p>
                  ))
                ) : (
                  <p>
                    Pedido registrado em{" "}
                    {new Date(r.createdAt).toLocaleString("pt-BR")}.
                  </p>
                )}
              </details>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
