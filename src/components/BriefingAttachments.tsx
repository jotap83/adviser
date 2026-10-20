import { useRef, useState } from "react";
import { Paperclip, FileText, Trash2, AlertCircle } from "lucide-react";
import type { Demand, BriefingAttachment } from "../types";
import { readBriefingFile } from "../attachments";
import { useStore } from "../store";
import { Button, Label, Badge } from "./UI";

export function BriefingAttachments({
  d,
  invalidate,
}: {
  d: Demand;
  invalidate: () => void;
}) {
  const { updateDemand, notify } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [messageId, setMessageId] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const files = d.attachments || [];
  function change(id: string, patch: Partial<BriefingAttachment>) {
    invalidate();
    updateDemand(d.id, (current) => ({
      ...current,
      briefingValid: false,
      attachments: (current.attachments || []).map((a) =>
        a.id === id ? { ...a, ...patch } : a,
      ),
    }));
  }
  return (
    <div className="briefing-attachments">
      <div className="section-heading">
        <h4>Anexos do e-mail</h4>
        <Badge>
          {files.length} arquivo{files.length === 1 ? "" : "s"}
        </Badge>
      </div>
      <p className="field-hint">
        Adicione os arquivos recebidos no Gmail. O texto lido entra na análise
        junto com a mensagem.
      </p>
      {(d.conversation || []).some((m) => m.direction === "in") && (
        <Label label="Origem dos próximos anexos">
          <select
            value={messageId}
            onChange={(e) => setMessageId(e.target.value)}
          >
            <option value="">Mensagem inicial</option>
            {(d.conversation || [])
              .filter((m) => m.direction === "in")
              .map((m, i) => (
                <option key={m.id} value={m.id}>
                  Retorno {i + 1} · {m.contact}
                </option>
              ))}
          </select>
        </Label>
      )}
      <input
        ref={input}
        type="file"
        accept=".pdf,.docx,.xlsx"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-label="Arquivos do briefing"
        onChange={async (e) => {
          const selected = Array.from(e.target.files || []);
          e.target.value = "";
          if (!selected.length) return;
          if (files.length + selected.length > 10) {
            setError(
              "Use até 10 anexos por briefing. Remova um arquivo para adicionar outro.",
            );
            return;
          }
          setBusy(true);
          setError("");
          const added: BriefingAttachment[] = [];
          const errors: string[] = [];
          for (const file of selected) {
            try {
              added.push({
                ...(await readBriefingFile(file)),
                messageId: messageId || undefined,
              });
            } catch (err) {
              errors.push(`${file.name}: ${(err as Error).message}`);
            }
          }
          if (added.length) {
            invalidate();
            updateDemand(
              d.id,
              (current) => ({
                ...current,
                briefingValid: false,
                attachments: [...(current.attachments || []), ...added],
              }),
              `${added.length} anexo(s) adicionado(s) ao briefing.`,
            );
            notify(
              "Anexos adicionados. Confira a leitura antes de organizar com IA.",
            );
          }
          setError(errors.join(" "));
          setBusy(false);
        }}
      />
      <Button
        icon={Paperclip}
        busy={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? "Lendo os anexos..." : "Adicionar PDF, DOCX ou XLSX"}
      </Button>
      <p className="field-hint">
        Até 10 MB por arquivo. Salva apenas o texto e o nome neste navegador; o
        original permanece com você.
      </p>
      {error && (
        <div className="note error" role="alert">
          <AlertCircle size={17} />
          {error}
        </div>
      )}
      <div className="attachment-list">
        {files.map((a) => (
          <div className="attachment-entry" key={a.id}>
            <div className="attachment-heading">
              <FileText size={18} />
              <div>
                <strong>{a.name}</strong>
                <small>
                  {a.kind.toUpperCase()} ·{" "}
                  {Math.max(1, Math.round(a.size / 1024))} KB ·{" "}
                  {a.messageId ? "Retorno do cliente" : "Mensagem inicial"}
                </small>
              </div>
              <button
                className="icon-btn"
                aria-label={`Remover ${a.name}`}
                onClick={() => {
                  invalidate();
                  updateDemand(d.id, (current) => ({
                    ...current,
                    briefingValid: false,
                    attachments: (current.attachments || []).filter(
                      (f) => f.id !== a.id,
                    ),
                  }));
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <p
              className={
                a.status === "manual" ? "attachment-warning" : "field-hint"
              }
            >
              {a.detail}
            </p>
            <label className="check-label">
              <input
                type="checkbox"
                checked={a.included}
                onChange={(e) => change(a.id, { included: e.target.checked })}
              />
              Incluir na análise
            </label>
            <details open={a.status === "manual" || undefined}>
              <summary>
                Conferir ou complementar texto (
                {a.text.length.toLocaleString("pt-BR")} caracteres)
              </summary>
              <Label label={`Texto de ${a.name}`}>
                <textarea
                  rows={6}
                  maxLength={100000}
                  value={a.text}
                  onChange={(e) => change(a.id, { text: e.target.value })}
                  placeholder="Cole aqui a transcrição ou o resumo deste anexo."
                />
              </Label>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
