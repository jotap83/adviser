import { messageKinds } from "../message-classification";
import { MessageClassification } from "../components/MessageClassification";
import { nucleusLabel, suggestedOwner, UNASSIGNED } from "../organization";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Mail,
  MessageCircle,
  Paperclip,
  Plus,
  Search,
  Undo2,
} from "lucide-react";
import type { InboxEmail } from "../types";
import { useStore, go } from "../store";
import { createDemand, uid } from "../data";
import { withReferences } from "../mail-reference";
import {
  changeMailStatus,
  demoFollowUp,
  directAssociation,
  linkMail,
  receiveMail,
  suggestMailCandidates,
  channelName,
  messageChannel,
} from "../inbox-model";
import {
  AIBadge,
  Badge,
  Button,
  Empty,
  Label,
  Note,
  Title,
} from "../components/UI";
import { ReceiveMessage } from "../components/ReceiveMessage";
import { ReplyComposer } from "../components/ReplyComposer";

const statusNames = {
  pending: "Para atender",
  linked: "Vinculadas",
  ignored: "Ignoradas",
};
const methodNames = {
  reference: "Código reconhecido",
  thread: "Conversa já vinculada",
  suggestion: "Sugestão confirmada",
  manual: "Escolha do atendimento",
  new: "Novo evento criado",
};
const dateTime = (at: string) =>
  new Date(at).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

