import { useState } from "react";
import { ArrowRight, Plus, Check, Bell } from "lucide-react";
import type { Demand, DocumentKind } from "../types";
import { useStore, go } from "../store";
import { uid } from "../data";
import { money, totals } from "../domain.mjs";
import { Badge, Button, Label, Note, Empty } from "../components/UI";
import { approvalStatus } from "../approval-model";
import {
  phaseSteps,
  eventPhase,
  eventPhaseLabel,
  eventProject,
  ensureEventProject,
  contractReady,
  executionLabels,
  closureIssues,
  documentReady,
  latestDocument,
} from "../event-lifecycle";
import { EventDocuments } from "./EventDocuments";
import { Handoff } from "./Proposal";
import { IntelligenceEntry } from "../components/Intelligence";
import { projectFromHandoff } from "../production-model";

export function EventOverview({ d }: { d: Demand }) {
  const { state, updateDemand } = useStore();
  const phase = eventPhase(state, d),
    p = eventProject(state, d.id),
    requests =
      state.eventRequests?.filter(
        (r) => r.eventId === d.id && r.status !== "done",
      ) || [],
    approvals = (state.approvals || []).filter(
      (r) => r.targetId === d.id && approvalStatus(state, r) === "pending",
    );
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Ciclo do evento</h2>
          <p>
            O mesmo evento desde o primeiro pedido até a prestação de contas.
            Solicitações e documentos continuam vinculados a ele.
          </p>
        </div>
        <Badge tone={phase === "closed" ? "green" : "blue"}>
          {eventPhaseLabel(state, d)}
        </Badge>
      </div>
      <div className="event-summary">
        <div>
          <strong>{requests.length}</strong>
          <span>solicitações abertas</span>
          <Button
            variant="ghost"
            onClick={() => go(`/eventos/${d.id}/requests`)}
          >
            Acompanhar solicitações
          </Button>
        </div>
        <div>
          <strong>{approvals.length}</strong>
          <span>revisões internas pendentes</span>
          <Button variant="ghost" onClick={() => go("/aprovacoes/todas")}>
            Ver aprovações
          </Button>
        </div>
        <div>
          <strong>
            {p?.tasks.filter((t) => t.status !== "done").length || 0}
          </strong>
          <span>tarefas operacionais abertas</span>
          <Button
            variant="ghost"
            onClick={() => go(`/eventos/${d.id}/production`)}
          >
            Planejar produção
          </Button>
        </div>
      </div>
      <div className="event-overview-grid">
        <section className="panel lifecycle-path">
          <h3>Do pedido à entrega</h3>
          {phaseSteps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => go(`/eventos/${d.id}/${step.tab}`)}
              aria-current={phase === step.id ? "step" : undefined}
            >
              <span className="lifecycle-number">{i + 1}</span>
              <span>
                <strong>{step.label}</strong>
                <small>{step.detail}</small>
              </span>
              <ArrowRight size={17} />
            </button>
          ))}
          <p className="field-hint">
            As etapas indicam o ciclo. Visitas técnicas podem acontecer antes do
            contrato; financeiro acompanha o evento ao longo do trabalho.
          </p>
        </section>
        <aside className="panel">
          <h3>Origem e responsabilidade</h3>
          <Label label="Origem da oportunidade">
            <select
              value={d.origin || ""}
              onChange={(e) =>
                updateDemand(
                  d.id,
                  { origin: e.target.value },
                  "Origem da oportunidade atualizada.",
                )
              }
            >
              <option value="">A identificar</option>
              {[
                "Indicação",
                "Prospecção ativa",
                "Demanda espontânea",
                "Cliente recorrente",
                "Contrato em andamento",
                "Renovação / sazonalidade",
                "Concorrência",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Label>
          <p>
            Responsável pelo evento:{" "}
            <strong>{d.owner || "A distribuir"}</strong>
          </p>
          <p>Canal inicial: {d.source}</p>
          <h3>Pedido que iniciou o evento</h3>
          <p className="document-content">
            {d.message || "Registre a mensagem inicial no briefing."}
          </p>
          <Button onClick={() => go(`/eventos/${d.id}/briefing`)}>
            Conferir briefing e fontes
          </Button>
          <hr />
          <h3>Financeiro durante o ciclo</h3>
          <p>
            Orçamento, compromissos e valores realizados no contexto deste
            evento.
          </p>
          <Button onClick={() => go(`/eventos/${d.id}/finance`)}>
            Abrir financeiro do evento
          </Button>
        </aside>
      </div>
      <section className="panel">
        <h3>Últimos registros do evento</h3>
        {d.history.slice(0, 5).map((h, i) => (
          <p key={i}>
            <time>{h.at}</time> · {h.text}
          </p>
        ))}
      </section>
    </>
  );
}
export function EventContracts({ d }: { d: Demand }) {
  const { state } = useStore();
  return (
    <>
      <Note>
        O evento já existe. Esta fase formaliza o escopo aceito, os contratos e
        o repasse para execução. Cotação escolhida não confirma contratação.
      </Note>
      <EventDocuments d={d} kinds={["contract", "supplier_contract"]} />
      <div className="lifecycle-section">
        <Handoff d={d} />
      </div>
      {!contractReady(state, d) && (
        <p className="field-hint">
          A liberação da execução exige uma proposta aceita e a versão atual do
          contrato aprovada internamente, com assinatura do cliente registrada.
        </p>
      )}
    </>
  );
}
export function EventProduction({ d }: { d: Demand }) {
  const { state, setState, updateDemand, notify } = useStore();
  const p = eventProject(state, d.id);
  const [section, setSection] = useState("tasks"),
    [title, setTitle] = useState(""),
    [due, setDue] = useState("");
  const [phaseError, setPhaseError] = useState("");
  const ready = contractReady(state, d);
  function createVisit() {
    if (!title.trim()) return;
    setState((s) => {
      const next = ensureEventProject(s, d.id),
        p = eventProject(next, d.id)!;
      return {
        ...next,
        productionProjects: next.productionProjects?.map((x) =>
          x.id === p.id
            ? {
                ...x,
                tasks: [
                  ...x.tasks,
                  {
                    id: uid(),
                    title: title.trim(),
                    description:
                      "Atividade de viabilidade antes do fechamento; não representa contratação.",
                    status: "todo",
                    owner: d.owner,
                    due,
                    phase: "Visita técnica / viabilidade",
                    priority: "normal",
                    supplier: "",
                    blockedReason: "",
                    checklist: [],
                    comments: [],
                    activity: [
                      {
                        text: "Visita técnica registrada no evento.",
                        at: new Date().toISOString(),
                      },
                    ],
                  },
                ],
              }
            : x,
        ),
      };
    });
    setTitle("");
    notify("Atividade criada no quadro do mesmo evento.");
  }
  function open() {
    setState((s) => ensureEventProject(s, d.id));
    go(`/operacoes/${p?.id || `project-${d.id}`}`);
  }
  function receive() {
    if (!ready) return;
    setState((s) => {
      const current = s.demands.find((x) => x.id === d.id)!;
      const updated = { ...current, handoff: true };
      let next = ensureEventProject(
        { ...s, demands: s.demands.map((x) => (x.id === d.id ? updated : x)) },
        d.id,
      );
      const snapshot = projectFromHandoff(updated, next),
        p = eventProject(next, d.id)!;
      return snapshot
        ? {
            ...next,
            productionProjects: next.productionProjects?.map((x) =>
              x.id === p.id
                ? {
                    ...x,
                    source: snapshot.source,
                    tasks: x.tasks.length ? x.tasks : snapshot.tasks,
                  }
                : x,
            ),
          }
        : s;
    });
    notify(
      "Repasse preservado na operação existente. Nenhum evento duplicado.",
    );
  }
  function advance(value: Demand["executionPhase"]) {
    setPhaseError("");
    if (value && value !== "planning" && !ready) {
      setPhaseError(
        "Conclua a proposta aceita e o contrato antes da execução.",
      );
      return;
    }
    if (
      ["setup", "live"].includes(value || "") &&
      !documentReady(state, latestDocument(state, d.id, "schedule"))
    ) {
      setPhaseError(
        "Aprove o cronograma internamente e registre a validação do cliente antes da montagem.",
      );
      return;
    }
    if (
      value === "live" &&
      (state.eventDocuments || []).some(
        (doc) =>
          doc.eventId === d.id &&
          ["material", "supplier_contract"].includes(doc.kind) &&
          !(state.eventDocuments || []).some(
            (newer) => newer.previousId === doc.id,
          ) &&
          !documentReady(state, doc),
      )
    ) {
      setPhaseError(
        "Há materiais ou contratos de fornecedores com revisão pendente.",
      );
      return;
    }
    updateDemand(
      d.id,
      { executionPhase: value },
      `Operação: ${executionLabels[value || "planning"]}.`,
    );
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Produção e execução</h2>
          <p>
            Atendimento/produção acompanha o evento. A área global de Operações
            reúne o trabalho de todos os eventos.
          </p>
        </div>
        <Button icon={ArrowRight} onClick={open}>
          Abrir quadro operacional
        </Button>
      </div>
      <IntelligenceEntry ids={["operations"]} contextId={p?.id} />
      {!ready && (
        <Note>
          Visitas técnicas e análise de viabilidade podem começar antes do
          fechamento. A contratação e a execução dependem do escopo aceito e dos
          contratos.
        </Note>
      )}
      <div className="workspace-filter-row">
        <Label label="Fase operacional do evento">
          <select
            value={d.executionPhase || "planning"}
            onChange={(e) =>
              advance(e.target.value as Demand["executionPhase"])
            }
          >
            {Object.entries(executionLabels)
              .filter(([id]) => id !== "closed")
              .map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
          </select>
        </Label>
        <Button disabled={!ready || !!p?.source} onClick={receive}>
          {p?.source ? "Repasse preservado" : "Confirmar repasse para execução"}
        </Button>
      </div>
      {phaseError && <Note tone="error">{phaseError}</Note>}
      <nav className="event-subnav" aria-label="Frentes de produção">
        {[
          ["tasks", "Visitas e tarefas"],
          ["schedule", "Cronograma"],
          ["material", "Materiais criativos"],
          ["extra", "Extras e estouros"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            aria-current={section === id ? "page" : undefined}
          >
            {label}
          </button>
        ))}
      </nav>
      {section === "tasks" ? (
        <section className="panel">
          <h3>Atividade de viabilidade / visita técnica</h3>
          <div className="form-grid">
            <Label label="Descrição da visita ou atividade">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: vistoriar acesso para montagem"
              />
            </Label>
            <Label label="Data da atividade">
              <input
                value={due}
                onChange={(e) => setDue(e.target.value)}
                type="date"
              />
            </Label>
          </div>
          <Button icon={Plus} disabled={!title.trim()} onClick={createVisit}>
            Adicionar ao quadro do evento
          </Button>
          <h3>Tarefas do evento</h3>
          {p?.tasks.length ? (
            p.tasks.map((t) => (
              <div className="lifecycle-task" key={t.id}>
                <strong>{t.title}</strong>
                <span>
                  {t.phase} · {t.owner || "A distribuir"} ·{" "}
                  {t.due || "Sem prazo"}
                </span>
                <Badge tone={t.status === "done" ? "green" : "blue"}>
                  {
                    {
                      todo: "A fazer",
                      doing: "Em andamento",
                      waiting: "Aguardando",
                      done: "Concluída",
                    }[t.status]
                  }
                </Badge>
              </div>
            ))
          ) : (
            <p className="muted">
              Nenhuma tarefa. Registre uma visita ou abra o quadro para planejar
              o trabalho.
            </p>
          )}
        </section>
      ) : (
        <EventDocuments
          key={section}
          d={d}
          kinds={
            section === "extra"
              ? ["extra", "supplier_over_budget"]
              : [section as DocumentKind]
          }
        />
      )}
    </>
  );
}
export function EventPost({ d }: { d: Demand }) {
  const { state, updateDemand, notify } = useStore();
  const issues = closureIssues(state, d),
    p = eventProject(state, d.id),
    entries = (state.financeEntries || []).filter((e) => e.projectId === p?.id);
  const v = d.versions.find((v) => v.id === d.acceptedVersion),
    t = v ? totals(v.lines, v.fee, v.tax) : null;
  const paid = entries
      .filter((e) => e.direction === "pay" && e.settled)
      .reduce((n, e) => n + e.amount, 0),
    received = entries
      .filter((e) => e.direction === "receive" && e.settled)
      .reduce((n, e) => n + e.amount, 0);
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Pós-evento e fechamento</h2>
          <p>
            Resultados, prestação de contas, satisfação e próximos passos com o
            cliente.
          </p>
        </div>
        <Badge tone={d.executionPhase === "closed" ? "green" : "blue"}>
          {d.executionPhase === "closed" ? "Encerrado" : "Em acompanhamento"}
        </Badge>
      </div>
      <div className="global-summary">
        <span>
          Orçamento via Adviser:{" "}
          <strong>{t ? money(t.invoice) : "Sem versão aceita"}</strong>
        </span>
        <span>
          Recebido: <strong>{money(received)}</strong>
        </span>
        <span>
          Pago: <strong>{money(paid)}</strong>
        </span>
        <span>
          Saldo realizado: <strong>{money(received - paid)}</strong>
        </span>
      </div>
      <p className="field-hint">
        Saldo de caixa não é lucro. A prestação de contas precisa considerar
        custos, impostos e documentos pendentes.
      </p>
      <EventDocuments d={d} kinds={["report", "accountability"]} />
      <section className="panel lifecycle-section">
        <h3>Satisfação e continuidade comercial</h3>
        <div className="form-grid">
          <Label label="Nota do cliente (0 a 10)">
            <input
              type="number"
              min="0"
              max="10"
              value={d.briefingDetails?.postRating || ""}
              onChange={(e) =>
                updateDemand(d.id, {
                  briefingDetails: {
                    ...d.briefingDetails,
                    postRating: e.target.value,
                  },
                })
              }
            />
          </Label>
          <Label label="Próximo contato comercial">
            <input
              type="date"
              value={d.briefingDetails?.postFollowup || ""}
              onChange={(e) =>
                updateDemand(d.id, {
                  briefingDetails: {
                    ...d.briefingDetails,
                    postFollowup: e.target.value,
                  },
                })
              }
            />
          </Label>
        </div>
        <Label label="Feedback, lições aprendidas e próximo evento">
          <textarea
            rows={4}
            value={d.briefingDetails?.postFeedback || ""}
            onChange={(e) =>
              updateDemand(d.id, {
                briefingDetails: {
                  ...d.briefingDetails,
                  postFeedback: e.target.value,
                },
              })
            }
          />
        </Label>
        <p className="field-hint">
          Registro manual. A nota só representa uma resposta registrada; não há
          pesquisa enviada automaticamente.
        </p>
      </section>
      <section className="panel">
        <h3>Conferência para encerramento</h3>
        {issues.length ? (
          <ul>
            {issues.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : (
          <p>
            Documentos validados, solicitações e tarefas concluídas, sem contas
            em aberto.
          </p>
        )}
        <Button
          icon={Check}
          variant="primary"
          disabled={!!issues.length || d.executionPhase === "closed"}
          onClick={() => {
            if (closureIssues(state, d).length) return;
            updateDemand(
              d.id,
              { executionPhase: "closed" },
              "Evento encerrado após conferência do pós-evento e das contas.",
            );
            notify("Encerramento registrado. Histórico preservado.");
          }}
        >
          Encerrar evento
        </Button>
      </section>
    </>
  );
}
export function EventFinanceStart({ d }: { d: Demand }) {
  const { state, setState } = useStore();
  const p = eventProject(state, d.id);
  return (
    <Empty
      title="Financeiro do evento"
      text="O planejamento financeiro acompanha o evento desde o orçamento. Abra o espaço financeiro para registrar compromissos, parcelas e documentos."
      action={
        <Button
          variant="primary"
          onClick={() => {
            setState((s) => ensureEventProject(s, d.id));
            go(`/financeiro/${p?.id || `project-${d.id}`}`);
          }}
        >
          Abrir acompanhamento financeiro
        </Button>
      }
    />
  );
}
export function LifecycleManagement() {
  const { state } = useStore();
  return (
    <section className="panel lifecycle-management">
      <div className="section-heading">
        <div>
          <h2>Carteira por ciclo do evento</h2>
          <p>
            Da oportunidade ao pós-evento, com a mesma referência entre áreas.
          </p>
        </div>
        <Button onClick={() => go("/eventos")}>Abrir eventos</Button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Evento</th>
              <th>Fase</th>
              <th>Responsável</th>
              <th>Solicitações</th>
              <th>Aprovações pendentes</th>
            </tr>
          </thead>
          <tbody>
            {state.demands.map((d) => (
              <tr key={d.id}>
                <td>
                  <button
                    className="portfolio-link"
                    onClick={() => go(`/eventos/${d.id}/overview`)}
                  >
                    {d.title}
                  </button>
                  <small>{d.reference}</small>
                </td>
                <td>{eventPhaseLabel(state, d)}</td>
                <td>{d.owner || "A distribuir"}</td>
                <td>
                  {state.eventRequests?.filter(
                    (r) => r.eventId === d.id && r.status !== "done",
                  ).length || 0}
                </td>
                <td>
                  {state.approvals?.filter(
                    (r) =>
                      r.targetId === d.id &&
                      approvalStatus(state, r) === "pending",
                  ).length || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
