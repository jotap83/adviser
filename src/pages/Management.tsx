import { useState } from "react";
import {
  ArrowRight,
  Bell,
  CheckCheck,
  Mail,
  SlidersHorizontal,
  Clock3,
} from "lucide-react";
import { useStore, go } from "../store";
import { stages, uid } from "../data";
import { Title, Button, Badge, Empty, Label, Note } from "../components/UI";
import { money } from "../domain.mjs";
import {
  activeDemand,
  ageDays,
  collectAlerts,
  sentProposal,
  shortDate,
  type AlertItem,
} from "../operations";
import type { Demand } from "../types";

const severity = {
  high: "Urgente",
  medium: "Acompanhar",
  info: "Novo retorno",
};
const tone = { high: "red", medium: "amber", info: "blue" };
export function Management() {
  const { state, updateDemand } = useStore();
  const [nucleus, setNucleus] = useState("all");
  const [owner, setOwner] = useState("all");
  const [stage, setStage] = useState("all");
  const rows = state.demands.filter(
    (d) =>
      (nucleus === "all" ||
        state.clients.find((c) => c.id === d.clientId)?.nucleus === nucleus) &&
      (owner === "all" || d.owner === owner),
  );
  const active = rows.filter(activeDemand);
  const alerts = collectAlerts(state).filter((a) =>
    rows.some((d) => d.id === a.demandId),
  );
  const risks = alerts.filter((a) => a.kind !== "response");
  const responses = alerts.filter((a) => a.kind === "response" && !a.read);
  const priorityRows = risks.filter(
    (a, i) => risks.findIndex((x) => x.demandId === a.demandId) === i,
  );
  const needsAttention = priorityRows.length;
  const decisions = rows.filter(
    (d) => d.decision === "accepted" || d.decision === "declined",
  );
  const accepted = decisions.filter((d) => d.decision === "accepted").length;
  const negotiating = active.filter(
    (d) => d.decision !== "accepted" && sentProposal(d),
  );
  const pipeline = stages.map((s) => ({
    ...s,
    count: active.filter((d) => d.stage === s.id).length,
  }));
  const nuclei = [...new Set(state.clients.map((c) => c.nucleus))];
  const list = active.filter((d) => stage === "all" || d.stage === stage);
  return (
    <>
      <Title
        title="Painel Gerencial"
        sub="Onde o atendimento avança, onde está parado e o que precisa de decisão."
        actions={
          <Button icon={Bell} onClick={() => go("/alertas")}>
            Central de alertas{" "}
            {responses.length > 0 && (
              <span className="count">{responses.length}</span>
            )}
          </Button>
        }
      />
      <div className="management-filters">
        <div>
          <strong>Carteira atual</strong>
          <small>Indicadores calculados a partir das demandas fictícias.</small>
        </div>
        <Label label="Núcleo">
          <select
            aria-label="Núcleo"
            value={nucleus}
            onChange={(e) => setNucleus(e.target.value)}
          >
            <option value="all">Todos os núcleos</option>
            {nuclei.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </Label>
        <Label label="Responsável">
          <select
            aria-label="Responsável"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          >
            <option value="all">Toda a equipe</option>
            {[...new Set(state.demands.map((d) => d.owner))].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </Label>
      </div>
      <dl className="management-metrics">
        <div>
          <dt>Demandas em andamento</dt>
          <dd>{active.length}</dd>
          <small>Sem recusadas e repasses concluídos</small>
        </div>
        <div>
          <dt>Precisam de atenção</dt>
          <dd className={needsAttention ? "attention-number" : ""}>
            {needsAttention}
          </dd>
          <small>Demandas com prazo, parada ou decisão pendente</small>
        </div>
        <div>
          <dt>Propostas em negociação</dt>
          <dd className="money-metric">
            {money(
              negotiating.reduce(
                (s, d) => s + (sentProposal(d)?.total || 0),
                0,
              ),
            )}
          </dd>
          <small>{negotiating.length} versões enviadas · não é receita</small>
        </div>
        <div>
          <dt>Aprovação entre decisões</dt>
          <dd>
            {decisions.length
              ? `${Math.round((accepted / decisions.length) * 100)}%`
              : "—"}
          </dd>
          <small>
            {accepted} {accepted === 1 ? "aprovação" : "aprovações"} em{" "}
            {decisions.length} decisões · pendentes excluídas
          </small>
        </div>
      </dl>
      <div className="management-columns">
        <section className="panel focus-panel">
          <div className="section-heading">
            <div>
              <h2>O que precisa destravar</h2>
              <p>Prioridades com contexto e caminho para agir.</p>
            </div>
            <Badge tone="amber">{risks.length} sinais</Badge>
          </div>
          {risks.length ? (
            <div className="attention-list">
              {priorityRows.slice(0, 5).map((a) => {
                const d = rows.find((d) => d.id === a.demandId)!;
                return (
                  <div className="attention-row" key={a.id}>
                    <div>
                      <Badge tone={tone[a.severity]}>
                        {severity[a.severity]}
                      </Badge>
                      <h3>{a.title}</h3>
                      <p>
                        {d.title} · {d.owner}
                      </p>
                      <small>{a.detail}</small>
                      {risks.filter((x) => x.demandId === a.demandId).length >
                        1 && (
                        <small className="related-signals">
                          +{" "}
                          {risks.filter((x) => x.demandId === a.demandId)
                            .length - 1}{" "}
                          {risks.filter((x) => x.demandId === a.demandId)
                            .length === 2
                            ? "sinal"
                            : "sinais"}{" "}
                          nesta demanda
                        </small>
                      )}
                    </div>
                    <Button icon={ArrowRight} onClick={() => go(a.path)}>
                      {a.action}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty
              title="Nenhum bloqueio identificado"
              text="Os alertas refletem os prazos e as regras configurados. Continue acompanhando os retornos."
            />
          )}
          {priorityRows.length > 5 && (
            <Button variant="ghost" onClick={() => go("/alertas")}>
              Ver os {risks.length} sinais de atenção
            </Button>
          )}
        </section>
        <section className="panel pipeline-panel">
          <div className="section-heading">
            <div>
              <h2>Onde estão as demandas</h2>
              <p>Distribuição atual por etapa.</p>
            </div>
          </div>
          <div className="pipeline-bars">
            {pipeline.map((s) => (
              <button
                key={s.id}
                className={stage === s.id ? "selected" : ""}
                onClick={() => setStage(stage === s.id ? "all" : s.id)}
                aria-pressed={stage === s.id}
              >
                <span>
                  {s.label}
                  <strong>{s.count}</strong>
                </span>
                <span className="bar-track">
                  <span
                    style={{
                      width: `${active.length ? (s.count / active.length) * 100 : 0}%`,
                    }}
                  />
                </span>
              </button>
            ))}
          </div>
          <div className="management-insight">
            <Clock3 size={18} />
            <div>
              <strong>
                {
                  active.filter(
                    (d) =>
                      ageDays(d.updatedAt) >= (state.alertRules?.idleDays || 3),
                  ).length
                }{" "}
                sem atualização recente
              </strong>
              <p>
                O tempo parado usa a última alteração registrada. Não mede horas
                trabalhadas.
              </p>
            </div>
          </div>
        </section>
      </div>
      <section className="panel management-nuclei">
        <div className="section-heading">
          <div>
            <h2>Distribuição por núcleo</h2>
            <p>Volume de trabalho e pendências, sem ranking de pessoas.</p>
          </div>
        </div>
        <div className="nucleus-grid">
          {nuclei
            .filter((n) => nucleus === "all" || n === nucleus)
            .map((n) => {
              const ds = active.filter(
                (d) =>
                  state.clients.find((c) => c.id === d.clientId)?.nucleus === n,
              );
              const ids = new Set(ds.map((d) => d.id));
              return (
                <button
                  key={n}
                  onClick={() => setNucleus(nucleus === n ? "all" : n)}
                  aria-pressed={nucleus === n}
                >
                  <strong>{n}</strong>
                  <span>
                    <b>{ds.length}</b> em andamento
                  </span>
                  <small>
                    {
                      new Set(
                        risks
                          .filter((a) => ids.has(a.demandId))
                          .map((a) => a.demandId),
                      ).size
                    }{" "}
                    precisam de atenção
                  </small>
                </button>
              );
            })}
        </div>
      </section>
      <section className="panel flush">
        <div className="section-heading management-table-heading">
          <div>
            <h2>Prazos e responsáveis</h2>
            <p>
              Ajuste o compromisso de cada demanda e acompanhe a etapa atual.
            </p>
          </div>
          <select
            aria-label="Etapa na visão gerencial"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="all">Todas as etapas</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="table-scroll">
          <table className="management-table">
            <thead>
              <tr>
                <th>Demanda / cliente</th>
                <th>Responsável</th>
                <th>Etapa</th>
                <th>Tempo na etapa</th>
                <th>Próxima entrega</th>
                <th>Abrir</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.title}</strong>
                    <small className="cell-sub">
                      {state.clients.find((c) => c.id === d.clientId)?.name}
                    </small>
                  </td>
                  <td>
                    <select
                      aria-label={`Responsável por ${d.title}`}
                      value={d.owner}
                      onChange={(e) =>
                        updateDemand(
                          d.id,
                          { owner: e.target.value },
                          "Responsável atualizado na visão gerencial.",
                        )
                      }
                    >
                      {[
                        ...new Set([
                          d.owner,
                          ...state.users
                            .filter((u) => u.active)
                            .map((u) => u.name),
                        ]),
                      ].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <Badge tone={d.decision === "accepted" ? "green" : "blue"}>
                      {d.decision === "accepted"
                        ? "Aprovada"
                        : stages.find((s) => s.id === d.stage)?.label}
                    </Badge>
                  </td>
                  <td>
                    {d.stageEnteredAt
                      ? `${ageDays(d.stageEnteredAt)} dias`
                      : "Sem registro"}
                  </td>
                  <td>
                    <input
                      type="date"
                      aria-label={`Próxima entrega de ${d.title}`}
                      value={d.dueAt || ""}
                      onChange={(e) =>
                        updateDemand(
                          d.id,
                          { dueAt: e.target.value },
                          "Prazo da próxima entrega atualizado.",
                        )
                      }
                    />
                  </td>
                  <td>
                    <Button
                      icon={ArrowRight}
                      onClick={() => go(`/demandas/${d.id}/${d.stage}`)}
                    >
                      Abrir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.length && (
          <Empty
            title="Nenhuma demanda neste filtro"
            text="Escolha outra etapa, núcleo ou responsável."
          />
        )}
      </section>
      <p className="management-footnote">
        Aprovação não significa faturamento ou recebimento. Indicadores
        financeiros completos e comparação de produtividade dependem das
        próximas etapas e de histórico real.
      </p>
    </>
  );
}

export function Alerts() {
  const { state, setState, updateDemand, notify } = useStore();
  const [filter, setFilter] = useState("pending");
  const [settings, setSettings] = useState(false);
  const [simulate, setSimulate] = useState(false);
  const [target, setTarget] = useState(
    state.demands.find(activeDemand)?.id || "",
  );
  const [kind, setKind] = useState("client");
  const alerts = collectAlerts(state);
  const unread = alerts.filter((a) => a.kind === "response" && !a.read);
  const rows = alerts.filter(
    (a) =>
      filter === "all" ||
      (filter === "pending"
        ? a.kind !== "response" || !a.read
        : filter === "responses"
          ? a.kind === "response" && !a.read
          : a.kind === "response" && a.read),
  );
  const mark = (ids: string[]) =>
    setState((s) => ({
      ...s,
      readAlerts: [...new Set([...(s.readAlerts || []), ...ids])],
    }));
  const d = state.demands.find((d) => d.id === target);
  const waiting = d?.quotes.find((q) => q.status === "requested");
  function simulateReply() {
    if (!d) return;
    if (kind === "client")
      updateDemand(
        d.id,
        {
          briefingValid: false,
          briefingLog: [
            ...d.briefingLog,
            "Resposta fictícia: confirmamos o público previsto. Precisamos rever a duração da alimentação e aguardar a validação de compras.",
          ],
        },
        "Retorno fictício do cliente registrado na simulação de alertas.",
      );
    else if (waiting)
      updateDemand(
        d.id,
        {
          quotes: d.quotes.map((q) =>
            q.id === waiting.id
              ? {
                  ...q,
                  status: "received",
                  fields: Object.fromEntries(
                    q.template.fields.map((f) => [
                      f.id,
                      f.type === "number"
                        ? "4"
                        : f.type === "date"
                          ? d.date
                          : "Informação fictícia para revisão do atendimento.",
                    ]),
                  ),
                  lines: [
                    {
                      id: uid(),
                      category: q.template.name,
                      description: "Serviço demonstrativo para o evento",
                      qty: 1,
                      unit: 6200,
                      direct: false,
                    },
                  ],
                  terms:
                    "Exemplo fictício: disponibilidade sujeita a confirmação; validade de 7 dias.",
                }
              : q,
          ),
        },
        "Cotação recebida na simulação de alertas.",
      );
    notify(
      "Retorno fictício registrado. A central e o contador foram atualizados.",
    );
    setFilter("responses");
    setSimulate(false);
  }
  function row(a: AlertItem) {
    const demand = state.demands.find((d) => d.id === a.demandId)!;
    return (
      <article className={`alert-row ${a.read ? "is-read" : ""}`} key={a.id}>
        <div className="alert-row-copy">
          <div className="alert-meta">
            <Badge tone={a.read ? "gray" : tone[a.severity]}>
              {a.read ? "Lido" : severity[a.severity]}
            </Badge>
            <span>
              {state.clients.find((c) => c.id === demand.clientId)?.nucleus} ·{" "}
              {demand.owner}
            </span>
          </div>
          <h3>{a.title}</h3>
          <strong>{demand.title}</strong>
          <p>{a.detail}</p>
        </div>
        <div className="alert-actions">
          <Button icon={ArrowRight} onClick={() => go(a.path)}>
            {a.action}
          </Button>
          {a.kind === "response" && !a.read && (
            <Button
              variant="ghost"
              icon={CheckCheck}
              onClick={() => mark([a.id])}
            >
              Marcar como lido
            </Button>
          )}
        </div>
      </article>
    );
  }
  return (
    <>
      <Title
        title="Central de alertas"
        sub="Respostas que chegaram e pendências que precisam de uma ação."
        actions={
          <>
            <Button
              icon={SlidersHorizontal}
              onClick={() => setSettings(!settings)}
            >
              Regras de alerta
            </Button>
            <Button
              variant="primary"
              icon={Mail}
              onClick={() => setSimulate(!simulate)}
            >
              Simular retorno
            </Button>
          </>
        }
      />
      {settings && (
        <section className="panel">
          <h2>Quando sinalizar atenção</h2>
          <div className="form-grid">
            <Label label="Dias corridos sem atualização">
              <input
                type="number"
                min="1"
                max="30"
                value={state.alertRules?.idleDays || 3}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    alertRules: {
                      dueDays: s.alertRules?.dueDays ?? 2,
                      idleDays: Math.min(
                        30,
                        Math.max(1, Number(e.target.value) || 1),
                      ),
                    },
                  }))
                }
              />
            </Label>
            <Label label="Antecedência do prazo em dias corridos">
              <input
                type="number"
                min="0"
                max="14"
                value={state.alertRules?.dueDays ?? 2}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    alertRules: {
                      idleDays: s.alertRules?.idleDays || 3,
                      dueDays: Math.min(
                        14,
                        Math.max(0, Number(e.target.value) || 0),
                      ),
                    },
                  }))
                }
              />
            </Label>
          </div>
          <p className="muted">
            Novos retornos aparecem ao serem registrados. Atrasos permanecem até
            receber a resposta ou ajustar o prazo. Neste protótipo, regras e
            leitura são salvas neste navegador.
          </p>
          <Button onClick={() => setSettings(false)}>Concluir</Button>
        </section>
      )}
      {simulate && (
        <section className="panel simulation-form">
          <h2>Experimente um retorno chegando</h2>
          <p className="muted">
            Escolha uma demanda fictícia. O teste registra uma resposta e
            atualiza os alertas.
          </p>
          <div className="form-grid">
            <Label label="Demanda do retorno">
              <select
                aria-label="Demanda do retorno"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                {state.demands.filter(activeDemand).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </Label>
            <Label label="Tipo de retorno">
              <select
                aria-label="Tipo de retorno"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="client">Cliente · registro no sistema</option>
                <option value="supplier">Fornecedor · cotação pelo link</option>
              </select>
            </Label>
          </div>
          {kind === "supplier" && !waiting && (
            <Note>
              Esta demanda não tem uma cotação aguardando resposta. Escolha
              outra demanda ou registre um retorno de cliente.
            </Note>
          )}
          <div className="actions">
            <Button
              variant="primary"
              disabled={!d || (kind === "supplier" && !waiting)}
              onClick={simulateReply}
            >
              Registrar retorno fictício
            </Button>
            <Button onClick={() => setSimulate(false)}>Cancelar</Button>
          </div>
        </section>
      )}
      <div className="alert-toolbar">
        <div className="alert-tabs" aria-label="Filtrar alertas">
          {[
            ["pending", "A acompanhar"],
            ["responses", `Novos retornos (${unread.length})`],
            ["read", "Retornos lidos"],
            ["all", "Todos"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
              className={filter === id ? "active" : ""}
            >
              {label}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          disabled={!unread.length}
          icon={CheckCheck}
          onClick={() => mark(unread.map((a) => a.id))}
        >
          Marcar retornos como lidos
        </Button>
      </div>
      <section className="panel flush">
        {rows.length ? (
          rows.map(row)
        ) : (
          <Empty
            title="Tudo acompanhado por aqui"
            text="Não há alertas neste filtro. Experimente registrar uma resposta fictícia para ver o fluxo."
          />
        )}
      </section>
      <Note>
        Respostas pelo link do fornecedor geram alertas ao serem registradas.
        Retornos de cliente precisam ser inseridos pela equipe nesta versão. Ler
        e-mails automaticamente depende da futura integração com o Gmail.
      </Note>
    </>
  );
}
