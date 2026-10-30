import { useState } from "react";
import type { ClientDecision as Decision } from "../types";
import { Button, Label, Note, Badge } from "./UI";
export function ClientDecisionPanel({
  value,
  fingerprint,
  onChange,
  contract = false,
  disabled = false,
}: {
  value?: Decision;
  fingerprint: string;
  onChange: (v: Decision) => void;
  contract?: boolean;
  disabled?: boolean;
}) {
  const [by, setBy] = useState(""),
    [evidence, setEvidence] = useState("");
  const current = value?.fingerprint === fingerprint;
  const save = (decision: "approved" | "changes") =>
    onChange({
      by: by.trim(),
      evidence: evidence.trim(),
      decision,
      at: new Date().toISOString(),
      fingerprint,
    });
  return (
    <section className="client-decision">
      <h3>{contract ? "Assinatura do cliente" : "Decisão do cliente"}</h3>
      <p>
        Registre o retorno recebido por e-mail, WhatsApp ou reunião. O protótipo
        não envia mensagens nem coleta assinaturas.
      </p>
      {value && (
        <Note
          tone={
            current && value.decision === "approved" ? "success" : "warning"
          }
        >
          <Badge
            tone={current && value.decision === "approved" ? "green" : "amber"}
          >
            {!current
              ? "Conteúdo alterado · confirmar novamente"
              : value.decision === "approved"
                ? "Cliente aprovou"
                : "Cliente pediu ajustes"}
          </Badge>
          <p>
            {value.by} · {new Date(value.at).toLocaleString("pt-BR")}
          </p>
          <p>{value.evidence}</p>
        </Note>
      )}
      <div className="form-grid">
        <Label label="Quem respondeu pelo cliente">
          <input value={by} onChange={(e) => setBy(e.target.value)} />
        </Label>
        <Label
          label={
            contract
              ? "Evidência da assinatura / contrato"
              : "Resposta e evidência da decisão"
          }
        >
          <textarea
            rows={3}
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="Registre o retorno e a referência do documento ou conversa."
          />
        </Label>
      </div>
      <div className="actions">
        <Button
          disabled={disabled || !by.trim() || !evidence.trim() || !fingerprint}
          variant="primary"
          onClick={() => save("approved")}
        >
          {contract
            ? "Registrar assinatura do cliente"
            : "Registrar aprovação do cliente"}
        </Button>
        <Button
          disabled={disabled || !by.trim() || !evidence.trim() || !fingerprint}
          onClick={() => save("changes")}
        >
          Registrar pedido de ajustes
        </Button>
      </div>
      {disabled && (
        <p className="field-hint">
          Conclua a revisão interna desta versão antes de registrar a decisão do
          cliente.
        </p>
      )}
    </section>
  );
}
