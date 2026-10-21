import { useEffect, useRef, useState } from "react";
import type { Demand, ManagementEvent } from "../types";
import { useStore } from "../store";
import { Button, Label, Note } from "./UI";
import {
  decisionEvent,
  firstContact,
  firstSent,
  forecast,
  instant,
  lossReasons,
  proposalVersion,
  revisionReasons,
} from "../management-model";
import { money, totals } from "../domain.mjs";
const localDateTime = (n?: number) =>
  n === undefined
    ? ""
    : new Date(n - new Date(n).getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 16);
export function ManagementRecordEditor({
  d,
  onClose,
}: {
  d: Demand;
  onClose: () => void;
}) {
  const { updateDemand, notify } = useStore();
  const heading = useRef<HTMLHeadingElement>(null),
    [error, setError] = useState("");
  const version = proposalVersion(d),
    prediction = forecast(d);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "center" });
  }, []);
  return (
    <section className="panel management-record-editor">
      <div className="section-heading">
        <div>
          <h2 tabIndex={-1} ref={heading}>
            Revisar registro · {d.title}
          </h2>
          <p>
            Registro manual para completar o histórico e as premissas da
            demonstração.
          </p>
        </div>
        <Button onClick={onClose}>Fechar</Button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const value = (key: string) => String(form.get(key) || "");
          const sent = firstSent(d),
            decision = decisionEvent(d);
          const parsed = (key: string, original?: string) =>
            value(key) === localDateTime(instant(original))
              ? original
              : value(key)
                ? new Date(value(key)).toISOString()
                : undefined;
          const start =
              value("contact") === localDateTime(firstContact(d))
                ? d.management?.firstContactAt
                : parsed("contact", d.management?.firstContactAt),
            sentAt = d.sentVersion ? parsed("sent", sent?.at) : sent?.at,
            decidedAt = parsed("decision", decision?.at);
          const effectiveStart =
            start ||
            (firstContact(d) !== undefined
              ? new Date(firstContact(d)!).toISOString()
              : undefined);
          if (
            [start, sentAt, decidedAt].some(
              (v) => v && instant(v)! > Date.now(),
            )
          ) {
            setError("Os marcos já ocorridos não podem ter uma data futura.");
            return;
          }
          if (
            (effectiveStart && sentAt && effectiveStart > sentAt) ||
            (sentAt && decidedAt && sentAt > decidedAt) ||
            (effectiveStart && decidedAt && effectiveStart > decidedAt)
          ) {
            setError(
              "Confira a ordem: primeiro contato, primeiro envio e decisão.",
            );
            return;
          }
          let events: ManagementEvent[] = (d.management?.events || []).filter(
            (event) => event !== sent && event !== decision,
          );
          if (sentAt && (d.sentVersion || sent))
            events.push({
              kind: "proposal_sent",
              at: sentAt,
              versionId: sent?.versionId || d.sentVersion,
              dueAt: sent?.dueAt || value("due") || undefined,
            });
          if (
            decidedAt &&
            (d.decision === "accepted" || d.decision === "declined")
          )
            events.push({
              kind: d.decision,
              at: decidedAt,
              versionId:
                decision?.versionId || d.acceptedVersion || d.sentVersion,
              reason: d.decision === "declined" ? value("loss") : undefined,
            });
          const lastRevision = events
            .filter((event) => event.kind === "revision")
            .sort((a, b) => a.at.localeCompare(b.at))
            .at(-1);
          if (lastRevision)
            events = events.map((event) =>
              event === lastRevision
                ? { ...event, reason: value("revision") }
                : event,
            );
          const hasCosts = value("internal") !== "" && value("other") !== "";
          const costs =
            hasCosts && version
              ? {
                  versionId: version.id,
                  internalCost: Number(value("internal")),
                  otherCost: Number(value("other")),
                }
              : undefined;
          if ((value("internal") !== "") !== (value("other") !== "")) {
            setError(
              "Informe os dois custos, inclusive zero quando confirmado. Deixe ambos vazios se ainda não houver previsão.",
            );
            return;
          }
          if (
            costs &&
            (!Number.isFinite(costs.internalCost) ||
              !Number.isFinite(costs.otherCost) ||
              costs.internalCost < 0 ||
              costs.otherCost < 0)
          ) {
            setError(
              "Os custos previstos precisam ser números positivos ou zero.",
            );
            return;
          }
          updateDemand(
            d.id,
            {
              management: {
                ...d.management,
                firstContactAt: start,
                proposalDueAt: value("due") || undefined,
                complexity:
                  (value("complexity") as "standard" | "high") || undefined,
                waitingOn:
                  (value("waiting") as "team" | "client" | "supplier") ||
                  undefined,
                lossReason: value("loss"),
                revisionReason: value("revision"),
                events: events.sort((a, b) => a.at.localeCompare(b.at)),
                forecast: costs,
              },
            },
            "Marcos e premissas revisados no Painel Gerencial.",
          );
          notify("Registro atualizado. Os indicadores foram recalculados.");
          onClose();
        }}
      >
        <div className="insight-form-grid">
          <Label
            label="Primeiro contato do cliente"
            hint="A mensagem recebida mais antiga também é considerada."
          >
            <input
              name="contact"
              type="datetime-local"
              defaultValue={localDateTime(firstContact(d))}
            />
          </Label>
          <Label
            label="Primeiro envio da proposta"
            hint="Informe o envio real, não a criação do rascunho."
          >
            <input
              name="sent"
              type="datetime-local"
              disabled={!d.sentVersion}
              defaultValue={localDateTime(instant(firstSent(d)?.at))}
            />
          </Label>
          <Label
            label="Aceite ou recusa registrados"
            hint="Disponível após registrar a decisão na demanda."
          >
            <input
              name="decision"
              type="datetime-local"
              disabled={!["accepted", "declined"].includes(d.decision)}
              defaultValue={localDateTime(instant(decisionEvent(d)?.at))}
            />
          </Label>
        </div>
        <div className="insight-form-grid">
          <Label
            label="Compromisso para o primeiro envio"
            hint="O prazo fica preservado quando o envio é registrado."
          >
            <input
              name="due"
              type="date"
              defaultValue={d.management?.proposalDueAt || ""}
            />
          </Label>
          <Label label="Complexidade informada">
            <select
              name="complexity"
              defaultValue={d.management?.complexity || ""}
            >
              <option value="">A classificar</option>
              <option value="standard">Padrão</option>
              <option value="high">Alta</option>
            </select>
          </Label>
          <Label label="Aguardando quem?">
            <select name="waiting" defaultValue={d.management?.waitingOn || ""}>
              <option value="">A identificar</option>
              <option value="team">Equipe Adviser</option>
              <option value="client">Cliente</option>
              <option value="supplier">Fornecedor</option>
            </select>
          </Label>
          <Label label="Motivo da recusa">
            <select name="loss" defaultValue={d.management?.lossReason || ""}>
              <option value="">Sem classificação</option>
              {lossReasons.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Label>
          <Label label="Motivo da última revisão">
            <select
              name="revision"
              defaultValue={d.management?.revisionReason || ""}
            >
              <option value="">Sem classificação</option>
              {revisionReasons.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Label>
        </div>
        <div className="forecast-editor">
          <h3>Premissas de resultado previsto</h3>
          {version ? (
            <>
              <p>
                Versão {version.number}{" "}
                {d.decision === "accepted" ? "aceita" : "enviada"} · evento{" "}
                {money(version.total)} · remuneração da agência{" "}
                {money(totals(version.lines, version.fee, version.tax).fee)}.
              </p>
              <div className="insight-form-grid">
                <Label label="Custo interno estimado (R$)">
                  <input
                    name="internal"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={prediction?.internalCost ?? ""}
                    placeholder="Ainda não estimado"
                  />
                </Label>
                <Label label="Outros custos estimados (R$)">
                  <input
                    name="other"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={prediction?.otherCost ?? ""}
                    placeholder="Ainda não estimado"
                  />
                </Label>
              </div>
              <p className="field-hint">
                Considere apenas custos suportados pela remuneração da agência,
                sem duplicar os fornecedores já repassados. Informar zero é
                diferente de não ter estimativa. Uma nova versão exige revisar
                essas premissas.
              </p>
            </>
          ) : (
            <p>
              Envie uma versão da proposta para vincular a previsão aos valores
              negociados.
            </p>
          )}
        </div>
        {error && (
          <div role="alert">
            <Note tone="warning">{error}</Note>
          </div>
        )}
        <div className="actions">
          <Button type="submit" variant="primary">
            Salvar registro e recalcular
          </Button>
          <Button onClick={onClose}>Cancelar</Button>
        </div>
      </form>
    </section>
  );
}
