import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Mail,
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
} from "../inbox-model";
import { Badge, Button, Empty, Label, Note, Title } from "../components/UI";

const statusNames = {
  pending: "Para identificar",
  linked: "Associados",
  ignored: "Ignorados",
};
const methodNames = {
  reference: "Código reconhecido",
  thread: "Conversa já vinculada",
  suggestion: "Sugestão confirmada",
  manual: "Escolha do atendimento",
  new: "Nova demanda criada",
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
  const detail = useRef<HTMLDivElement>(null);
  const rows = inbox
    .filter((m) => m.status === filter)
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  const selected = rows.find((m) => m.id === selectedId) || rows[0];
  const choose = (id: string) => {
    setSelectedId(id);
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
  };
  return (
    <>
      <div className="demand-breadcrumb">
        <button onClick={() => go("/")}>
          <ArrowLeft size={15} /> Atendimento
        </button>
        <ChevronRight size={13} />
        <span>E-mails</span>
      </div>
      <Title
        title="E-mails do atendimento"
        sub="Uma mensagem, o atendimento certo. Revise a sugestão e confirme o vínculo."
        actions={
          <Button
            icon={Mail}
            disabled={!inbox.some((m) => m.status === "linked")}
            onClick={() => {
              const email = demoFollowUp(state);
              if (!email) return;
              const nextState = receiveMail(state, [email]);
              const received = nextState.inbox?.find((m) => m.id === email.id);
              if (!received) return;
              setState(() => nextState);
              setFilter(received.status);
              setSelectedId(email.id);
              notify(
                received.status === "linked"
                  ? `Resposta fictícia recebida e associada ${received.method === "reference" ? "pelo código reconhecido" : "pela conversa conhecida"}. O briefing continua aguardando revisão do conteúdo.`
                  : "Resposta fictícia recebida e pendente de identificação. Revise os indícios e confirme o vínculo.",
              );
            }}
          >
            Simular nova resposta
          </Button>
        }
      />
      <div className="inbox-mode">
        <Badge>Simulação</Badge>
        <span>Mensagens fictícias · Gmail não conectado</span>
        <label>
          <input
            type="checkbox"
            checked={state.aiMode === "offline"}
            onChange={(e) => {
              const offline = e.target.checked;
              setState((s) => ({
                ...s,
                aiMode: offline ? "offline" : "available",
              }));
            }}
          />{" "}
          Simular IA indisponível
        </label>
      </div>
      <div className="inbox-filters" role="group" aria-label="Filtrar e-mails">
        {(Object.keys(statusNames) as InboxEmail["status"][]).map((key) => (
          <button
            key={key}
            aria-pressed={filter === key}
            className={filter === key ? "active" : ""}
            onClick={() => {
              setFilter(key);
              setSelectedId("");
            }}
          >
            {statusNames[key]}{" "}
            <span className="count">
              {inbox.filter((m) => m.status === key).length}
            </span>
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <section className="panel">
          <Empty
            title={
              filter === "pending"
                ? "Todas as mensagens foram identificadas"
                : "Nenhum e-mail nesta lista"
            }
            text={
              filter === "pending"
                ? "As associações ficam no histórico. Você pode revisá-las na aba Associados."
                : "As mensagens aparecerão aqui conforme você concluir a triagem."
            }
            action={
              filter === "pending" ? (
                <Button onClick={() => setFilter("linked")}>
                  Ver associados
                </Button>
              ) : (
                <Button onClick={next}>Voltar para identificação</Button>
              )
            }
          />
        </section>
      ) : (
        <div className="inbox-layout">
          <nav className="inbox-list" aria-label="Mensagens recebidas">
            {rows.map((m) => (
              <button
                key={m.id}
                className={`inbox-list-item ${m.id === selected?.id ? "active" : ""}`}
                aria-current={m.id === selected?.id ? "true" : undefined}
                onClick={() => choose(m.id)}
              >
                <span className="inbox-list-sender">{m.from}</span>
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
  const candidates = suggestMailCandidates(email, state);
  const direct = directAssociation(email, state);
  const linkedDemand = state.demands.find((d) => d.id === email.demandId);
  const [correcting, setCorrecting] = useState(false);
  const [choice, setChoice] = useState("");
  const [manual, setManual] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [clientId, setClientId] = useState("");
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
              pending: "Para identificar",
              linked: "Associado",
              ignored: "Ignorado",
            }[email.status]
          }
        </Badge>
      </div>
      <div className="mail-review-columns">
        <section className="mail-original" aria-label="Conteúdo do e-mail">
          <dl className="mail-envelope">
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
          <p className="mail-body">{email.text}</p>
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
                  onClick={() => go(`/demandas/${linkedDemand!.id}/briefing`)}
                >
                  Abrir briefing
                </Button>
                {pendingCount > 0 && (
                  <Button onClick={onNext}>Próximo e-mail</Button>
                )}
              </div>
              <Button
                variant="ghost"
                icon={Undo2}
                onClick={() => {
                  setCorrecting(true);
                  setChoice("");
                  setManual(true);
                }}
              >
                Corrigir vínculo
              </Button>
            </>
          ) : (
            <>
              <div className="section-heading">
                <h3>
                  {correcting
                    ? "Corrigir atendimento"
                    : "Atendimentos sugeridos"}
                </h3>
                {!correcting && <Badge>IA simulada</Badge>}
              </div>
              {correcting && (
                <Note>
                  A mensagem será movida. Alterações que já foram aplicadas aos
                  campos não são desfeitas; confira os dois briefings.
                </Note>
              )}
              {direct.warning && <Note tone="warning">{direct.warning}</Note>}
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
                                    {client?.name} · {d.owner}
                                  </small>
                                  <small>
                                    {d.date
                                      ? d.date.split("-").reverse().join("/")
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
                                <p className="candidate-caution" key={caution}>
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
                          pedido como uma nova demanda.
                        </p>
                      </div>
                    )}
                  </>
                )
              )}
              {(manual || state.aiMode === "offline") && !creating && (
                <div className="mail-manual">
                  <Label label="Buscar atendimento">
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Código, evento ou cliente"
                    />
                  </Label>
                  <Label label="Atendimento para associar">
                    <select
                      value={choice}
                      onChange={(e) => setChoice(e.target.value)}
                    >
                      <option value="">Selecione um atendimento</option>
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
                        icon={Plus}
                        onClick={() => setCreating(true)}
                      >
                        Criar nova demanda
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
                    const company = String(form.get("company") || "").trim();
                    const person = String(form.get("person") || "").trim();
                    if (
                      !title ||
                      !clientId ||
                      (clientId === "new" && (!company || !person))
                    )
                      return;
                    const newClientId = clientId === "new" ? uid() : clientId;
                    const d = createDemand(newClientId, title);
                    setState((s) => {
                      const current = s.inbox?.find((m) => m.id === email.id);
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
                                  email: email.from,
                                  nucleus: "Núcleo 1",
                                },
                              ]
                            : s.clients,
                        demands: [d, ...s.demands],
                      });
                      return linkMail(next, email.id, d.id, "new");
                    });
                    onResolved("linked");
                    notify(
                      "Demanda criada com a mensagem no histórico. Revise o briefing para organizar as informações.",
                    );
                  }}
                >
                  <h3>Registrar o novo pedido</h3>
                  <Label label="Nome da nova demanda">
                    <input
                      name="title"
                      required
                      defaultValue={email.subject.replace(/^Re:\s*/i, "")}
                    />
                  </Label>
                  <Label label="Cliente da nova demanda">
                    <select
                      required
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
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
                      <p className="muted">E-mail do contato: {email.from}</p>
                    </>
                  )}
                  <div className="actions">
                    <Button type="submit" variant="primary">
                      Criar e associar
                    </Button>
                    <Button onClick={() => setCreating(false)}>Cancelar</Button>
                  </div>
                </form>
              )}
              {correcting ? (
                <Button variant="ghost" onClick={() => setCorrecting(false)}>
                  Cancelar correção
                </Button>
              ) : (
                !creating && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setState((s) => changeMailStatus(s, email.id, "ignored"));
                      onResolved("ignored");
                      notify(
                        "Mensagem ignorada nesta fila. Você pode restaurá-la na aba Ignorados.",
                      );
                    }}
                  >
                    Ignorar nesta fila
                  </Button>
                )
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