export function Inbox({ emailId }: { emailId?: string }) {
  const { state, setState, notify } = useStore();
  const inbox = state.inbox || [];
  const [filter, setFilter] = useState<InboxEmail["status"]>(
    () => inbox.find((m) => m.id === emailId)?.status || "pending",
  );
  const [selectedId, setSelectedId] = useState(emailId || "");
  const [channelFilter, setChannelFilter] = useState("all");
  const [receiving, setReceiving] = useState<"email" | "whatsapp" | null>(null);
  const detail = useRef<HTMLDivElement>(null);
  const messageList = useRef<HTMLElement>(null);
  const [mobileDetail, setMobileDetail] = useState(Boolean(emailId));
  const rows = inbox
    .filter(
      (m) =>
        m.status === filter &&
        (channelFilter === "all" || messageChannel(m) === channelFilter),
    )
    .sort(
      (a, b) =>
        Number(!!b.classification?.reviewed && !!b.classification?.urgent) -
          Number(!!a.classification?.reviewed && !!a.classification?.urgent) ||
        b.receivedAt.localeCompare(a.receivedAt),
    );
  const selected = rows.find((m) => m.id === selectedId) || rows[0];
  const choose = (id: string) => {
    setSelectedId(id);
    setMobileDetail(true);
    if (window.matchMedia("(max-width: 760px)").matches) {
      requestAnimationFrame(() => {
        detail.current?.focus();
        detail.current?.scrollIntoView({ block: "start" });
      });
    }
  };
  const next = () => {
    setFilter("pending");
    setSelectedId("");
    setMobileDetail(true);
  };
  return (
    <>
      <Title
        title="Mensagens"
        sub="Uma mensagem por vez: revise o pedido e escolha o evento."
        actions={
          <Button icon={Plus} onClick={() => go("/novo-evento")}>
            Novo evento sem mensagem
          </Button>
        }
      />
      <details className="service-disclosure inbox-demo-tools">
        <summary>Simular recebimento de mensagens</summary>
        <p>Gmail e WhatsApp não conectados. Nenhuma mensagem real é enviada.</p>
        <div className="actions">
          <Button icon={Mail} onClick={() => setReceiving("email")}>
            Simular Gmail
          </Button>
          <Button icon={MessageCircle} onClick={() => setReceiving("whatsapp")}>
            Simular WhatsApp
          </Button>
          <Button
            icon={Mail}
            disabled={!inbox.some((m) => m.status === "linked")}
            onClick={() => {
              const message = demoFollowUp(state);
              if (!message) return;
              const nextState = receiveMail(state, [message]);
              const received = nextState.inbox?.find(
                (m) => m.id === message.id,
              );
              if (!received) return;
              setState(() => nextState);
              setFilter(received.status);
              setSelectedId(message.id);
              setMobileDetail(true);
              setChannelFilter("all");
              notify(
                "Resposta fictícia recebida. Revise a mensagem antes de atualizar o briefing.",
              );
            }}
          >
            Simular nova resposta
          </Button>
        </div>
        <label className="check-line">
          <input
            type="checkbox"
            checked={state.aiMode === "offline"}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                aiMode: e.target.checked ? "offline" : "available",
              }))
            }
          />
          Simular IA indisponível
        </label>
      </details>
      {receiving && (
        <ReceiveMessage
          key={receiving}
          channel={receiving}
          onCancel={() => setReceiving(null)}
          onReceive={(message) => {
            const nextState = receiveMail(state, [message]);
            const received = nextState.inbox!.find((m) => m.id === message.id)!;
            setState(() => nextState);
            setFilter(received.status);
            setSelectedId(message.id);
            setMobileDetail(true);
            setChannelFilter("all");
            setReceiving(null);
            notify(
              received.status === "linked"
                ? "Mensagem e anexos associados. Revise o conteúdo antes de atualizar o briefing."
                : "Mensagem recebida. Confirme a qual evento ela pertence.",
            );
          }}
        />
      )}
      <div className="service-inbox-toolbar">
        <Label label="Canal">
          <select
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value);
              setSelectedId("");
              setMobileDetail(false);
            }}
          >
            <option value="all">Todos os canais</option>
            <option value="email">Gmail</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </Label>
        <div
          className="inbox-filters"
          role="group"
          aria-label="Filtrar mensagens"
        >
          {(Object.keys(statusNames) as InboxEmail["status"][]).map((key) => (
            <button
              key={key}
              aria-pressed={filter === key}
              className={filter === key ? "active" : ""}
              onClick={() => {
                setFilter(key);
                setSelectedId("");
                setMobileDetail(false);
              }}
            >
              {statusNames[key]}{" "}
              <span className="count">
                {
                  inbox.filter(
                    (m) =>
                      m.status === key &&
                      (channelFilter === "all" ||
                        messageChannel(m) === channelFilter),
                  ).length
                }
              </span>
            </button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <section className="panel">
          <Empty
            title={
              filter === "pending"
                ? "Nenhuma mensagem para identificar neste filtro"
                : "Nenhuma mensagem nesta lista"
            }
            text={
              filter === "pending"
                ? "As associações ficam no histórico. Você pode revisá-las na aba Vinculadas."
                : "As mensagens aparecerão aqui conforme você concluir a triagem."
            }
            action={
              filter === "pending" ? (
                <Button onClick={() => setFilter("linked")}>
                  Ver vinculadas
                </Button>
              ) : (
                <Button onClick={next}>Voltar para identificação</Button>
              )
            }
          />
        </section>
      ) : (
        <div
          className={`inbox-layout service-inbox ${mobileDetail ? "show-message" : "show-list"}`}
        >
          <nav
            ref={messageList}
            className="inbox-list"
            aria-label="Mensagens recebidas"
          >
            {rows.map((m) => (
              <button
                key={m.id}
                className={`inbox-list-item ${m.id === selected?.id ? "active" : ""}`}
                aria-current={m.id === selected?.id ? "true" : undefined}
                onClick={() => choose(m.id)}
              >
                <span className="inbox-list-sender">{m.from}</span>
                <span className="inbox-channel">
                  <Badge
                    tone={messageChannel(m) === "whatsapp" ? "green" : "blue"}
                  >
                    {channelName(m)}
                  </Badge>
                  {m.classification?.reviewed && (
                    <Badge tone={m.classification.urgent ? "amber" : "gray"}>
                      {m.classification.urgent ? "Prioridade · " : ""}
                      {messageKinds[m.classification.kind]}
                    </Badge>
                  )}
                </span>
                <strong>{m.subject}</strong>
                <span className="inbox-list-preview">
                  {m.text.slice(0, 110)}
                </span>
                <span className="inbox-list-meta">
                  <time>{dateTime(m.receivedAt)}</time>
                  {m.attachments.length > 0 && (
                    <Paperclip size={14} aria-label="Contém anexo" />
                  )}
                </span>
              </button>
            ))}
          </nav>
          {selected && (
            <div
              ref={detail}
              tabIndex={-1}
              className="inbox-detail"
              aria-label="Mensagem e associação"
            >
              <div className="inbox-mobile-back">
                <Button
                  icon={ArrowLeft}
                  onClick={() => {
                    setMobileDetail(false);
                    requestAnimationFrame(() => {
                      messageList.current
                        ?.querySelector<HTMLButtonElement>(
                          'button[aria-current="true"]',
                        )
                        ?.focus();
                    });
                  }}
                >
                  Voltar às mensagens
                </Button>
              </div>
              <MailReview
                key={`${selected.id}-${selected.status}`}
                email={selected}
                onResolved={(status) => {
                  setFilter(status);
                  setSelectedId(selected.id);
                }}
                onNext={next}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

function MailReview({
  email,
  onResolved,
  onNext,
}: {
  email: InboxEmail;
  onResolved: (status: InboxEmail["status"]) => void;
  onNext: () => void;
}) {
  const { state, setState, notify } = useStore();
  const reply = useRef<HTMLDetailsElement>(null);
  const [triageStep, setTriageStep] = useState(
    email.classification?.reviewed ? "destination" : "classification",
  );
  const [choosingLink, setChoosingLink] = useState(false);
  const stepHeading = useRef<HTMLDivElement>(null);
  const advance = (step: string) => {
    setTriageStep(step);
    requestAnimationFrame(() => {
      stepHeading.current?.focus();
      stepHeading.current?.scrollIntoView({ block: "nearest" });
    });
  };
  const candidates = suggestMailCandidates(email, state);
  const direct = directAssociation(email, state);
  const linkedDemand = state.demands.find((d) => d.id === email.demandId);
  const [correcting, setCorrecting] = useState(false);
  const [choice, setChoice] = useState("");
  const [manual, setManual] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [clientId, setClientId] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const choices = state.demands.filter((d) =>
    `${d.reference} ${d.title} ${state.clients.find((c) => c.id === d.clientId)?.name}`
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const pendingCount = (state.inbox || []).filter(
    (m) => m.status === "pending",
  ).length;
  const selectedDemand = state.demands.find((d) => d.id === choice);
  const confirm = () => {
    if (!selectedDemand) return;
    const method =
      manual || state.aiMode === "offline" ? "manual" : "suggestion";
    setState((s) => linkMail(s, email.id, choice, method));
    setCorrecting(false);
    onResolved("linked");
    notify(
      correcting
        ? "Vínculo corrigido. A mensagem foi movida; os campos já preenchidos nos briefings foram preservados."
        : "Mensagem associada. Revise seu conteúdo no briefing antes de aplicar alterações.",
    );
  };
  return (
    <>
      <div className="inbox-detail-heading">
        <h2>{email.subject}</h2>
        <Badge
          tone={
            email.status === "linked"
              ? "green"
              : email.status === "pending"
                ? "amber"
                : "gray"
          }
        >
          {
            {
              pending: "Para atender",
              linked: "Associado",
              ignored: "Ignorado",
            }[email.status]
          }
        </Badge>
      </div>
      <div className="mail-review-columns">
        <section className="mail-original" aria-label="Conteúdo da mensagem">
          <p className="service-message-from">
            {email.from} · {channelName(email)}
          </p>
          <details className="service-disclosure">
            <summary>Detalhes da mensagem</summary>
            <dl className="mail-envelope">
              <div>
                <dt>Canal</dt>
                <dd>{channelName(email)} · recebimento simulado</dd>
              </div>
              <div>
                <dt>De</dt>
                <dd>{email.from}</dd>
              </div>
              <div>
                <dt>Para</dt>
                <dd>{email.to.join(", ")}</dd>
              </div>
              <div>
                <dt>Recebido</dt>
                <dd>{dateTime(email.receivedAt)}</dd>
              </div>
            </dl>
          </details>
          <p className="mail-body">
            {email.text.length > 420
              ? `${email.text.slice(0, 420)}…`
              : email.text}
          </p>
          {email.text.length > 420 && (
            <details className="service-disclosure">
              <summary>Ler mensagem completa</summary>
              <p className="mail-body">{email.text}</p>
            </details>
          )}
          {email.attachments.length > 0 && (
            <div className="mail-attachments">
              <h3>Anexos da mensagem</h3>
              {email.attachments.map((a) => (
                <details key={a.name}>
                  <summary>
                    <Paperclip size={15} />
                    {a.name}
                  </summary>
                  <small>Texto simulado do anexo</small>
                  <p className="mail-body">{a.text}</p>
                </details>
              ))}
            </div>
          )}
          {email.history.length > 0 && (
            <details className="mail-audit">
              <summary>
                Histórico da associação ({email.history.length})
              </summary>
              <ol>
                {email.history.map((h, i) => (
                  <li key={`${h.at}-${i}`}>
                    <strong>{h.action}</strong>
                    <span>
                      {h.actor} · {dateTime(h.at)}
                    </span>
                    {h.demandId && (
                      <span>
                        {
                          state.demands.find((d) => d.id === h.demandId)
                            ?.reference
                        }
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </details>
          )}
        </section>
        <section
          className="mail-association"
          aria-label="Associação ao atendimento"
        >
          {email.status === "ignored" ? (
            <>
              <h3>Ignorado nesta fila</h3>
              <p className="muted">
                A mensagem permanece neste histórico. Você pode devolvê-la para
                identificação.
              </p>
              <Button
                icon={Undo2}
                onClick={() => {
                  setState((s) => changeMailStatus(s, email.id, "pending"));
                  onResolved("pending");
                }}
              >
                Restaurar para identificação
              </Button>
            </>
          ) : email.status === "linked" && !correcting ? (
            <>
              <div className="mail-linked-title">
                <Check size={20} />
                <h3>Mensagem associada</h3>
              </div>
              <p className="mail-reference">{linkedDemand?.reference}</p>
              <h3>{linkedDemand?.title || "Atendimento não encontrado"}</h3>
              <p className="muted">
                {email.method && methodNames[email.method]}
              </p>
              <Note>
                O conteúdo foi incluído na conversa. Os campos e valores do
                briefing foram preservados e aguardam revisão.
              </Note>
              <div className="actions">
                <Button
                  variant="primary"
                  icon={ArrowRight}
                  disabled={!linkedDemand}
                  onClick={() => go(`/eventos/${linkedDemand!.id}/briefing`)}
                >
                  Abrir briefing
                </Button>
                <Button
                  icon={MessageCircle}
                  disabled={!linkedDemand}
                  onClick={() => {
                    if (reply.current) reply.current.open = true;
                    reply.current?.scrollIntoView({ block: "start" });
                    reply.current
                      ?.querySelector<HTMLSelectElement>("select")
                      ?.focus({ preventScroll: true });
                  }}
                >
                  Responder pela plataforma
                </Button>
                {pendingCount > 0 && (
                  <Button onClick={onNext}>Próxima mensagem</Button>
                )}
              </div>
              <Button
                variant="ghost"
                icon={Undo2}
                onClick={() => {
                  setCorrecting(true);
                  advance("destination");
                  setChoice("");
                  setManual(true);
                }}
              >
                Corrigir vínculo
              </Button>
            </>
          ) : (
            <>
              <div
                ref={stepHeading}
                tabIndex={-1}
                className="triage-progress"
                aria-label="Etapa do atendimento"
              >
                <span
                  aria-current={
                    triageStep === "classification" ? "step" : undefined
                  }
                >
                  1. Revisar pedido
                </span>
                <ChevronRight size={14} aria-hidden="true" />
                <span
                  aria-current={
                    triageStep === "destination" ? "step" : undefined
                  }
                >
                  2. Escolher evento
                </span>
              </div>
              {!correcting && triageStep === "classification" && (
                <MessageClassification
                  key={email.id}
                  email={email}
                  onContinue={() => advance("destination")}
                />
              )}
              {!correcting &&
                triageStep === "destination" &&
                !choosingLink &&
                !creating && (
                  <div className="intake-destination">
                    <h3>Este pedido inicia um novo evento?</h3>
                    <p>
                      A mensagem e os anexos serão levados para o evento
                      escolhido.
                    </p>
                    <div className="intake-destination-options">
                      <Button icon={Plus} onClick={() => setCreating(true)}>
                        Criar novo evento
                      </Button>
                      <Button
                        icon={Search}
                        onClick={() => setChoosingLink(true)}
                      >
                        Vincular a evento existente
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => advance("classification")}
                    >
                      Voltar à classificação
                    </Button>
                  </div>
                )}
              {(correcting || choosingLink || creating) && (
                <>
                  <div className="section-heading">
                    <h3>
                      {correcting
                        ? "Corrigir atendimento"
                        : creating
                          ? "Novo pedido"
                          : "Eventos sugeridos"}
                    </h3>
                    {!correcting && !creating && <AIBadge />}
                  </div>
                  {correcting && (
                    <Note>
                      A mensagem será movida. Alterações que já foram aplicadas
                      aos campos não são desfeitas; confira os dois briefings.
                    </Note>
                  )}
                  {direct.warning && (
                    <Note tone="warning">{direct.warning}</Note>
                  )}
                  {state.aiMode === "offline" ? (
                    <Note tone="warning">
                      IA indisponível nesta simulação. Escolha o atendimento
                      manualmente para continuar.
                    </Note>
                  ) : (
                    !manual &&
                    !creating && (
                      <>
                        <p className="muted mail-hint">
                          Compare os indícios e escolha o atendimento. Nenhum
                          vínculo é confirmado pela sugestão.
                        </p>
                        {candidates.length ? (
                          <div
                            className="mail-candidates"
                            role="radiogroup"
                            aria-label="Sugestões de atendimento"
                          >
                            {candidates.map((c) => {
                              const d = state.demands.find(
                                (d) => d.id === c.demandId,
                              )!;
                              const client = state.clients.find(
                                (cl) => cl.id === d.clientId,
                              );
                              return (
                                <label
                                  key={d.id}
                                  className={`mail-candidate ${choice === d.id ? "selected" : ""}`}
                                >
                                  <div className="candidate-choice">
                                    <input
                                      type="radio"
                                      name={`candidate-${email.id}`}
                                      checked={choice === d.id}
                                      onChange={() => setChoice(d.id)}
                                    />
                                    <div>
                                      <span className="mail-reference">
                                        {d.reference}
                                      </span>
                                      <strong>{d.title}</strong>
                                      <small>
                                        {client?.name} · {d.owner || UNASSIGNED}
                                      </small>
                                      <small>
                                        {d.date
                                          ? d.date
                                              .split("-")
                                              .reverse()
                                              .join("/")
                                          : "Data a confirmar"}
                                        {d.guests > 0
                                          ? ` · ${d.guests} pessoas`
                                          : ""}
                                      </small>
                                    </div>
                                  </div>
                                  <ul>
                                    {c.reasons.map((r) => (
                                      <li key={r}>{r}</li>
                                    ))}
                                  </ul>
                                  {c.cautions.map((caution) => (
                                    <p
                                      className="candidate-caution"
                                      key={caution}
                                    >
                                      {caution}
                                    </p>
                                  ))}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mail-no-match">
                            <h4>Sem indícios suficientes</h4>
                            <p>
                              Procure um atendimento existente ou registre este
                              pedido como um novo evento.
                            </p>
                          </div>
                        )}
                      </>
                    )
                  )}
                  {(manual || state.aiMode === "offline") && !creating && (
                    <div className="mail-manual">
                      <Label label="Buscar evento">
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Código, evento ou cliente"
                        />
                      </Label>
                      <Label label="Evento para vincular">
                        <select
                          value={choice}
                          onChange={(e) => setChoice(e.target.value)}
                        >
                          <option value="">Selecione um evento</option>
                          {choices.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.reference} · {d.title}
                            </option>
                          ))}
                        </select>
                      </Label>
                      {choices.length === 0 && (
                        <p role="status">
                          Nenhum atendimento encontrado. Ajuste a busca.
                        </p>
                      )}
                    </div>
                  )}
                  {!creating && (
                    <>
                      {selectedDemand && (
                        <p className="mail-confirm-context">
                          Vincular a{" "}
                          <strong>
                            {selectedDemand.reference} · {selectedDemand.title}
                          </strong>
                        </p>
                      )}
                      <Button
                        variant="primary"
                        icon={Check}
                        disabled={
                          !selectedDemand ||
                          (correcting && choice === email.demandId)
                        }
                        onClick={confirm}
                      >
                        {correcting ? "Salvar correção" : "Confirmar vínculo"}
                      </Button>
                      <div className="mail-secondary-actions">
                        {state.aiMode !== "offline" && (
                          <Button
                            variant="ghost"
                            icon={Search}
                            onClick={() => {
                              setManual(!manual);
                              setChoice("");
                            }}
                          >
                            {manual
                              ? "Voltar às sugestões"
                              : "Escolher outro atendimento"}
                          </Button>
                        )}
                        {!correcting && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setChoosingLink(false);
                              setChoice("");
                            }}
                          >
                            Voltar
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                  {creating && (
                    <form
                      className="mail-new-demand"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = new FormData(e.currentTarget);
                        const title = String(form.get("title") || "").trim();
                        const company = String(
                          form.get("company") || "",
                        ).trim();
                        const person = String(form.get("person") || "").trim();
                        if (
                          !title ||
                          !clientId ||
                          (clientId === "new" && (!company || !person))
                        )
                          return;
                        const newClientId =
                          clientId === "new" ? uid() : clientId;
                        const d = createDemand(newClientId, title);
                        d.source = channelName(email);
                        d.message = email.text;
                        d.owner = newOwner;
                        setState((s) => {
                          const current = s.inbox?.find(
                            (m) => m.id === email.id,
                          );
                          if (current?.status !== "pending") return s;
                          const next = withReferences({
                            ...s,
                            clients:
                              clientId === "new"
                                ? [
                                    ...s.clients,
                                    {
                                      id: newClientId,
                                      name: company,
                                      contact: person,
                                      email:
                                        messageChannel(email) === "email"
                                          ? email.from
                                          : "",
                                      phone:
                                        messageChannel(email) === "whatsapp"
                                          ? email.from
                                          : "",
                                      nucleus: "",
                                      nucleusId: "",
                                      accountOwnerId: "",
                                    },
                                  ]
                                : s.clients,
                            demands: [d, ...s.demands],
                          });
                          return linkMail(next, email.id, d.id, "new");
                        });
                        go(`/eventos/${d.id}/briefing`);
                        notify(
                          "Evento criado com a mensagem no histórico. Revise o briefing para organizar as informações.",
                        );
                      }}
                    >
                      <h3>Criar novo evento desta solicitação</h3>
                      <Label label="Nome do novo evento">
                        <input
                          name="title"
                          required
                          defaultValue={email.subject.replace(/^Re:\s*/i, "")}
                        />
                      </Label>
                      <Label label="Cliente do evento">
                        <select
                          required
                          value={clientId}
                          onChange={(e) => {
                            setClientId(e.target.value);
                            setNewOwner(suggestedOwner(state, e.target.value));
                          }}
                        >
                          <option value="">Selecione o cliente</option>
                          {state.clients.map((c) => (
                            <option value={c.id} key={c.id}>
                              {c.name}
                            </option>
                          ))}
                          <option value="new">Cadastrar novo cliente</option>
                        </select>
                      </Label>
                      {clientId === "new" && (
                        <>
                          <Label label="Nome da empresa">
                            <input required name="company" />
                          </Label>
                          <Label label="Nome do contato">
                            <input required name="person" />
                          </Label>
                          <p className="muted">
                            Contato por {channelName(email)}: {email.from}
                          </p>
                        </>
                      )}
                      <Label
                        label="Responsável pelo evento"
                        hint={
                          clientId === "new"
                            ? "O novo cliente ficará A distribuir na carteira."
                            : `Carteira: ${nucleusLabel(
                                state,
                                state.clients.find((c) => c.id === clientId),
                              )}. Sugestão do responsável pela conta; revise antes de criar.`
                        }
                      >
                        <select
                          value={newOwner}
                          onChange={(e) => setNewOwner(e.target.value)}
                        >
                          <option value="">A distribuir</option>
                          {state.users
                            .filter((u) => u.active)
                            .map((u) => (
                              <option key={u.id}>{u.name}</option>
                            ))}
                        </select>
                      </Label>
                      <div className="actions">
                        <Button type="submit" variant="primary">
                          Criar evento e abrir briefing
                        </Button>
                        <Button onClick={() => setCreating(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )}
              {correcting ? (
                <Button variant="ghost" onClick={() => setCorrecting(false)}>
                  Cancelar correção
                </Button>
              ) : (
                !creating &&
                !choosingLink && (
                  <details className="service-disclosure">
                    <summary>Outras ações</summary>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setState((s) =>
                          changeMailStatus(s, email.id, "ignored"),
                        );
                        onResolved("ignored");
                        notify(
                          "Mensagem ignorada nesta fila. Você pode restaurá-la na aba Ignoradas.",
                        );
                      }}
                    >
                      Ignorar nesta fila
                    </Button>
                  </details>
                )
              )}
            </>
          )}
        </section>
      </div>
      {linkedDemand && email.status === "linked" && !correcting && (
        <details
          ref={reply}
          className="inbox-reply"
          aria-label="Resposta ao contato"
        >
          <summary>Responder ao cliente e ver respostas</summary>
          <div className="conversation-owner">
            <span>
              <strong>Responsável:</strong> {linkedDemand.owner || UNASSIGNED}
            </span>
            <span>
              {nucleusLabel(
                state,
                state.clients.find((c) => c.id === linkedDemand.clientId),
              )}
            </span>
          </div>
          <ReplyComposer
            key={`${email.id}-${linkedDemand.id}`}
            d={linkedDemand}
            incoming={email}
          />
          {(linkedDemand.conversation || [])
            .filter(
              (m) => m.direction === "out" && m.replyToMessageId === email.id,
            )
            .map((m) => (
              <article className="reply-sent-message" key={m.id}>
                <strong>
                  {m.author} · {m.channel}
                </strong>
                <small>
                  {dateTime(m.at)} ·{" "}
                  {m.delivery === "manual"
                    ? "Registro manual"
                    : "Envio simulado"}
                </small>
                <p className="mail-body">{m.text}</p>
              </article>
            ))}
        </details>
      )}
    </>
  );
}
