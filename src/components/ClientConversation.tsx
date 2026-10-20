import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Mail,
  Sparkles,
  Check,
} from "lucide-react";
import type { Demand, ClientMessage } from "../types";
import { useStore, copy, go } from "../store";
import { mailSubject, referenceText } from "../mail-reference";
import { MailSubject } from "./MailSubject";
import { briefingFields, scopeSummary } from "../briefing-model";
import { clientReplyExample } from "../briefing-example";
import { Badge, Button, Label } from "./UI";

export function ClientConversation({
  d,
  invalidate,
  analyzeReply,
}: {
  d: Demand;
  invalidate: () => void;
  analyzeReply: (message: ClientMessage) => void;
}) {
  const { state, updateDemand, notify } = useStore();
  const client = state.clients.find((c) => c.id === d.clientId);
  const [mode, setMode] = useState<"out" | "in">("out");
  const [reply, setReply] = useState("");
  const [contact, setContact] = useState(client?.email || "");
  const [channel, setChannel] = useState("E-mail");
  const messages = d.conversation || [];
  const latest = messages.at(-1);
  const pendingReply = [...messages]
    .reverse()
    .find((m) => m.direction === "in" && !m.reviewedAt);
  const plan = briefingFields
    .filter((f) => d.briefingDetails?.[f.id])
    .map((f) => `${f.label}: ${d.briefingDetails![f.id]}`)
    .join("\n");
  const generated = `Olá, ${client?.contact.split(" ")[0] || "tudo bem"}!\n\nConsolidamos nosso entendimento para ${d.title}:\n${d.date ? `Data: ${d.date.split("-").reverse().join("/")}\n` : ""}Público: ${d.guests || "a confirmar"} pessoas\nLocal: ${d.location || "a confirmar"}\nObjetivo: ${d.objective || "a confirmar"}\n${d.budget ? `Investimento de referência: ${d.budget.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n` : ""}\n${plan ? `${plan}\n\n` : ""}${scopeSummary(d) ? `Escopo para cotação\n${scopeSummary(d)}\n\n` : ""}Pontos que precisamos confirmar:\n${d.questions || "Confirma o entendimento e as premissas acima? Há algum ajuste?"}\n\nCom sua confirmação, seguimos para as cotações.\n\n${d.owner} · Adviser`;
  const draft = d.clientDraft ?? referenceText(generated, d);
  const legacy = d.briefingLog.filter(
    (t) => !messages.some((m) => m.direction === "in" && m.text === t),
  );
  const status = pendingReply
    ? "Retorno a revisar"
    : latest?.direction === "out"
      ? "Aguardando cliente"
      : d.briefingValid
        ? "Alinhamento validado"
        : "Em alinhamento";
  return (
    <section id="briefing-conversa" className="briefing-section">
      <div className="section-heading">
        <div>
          <h2>Conversa com o cliente</h2>
          <p>
            Um histórico do entendimento enviado, dos retornos e das decisões.
          </p>
        </div>
        <Badge tone={pendingReply ? "amber" : "blue"}>{status}</Badge>
      </div>
      <div className="conversation-layout">
        <section
          className="panel conversation-history"
          aria-label="Histórico da conversa"
        >
          <h3>Do pedido ao alinhamento</h3>
          <ol className="conversation-timeline">
            {(d.message || !messages.length) && (
              <li className="incoming">
                <span className="conversation-icon">
                  <ArrowDownLeft size={16} />
                </span>
                <div>
                  <div className="conversation-meta">
                    <strong>Cliente · pedido inicial</strong>
                    <span>{d.source}</span>
                  </div>
                  <details>
                    <summary>
                      {d.message
                        ? d.message.slice(0, 150) +
                          (d.message.length > 150 ? "…" : "")
                        : "Mensagem ainda não registrada"}
                    </summary>
                    <p className="message-body">{d.message}</p>
                  </details>
                </div>
              </li>
            )}
            {legacy.map((text, i) => (
              <li className="incoming" key={`legacy-${i}`}>
                <span className="conversation-icon">
                  <ArrowDownLeft size={16} />
                </span>
                <div>
                  <div className="conversation-meta">
                    <strong>Cliente · retorno anterior {i + 1}</strong>
                    <span>Registro manual</span>
                  </div>
                  <p className="message-body">{text}</p>
                </div>
              </li>
            ))}
            {messages.map((m) => (
              <li
                key={m.id}
                className={m.direction === "in" ? "incoming" : "outgoing"}
              >
                <span className="conversation-icon">
                  {m.direction === "in" ? (
                    <ArrowDownLeft size={16} />
                  ) : (
                    <ArrowUpRight size={16} />
                  )}
                </span>
                <div>
                  <div className="conversation-meta">
                    <strong>
                      {m.direction === "in" ? "Cliente" : "Adviser"} ·{" "}
                      {m.direction === "in"
                        ? "retorno registrado"
                        : "envio registrado"}
                    </strong>
                    <time>
                      {new Date(m.at).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </time>
                  </div>
                  <small className="message-contact">
                    {m.channel} · {m.direction === "in" ? "De" : "Para"}:{" "}
                    {m.contact}
                  </small>
                  {m.subject && <p className="mail-reference">{m.subject}</p>}
                  <details>
                    <summary>
                      {m.text.slice(0, 160)}
                      {m.text.length > 160 ? "…" : ""}
                    </summary>
                    <p className="message-body">{m.text}</p>
                  </details>
                  {m.inboxEmailId && (
                    <Button
                      variant="ghost"
                      onClick={() => go(`/emails/${m.inboxEmailId}`)}
                    >
                      Ver associação do e-mail
                    </Button>
                  )}
                  {m.direction === "in" && (
                    <div className="actions message-actions">
                      {m.reviewedAt ? (
                        <Badge tone="green">Revisado pelo atendimento</Badge>
                      ) : (
                        <>
                          <Button
                            icon={Sparkles}
                            onClick={() => analyzeReply(m)}
                          >
                            Analisar retorno com IA
                          </Button>
                          <Button
                            variant="ghost"
                            icon={Check}
                            onClick={() => {
                              updateDemand(
                                d.id,
                                (current) => ({
                                  ...current,
                                  conversation: (
                                    current.conversation || []
                                  ).map((x) =>
                                    x.id === m.id
                                      ? {
                                          ...x,
                                          reviewedAt: new Date().toISOString(),
                                        }
                                      : x,
                                  ),
                                }),
                                "Retorno revisado pelo atendimento.",
                              );
                              notify(
                                "Retorno marcado como revisado. A validação do briefing continua sendo uma etapa separada.",
                              );
                            }}
                          >
                            Marcar como revisado
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {latest?.direction === "out" && !pendingReply && (
            <div className="conversation-wait">
              <Mail size={18} />
              <span>
                Aguardando retorno do cliente
                {d.clientResponseDue
                  ? ` até ${d.clientResponseDue.split("-").reverse().join("/")}`
                  : ". Defina uma data para acompanhar."}
              </span>
            </div>
          )}
        </section>
        <section className="panel conversation-compose">
          <div className="segmented-control" aria-label="Tipo de registro">
            <button
              className={mode === "out" ? "active" : ""}
              aria-pressed={mode === "out"}
              onClick={() => setMode("out")}
            >
              Devolver entendimento
            </button>
            <button
              className={mode === "in" ? "active" : ""}
              aria-pressed={mode === "in"}
              onClick={() => setMode("in")}
            >
              Registrar retorno
            </button>
          </div>
          {mode === "out" ? (
            <>
              <h3>Formalizar o que entendemos</h3>
              <p className="muted">
                Revise, copie e envie pelo Gmail. Depois registre o envio para
                acompanhar a resposta.
              </p>
              <Label label="Destinatário do entendimento">
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Nome ou e-mail do contato"
                />
              </Label>
              <MailSubject d={d} purpose="Alinhamento do briefing" />
              <Label label="Texto sugerido de formalização">
                <textarea
                  className="email-draft"
                  value={draft}
                  onChange={(e) =>
                    updateDemand(d.id, { clientDraft: e.target.value })
                  }
                />
              </Label>
              <Button
                variant="ghost"
                onClick={() => {
                  updateDemand(d.id, { clientDraft: undefined });
                  notify(
                    "Rascunho atualizado com os campos atuais do briefing.",
                  );
                }}
              >
                Atualizar rascunho com briefing atual
              </Button>
              <Label label="Acompanhar resposta até">
                <input
                  type="date"
                  value={d.clientResponseDue || ""}
                  onChange={(e) =>
                    updateDemand(d.id, { clientResponseDue: e.target.value })
                  }
                />
              </Label>
              <div className="actions">
                <Button
                  icon={Copy}
                  disabled={!draft.trim()}
                  onClick={async () =>
                    notify(
                      (await copy(referenceText(draft, d)))
                        ? "Texto copiado. Revise e envie pelo Gmail."
                        : "Selecione o texto e copie manualmente.",
                    )
                  }
                >
                  Copiar texto
                </Button>
                <Button
                  variant="primary"
                  icon={Mail}
                  disabled={!draft.trim() || !contact.trim()}
                  onClick={() => {
                    const message: ClientMessage = {
                      id: crypto.randomUUID(),
                      direction: "out",
                      text: referenceText(draft, d),
                      subject: mailSubject(d, "Alinhamento do briefing"),
                      contact: contact.trim(),
                      channel: "E-mail",
                      at: new Date().toISOString(),
                    };
                    updateDemand(
                      d.id,
                      (current) => ({
                        ...current,
                        conversation: [
                          ...(current.conversation || []),
                          message,
                        ],
                        clientDraft: undefined,
                      }),
                      "Envio de entendimento registrado manualmente; aguardando cliente.",
                    );
                    setMode("in");
                    notify(
                      "Envio registrado no histórico. Nenhum e-mail foi disparado pelo protótipo.",
                    );
                  }}
                >
                  Registrar envio pelo Gmail
                </Button>
              </div>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!reply.trim() || !contact.trim()) return;
                const message: ClientMessage = {
                  id: crypto.randomUUID(),
                  direction: "in",
                  text: reply.trim(),
                  contact: contact.trim(),
                  channel,
                  at: new Date().toISOString(),
                };
                invalidate();
                updateDemand(
                  d.id,
                  (current) => ({
                    ...current,
                    briefingValid: false,
                    conversation: [...(current.conversation || []), message],
                    briefingLog: [...current.briefingLog, message.text],
                  }),
                  "Resposta do cliente registrada manualmente; briefing requer revisão.",
                );
                setReply("");
                notify(
                  "Retorno registrado. Analise as mudanças e revise o briefing antes de validar.",
                );
              }}
            >
              <h3>O cliente respondeu</h3>
              <p className="muted">
                A resposta pode vir de outro contato. Registre quem respondeu e
                mantenha tudo nesta demanda.
              </p>
              <div className="form-grid">
                <Label label="Quem respondeu">
                  <input
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Nome ou e-mail"
                  />
                </Label>
                <Label label="Canal do retorno">
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                  >
                    <option>E-mail</option>
                    <option>Ligação</option>
                    <option>Reunião</option>
                  </select>
                </Label>
              </div>
              <Label label="Registrar retorno do cliente">
                <textarea
                  required
                  rows={8}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Cole a resposta ou anote as decisões da conversa."
                />
              </Label>
              <div className="actions">
                <Button variant="primary" type="submit">
                  Salvar retorno
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setReply(clientReplyExample)}
                >
                  Preencher retorno fictício
                </Button>
              </div>
              <p className="field-hint">
                Se houver novos arquivos, adicione-os em “Anexos do e-mail” e
                selecione este retorno como origem.
              </p>
            </form>
          )}
        </section>
      </div>
    </section>
  );
}
