import { useState, type ReactNode } from "react";
import { ArrowRight, Bell, SlidersHorizontal, Clock3 } from "lucide-react";
import { useStore, go } from "../store";
import { demandNucleusId, UNASSIGNED } from "../organization";
import { activeDemand, sentProposal, shortDate } from "../operations";
import { money } from "../domain.mjs";
import { Badge, Button, Empty, Label, Note, Title } from "./UI";
import { ManagementPortfolio } from "./ManagementPortfolio";
import { ManagementRecordEditor } from "./ManagementRecordEditor";
import { IntelligenceEntry } from "./Intelligence";
import type { Demand } from "../types";
import {
  cycleRows,
  decisionEvent,
  elapsed,
  firstContact,
  firstSent,
  forecast,
  instant,
  managementAnalytics,
  managementDefaults,
  mean,
  riskRows,
  supplierAnalytics,
  type Period,
} from "../management-model";

type View = "overview" | "portfolio" | "relationships" | "evidence";
type Basis =
  | "cycle"
  | "conversion"
  | "margin"
  | "risk"
  | "response"
  | "punctuality"
  | "all";
const number = (n?: number, suffix = "") =>
  n === undefined
    ? "—"
    : `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${suffix}`;
const dateTime = (n?: number) =>
  n === undefined
    ? "Sem registro"
    : new Date(n).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      });
const status = (d: Demand) =>
  ({
    pending: "Em andamento",
    changes: "Em revisão",
    accepted: "Aprovada",
    declined: "Não aprovada",
  })[d.decision];
