import { money } from "../domain.mjs";
import { useState } from "react";
import { ArrowRight, Check, Bell } from "lucide-react";
import { useStore, go } from "../store";
import { demoPerson } from "../organization";
import {
  approvalNotifications,
  approvalRoute,
  approvalNoticeRoute,
  approvalStatus,
  decideApproval,
} from "../approval-model";
import { approvalLabels } from "../components/ApprovalRequest";
import { Badge, Button, Empty, Label, Title } from "../components/UI";
import type { ApprovalRequest, Version } from "../types";
export function ApprovalNotices() {
  const { state, setState } = useStore(),
    person = demoPerson(state);
  const notices = approvalNotifications(state, person?.id || "").filter(
    (n) => !state.readApprovalNotifications?.includes(n.id),
  );
  return (
    <section className="panel approval-notices">
      <div className="section-heading">
        <div>
          <h2>Avisos de aprovação</h2>
          <p>
            Para {person?.name || "a pessoa selecionada"} · {notices.length} não
            lidos
          </p>
        </div>
        <Button icon={Bell} onClick={() => go("/aprovacoes")}>
          Central de aprovações
        </Button>
      </div>
      {notices.length ? (
        notices.map((n) => (
          <div className="approval-notice" key={n.id}>
            <div>
              <strong>{n.text}</strong>
              <p>
                {n.pending
                  ? "Abra a central para revisar o registro e decidir."
                  : "O solicitante foi avisado do resultado da revisão."}
              </p>
            </div>
            <Button
              onClick={() => {
                setState((s) => ({
                  ...s,
                  readApprovalNotifications: [
                    ...(s.readApprovalNotifications || []),
                    n.id,
                  ],
                }));
                go(approvalNoticeRoute(n.request));
              }}
            >
              Ler aviso e abrir
            </Button>
          </div>
        ))
      ) : (
        <p className="muted">
          Sem avisos novos para esta pessoa. As solicitações continuam
          disponíveis na central.
        </p>
      )}
    </section>
  );
}
export function Approvals({
  initialView = "mine",
  requestId,
}: {
  initialView?: string;
  requestId?: string;
}) {
  const { state, setState } = useStore(),
    person = demoPerson(state);
  const [view, setView] = useState(initialView);
  const rows = (state.approvals || []).filter((r) =>
    requestId
      ? r.id === requestId
      : view === "all" ||
        (view === "sent" && r.requestedBy === person?.id) ||
        (view === "mine" &&
          r.reviewers.some(
            (x) => x.userId === person?.id && x.decision === "pending",
          ) &&
          approvalStatus(state, r) === "pending"),
  );
  return (
    <>
      <Title
        title="Central de aprovações"
        sub="Briefing, propostas, criativos, contratos, cronogramas, extras, pagamentos e pós-evento."
      />
      {requestId && (
        <Button onClick={() => go("/aprovacoes/todas")}>
          Ver todas as aprovações
        </Button>
      )}
      <div className="workspace-filter-row">
        <Label label="Pessoa simulada">
          <select
            value={person?.id || ""}
            onChange={(e) =>
              setState((s) => ({ ...s, demoUserId: e.target.value }))
            }
          >
            {state.users
              .filter((u) => u.active)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </Label>
        {!requestId && (
          <Label label="Mostrar aprovações">
            <select value={view} onChange={(e) => setView(e.target.value)}>
              <option value="mine">Aguardando minha decisão</option>
              <option value="sent">Solicitadas por mim</option>
              <option value="all">Todas e histórico</option>
            </select>
          </Label>
        )}
      </div>
      <p role="status">
        {rows.length} solicitação(ões) nesta visão · {person?.name}
      </p>
      {rows.map((r) => (
        <ApprovalRow key={`${r.id}-${person?.id}`} record={r} />
      ))}
      {!rows.length && (
        <Empty
          title="Nenhuma aprovação nesta visão"
          text="Solicite a revisão no briefing, proposta, criativo, documentos do evento ou em uma conta a pagar. Troque a pessoa simulada para acompanhar os avisos de cada responsável."
          action={<Button onClick={() => go("/eventos")}>Abrir eventos</Button>}
        />
      )}
    </>
  );
}
function ApprovalRow({ record: r }: { record: ApprovalRequest }) {
  const { state, setState, notify } = useStore(),
    person = demoPerson(state),
    status = approvalStatus(state, r);
  const [comment, setComment] = useState("");
  const mine = r.reviewers.find((x) => x.userId === person?.id),
    canDecide = status === "pending" && mine?.decision === "pending";
  const snapshot = JSON.parse(r.fingerprint);
  return (
    <article className="panel approval-record">
      <div className="section-heading">
        <div>
          <h2>{r.title}</h2>
          <p>
            Solicitada por{" "}
            {state.users.find((u) => u.id === r.requestedBy)?.name ||
              "Pessoa removida"}{" "}
            · {new Date(r.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <Badge tone={status === "approved" ? "green" : "amber"}>
          {approvalLabels[status]}
        </Badge>
      </div>
      <p>
        {r.kind === "proposal"
          ? `Proposta v${snapshot.number} · investimento ${Number(snapshot.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
          : r.kind === "payment"
            ? `Conta a pagar · ${Number(snapshot[3]).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · vencimento ${snapshot[4]}`
            : `Entrega: ${snapshot.title || r.kind}`}
      </p>
      {r.kind === "proposal" ? (
        <ProposalSnapshot version={snapshot as Version} />
      ) : r.kind === "payment" ? (
        <p>
          Evento:{" "}
          {state.productionProjects?.find((p) => p.id === snapshot[0])?.title ||
            "Evento não localizado"}
        </p>
      ) : (
        <details className="approval-snapshot" open>
          <summary>Conteúdo preservado para revisão</summary>
          {Object.entries(snapshot)
            .filter(
              ([key]) =>
                ![
                  "eventId",
                  "clientId",
                  "proposalVersionId",
                  "contractVersion",
                ].includes(key),
            )
            .map(([key, value]) => (
              <div className="review-field" key={key}>
                <strong>
                  {(
                    {
                      title: "Título",
                      content: "Conteúdo",
                      url: "Documento",
                      date: "Data",
                      guests: "Público",
                      budget: "Orçamento",
                      location: "Local",
                      objective: "Objetivo",
                      questions: "Pendências",
                      scope: "Escopo",
                      details: "Detalhes",
                      concept: "Conceito",
                      changes: "Mudanças",
                      number: "Versão",
                      revision: "Versão",
                      createdAt: "Registrado em",
                      at: "Registrado em",
                      fileName: "Arquivo",
                      source: "Origem",
                      operationalPlan: "Plano operacional desta revisão",
                      accounts: "Lançamentos desta revisão",
                    } as Record<string, string>
                  )[key] || key}
                </strong>
                <p>
                  <SnapshotValue value={value} />
                </p>
              </div>
            ))}
        </details>
      )}
      <Button icon={ArrowRight} onClick={() => go(approvalRoute(state, r))}>
        Abrir registro de origem
      </Button>
      <ul className="approval-reviewers">
        {r.reviewers.map((x) => (
          <li key={x.userId}>
            <strong>
              {state.users.find((u) => u.id === x.userId)?.name ||
                "Pessoa removida"}
            </strong>{" "}
            ·{" "}
            {x.decision === "pending"
              ? "Aguardando"
              : x.decision === "approved"
                ? "Aprovou"
                : "Solicitou ajustes"}
            {x.at && ` · ${new Date(x.at).toLocaleString("pt-BR")}`}
            {x.comment && <p>{x.comment}</p>}
          </li>
        ))}
      </ul>
      {canDecide && (
        <>
          <Label
            label="Comentário da revisão"
            hint="Obrigatório ao solicitar ajustes."
          >
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </Label>
          <div className="actions">
            <Button
              variant="primary"
              icon={Check}
              onClick={() => {
                setState((s) =>
                  decideApproval(s, r.id, person!.id, "approved", comment),
                );
                notify(
                  "Decisão registrada na demonstração. A liberação exige a aprovação de todos os responsáveis.",
                );
              }}
            >
              Aprovar esta versão
            </Button>
            <Button
              disabled={!comment.trim()}
              onClick={() => {
                setState((s) =>
                  decideApproval(s, r.id, person!.id, "changes", comment),
                );
                notify(
                  "Ajustes solicitados. O solicitante recebeu um aviso interno.",
                );
              }}
            >
              Solicitar ajustes
            </Button>
          </div>
        </>
      )}
    </article>
  );
}

function ProposalSnapshot({ version: v }: { version: Version }) {
  return (
    <details className="approval-snapshot" open>
      <summary>Conteúdo preservado da proposta v{v.number}</summary>
      <p>
        {v.client} · {v.title} · {v.date || "Data a definir"} ·{" "}
        {v.guests || "Público a definir"} pessoas ·{" "}
        {v.location || "Local a definir"}
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Item / categoria</th>
              <th>Quantidade</th>
              <th>Valor unitário</th>
              <th>Total</th>
              <th>Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {v.lines.map((l) => (
              <tr key={l.id}>
                <td>
                  {l.description}
                  <small className="snapshot-category">{l.category}</small>
                </td>
                <td>{l.qty}</td>
                <td>{money(l.unit)}</td>
                <td>{money(Math.round(l.qty * l.unit * 100) / 100)}</td>
                <td>{l.direct ? "Direto ao fornecedor" : "Via Adviser"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Fee: {v.fee}% · acréscimo: {money(v.tax)} · investimento:{" "}
        <strong>{money(v.total)}</strong>
      </p>
      <h3>Condições desta versão</h3>
      <p className="snapshot-terms">
        {v.terms || "Sem condições registradas."}
      </p>
      <p className="field-hint">
        Cópia preservada no pedido de aprovação. Alterar o rascunho não modifica
        estes dados.
      </p>
    </details>
  );
}

function SnapshotValue({ value }: { value: unknown }): React.ReactNode {
  if (value === null || value === undefined) return "Não informado";
  if (Array.isArray(value))
    return (
      <>
        {value.map((v, i) => (
          <span className="snapshot-value" key={i}>
            <SnapshotValue value={v} />
          </span>
        ))}
      </>
    );
  if (typeof value === "object")
    return (
      <>
        {Object.entries(value)
          .filter(([key]) => !["id", "eventId", "clientId"].includes(key))
          .map(([key, v]) => (
            <span className="snapshot-value" key={key}>
              <strong>
                {(
                  {
                    title: "Título",
                    description: "Descrição",
                    due: "Prazo",
                    owner: "Responsável",
                    phase: "Fase",
                    amount: "Valor",
                    direction: "Pagar / receber",
                    settled: "Baixado",
                    documentRef: "Documento",
                    included: "Incluído",
                    answers: "Respostas",
                  } as Record<string, string>
                )[key] || key}
                :{" "}
              </strong>
              <SnapshotValue value={v} />
            </span>
          ))}
      </>
    );
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
}
