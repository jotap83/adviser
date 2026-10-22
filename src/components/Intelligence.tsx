import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  BookOpen,
  ListChecks,
  WandSparkles,
} from "lucide-react";
import { useStore, go, copy } from "../store";
import { uid } from "../data";
import { AIBadge, Badge, Button, Empty, Label, Note, Title } from "./UI";
import {
  contextFingerprint,
  defaultInputs,
  demandPath,
  opportunities,
  simulateIntelligence,
  type AIInputs,
  type IntelligenceResult,
  type OpportunityId,
  type SuggestedTask,
} from "../intelligence-model";
import { FinanceDocumentIntake } from "./FinanceDocumentIntake";
import { money } from "../domain.mjs";
import type { ProductionTask } from "../types";

export function IntelligenceEntry({
  ids,
  contextId = "",
}: {
  ids: OpportunityId[];
  contextId?: string;
}) {
  return (
    <section className="intelligence-entry" aria-label="Apoio com IA">
      <div>
        <WandSparkles size={18} aria-hidden="true" />
        <span>
          <strong>Apoio com IA</strong>
          <small>Possibilidades para evoluir · simulação</small>
        </span>
      </div>
      <div className="intelligence-entry-actions">
        {ids.map((id) => (
          <Button key={id} onClick={() => go(`/escopo/ia/${id}/${contextId}`)}>
            {opportunities.find((o) => o.id === id)?.title}
            <AIBadge decorative />
            <ArrowRight size={14} />
          </Button>
        ))}
      </div>
    </section>
  );
}

