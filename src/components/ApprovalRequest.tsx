import { useState } from "react";
import { Bell, ArrowRight } from "lucide-react";
import { useStore, go } from "../store";
import { demoPerson } from "../organization";
import {
  approvalStatus,
  latestApproval,
  requestApproval,
  type ApprovalTarget,
} from "../approval-model";
import { Badge, Button } from "./UI";
export const approvalLabels = {
  pending: "Aguardando aprovação",
  approved: "Aprovação concluída",
  changes: "Ajustes solicitados",
  outdated: "Dados alterados · revisar novamente",
};
export function ApprovalRequestPanel({ target }: { target: ApprovalTarget }) {
  const { state, setState, notify } = useStore(),
    person = demoPerson(state);
  const [selected, setSelected] = useState<string[]>([]);
  const record = latestApproval(state, target),
    status = record ? approvalStatus(state, record) : undefined;
  const canRequest = !status || status === "changes" || status === "outdated";
  const eligible = state.users.filter((u) => u.active && u.id !== person?.id);
  return (
    <section className="approval-request" aria-label="Aprovação interna">
      <div className="section-heading">
        <h3>
          {target.kind === "proposal"
            ? "Aprovação interna da proposta"
            : "Aprovação do pagamento"}
        </h3>
        {status && (
          <Badge tone={status === "approved" ? "green" : "amber"}>
            {approvalLabels[status]}
          </Badge>
        )}
      </div>
      {record && (
        <p>
          {record.reviewers
            .map(
              (r) =>
                `${state.users.find((u) => u.id === r.userId)?.name || "Pessoa removida"}: ${r.decision === "approved" ? "aprovou" : r.decision === "changes" ? "pediu ajustes" : "aguardando"}${r.comment ? ` — ${r.comment}` : ""}`,
            )
            .join(" · ")}
        </p>
      )}
      {canRequest ? (
        <>
          <p>
            Selecione quem deve aprovar. Todos precisam revisar esta versão;
            cada pessoa recebe um aviso na central.
          </p>
          <fieldset className="reviewer-options">
            <legend>Responsáveis pela aprovação</legend>
            {eligible.map((u) => (
              <label key={u.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(u.id)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, u.id]
                        : selected.filter((id) => id !== u.id),
                    )
                  }
                />
                {u.name} · {u.role}
              </label>
            ))}
            {!eligible.length && (
              <p>Cadastre outra pessoa ativa em Equipe e IA para revisar.</p>
            )}
          </fieldset>
          <Button
            icon={Bell}
            disabled={!selected.some((id) => eligible.some((u) => u.id === id))}
            onClick={() => {
              setState((s) =>
                requestApproval(s, target, person?.id || "", selected),
              );
              setSelected([]);
              notify(
                "Aprovação solicitada. Avisos internos criados para os responsáveis na demonstração.",
              );
            }}
          >
            Solicitar aprovação e avisar
          </Button>
        </>
      ) : (
        <Button icon={ArrowRight} onClick={() => go("/aprovacoes")}>
          Acompanhar na central de aprovações
        </Button>
      )}
      <p className="field-hint">
        Avisos locais neste protótipo. E-mail e WhatsApp não são enviados. A
        pessoa simulada não é uma autenticação.
      </p>
    </section>
  );
}