const bases: Record<Basis, string> = {
  cycle: "Ciclo até o aceite",
  conversion: "Conversão",
  margin: "Margem prevista",
  risk: "Demandas em atenção",
  response: "Primeira resposta",
  punctuality: "Primeiro envio no prazo",
  all: "Todos os registros da carteira",
};
function Metric({
  label,
  value,
  context,
  onClick,
  warning,
}: {
  label: string;
  value: string;
  context: ReactNode;
  onClick: () => void;
  warning?: boolean;
}) {
  return (
    <button
      className="insight-metric"
      onClick={onClick}
      aria-label={`Ver base: ${label}`}
    >
      <span className="metric-label">
        {label}
        <ArrowRight size={15} />
      </span>
      <strong className={warning ? "attention-number" : ""}>{value}</strong>
      <small>{context}</small>
    </button>
  );
}
function ReasonList({ values, empty }: { values: string[]; empty: string }) {
  const counts = Object.entries(
    values.reduce<Record<string, number>>(
      (all, v) => ({
        ...all,
        [v || "Sem classificação"]: (all[v || "Sem classificação"] || 0) + 1,
      }),
      {},
    ),
  ).sort((a, b) => b[1] - a[1]);
  return counts.length ? (
    <ul className="insight-reasons">
      {counts.map(([reason, count]) => (
        <li key={reason}>
          <span>{reason}</span>
          <strong>{count}</strong>
        </li>
      ))}
    </ul>
  ) : (
    <p className="muted">{empty}</p>
  );
}
export function ManagementDashboard() {
  const { state, setState, notify } = useStore();
  const [nucleus, setNucleus] = useState("all"),
    [owner, setOwner] = useState("all");
  const [period, setPeriod] = useState<Period>("30"),
    [view, setView] = useState<View>("overview"),
    [basis, setBasis] = useState<Basis>("cycle");
  const [settings, setSettings] = useState(false),
    [selected, setSelected] = useState("");
  const [clientBasis, setClientBasis] = useState("");
  const now = Date.now();
  const rows = state.demands.filter(
    (d) =>
      (nucleus === "all" || demandNucleusId(state, d) === nucleus) &&
      (owner === "all" || d.owner === owner),
  );
  const data = managementAnalytics(rows, period, now),
    risks = riskRows(state, rows, new Date(now));
  const targets = state.managementTargets || managementDefaults;
  const open = rows.filter((d) => activeDemand(d) && d.decision !== "accepted"),
    negotiating = open.filter((d) => sentProposal(d));
  const riskValue = risks.reduce((s, r) => s + (r.value || 0), 0),
    pricedRisks = risks.filter((r) => r.value !== undefined).length;
  const suppliers = supplierAnalytics(state, rows, period, now);
  const showBase = (next: Basis) => {
    setBasis(next);
    setView("evidence");
    setSelected("");
    setClientBasis("");
  };
  const periods = [
    { value: "30", label: "Últimos 30 dias" },
    { value: "90", label: "Últimos 90 dias" },
    { value: "all", label: "Todo o histórico" },
  ];
  const baseRows =
    basis === "cycle"
      ? data.accepted
      : basis === "conversion"
        ? data.decided
        : basis === "margin"
          ? data.accepted
          : basis === "risk"
            ? risks.map((r) => r.d)
            : basis === "response"
              ? data.replies.map((r) => r.d)
              : basis === "punctuality"
                ? data.commitments.map((r) => r.d)
                : rows;
  const evidence = rows.find((d) => d.id === selected);
  const trend = [2, 1, 0].map((offset) => {
    const cohort = cycleRows(rows, "30", now, offset);
    return {
      offset,
      label:
        offset === 0
          ? "Últimos 30 dias"
          : `${(offset + 1) * 30}–${offset * 30} dias atrás`,
      count: cohort.length,
      days: mean(cohort.map((r) => r.days)),
    };
  });
  const scale = Math.max(
    targets.cycleDays,
    ...trend.map((t) => t.days || 0),
    1,
  );
  return (
    <div className="managerial-dashboard">
      <Title
        title="Painel Gerencial"
        sub="Tempo, resultado previsto e decisões para fazer o atendimento avançar."
        actions={
          <>
            <Button
              icon={SlidersHorizontal}
              aria-expanded={settings}
              onClick={() => setSettings(!settings)}
            >
              Metas
            </Button>
            <Button icon={Bell} onClick={() => go("/alertas")}>
              Central de alertas
            </Button>
          </>
        }
      />
      <IntelligenceEntry ids={["management"]} />
      <div className="management-filters insight-filters">
        <Label label="Período dos resultados">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
          >
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Label>
        <Label label="Núcleo">
          <select value={nucleus} onChange={(e) => setNucleus(e.target.value)}>
            <option value="all">Todos os núcleos</option>
            {(state.nuclei || []).map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
            <option value="">A distribuir</option>
          </select>
        </Label>
        <Label label="Responsável">
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="all">Toda a equipe</option>
            {[...new Set(state.demands.map((d) => d.owner))].map((n) => (
              <option key={n} value={n}>
                {n || UNASSIGNED}
              </option>
            ))}
          </select>
        </Label>
        <p className="insight-filter-note">
          Base fictícia · dias corridos
          <br />
          Carteira e alertas mostram a situação atual.
        </p>
      </div>
      {settings && (
        <form
          className="panel insight-settings"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const cycleDays = Number(form.get("cycle")),
              marginPercent = Number(form.get("margin"));
            if (!(
              cycleDays > 0 &&
              cycleDays <= 365 &&
              marginPercent >= 0 &&
              marginPercent <= 100
            ))
              return;
            setState((s) => ({
              ...s,
              managementTargets: { cycleDays, marginPercent },
            }));
            notify("Metas atualizadas neste navegador.");
            setSettings(false);
          }}
        >
          <div>
            <h2>Metas de acompanhamento</h2>
            <p>Valores ilustrativos, ajustáveis à operação da Adviser.</p>
          </div>
          <Label label="Contato até aceite (dias)">
            <input
              name="cycle"
              type="number"
              min="1"
              max="365"
              step="1"
              required
              defaultValue={targets.cycleDays}
            />
          </Label>
          <Label label="Margem sobre remuneração (%)">
            <input
              name="margin"
              type="number"
              min="0"
              max="100"
              step="1"
              required
              defaultValue={targets.marginPercent}
            />
          </Label>
          <Button type="submit" variant="primary">
            Salvar metas
          </Button>
        </form>
      )}
      <div className="insight-metrics">
        <Metric
          label="Contato até o aceite"
          value={number(data.average, " dias")}
          context={
            <>
              {data.cycles.length} aceites com datas · meta {targets.cycleDays}{" "}
              dias
              <br />
              {data.improvement === undefined
                ? "Sem comparação suficiente"
                : `${number(Math.abs(data.improvement))}% ${data.improvement >= 0 ? "mais rápido" : "mais lento"} que o período anterior`}
            </>
          }
          onClick={() => showBase("cycle")}
          warning={
            data.average !== undefined && data.average > targets.cycleDays
          }
        />
        <Metric
          label="Conversão de propostas"
          value={number(data.conversion, "%")}
          context={
            <>
              {data.accepted.length} aprovadas em {data.decided.length} decisões
              <br />
              Pendentes fora do cálculo
            </>
          }
          onClick={() => showBase("conversion")}
        />
        <Metric
          label="Margem prevista"
          value={number(data.margin, "%")}
          context={
            <>
              {data.forecasts.length} aprovadas com custos previstos
              <br />
              Sobre a remuneração da agência
            </>
          }
          onClick={() => showBase("margin")}
          warning={
            data.margin !== undefined && data.margin < targets.marginPercent
          }
        />
        <Metric
          label="Demandas em atenção"
          value={String(risks.length)}
          context={
            <>
              {pricedRisks ? money(riskValue) : "Valor não informado"} em
              negociação exposta
              <br />
              {pricedRisks} com valor enviado · carteira atual
            </>
          }
          onClick={() => showBase("risk")}
          warning={risks.some((r) => r.urgent)}
        />
      </div>
      <nav className="insight-tabs" aria-label="Leituras do painel">
        {(
          [
            ["overview", "Visão geral"],
            ["portfolio", "Carteira e prazos"],
            ["relationships", "Clientes e fornecedores"],
            ["evidence", "Base dos indicadores"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            aria-current={view === id ? "page" : undefined}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {view === "overview" && (
        <>
          <div className="insight-overview-grid">
            <section className="panel cycle-panel">
              <div className="section-heading">
                <div>
                  <h2>O aceite está chegando mais rápido?</h2>
                  <p>
                    Média entre a primeira comunicação e o aceite registrado.
                  </p>
                </div>
              </div>
              <div
                className="cycle-trend"
                aria-label="Evolução em três períodos de 30 dias, independentemente do filtro de período"
              >
                {trend.map((t) => (
                  <div className="cycle-period" key={t.offset}>
                    <span>
                      {t.label}
                      <small>
                        {t.count} {t.count === 1 ? "aceite" : "aceites"} com
                        datas
                      </small>
                    </span>
                    <div className="cycle-bar">
                      <span
                        style={{ width: `${((t.days || 0) / scale) * 100}%` }}
                      />
                    </div>
                    <strong>{number(t.days, " d")}</strong>
                  </div>
                ))}
              </div>
              <p className="field-hint">
                Janelas fixas de 30 dias · mesmos filtros de núcleo e
                responsável.
              </p>
              <div className="cycle-breakdown">
                <div>
                  <Clock3 size={16} />
                  <span>
                    Contato → primeiro envio
                    <strong>{number(data.preparation, " dias")}</strong>
                  </span>
                </div>
                <div>
                  <ArrowRight size={16} />
                  <span>
                    Primeiro envio → aceite
                    <strong>{number(data.negotiation, " dias")}</strong>
                  </span>
                </div>
              </div>
              <p className="field-hint">
                Comparação: {data.cycles.length} aceites no período escolhido e{" "}
                {data.previousCount} no anterior
                {period === "all"
                  ? " (comparação desativada para todo o histórico)"
                  : ""}
                .
              </p>
              <p className="field-hint">
                {data.splitCount} aceites com os três marcos no período
                escolhido. Revisões preservam o primeiro contato e o primeiro
                envio.
              </p>
              <Button variant="ghost" onClick={() => showBase("cycle")}>
                Ver propostas e marcos <ArrowRight size={15} />
              </Button>
            </section>
            <section className="panel decision-panel">
              <div className="section-heading">
                <div>
                  <h2>Decisões de hoje</h2>
                  <p>Sinais da carteira atual, com evidência para agir.</p>
                </div>
                <Badge tone="amber">
                  {risks.filter((r) => r.urgent).length} urgentes
                </Badge>
              </div>
              {risks.length ? (
                <ol className="decision-list">
                  {risks.slice(0, 3).map((r) => (
                    <li key={r.d.id}>
                      <div className="decision-title">
                        <span
                          className={
                            r.urgent ? "decision-dot urgent" : "decision-dot"
                          }
                        />
                        <h3>{r.title}</h3>
                      </div>
                      <p>
                        {r.d.title} · {r.d.owner || UNASSIGNED}
                      </p>
                      <small>{r.detail}</small>
                      <Button
                        variant="ghost"
                        icon={ArrowRight}
                        onClick={() => go(r.path)}
                      >
                        {r.action}
                      </Button>
                    </li>
                  ))}
                </ol>
              ) : (
                <Empty
                  title="Nenhum sinal de atenção neste filtro"
                  text="Acompanhe a carteira e registre os próximos compromissos."
                />
              )}
              {risks.length > 3 && (
                <Button variant="ghost" onClick={() => showBase("risk")}>
                  Ver as {risks.length} demandas em atenção
                </Button>
              )}
              <p className="field-hint">
                Sugestões demonstrativas por regras, sem análise de IA externa.
              </p>
            </section>
          </div>
          <div className="insight-secondary">
            <button onClick={() => showBase("response")}>
              <span>Primeira resposta da equipe</span>
              <strong>{number(data.replyHours, " h")}</strong>
              <small>
                {data.replies.length} demandas iniciadas no período ·
                confirmações automáticas excluídas
              </small>
            </button>
            <button onClick={() => showBase("punctuality")}>
              <span>Primeiro envio no prazo</span>
              <strong>{number(data.punctuality, "%")}</strong>
              <small>
                {data.commitments.length} envios com compromisso registrado ·
                prazo preservado no envio
              </small>
            </button>
            <button onClick={() => setView("portfolio")}>
              <span>Carteira em negociação</span>
              <strong className="insight-money">
                {money(
                  negotiating.reduce(
                    (s, d) => s + (sentProposal(d)?.total || 0),
                    0,
                  ),
                )}
              </strong>
              <small>
                {negotiating.length} propostas enviadas · {open.length} demandas
                comerciais abertas · não é receita
              </small>
            </button>
          </div>
          <div className="insight-two-columns">
            <section className="panel">
              <h2>Por que perdemos propostas?</h2>
              <p>
                {data.refused.length} recusas no período. Motivos registrados
                pela equipe.
              </p>
              <ReasonList
                values={data.refused.map(
                  (d) =>
                    decisionEvent(d)?.reason || d.management?.lossReason || "",
                )}
                empty="Nenhuma recusa com data neste período."
              />
            </section>
            <section className="panel">
              <h2>O que gera novas revisões?</h2>
              <p>
                {data.revisions.length} rodadas em{" "}
                {new Set(data.revisions.map((r) => r.d.id)).size} demandas no
                período. Nem toda revisão é retrabalho evitável.
              </p>
              <ReasonList
                values={data.revisions.map((r) => r.reason || "")}
                empty="Nenhuma revisão registrada no período."
              />
            </section>
          </div>
          <div className="insight-quality">
            <span>
              <strong>Qualidade da base.</strong> {data.missingDecision}{" "}
              decisões sem data; {data.missingCycle} aceites do período sem
              início válido. Esses registros não entram no cálculo
              correspondente.
            </span>
            <Button variant="ghost" onClick={() => showBase("all")}>
              Revisar registros
            </Button>
          </div>
          <div className="insight-roadmap">
            <div>
              <Badge>Etapa 2 · Operações</Badge>
              <p>
                Execução no prazo, tarefas bloqueadas e cumprimento dos
                fornecedores no evento.
              </p>
              <Button variant="ghost" onClick={() => go("/operacoes")}>
                Explorar prévia de Operações
              </Button>
            </div>
            <div>
              <Badge>Etapa 3 · Financeiro</Badge>
              <p>
                Resultado realizado por evento, previsto × realizado,
                recebimentos e fluxo de caixa.
              </p>
              <Button variant="ghost" onClick={() => go("/financeiro")}>
                Explorar prévia do Financeiro
              </Button>
            </div>
          </div>
        </>
      )}
      {view === "portfolio" && (
        <ManagementPortfolio
          rows={rows}
          nucleus={nucleus}
          setNucleus={setNucleus}
        />
      )}
      {view === "relationships" && (
        <>
          <section className="panel flush">
            <div className="section-heading management-table-heading">
              <div>
                <h2>Quais clientes trazem resultado?</h2>
                <p>
                  Decisões do período; resultado é uma estimativa da
                  contribuição, não lucro realizado.
                </p>
              </div>
            </div>
            <div className="table-scroll">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Decisões / conversão</th>
                    <th>Contribuição prevista</th>
                    <th>Carga atual</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {state.clients
                    .filter((c) => rows.some((d) => d.clientId === c.id))
                    .map((c) => {
                      const ds = rows.filter((d) => d.clientId === c.id),
                        a = managementAnalytics(ds, period, now);
                      return (
                        <tr key={c.id}>
                          <td>
                            <strong>{c.name}</strong>
                            <small className="cell-sub">
                              {a.revisions.length} revisões no período
                            </small>
                          </td>
                          <td>
                            {a.decided.length} decisões ·{" "}
                            {number(a.conversion, "%")}
                            <small className="cell-sub">
                              {a.accepted.length} aprovadas
                            </small>
                          </td>
                          <td>
                            {a.forecasts.length
                              ? money(a.result)
                              : "Sem custos previstos"}
                            <small className="cell-sub">
                              {a.forecasts.length} de {a.accepted.length}{" "}
                              aprovadas com base
                            </small>
                          </td>
                          <td>
                            {
                              ds.filter(
                                (d) =>
                                  activeDemand(d) && d.decision !== "accepted",
                              ).length
                            }{" "}
                            abertas
                            <small className="cell-sub">
                              {
                                ds.filter(
                                  (d) =>
                                    activeDemand(d) &&
                                    d.management?.complexity === "high",
                                ).length
                              }{" "}
                              de alta complexidade
                            </small>
                          </td>
                          <td>
                            <Button
                              onClick={() => {
                                setView("evidence");
                                setBasis("all");
                                setSelected("");
                                setClientBasis(c.id);
                              }}
                            >
                              Ver registros
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            {!rows.length && (
              <Empty
                title="Nenhum cliente neste filtro"
                text="Escolha outro núcleo ou responsável."
              />
            )}
            <p className="insight-table-note">
              O esforço aparece por revisões e complexidade informada. Horas
              trabalhadas ainda não são medidas.
            </p>
          </section>
          <section className="panel flush">
            <div className="section-heading management-table-heading">
              <div>
                <h2>Quais fornecedores ajudam a avançar?</h2>
                <p>
                  Primeiras respostas recebidas no período. Pendências refletem
                  a carteira atual.
                </p>
              </div>
            </div>
            <div className="table-scroll">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Fornecedor</th>
                    <th>Tempo de resposta</th>
                    <th>No prazo</th>
                    <th>Resposta completa</th>
                    <th>Pendências atuais</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((r) => (
                    <tr key={r.supplier.id}>
                      <td>
                        <strong>{r.supplier.name}</strong>
                        <small className="cell-sub">
                          {r.received.length} primeiras respostas
                        </small>
                      </td>
                      <td>{number(r.hours, " h")}</td>
                      <td>
                        {number(r.onTime, "%")}
                        <small className="cell-sub">
                          Base: {r.deadlineCount}
                        </small>
                      </td>
                      <td>
                        {number(r.complete, "%")}
                        <small className="cell-sub">
                          Base: {r.completeCount}
                        </small>
                      </td>
                      <td>
                        {r.pending.length} aguardando
                        <small className="cell-sub">
                          {r.overdue} fora do prazo
                        </small>
                      </td>
                      <td>
                        <Button
                          onClick={() =>
                            go(
                              `/demandas/${(r.pending[0] || r.received[0]).d.id}/quotes`,
                            )
                          }
                        >
                          Ver cotações
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!suppliers.length && (
              <Empty
                title="Ainda não há respostas mensuráveis"
                text="Registre a solicitação e o primeiro retorno para formar a base."
              />
            )}
            <p className="insight-table-note">
              Resposta completa: campos obrigatórios e itens com valores
              preenchidos no primeiro retorno. A avaliação da execução pertence
              à etapa de Operações.
            </p>
          </section>
        </>
      )}
      {view === "evidence" && (
        <>
          <section className="panel flush">
            <div className="section-heading management-table-heading">
              <div>
                <h2>De onde vem o indicador</h2>
                <p>
                  {basis === "all" || basis === "risk"
                    ? "Carteira atual, independentemente do período."
                    : basis === "response"
                      ? "Demandas iniciadas no período, com primeira resposta registrada."
                      : basis === "punctuality"
                        ? "Primeiros envios no período, com prazo preservado."
                        : "Decisões registradas no período escolhido."}{" "}
                  Abra um registro para revisar marcos e premissas.
                </p>
              </div>
              <select
                aria-label="Base do indicador"
                value={basis}
                onChange={(e) => {
                  setBasis(e.target.value as Basis);
                  setSelected("");
                }}
              >
                {Object.entries(bases).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {clientBasis && (
              <div className="insight-table-note">
                Cliente:{" "}
                <strong>
                  {state.clients.find((c) => c.id === clientBasis)?.name}
                </strong>{" "}
                <Button variant="ghost" onClick={() => setClientBasis("")}>
                  Ver toda a carteira
                </Button>
              </div>
            )}
            {basis === "margin" && (
              <p className="insight-table-note">
                Contribuição = remuneração da agência − custo interno − outros
                custos previstos. Margem = contribuição ÷ remuneração. Custos
                precisam estar revisados para a versão enviada ou aceita.
                Valores pagos diretamente e repasses não compõem a remuneração.
                Não é lucro líquido; premissas a validar com os sócios.
              </p>
            )}
            <div className="table-scroll">
              <table className="management-table insight-evidence-table">
                <thead>
                  <tr>
                    <th>Demanda</th>
                    <th>Marcos do atendimento</th>
                    <th>
                      {basis === "margin"
                        ? "Previsão"
                        : basis === "risk"
                          ? "Sinal / valor exposto"
                          : basis === "response"
                            ? "Primeira resposta"
                            : basis === "punctuality"
                              ? "Compromisso"
                              : "Ciclo / decisão"}
                    </th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {baseRows
                    .filter((d) => !clientBasis || d.clientId === clientBasis)
                    .map((d) => {
                      const start = firstContact(d),
                        sent = firstSent(d),
                        end = decisionEvent(d),
                        f = forecast(d),
                        r = risks.find((r) => r.d.id === d.id);
                      return (
                        <tr key={d.id}>
                          <td>
                            <strong>{d.title}</strong>
                            <small className="cell-sub">
                              {
                                state.clients.find((c) => c.id === d.clientId)
                                  ?.name
                              }{" "}
                              · {d.owner}
                            </small>
                            <Badge
                              tone={
                                d.decision === "accepted" ? "green" : "gray"
                              }
                            >
                              {status(d)}
                            </Badge>
                          </td>
                          <td>
                            <small>Contato: {dateTime(start)}</small>
                            <small>
                              1º envio: {dateTime(instant(sent?.at))}
                            </small>
                            <small>
                              {d.decision === "accepted" ? "Aceite" : "Decisão"}
                              : {dateTime(instant(end?.at))}
                            </small>
                            {sent?.dueAt && (
                              <small>
                                Prazo no 1º envio: {shortDate(sent.dueAt)}
                              </small>
                            )}
                          </td>
                          <td>
                            {basis === "margin" ? (
                              <>
                                <strong>{number(f?.margin, "%")}</strong>
                                <small>
                                  Contribuição:{" "}
                                  {f
                                    ? money(f.contribution)
                                    : "Sem previsão válida"}
                                </small>
                              </>
                            ) : basis === "risk" ? (
                              <>
                                <strong>{r?.title}</strong>
                                <small>
                                  {r?.value === undefined
                                    ? "Sem valor enviado em negociação"
                                    : money(r.value)}
                                </small>
                              </>
                            ) : basis === "response" ? (
                              <strong>
                                {number(
                                  data.replies.find((r) => r.d.id === d.id)
                                    ?.hours,
                                  " horas até responder",
                                )}
                              </strong>
                            ) : basis === "punctuality" ? (
                              <strong>
                                {data.commitments.find((r) => r.d.id === d.id)
                                  ?.onTime
                                  ? "Enviado no prazo"
                                  : "Enviado após o prazo"}
                              </strong>
                            ) : (
                              <>
                                <strong>
                                  {d.decision === "accepted"
                                    ? number(
                                        elapsed(start, instant(end?.at)),
                                        " dias até aceite",
                                      )
                                    : status(d)}
                                </strong>
                                <small>
                                  {end?.reason ||
                                    d.management?.lossReason ||
                                    ""}
                                </small>
                              </>
                            )}
                          </td>
                          <td>
                            <Button
                              aria-label={`Revisar registro de ${d.title}`}
                              onClick={() =>
                                setSelected(selected === d.id ? "" : d.id)
                              }
                            >
                              Revisar registro
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => go(`/demandas/${d.id}/${d.stage}`)}
                            >
                              Abrir demanda
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            {!baseRows.filter((d) => !clientBasis || d.clientId === clientBasis)
              .length && (
              <Empty
                title="Sem registros para este indicador"
                text="Altere o período ou consulte todos os registros para completar os marcos ausentes."
              />
            )}
          </section>
          {evidence && (
            <ManagementRecordEditor
              key={`${evidence.id}-${evidence.sentVersion}`}
              d={evidence}
              onClose={() => setSelected("")}
            />
          )}
        </>
      )}
      <p className="management-footnote">
        MVP · indicadores calculados com dados locais fictícios. Datas ausentes
        não viram zero; aprovação não significa faturamento ou recebimento.
      </p>
    </div>
  );
}
