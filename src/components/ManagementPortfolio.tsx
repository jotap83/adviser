import { demandNucleusId, nucleusLabel, UNASSIGNED } from "../organization";
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
import { Title, Button, Badge, Empty, Label, Note } from "./UI";
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
export function ManagementPortfolio({
  rows,
  nucleus,
  setNucleus,
}: {
  rows: Demand[];
  nucleus: string;
  setNucleus: (value: string) => void;
}) {
  const { state, updateDemand } = useStore();
  const [stage, setStage] = useState("all");
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
  const pipeline = stages.map((s) => ({
    ...s,
    count: active.filter((d) => d.stage === s.id).length,
  }));
  const nuclei = [
    ...(state.nuclei || []),
    ...(state.clients.some((c) => !c.nucleusId)
      ? [{ id: "", name: UNASSIGNED, coordinatorId: "" }]
      : []),
  ];
  const list = active.filter((d) => stage === "all" || d.stage === stage);
  return (
    <>
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
                        {d.title} · {d.owner || UNASSIGNED}
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
            <p>
              Carga atual conforme os filtros. Volume não equivale a
              produtividade; considere urgência e complexidade.
            </p>
          </div>
          <Button onClick={() => go("/configuracoes/nucleos")}>
            Gerenciar núcleos
          </Button>
        </div>
        <div className="nucleus-grid">
          {nuclei
            .filter((n) => nucleus === "all" || n.id === nucleus)
            .map((n) => {
              const ds = active.filter(
                (d) => demandNucleusId(state, d) === n.id,
              );
              const ids = new Set(ds.map((d) => d.id));
              return (
                <button
                  key={n.id}
                  onClick={() => setNucleus(nucleus === n.id ? "all" : n.id)}
                  aria-pressed={nucleus === n.id}
                >
                  <strong>{n.name}</strong>
                  <small>
                    Coordenação:{" "}
                    {state.users.find((u) => u.id === n.coordinatorId)?.name ||
                      "A definir"}
                  </small>
                  <small>
                    {
                      state.clients.filter((c) => (c.nucleusId || "") === n.id)
                        .length
                    }{" "}
                    clientes ·{" "}
                    {
                      state.users.filter(
                        (u) => u.active && u.nucleusIds?.includes(n.id),
                      ).length
                    }{" "}
                    integrantes ativos
                  </small>
                  <span>
                    <b>{ds.length}</b> em andamento
                  </span>
                  <small>
                    {
                      ds.filter((d) => d.management?.complexity === "high")
                        .length
                    }{" "}
                    de alta complexidade ·{" "}
                    {ds.filter((d) => !d.management?.complexity).length} sem
                    classificação
                  </small>
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
                          "",
                          d.owner,
                          ...state.users
                            .filter((u) => u.active)
                            .map((u) => u.name),
                        ]),
                      ].map((n) => (
                        <option key={n} value={n}>
                          {n || UNASSIGNED}
                        </option>
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
