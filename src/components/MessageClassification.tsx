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
export function MessageClassification({ email }: { email: InboxEmail }) {
  const { state, setState, notify } = useStore();
  const [draft, setDraft] = useState<Classification>(
    email.classification || {
      kind: "other",
      urgent: false,
      reason: "Classifique manualmente ou peça uma sugestão.",
      reviewed: false,
    },
  );
  return (
    <section
      className="classification-box"
      aria-label="Classificação da mensagem"
    >
      <div className="section-heading">
        <h3>Classificação da mensagem</h3>
        <Badge tone={email.classification?.reviewed ? "green" : "blue"}>
          {email.classification?.reviewed ? "Revisada" : "IA · demonstração"}
        </Badge>
      </div>
      <Button
        icon={Sparkles}
        disabled={state.aiMode === "offline"}
        onClick={() => setDraft(classifyMessage(email))}
      >
        Classificar com IA
      </Button>
      <p className="field-hint">
        Sugestão simulada por regras, sujeita à sua revisão.
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
        }}
      >
        Confirmar classificação
      </Button>
    </section>
  );
}
