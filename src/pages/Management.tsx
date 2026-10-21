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
export { ManagementDashboard as Management } from "../components/ManagementDashboard";

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
              {nucleusLabel(
                state,
                state.clients.find((c) => c.id === demand.clientId),
              )}{" "}
              · {demand.owner || UNASSIGNED}
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