export function IntelligenceWorkspace({
  opportunity = "quotes",
  contextId = "",
}: {
  opportunity?: string;
  contextId?: string;
}) {
  const { state, setState, updateDemand, notify } = useStore();
  const item =
    opportunities.find((o) => o.id === opportunity) || opportunities[0];
  const isProject = item.id === "operations" || item.id === "finance";
  const d =
    state.demands.find((x) => x.id === contextId) ||
    (item.id === "quotes"
      ? state.demands.find((x) => x.quotes.some((q) => q.status === "received"))
      : undefined) ||
    state.demands[0];
  const project =
    (state.productionProjects || []).find((x) => x.id === contextId) ||
    state.productionProjects?.[0];
  const actualContext =
    item.id === "management"
      ? "portfolio"
      : isProject
        ? project?.id || ""
        : d?.id || "";
  const [input, setInput] = useState<AIInputs>(() =>
    defaultInputs(state, d, project),
  );
  const [result, setResult] = useState<IntelligenceResult>();
  const [draft, setDraft] = useState("");
  const [snapshot, setSnapshot] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [taskDrafts, setTaskDrafts] = useState<SuggestedTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const priority = !!state.intelligencePriorities?.[item.id];
  const stale = !!result && snapshot !== contextFingerprint(state);
  const offline = state.aiMode === "offline";
  const notes = (state.intelligenceNotes || []).filter(
    (n) => n.opportunity === item.id && n.contextId === actualContext,
  );
  const entries = (state.financeEntries || []).filter(
    (e) => e.projectId === project?.id && e.direction === "pay",
  );
  const selectedEntry = entries.find((entry) => entry.id === input.entryId);
  const takenTask = (task: SuggestedTask) =>
    !!project?.tasks.some(
      (t) =>
        t.aiOrigin === task.key ||
        t.title.toLocaleLowerCase("pt-BR") ===
          task.title.toLocaleLowerCase("pt-BR"),
    );
  useEffect(() => {
    if (result) resultHeading.current?.focus({ preventScroll: true });
  }, [result]);
  function changeInput(patch: Partial<AIInputs>) {
    setInput((v) => ({ ...v, ...patch }));
    setResult(undefined);
    setReviewed(false);
    setSaved(false);
    setApplied(false);
  }
  function run() {
    if (offline && item.id !== "finance") return;
    if (item.id === "finance" && (!input.document || !input.entryId)) return;
    const next = simulateIntelligence(state, item.id, actualContext, input);
    setResult(next);
    setDraft(
      next.draft ||
        `${next.summary}\n\n${next.findings.map((f) => `${f.title}: ${f.detail}`).join("\n\n")}`,
    );
    setSnapshot(contextFingerprint(state));
    setReviewed(false);
    setSaved(false);
    setApplied(false);
    setTaskDrafts(next.tasks || []);
    setSelectedTasks(
      (next.tasks || []).filter((t) => !takenTask(t)).map((t) => t.key),
    );
  }
  function save() {
    if (!result || stale || !reviewed || !draft.trim()) return;
    setState((s) => ({
      ...s,
      intelligenceNotes: [
        {
          id: uid(),
          opportunity: item.id,
          contextId: actualContext,
          title: result.title,
          content: draft.trim(),
          at: new Date().toISOString(),
        },
        ...(s.intelligenceNotes || []),
      ],
    }));
    setSaved(true);
    notify(
      "Análise revisada guardada neste navegador. Nenhuma mensagem foi enviada.",
    );
  }
  function addTasks() {
    if (!project || !result || result.blocked || !reviewed || stale) return;
    const chosen = taskDrafts.filter(
      (t) => selectedTasks.includes(t.key) && !takenTask(t),
    );
    if (!chosen.length) return;
    const at = new Date().toISOString();
    const tasks: ProductionTask[] = chosen.map((t) => ({
      id: uid(),
      aiOrigin: t.key,
      title: t.title.trim(),
      description: t.description,
      status: "todo",
      owner: t.owner,
      due: t.due,
      phase: t.phase,
      priority: "normal",
      supplier: "",
      blockedReason: "",
      checklist: t.checks.map((text) => ({ id: uid(), text, done: false })),
      comments: [],
      activity: [
        {
          at,
          text: "Sugestão da simulação de IA revisada e adicionada pela equipe.",
        },
      ],
    }));
    if (tasks.some((t) => !t.title)) {
      notify("Dê um título às tarefas selecionadas.");
      return;
    }
    setState((s) => ({
      ...s,
      productionProjects: s.productionProjects?.map((p) =>
        p.id === project.id
          ? {
              ...p,
              tasks: [
                ...p.tasks,
                ...tasks.filter(
                  (t) =>
                    !p.tasks.some(
                      (old) =>
                        old.aiOrigin === t.aiOrigin ||
                        old.title.toLocaleLowerCase("pt-BR") ===
                          t.title.toLocaleLowerCase("pt-BR"),
                    ),
                ),
              ],
            }
          : p,
      ),
    }));
    setApplied(true);
    notify(
      `${tasks.length} tarefa(s) adicionada(s) ao quadro de demonstração.`,
    );
  }
  const canUse =
    !!result && !result.blocked && !stale && reviewed && !!draft.trim();
  const sourcePath =
    item.id === "management"
      ? "/gestao"
      : isProject
        ? `/${item.id === "operations" ? "operacoes" : "financeiro"}/${actualContext}`
        : d
          ? demandPath(
              d,
              item.id === "quotes"
                ? "compare"
                : item.id === "review"
                  ? "proposal"
                  : "briefing",
            )
          : "/demandas";
  return (
    <div className="intelligence-workspace">
      <Title title={item.title} sub={item.benefit} />
      <p className="ai-legend">
        <AIBadge /> Demonstração com dados fictícios e análises simuladas.
        Nenhuma IA está conectada.
      </p>
      <div className="intelligence-layout">
        <div className="intelligence-mobile-nav">
          <Label label="Qual possibilidade você quer explorar?">
            <select
              value={item.id}
              onChange={(e) =>
                go(
                  `/escopo/ia/${e.target.value}/${e.target.value === "management" ? "" : ["operations", "finance"].includes(e.target.value) ? project?.id || "" : d?.id || ""}`,
                )
              }
            >
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                  {state.intelligencePriorities?.[o.id] ? " · priorizado" : ""}
                </option>
              ))}
            </select>
          </Label>
        </div>
        <nav className="intelligence-nav" aria-label="Possibilidades com IA">
          {opportunities.map((o) => (
            <a
              key={o.id}
              href={`#/escopo/ia/${o.id}/${o.id === "management" ? "" : o.id === "operations" || o.id === "finance" ? project?.id || "" : d?.id || ""}`}
              aria-current={item.id === o.id ? "page" : undefined}
            >
              <span>
                {o.title}
                <small>{o.area}</small>
                <AIBadge />
              </span>
              {state.intelligencePriorities?.[o.id] ? (
                <Check size={15} aria-label="Priorizado para conversa" />
              ) : (
                <ArrowRight size={14} aria-hidden="true" />
              )}
            </a>
          ))}
          <p className="intelligence-plan-count">
            {
              Object.values(state.intelligencePriorities || {}).filter(Boolean)
                .length
            }{" "}
            prioridade(s) para conversar.
            <br />
            Sem compromisso de prazo ou contratação.
          </p>
        </nav>
        <div className="intelligence-main">
          <section className="panel intelligence-form" aria-label={item.title}>
            <div className="intelligence-context">
              {item.id !== "management" && (
                <Label
                  label={
                    isProject
                      ? "Projeto de referência"
                      : "Demanda de referência"
                  }
                >
                  <select
                    value={actualContext}
                    onChange={(e) =>
                      go(`/escopo/ia/${item.id}/${e.target.value}`)
                    }
                  >
                    {(isProject
                      ? state.productionProjects || []
                      : state.demands
                    ).map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.title}
                      </option>
                    ))}
                  </select>
                </Label>
              )}
              <Button
                variant="ghost"
                icon={ArrowRight}
                onClick={() => go(sourcePath)}
              >
                Abrir tela de origem
              </Button>
            </div>
            {item.id === "quotes" && (
              <Label label="Categoria para comparar">
                <select
                  value={input.category}
                  onChange={(e) => changeInput({ category: e.target.value })}
                >
                  <option value="">Todas as categorias</option>
                  {[
                    ...new Map(
                      d?.quotes.map((q) => [q.template.id, q.template.name]) ||
                        [],
                    ).entries(),
                  ].map(([id, name]) => (
                    <option value={id} key={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </Label>
            )}
            {item.id === "changes" && (
              <div className="intelligence-fields">
                <Label
                  label="Novo público solicitado"
                  hint={`Registrado: ${d?.guests || "não definido"}. Alteração hipotética para análise.`}
                >
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    step="1"
                    value={input.guests}
                    onChange={(e) => changeInput({ guests: e.target.value })}
                  />
                </Label>
                <Label
                  label="Nova data solicitada"
                  hint="Confirme os campos extraídos da conversa antes de aplicar."
                >
                  <input
                    type="date"
                    value={input.date}
                    onChange={(e) => changeInput({ date: e.target.value })}
                  />
                </Label>
              </div>
            )}
            {item.id === "management" && (
              <Label
                label="O que você quer entender?"
                hint="Carteira completa. Perguntas demonstrativas; análises de ciclo e conversão usam os últimos 30 dias."
              >
                <select
                  value={input.question}
                  onChange={(e) => changeInput({ question: e.target.value })}
                >
                  <option value="attention">Onde preciso agir hoje?</option>
                  <option value="cycle">Como está o tempo até o aceite?</option>
                  <option value="conversion">
                    O que sabemos sobre a conversão?
                  </option>
                </select>
              </Label>
            )}
            {item.id === "memory" && (
              <Label
                label="Buscar no histórico de propostas aceitas"
                hint="Busca demonstrativa por termos. Deixe vazio para ver referências disponíveis."
              >
                <input
                  value={input.query}
                  placeholder="Ex.: convenção, Rio, confraternização"
                  onChange={(e) => changeInput({ query: e.target.value })}
                />
              </Label>
            )}
            {item.id === "creative" && (
              <Label label="Direção para explorar">
                <select
                  value={input.direction}
                  onChange={(e) => changeInput({ direction: e.target.value })}
                >
                  <option value="conexoes">Integração e conexões</option>
                  <option value="reconhecimento">
                    Reconhecimento da equipe
                  </option>
                  <option value="futuro">Visão de futuro</option>
                </select>
              </Label>
            )}
            {item.id === "finance" && (
              <>
                <FinanceDocumentIntake
                  key={actualContext}
                  projectId={actualContext}
                  onReviewed={(document, documentOrigin) =>
                    changeInput({ document, documentOrigin })
                  }
                />
                <section className="billing-match" data-tour="billing-match">
                  <h3>3. Conferir com o valor previsto</h3>
                  <p>
                    Escolha a conta a pagar que corresponde à cobrança. O
                    vínculo é confirmado por você.
                  </p>
                  <Label label="Lançamento a pagar para comparar">
                    <select
                      value={input.entryId}
                      onChange={(e) => changeInput({ entryId: e.target.value })}
                    >
                      <option value="">Selecione um lançamento</option>
                      {entries.map((e) => (
                        <option value={e.id} key={e.id}>
                          {e.description} · {money(e.amount)}
                        </option>
                      ))}
                    </select>
                  </Label>
                  {selectedEntry && (
                    <p className="billing-match-summary">
                      Previsto: {money(selectedEntry.amount)} · Vencimento:{" "}
                      {entries
                        .find((e) => e.id === input.entryId)!
                        .due.split("-")
                        .reverse()
                        .join("/")}
                    </p>
                  )}
                  {!entries.length && (
                    <p className="field-hint">
                      Este evento não tem lançamentos a pagar para comparação.
                    </p>
                  )}
                  {!input.document && (
                    <p className="field-hint">
                      Receba a cobrança e confirme a revisão dos dados na etapa
                      2 para habilitar a conferência.
                    </p>
                  )}
                  <p className="field-hint">
                    A comparação de valores usa regras do sistema. A IA apoia a
                    leitura; nenhum pagamento ou lançamento é alterado.
                  </p>
                </section>
              </>
            )}
            {offline && item.id !== "finance" && (
              <Note tone="warning">
                A IA está indisponível nesta simulação. Você pode continuar pela
                tela de origem e preencher tudo manualmente, ou reativá-la em
                Equipe e IA.
              </Note>
            )}
            <div className="intelligence-controls">
              <Button
                variant="primary"
                icon={item.id === "finance" ? Check : WandSparkles}
                onClick={run}
                disabled={
                  (offline && item.id !== "finance") ||
                  (!actualContext && item.id !== "management") ||
                  (item.id === "finance" && (!input.document || !input.entryId))
                }
              >
                {item.action}
                {item.id !== "finance" && <AIBadge decorative />}
              </Button>
              <Button
                icon={priority ? Check : ListChecks}
                aria-pressed={priority}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    intelligencePriorities: {
                      ...s.intelligencePriorities,
                      [item.id]: !priority,
                    },
                  }))
                }
              >
                {priority
                  ? "Retirar das prioridades"
                  : "Priorizar para conversa"}
              </Button>
            </div>
            <p className="intelligence-measure">
              <strong>Como avaliar o ganho:</strong> {item.measure}
            </p>
          </section>
          {!result && (
            <div className="intelligence-awaiting">
              <BookOpen size={21} />
              <div>
                <h3>Veja o raciocínio e as fontes</h3>
                <p>
                  Simule a análise acima. Depois confira os registros, ajuste o
                  texto e decida o próximo passo.
                </p>
              </div>
            </div>
          )}
          {result && (
            <section
              className="panel intelligence-result"
              aria-label="Resultado da simulação"
            >
              <div className="section-heading">
                <div>
                  <h2 ref={resultHeading} tabIndex={-1}>
                    {result.title}
                  </h2>
                  <p>{result.summary}</p>
                </div>
                <Badge tone="blue">Sugestão para revisão</Badge>
              </div>
              {stale && !applied && (
                <Note tone="warning">
                  Os registros mudaram após a análise. Execute novamente antes
                  de guardar ou aplicar o resultado.
                </Note>
              )}
              {result.blocked && <Note tone="warning">{result.blocked}</Note>}
              {!!result.rows?.length && (
                <div className="table-scroll intelligence-comparison">
                  <table>
                    <caption>
                      Valores e condições informados nas cotações
                    </caption>
                    <thead>
                      <tr>
                        {result.columns?.map((c) => (
                          <th key={c}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i}>
                          {row.map((v, j) => (
                            <td key={j}>{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="intelligence-findings">
                {result.findings.map((f, i) => (
                  <article key={i}>
                    <div>
                      <h3>{f.title}</h3>
                      {f.tone === "amber" && (
                        <Badge tone="amber">Conferir</Badge>
                      )}
                    </div>
                    <p>{f.detail}</p>
                    <small>Fonte: {f.source}</small>
                    {f.path && (
                      <a href={`#${f.path}`}>
                        Abrir registro <ArrowRight size={13} />
                      </a>
                    )}
                  </article>
                ))}
              </div>
              {!result.findings.length && !result.blocked && (
                <Empty
                  title="Sem registros para detalhar"
                  text="Os dados disponíveis ainda não sustentam uma recomendação específica."
                />
              )}
              {result.tasks && !result.blocked && (
                <div className="intelligence-tasks">
                  <h3>Revise o plano antes de adicionar ao quadro</h3>
                  {taskDrafts.map((t) => (
                    <div className="intelligence-task" key={t.key}>
                      <label className="intelligence-check">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(t.key)}
                          disabled={takenTask(t) || applied}
                          onChange={(e) => {
                            setReviewed(false);
                            setSelectedTasks((v) =>
                              e.target.checked
                                ? [...v, t.key]
                                : v.filter((k) => k !== t.key),
                            );
                          }}
                        />
                        <span>
                          {t.title}
                          {takenTask(t) && <small>Já existe no quadro</small>}
                        </span>
                      </label>
                      <p>{t.description}</p>
                      <div className="intelligence-fields">
                        <Label label={`Responsável — ${t.title}`}>
                          <select
                            value={t.owner}
                            disabled={applied || takenTask(t)}
                            onChange={(e) => {
                              setReviewed(false);
                              setTaskDrafts((v) =>
                                v.map((x) =>
                                  x.key === t.key
                                    ? { ...x, owner: e.target.value }
                                    : x,
                                ),
                              );
                            }}
                          >
                            <option value="">A distribuir</option>
                            {[
                              ...new Set([
                                t.owner,
                                ...state.users
                                  .filter((u) => u.active)
                                  .map((u) => u.name),
                              ]),
                            ]
                              .filter(Boolean)
                              .map((n) => (
                                <option key={n}>{n}</option>
                              ))}
                          </select>
                        </Label>
                        <Label
                          label={`Prazo — ${t.title}`}
                          hint="Opcional; confirme com a operação."
                        >
                          <input
                            type="date"
                            value={t.due}
                            disabled={applied || takenTask(t)}
                            onChange={(e) => {
                              setReviewed(false);
                              setTaskDrafts((v) =>
                                v.map((x) =>
                                  x.key === t.key
                                    ? { ...x, due: e.target.value }
                                    : x,
                                ),
                              );
                            }}
                          />
                        </Label>
                      </div>
                      <details>
                        <summary>Checklist sugerido</summary>
                        <ul>
                          {t.checks.map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  ))}
                </div>
              )}
              <p className="intelligence-limitation">{result.limitation}</p>
              {!result.blocked && (
                <div className="intelligence-review">
                  <Label
                    label="Texto para revisar e guardar"
                    hint="Um rascunho interno; guardar não envia mensagens nem altera a proposta."
                  >
                    <textarea
                      rows={7}
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        setReviewed(false);
                        setSaved(false);
                      }}
                    />
                  </Label>
                  <label className="intelligence-check">
                    <input
                      type="checkbox"
                      checked={reviewed}
                      onChange={(e) => setReviewed(e.target.checked)}
                    />
                    <span>
                      Revisei o conteúdo e as fontes
                      {result.tasks
                        ? ", os responsáveis e os prazos das tarefas selecionadas"
                        : ""}
                      .
                    </span>
                  </label>
                  <div className="intelligence-controls">
                    <Button
                      icon={Check}
                      variant="primary"
                      disabled={!canUse || saved}
                      onClick={save}
                    >
                      {saved ? "Análise guardada" : "Guardar análise revisada"}
                    </Button>
                    <Button
                      disabled={!reviewed || !draft.trim() || stale}
                      onClick={async () =>
                        notify(
                          (await copy(draft))
                            ? "Rascunho copiado. Revise o destinatário antes de usar."
                            : "Selecione o texto e copie manualmente.",
                        )
                      }
                    >
                      Copiar rascunho
                    </Button>
                    {result.tasks && (
                      <Button
                        disabled={
                          !canUse ||
                          applied ||
                          !taskDrafts.some(
                            (t) =>
                              selectedTasks.includes(t.key) && !takenTask(t),
                          )
                        }
                        onClick={addTasks}
                      >
                        {applied
                          ? "Tarefas adicionadas"
                          : "Adicionar tarefas revisadas"}
                      </Button>
                    )}
                    {item.id === "creative" && d && (
                      <Button
                        disabled={
                          !canUse ||
                          applied ||
                          (!!d.creative && d.creative.includes(draft.trim()))
                        }
                        onClick={() => {
                          updateDemand(
                            d.id,
                            (current) => ({
                              ...current,
                              creative: [current.creative, draft.trim()]
                                .filter(Boolean)
                                .join("\n\n"),
                            }),
                            "Direção criativa da simulação de IA revisada e registrada.",
                          );
                          setApplied(true);
                          notify(
                            "Sugestão adicionada à direção criativa, sem alterar apresentações ou aprovações.",
                          );
                        }}
                      >
                        {applied
                          ? "Direção registrada"
                          : "Adicionar à direção criativa"}
                      </Button>
                    )}
                  </div>
                  {applied && (
                    <p role="status">
                      <a href={`#${sourcePath}`}>
                        Abrir a tela e conferir o resultado{" "}
                        <ArrowRight size={14} />
                      </a>
                    </p>
                  )}
                </div>
              )}
            </section>
          )}
          <section className="intelligence-saved">
            <Button
              variant="ghost"
              onClick={() => setSavedOpen(!savedOpen)}
              aria-expanded={savedOpen}
            >
              {savedOpen ? "Ocultar" : "Ver"} análises guardadas ({notes.length}
              )
            </Button>
            {savedOpen &&
              (notes.length ? (
                notes.map((n) => (
                  <article key={n.id}>
                    <h3>{n.title}</h3>
                    <small>
                      {new Date(n.at).toLocaleString("pt-BR")} · revisão local
                    </small>
                    <p>{n.content}</p>
                  </article>
                ))
              ) : (
                <p>Nenhuma análise guardada neste contexto.</p>
              ))}
          </section>
        </div>
      </div>
      <div className="intelligence-footer">
        <Button onClick={() => go("/escopo")} icon={ArrowLeft}>
          Ver etapas
        </Button>
        <p>
          As prioridades e entregas são combinadas a cada ciclo de evolução.
        </p>
      </div>
    </div>
  );
}
