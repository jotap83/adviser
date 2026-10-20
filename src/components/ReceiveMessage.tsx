import { useState } from "react";
import type { InboxEmail } from "../types";
import { useStore } from "../store";
import { incomingExample, contactIsValid } from "../channels";
import { Button, Label, Badge } from "./UI";

export function ReceiveMessage({
  channel,
  onReceive,
  onCancel,
}: {
  channel: "email" | "whatsapp";
  onReceive: (message: InboxEmail) => void;
  onCancel: () => void;
}) {
  const { state } = useStore();
  const [draft, setDraft] = useState(() => incomingExample(state, channel));
  const [withAttachment, setWithAttachment] = useState(true);
  const [scenario, setScenario] = useState("reference");
  return (
    <form
      className="panel receive-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          !draft.text.trim() ||
          !contactIsValid(
            channel === "email" ? "Gmail" : "WhatsApp",
            draft.from,
          )
        )
          return;
        onReceive({
          ...draft,
          subject: draft.subject.trim() || "Nova mensagem",
          text: draft.text.trim(),
          receivedAt: new Date().toISOString(),
          attachments: withAttachment ? draft.attachments : [],
        });
      }}
    >
      <div className="section-heading">
        <h2>
          Demonstrar recebimento por{" "}
          {channel === "email" ? "Gmail" : "WhatsApp"}
        </h2>
        <Badge>Dados fictícios</Badge>
      </div>
      <p className="muted">
        Edite o exemplo para testar o vínculo. Nenhuma conta será conectada.
      </p>
      <div className="form-grid">
        <Label label="Cenário de recebimento">
          <select
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value);
              setDraft(incomingExample(state, channel, e.target.value));
              setWithAttachment(e.target.value === "reference");
            }}
          >
            <option value="reference">Mensagem com referência e anexo</option>
            <option value="ambiguous">Mesmo contato, evento indefinido</option>
          </select>
        </Label>
        <Label
          label={
            channel === "email"
              ? "E-mail de quem enviou"
              : "WhatsApp de quem enviou"
          }
        >
          <input
            required
            type={channel === "email" ? "email" : "tel"}
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          />
        </Label>
      </div>
      <Label
        label={
          channel === "email"
            ? "Assunto recebido"
            : "Título para organizar a mensagem"
        }
      >
        <input
          value={draft.subject}
          onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
        />
      </Label>
      <Label label="Mensagem recebida">
        <textarea
          required
          rows={6}
          value={draft.text}
          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
        />
      </Label>
      {draft.attachments.length > 0 && (
        <label className="check-label">
          <input
            type="checkbox"
            checked={withAttachment}
            onChange={(e) => setWithAttachment(e.target.checked)}
          />
          Incluir briefing-atualizado.pdf · conteúdo fictício
        </label>
      )}
      <div className="actions">
        <Button
          type="submit"
          variant="primary"
          disabled={
            !draft.text.trim() ||
            !contactIsValid(
              channel === "email" ? "Gmail" : "WhatsApp",
              draft.from,
            )
          }
        >
          Receber mensagem simulada
        </Button>
        <Button onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
