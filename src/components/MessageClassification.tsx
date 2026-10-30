import { useState } from "react";
import { Sparkles, Check } from "lucide-react";
import type {
  InboxEmail,
  MessageClassification as Classification,
  MessageKind,
} from "../types";
import { classifyMessage, messageKinds } from "../message-classification";
import { useStore } from "../store";
import { Badge, Button, Label } from "./UI";
export function MessageClassification({
  email,
  onContinue,
}: {
  email: InboxEmail;
  onContinue?: () => void;
}) {
  const { state, setState, notify } = useStore();
  const [draft, setDraft] = useState<Classification>(
    email.classification ||
      (state.aiMode !== "offline"
        ? classifyMessage(email)
        : {
            kind: "other",
            urgent: false,
            reason: "Classifique manualmente ou peça uma sugestão.",
            reviewed: false,
          }),
  );
  return (
    <section
      className="classification-box"
      aria-label="Classificação da mensagem"
    >
      <div className="section-heading">
        <h3>Que tipo de pedido chegou?</h3>
        <Badge tone={email.classification?.reviewed ? "green" : "blue"}>
          {email.classification?.reviewed ? "Revisada" : "IA · demonstração"}
        </Badge>
      </div>
      <p className="field-hint">
        {state.aiMode === "offline"
          ? ""
          : "A IA sugeriu a classificação abaixo. Revise antes de continuar. Sugestão simulada."}
        {state.aiMode === "offline"
          ? " IA indisponível. A classificação manual continua disponível."
          : ""}
      </p>
      <Label label="Tipo de solicitação">
        <select
          value={draft.kind}
          onChange={(e) =>
            setDraft({
              ...draft,
              kind: e.target.value as MessageKind,
              reviewed: false,
            })
          }
        >
          {Object.entries(messageKinds).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Label>
      <p className="muted" role="status">
        {draft.reason}
      </p>
      <label className="check-line">
        <input
          type="checkbox"
          checked={draft.urgent}
          onChange={(e) => setDraft({ ...draft, urgent: e.target.checked })}
        />
        Priorizar na triagem
      </label>
      <Button
        variant="primary"
        icon={Check}
        onClick={() => {
          setState((s) => ({
            ...s,
            inbox: s.inbox?.map((m) =>
              m.id === email.id
                ? { ...m, classification: { ...draft, reviewed: true } }
                : m,
            ),
          }));
          notify(
            "Classificação revisada. Escolha criar um evento ou vincular a um existente.",
          );
          onContinue?.();
        }}
      >
        Confirmar e continuar
      </Button>
      <details className="service-disclosure">
        <summary>Revisar sugestão da IA</summary>
        <Button
          icon={Sparkles}
          disabled={state.aiMode === "offline"}
          onClick={() => setDraft(classifyMessage(email))}
        >
          Gerar sugestão novamente
        </Button>
      </details>
    </section>
  );
}
