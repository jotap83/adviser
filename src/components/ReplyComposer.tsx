import { useState } from "react";
import { Copy, Send, Sparkles, Check } from "lucide-react";
import type { Demand, InboxEmail } from "../types";
import { useStore, copy } from "../store";
import { channelName } from "../inbox-model";
import {
  acknowledgement,
  contactIsValid,
  whatsappWindowOpen,
  type ReplyChannel,
} from "../channels";
import { referenceText, mailSubject } from "../mail-reference";
import { Badge, Button, Label } from "./UI";

export function ReplyComposer({
  d,
  incoming,
  initialDraft = "",
}: {
  d: Demand;
  incoming?: InboxEmail;
  initialDraft?: string;
}) {
  const { state, updateDemand, notify } = useStore();
  const client = state.clients.find((c) => c.id === d.clientId);
  const [channel, setChannel] = useState<ReplyChannel>(
    incoming ? channelName(incoming) : "Gmail",
  );
  const defaultContact = (next: ReplyChannel) =>
    incoming && channelName(incoming) === next
      ? incoming.from
      : next === "WhatsApp"
        ? client?.phone || ""
        : next === "Gmail"
          ? client?.email || ""
          : client?.contact || "";
  const [contact, setContact] = useState(() => defaultContact(channel));
  const [text, setText] = useState(initialDraft);
  const [reviewed, setReviewed] = useState(false);
  const [consent, setConsent] = useState(false);
  const [simulateExpired, setSimulateExpired] = useState(false);
  const [template, setTemplate] = useState("");
  const [sent, setSent] = useState("");
  const [attached, setAttached] = useState<string[]>([]);
  const [error, setError] = useState("");
  const closed =
    channel === "WhatsApp" &&
    (simulateExpired || !whatsappWindowOpen(state, contact));
  const templateText = `Olá! Temos uma atualização sobre ${d.title}, referência ${d.reference}. Podemos continuar o atendimento por aqui? Equipe Adviser.`;
  const body = closed ? (template ? templateText : "") : text;
  const valid = contactIsValid(channel, contact);
  const canSend =
    valid &&
    Boolean(body.trim()) &&
    (channel === "Registro manual" || reviewed) &&
    (!closed || consent);
  function send() {
    if (!canSend) return;
    if (
      channel === "WhatsApp" &&
      !simulateExpired &&
      !whatsappWindowOpen(state, contact) &&
      !template
    ) {
      setError(
        "A janela de atendimento terminou. Selecione um modelo de mensagem.",
      );
      return;
    }
    const at = new Date().toISOString();
    const manual = channel === "Registro manual";
    updateDemand(
      d.id,
      (current) => ({
        ...current,
        conversation: [
          ...(current.conversation || []),
          {
            id: crypto.randomUUID(),
            direction: "out",
            text: referenceText(body.trim(), current),
            subject:
              channel === "Gmail"
                ? mailSubject(current, "Alinhamento do briefing")
                : undefined,
            channel,
            contact: contact.trim(),
            at,
            author: current.owner,
            delivery: manual ? "manual" : "simulated",
            replyToMessageId: incoming?.id,
            template: closed ? "retomar_atendimento_demo" : undefined,
            attachedFiles: closed
              ? []
              : (current.attachments || [])
                  .filter((a) => attached.includes(a.id))
                  .map((a) => a.name),
          },
        ],
      }),
      manual
        ? "Contato registrado diretamente na plataforma."
        : `Resposta por ${channel} simulada após revisão humana.`,
    );
    setSent(
      manual
        ? "Registro salvo no histórico."
        : `Resposta por ${channel} simulada e salva no histórico. Nenhuma mensagem real foi enviada.`,
    );
    setText("");
    setTemplate("");
    setReviewed(false);
    setError("");
    setAttached([]);
    notify(
      manual
        ? "Registro salvo."
        : "Envio simulado. A resposta está no histórico do atendimento.",
    );
  }
  return (
    <div className="reply-composer">
      <div className="section-heading">
        <h3>Responder pela plataforma</h3>
        <Badge>
          {channel === "Registro manual" ? "Registro local" : "Envio simulado"}
        </Badge>
      </div>
      <p className="muted">
        Escolha o canal, escreva ou use a sugestão da IA e revise antes de
        enviar.
      </p>
      <div className="form-grid">
        <Label label="Canal da resposta">
          <select
            value={channel}
            onChange={(e) => {
              const next = e.target.value as ReplyChannel;
              setChannel(next);
              setContact(defaultContact(next));
              setReviewed(false);
              setConsent(false);
              setTemplate("");
              setSent("");
            }}
          >
            <option>Gmail</option>
            <option>WhatsApp</option>
            <option>Registro manual</option>
          </select>
        </Label>
        <Label
          label={
            channel === "WhatsApp"
              ? "WhatsApp do destinatário"
              : channel === "Gmail"
                ? "E-mail do destinatário"
                : "Pessoa do contato"
          }
        >
          <input
            type={
              channel === "Gmail"
                ? "email"
                : channel === "WhatsApp"
                  ? "tel"
                  : "text"
            }
            value={contact}
            onChange={(e) => {
              setContact(e.target.value);
              setReviewed(false);
              setConsent(false);
              setSent("");
            }}
            placeholder={
              channel === "WhatsApp" ? "+55 (DDD) número" : "Contato do cliente"
            }
          />
        </Label>
      </div>
      {contact && !valid && (
        <p className="field-hint" role="alert">
          Confira{" "}
          {channel === "WhatsApp"
            ? "o telefone com DDI e DDD"
            : "o e-mail do destinatário"}{" "}
          para continuar.
        </p>
      )}
      {channel === "Gmail" && (
        <Label label="Assunto com referência do atendimento">
          <input readOnly value={mailSubject(d, "Alinhamento do briefing")} />
        </Label>
      )}
      {channel === "WhatsApp" && (
        <div className="wa-window">
          <Badge tone={closed ? "amber" : "green"}>
            {closed ? "Usar modelo de mensagem" : "Janela de 24h aberta"}
          </Badge>
          <p>
            {closed
              ? "Para iniciar ou retomar uma conversa fora da janela, escolha um modelo aprovado. Neste protótipo, o modelo é apenas ilustrativo."
              : "Você pode responder com texto livre. Uma nova mensagem do cliente renova a janela."}
          </p>
          <label className="check-label">
            <input
              type="checkbox"
              checked={simulateExpired}
              onChange={(e) => {
                setSimulateExpired(e.target.checked);
                setReviewed(false);
                setTemplate("");
                setSent("");
              }}
            />
            Demonstrar janela encerrada
          </label>
        </div>
      )}
      {closed && (
        <>
          <Label label="Modelo de WhatsApp">
            <select
              value={template}
              onChange={(e) => {
                setTemplate(e.target.value);
                setReviewed(false);
                setSent("");
              }}
            >
              <option value="">Selecione um modelo</option>
              <option value="resume">
                Retomar atendimento · exemplo fictício
              </option>
            </select>
          </Label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                setSent("");
              }}
            />
            O contato autorizou receber mensagens da Adviser.
          </label>
        </>
      )}
      <Label
        label="Mensagem da resposta"
        hint={
          closed
            ? "O modelo inclui a referência do atendimento."
            : "Você pode escrever tudo manualmente. A referência acompanha o envio."
        }
      >
        <textarea
          rows={7}
          readOnly={closed}
          value={body}
          onChange={(e) => {
            setText(e.target.value);
            setReviewed(false);
            setSent("");
          }}
          placeholder="Escreva a resposta ou prepare uma sugestão com IA..."
        />
      </Label>
      {!closed && (
        <Button
          icon={Sparkles}
          disabled={state.aiMode === "offline"}
          onClick={() => {
            setText(initialDraft || acknowledgement(d, contact));
            setReviewed(false);
            setSent("");
          }}
        >
          Preparar resposta com IA
        </Button>
      )}
      {!closed && Boolean(d.attachments?.length) && (
        <details className="reply-attachments">
          <summary>
            Anexar arquivos do atendimento ({attached.length} selecionados)
          </summary>
          <p className="field-hint">
            Selecione os arquivos que devem acompanhar esta resposta. O envio
            dos arquivos também é simulado.
          </p>
          {d.attachments!.map((a) => (
            <label className="check-label" key={a.id}>
              <input
                type="checkbox"
                checked={attached.includes(a.id)}
                onChange={(e) => {
                  setAttached(
                    e.target.checked
                      ? [...attached, a.id]
                      : attached.filter((id) => id !== a.id),
                  );
                  setReviewed(false);
                  setSent("");
                }}
              />
              {a.name}
            </label>
          ))}
        </details>
      )}
      {state.aiMode === "offline" && !closed && (
        <p className="field-hint">
          IA indisponível. Escreva a resposta e continue normalmente.
        </p>
      )}
      {channel !== "Registro manual" && (
        <label className="check-label reply-review">
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(e) => setReviewed(e.target.checked)}
          />
          Revisei o destinatário e o conteúdo da resposta.
        </label>
      )}
      <div className="actions">
        <Button
          variant="primary"
          icon={channel === "Registro manual" ? Check : Send}
          disabled={!canSend}
          onClick={send}
        >
          {channel === "Registro manual"
            ? "Salvar registro"
            : `Simular envio por ${channel}`}
        </Button>
        <Button
          icon={Copy}
          disabled={!body.trim()}
          onClick={async () =>
            notify(
              (await copy(referenceText(body, d)))
                ? "Texto copiado."
                : "Selecione e copie o texto manualmente.",
            )
          }
        >
          Copiar texto
        </Button>
      </div>
      {error && (
        <p className="note error" role="alert">
          {error}
        </p>
      )}
      {sent && (
        <p className="reply-saved" role="status">
          <Check size={16} />
          {sent}
        </p>
      )}
    </div>
  );
}
