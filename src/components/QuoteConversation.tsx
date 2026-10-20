import { useState } from "react";
import { Copy, MessageSquare, Send } from "lucide-react";
import type { Demand, Quote } from "../types";
import { copy, useStore } from "../store";
import {
  addQuoteMessage,
  requestQuoteAdjustment,
  revisionSnapshot,
} from "../quote-model";
import { money } from "../domain.mjs";
import { Badge, Button, Label } from "./UI";

export function QuoteConversation({
  d,
  q,
  role,
}: {
  d: Demand;
  q: Quote;
  role: "adviser" | "supplier";
}) {
  const { updateDemand, notify } = useStore();
  const [text, setText] = useState("");
  const [kind, setKind] = useState("message");
  const locked = d.decision === "accepted" || d.handoff;
  function send() {
    if (!text.trim() || (kind === "adjustment" && locked)) return;
    updateDemand(
      d.id,
      (current) => ({
        ...current,
        quotes: current.quotes.map((x) =>
          x.id !== q.id
            ? x
            : role === "adviser" && kind === "adjustment"
              ? requestQuoteAdjustment(x, text)
              : addQuoteMessage(x, role, "message", text),
        ),
      }),
      `${role === "adviser" ? "Adviser" : "Fornecedor"}: ${kind === "adjustment" ? "ajuste solicitado na cotação" : "mensagem registrada na cotação"}.`,
    );
    setText("");
    notify("Mensagem registrada na demonstração. Nenhum e-mail foi enviado.");
  }
  return (
    <section className="quote-conversation" aria-label="Conversa da cotação">
      <h3>
        <MessageSquare size={18} /> Conversa sobre esta cotação
      </h3>
      <p className="muted">
        Perguntas, ajustes e confirmações ficam vinculados à versão da cotação.
        Nesta demonstração, tudo permanece neste navegador.
      </p>
      <ol className="quote-thread">
        {(q.messages || []).map((m) => (
          <li key={m.id} className={`quote-message ${m.author}`}>
            <div className="quote-message-meta">
              <strong>
                {m.author === "adviser" ? "Adviser" : "Fornecedor"}
              </strong>
              <span>
                v{m.revision} ·{" "}
                {new Date(m.at).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>
            {m.kind !== "message" && (
              <Badge tone={m.kind === "confirmation" ? "green" : "blue"}>
                {
                  {
                    adjustment: "Ajuste solicitado",
                    selection: "Composição escolhida",
                    confirmation: "Composição confirmada",
                    revision: "Nova versão",
                  }[m.kind]
                }
              </Badge>
            )}
            <p>{m.text}</p>
          </li>
        ))}
      </ol>
      {!q.messages?.length && (
        <p className="muted">
          Nenhuma mensagem registrada. Use este espaço para esclarecer o escopo
          ou negociar uma nova opção.
        </p>
      )}
      <div className="quote-reply">
        {role === "adviser" && (
          <Label label="Tipo de retorno">
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="message">Tirar uma dúvida</option>
              <option value="adjustment" disabled={locked}>
                Pedir ajuste e nova versão
              </option>
            </select>
          </Label>
        )}
        <Label
          label={
            role === "adviser"
              ? "Mensagem para o fornecedor"
              : "Resposta para a Adviser"
          }
        >
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              role === "adviser"
                ? "Ex.: na opção 2, podemos substituir as bebidas e rever o valor por pessoa?"
                : "Esclareça as condições ou informe o que mudou na nova versão."
            }
          />
        </Label>
        {kind === "adjustment" && (
          <p className="field-hint">
            O pedido suspende a seleção atual. O fornecedor enviará uma nova
            versão e você revisará a composição novamente.
          </p>
        )}
        <div className="actions">
          <Button
            icon={Send}
            onClick={send}
            disabled={!text.trim() || (kind === "adjustment" && locked)}
          >
            {role === "adviser"
              ? "Registrar retorno ao fornecedor"
              : "Registrar resposta à Adviser"}
          </Button>
          <Button
            icon={Copy}
            variant="ghost"
            disabled={!text.trim()}
            onClick={async () =>
              notify(
                (await copy(text))
                  ? "Texto copiado para usar no e-mail."
                  : "Selecione o texto e copie manualmente.",
              )
            }
          >
            Copiar para e-mail
          </Button>
        </div>
      </div>
    </section>
  );
}

export function QuoteHistory({ q }: { q: Quote }) {
  const versions = q.revisions?.length
    ? q.revisions
    : q.status === "received"
      ? [revisionSnapshot(q)]
      : [];
  if (!versions.length) return null;
  return (
    <details className="quote-history">
      <summary>Histórico de versões ({versions.length})</summary>
      {versions
        .slice()
        .reverse()
        .map((v) => (
          <section key={v.number}>
            <h4>
              Cotação v{v.number} · {new Date(v.at).toLocaleDateString("pt-BR")}
            </h4>
            {v.options.map((o) => (
              <div key={o.id}>
                <strong>{o.name}</strong>
                <ul>
                  {o.lines.map((l) => (
                    <li key={l.id}>
                      {l.description}
                      {l.optional ? " (opcional)" : ""}: {l.qty} ×{" "}
                      {money(l.unit)}
                    </li>
                  ))}
                </ul>
                {o.detail && <p>{o.detail}</p>}
              </div>
            ))}
            <p>
              <strong>Condições:</strong> {v.terms}
            </p>
            <dl className="quote-fields">
              {q.template.fields.map((f) => (
                <div key={f.id}>
                  <dt>{f.label}</dt>
                  <dd>{v.fields[f.id] || "Não informado"}</dd>
                </div>
              ))}
            </dl>
            {v.attachment && <p>Anexo informado: {v.attachment}</p>}
          </section>
        ))}
    </details>
  );
}
