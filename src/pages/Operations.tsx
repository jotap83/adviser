import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckSquare,
  GripVertical,
  MessageSquare,
  Plus,
  Search,
  TriangleAlert,
} from "lucide-react";
import { Badge, Button, Empty, Label, Note, Title } from "../components/UI";
import { useStore, go } from "../store";
import { uid } from "../data";
import { money } from "../domain.mjs";
import {
  isTaskLate,
  productionPhases,
  projectFromHandoff,
  taskStatuses,
  taskTransitionError,
} from "../production-model";
import type { ProductionProject, ProductionTask, TaskStatus } from "../types";

const dateLabel = (date: string) =>
  date ? date.split("-").reverse().join("/") : "Sem prazo";
const timeLabel = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

export function Operations({ projectId }: { projectId?: string }) {
  const { state, setState, notify } = useStore();
  const projects = state.productionProjects || [];
  const project = projects.find((p) => p.id === projectId) || projects[0];
  const [selected, setSelected] = useState("");
  const [adding, setAdding] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState("");
  const [attention, setAttention] = useState("");
  const [mobileStatus, setMobileStatus] = useState<TaskStatus>("todo");
  const [dragging, setDragging] = useState("");
  const [showSource, setShowSource] = useState(false);
  useEffect(() => {
    setSelected("");
    setAdding(false);
    setSearch("");
    setOwner("");
    setAttention("");
    setShowSource(false);
  }, [project?.id]);
  if (!project)
    return (
      <Empty
        title="Nenhum projeto"
        text="Prepare um repasse no atendimento para iniciar a demonstração de Operações."
        action={
          <Button onClick={() => go("/demandas")}>Abrir atendimento</Button>
        }
      />
    );
  function updateProject(change: (p: ProductionProject) => ProductionProject) {
    setState((s) => ({
      ...s,
      productionProjects: (s.productionProjects || []).map((p) =>
        p.id === project.id ? change(p) : p,
      ),
    }));
  }
  function patchTask(id: string, patch: Partial<ProductionTask>, log: string) {
    updateProject((p) => ({
      ...p,
      tasks: p.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              ...patch,
              activity: [
                { text: log, at: new Date().toISOString() },
                ...t.activity,
              ],
            }
          : t,
      ),
    }));
  }
  function move(id: string, status: TaskStatus) {
    const task = project.tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    const error = taskTransitionError(task, status);
    if (error) {
      notify(error);
      return;
    }
    patchTask(
      id,
      { status },
      `Movida para ${taskStatuses.find((s) => s.id === status)?.label}.`,
    );
    setMobileStatus(status);
    notify(
      `Tarefa movida para ${taskStatuses.find((s) => s.id === status)?.label}.`,
    );
  }
  function receive(id: string) {
    const demand = state.demands.find((d) => d.id === id);
    const newProject = demand && projectFromHandoff(demand, state);
    if (!newProject) {
      notify("Conclua o aceite e prepare o repasse no atendimento primeiro.");
      return;
    }
    setState((s) => ({
      ...s,
      productionProjects: (s.productionProjects || []).some(
        (p) => p.id === newProject.id,
      )
        ? s.productionProjects
        : [...(s.productionProjects || []), newProject],
    }));
    setReceiving(false);
    go(`/operacoes/${newProject.id}`);
    notify(
      "Projeto criado na demonstração a partir da versão aprovada. Revise o repasse.",
    );
  }
  const ready = state.demands.filter(
    (d) =>
      d.handoff &&
      d.decision === "accepted" &&
      d.versions.some((v) => v.id === d.acceptedVersion) &&
      !projects.some((p) => p.source?.demandId === d.id),
  );
  const visible = project.tasks.filter(
    (t) =>
      (!search ||
        `${t.title} ${t.description} ${t.supplier}`
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR"))) &&
      (!owner || t.owner === owner) &&
      (!attention ||
        (attention === "late"
          ? isTaskLate(t)
          : t.status !== "done" && !!t.blockedReason)),
  );
  const selectedTask = project.tasks.find((t) => t.id === selected);
  const sourceDemand =
    project.source &&
    state.demands.find((d) => d.id === project.source?.demandId);
  const sourceChanged =
    !!project.source &&
    (!sourceDemand ||
      sourceDemand.decision !== "accepted" ||
      sourceDemand.acceptedVersion !== project.source.version.id ||
      !sourceDemand.handoff);
  return (
    <>
      <Title
        title="Operações"
        sub="Do repasse à entrega do evento. Organize o trabalho da equipe em um quadro compartilhado na versão futura."
        actions={
          <Button
            icon={Plus}
            variant="primary"
            onClick={() => {
              setAdding(!adding);
              setSelected("");
            }}
          >
            Nova tarefa
          </Button>
        }
      />
      <div className="production-project-picker">
        <Label label="Projeto / evento">
          <select
            value={project.id}
            onChange={(e) => go(`/operacoes/${e.target.value}`)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </Label>
        <Button icon={ArrowRight} onClick={() => setReceiving(!receiving)}>
          Receber do atendimento
        </Button>
      </div>
      {receiving && (
        <section className="panel production-receive">
          <h2>Repasses prontos para Operações</h2>
          <p>
            O projeto nasce somente após aceite e repasse preparado. Criar o
            projeto não contrata fornecedores.
          </p>
          {ready.length ? (
            ready.map((d) => (
              <div className="production-receive-row" key={d.id}>
                <div>
                  <strong>{d.title}</strong>
                  <small>
                    {d.reference} · {d.owner}
                  </small>
                </div>
                <Button onClick={() => receive(d.id)}>
                  Criar projeto de demonstração
                </Button>
              </div>
            ))
          ) : (
            <Empty
              title="Nenhum novo repasse preparado"
              text="No atendimento, abra uma proposta aprovada, prepare o pacote na aba Repasse e volte aqui."
              action={
                <Button onClick={() => go("/demandas")}>Ver demandas</Button>
              }
            />
          )}
        </section>
      )}
      <section className="production-project-summary">
        <div>
          <h2>{project.title}</h2>
          <p>
            {project.client} · {project.location || "Local a confirmar"}
          </p>
          <span className="production-project-context">
            <CalendarDays size={15} /> {dateLabel(project.date)} · Coordenação:{" "}
            {project.owner}
          </span>
        </div>
        <div className="production-project-progress">
          <strong>
            {project.tasks.filter((t) => t.status === "done").length} de{" "}
            {project.tasks.length} tarefas concluídas
          </strong>
          <span>
            {project.tasks.filter(isTaskLate).length} atrasada(s) ·{" "}
            {
              project.tasks.filter(
                (t) => t.status !== "done" && t.blockedReason,
              ).length
            }{" "}
            bloqueada(s)
          </span>
          <button
            className="text-button"
            onClick={() => setShowSource(!showSource)}
          >
            {showSource ? "Ocultar dados do repasse" : "Ver dados do repasse"}
          </button>
        </div>
      </section>
      {sourceChanged && (
        <Note tone="warning">
          O aceite ou o repasse foi alterado no atendimento. Este projeto
          conserva a versão recebida. Revise o escopo com o atendimento antes de
          continuar.
        </Note>
      )}
      {showSource && (
        <section className="panel production-source">
          <h2>Dados recebidos do atendimento</h2>
          {project.source ? (
            <>
              <p>
                <strong>
                  {project.source.reference} · proposta v
                  {project.source.version.number}
                </strong>{" "}
                · {money(project.source.version.total)} · recebida em{" "}
                {timeLabel(project.source.at)}
              </p>
              <p>
                A cópia recebida é preservada; revisões posteriores não alteram
                o projeto automaticamente.
              </p>
              <dl>
                <dt>Aceite registrado</dt>
                <dd>
                  {project.source.evidence || "Sem observação adicional."}
                </dd>
                <dt>Condições da proposta</dt>
                <dd>
                  {project.source.version.terms ||
                    "A confirmar no atendimento."}
                </dd>
              </dl>
              <details>
                <summary>
                  Itens da versão aprovada (
                  {project.source.version.lines.length})
                </summary>
                <ul>
                  {project.source.version.lines.map((l) => (
                    <li key={l.id}>
                      {l.description} · {l.qty} × {money(l.unit)}
                      {l.direct ? " · pagamento direto pelo cliente" : ""}
                    </li>
                  ))}
                </ul>
              </details>
              <details>
                <summary>Briefing e fornecedores selecionados</summary>
                <p className="preserve-text">{project.source.briefing}</p>
                {project.source.suppliers.map((s, i) => (
                  <p key={i}>
                    <strong>{s.name}</strong> —{" "}
                    {s.terms || "Condições a conferir"}
                  </p>
                ))}
              </details>
              <Button
                onClick={() =>
                  go(`/demandas/${project.source!.demandId}/handoff`)
                }
              >
                Abrir atendimento de origem
              </Button>
            </>
          ) : (
            <p>
              Projeto fictício preparado para explorar o quadro. Para testar a
              continuidade real do fluxo demonstrativo, use “Receber do
              atendimento” com um repasse preparado.
            </p>
          )}
        </section>
      )}
      {adding && (
        <TaskCreate
          onCancel={() => setAdding(false)}
          onSave={(task) => {
            updateProject((p) => ({ ...p, tasks: [...p.tasks, task] }));
            setAdding(false);
            setMobileStatus(task.status);
            notify("Tarefa criada e salva neste navegador.");
          }}
        />
      )}
      {selectedTask ? (
        <TaskDetail
          key={selectedTask.id}
          task={selectedTask}
          onBack={() => setSelected("")}
          onPatch={(patch, log) => patchTask(selectedTask.id, patch, log)}
          onMove={(status) => move(selectedTask.id, status)}
        />
      ) : (
        <>
          <div className="production-toolbar">
            <Label label="Buscar tarefa">
              <div className="production-search">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Título, descrição ou fornecedor"
                />
              </div>
            </Label>
            <Label label="Responsável">
              <select value={owner} onChange={(e) => setOwner(e.target.value)}>
                <option value="">Todos</option>
                {[...new Set(project.tasks.map((t) => t.owner))]
                  .sort()
                  .map((name) => (
                    <option key={name} value={name}>
                      {name || "Sem responsável"}
                    </option>
                  ))}
              </select>
            </Label>
            <Label label="Pendências">
              <select
                value={attention}
                onChange={(e) => setAttention(e.target.value)}
              >
                <option value="">Todas as tarefas</option>
                <option value="late">Atrasadas</option>
                <option value="blocked">Bloqueadas</option>
              </select>
            </Label>
            {(search || owner || attention) && (
              <Button
                onClick={() => {
                  setSearch("");
                  setOwner("");
                  setAttention("");
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
          <div className="production-board-caption">
            <span>
              {visible.length} de {project.tasks.length} tarefas
            </span>
            <span>
              Arraste entre colunas ou use “Mover para” em cada tarefa.
            </span>
          </div>
          <div
            className="production-mobile-states"
            aria-label="Coluna do quadro"
          >
            {taskStatuses.map((s) => (
              <button
                key={s.id}
                aria-pressed={mobileStatus === s.id}
                onClick={() => setMobileStatus(s.id)}
              >
                {s.label}{" "}
                <span>{visible.filter((t) => t.status === s.id).length}</span>
              </button>
            ))}
          </div>
          <div className="production-board">
            {taskStatuses.map((column) => (
              <section
                key={column.id}
                aria-label={column.label}
                className={`production-column ${mobileStatus === column.id ? "mobile-active" : ""} ${dragging ? "accept-drop" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  move(e.dataTransfer.getData("text/plain"), column.id);
                  setDragging("");
                }}
              >
                <h3>
                  {column.label}
                  <span>
                    {visible.filter((t) => t.status === column.id).length}
                  </span>
                </h3>
                {visible
                  .filter((t) => t.status === column.id)
                  .map((task) => (
                    <article
                      className={`production-task ${task.status === "done" ? "task-complete" : ""}`}
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", task.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragging(task.id);
                      }}
                      onDragEnd={() => setDragging("")}
                    >
                      <div className="production-task-top">
                        <span>{task.phase}</span>
                        <GripVertical size={16} aria-hidden="true" />
                      </div>
                      <button
                        className="production-task-title"
                        onClick={() => setSelected(task.id)}
                      >
                        {task.title}
                      </button>
                      <div className="production-task-flags">
                        {task.priority === "high" && (
                          <Badge tone="amber">Prioridade alta</Badge>
                        )}
                        {task.blockedReason && task.status !== "done" && (
                          <Badge tone="red">Bloqueada</Badge>
                        )}
                      </div>
                      {task.blockedReason && task.status !== "done" && (
                        <p className="production-block-reason">
                          {task.blockedReason}
                        </p>
                      )}
                      <p className="production-task-owner">
                        {task.owner || "Sem responsável"}
                      </p>
                      <div
                        className={`production-task-due ${isTaskLate(task) ? "late" : ""}`}
                      >
                        <CalendarDays size={14} />
                        <span>
                          {dateLabel(task.due)}
                          {isTaskLate(task) ? " · atrasada" : ""}
                        </span>
                      </div>
                      <div className="production-task-meta">
                        <span>
                          <CheckSquare size={14} />
                          {task.checklist.filter((x) => x.done).length}/
                          {task.checklist.length}
                        </span>
                        <span>
                          <MessageSquare size={14} />
                          {task.comments.length}
                        </span>
                      </div>
                      <label className="production-move">
                        Mover para
                        <select
                          aria-label={`Mover tarefa ${task.title}`}
                          value={task.status}
                          onChange={(e) =>
                            move(task.id, e.target.value as TaskStatus)
                          }
                        >
                          {taskStatuses.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </article>
                  ))}
                {!visible.some((t) => t.status === column.id) && (
                  <p className="production-column-empty">
                    {search || owner || attention
                      ? "Nenhuma tarefa com estes filtros."
                      : "Nenhuma tarefa nesta coluna."}
                  </p>
                )}
              </section>
            ))}
          </div>
          <div className="bottom-actions">
            <span>
              Pagamentos e recebimentos serão acompanhados na etapa 3.
            </span>
            <Button
              icon={ArrowRight}
              onClick={() => go(`/financeiro/${project.id}`)}
            >
              Ver prévia do financeiro
            </Button>
          </div>
        </>
      )}
    </>
  );
}

function TaskCreate({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (task: ProductionTask) => void;
}) {
  const title = useRef<HTMLInputElement>(null);
  useEffect(() => title.current?.focus(), []);
  return (
    <form
      className="panel production-task-form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const name = String(f.get("title") || "").trim();
        if (!name) return;
        onSave({
          id: uid(),
          title: name,
          description: String(f.get("description") || "").trim(),
          status: "todo",
          owner: String(f.get("owner") || "").trim(),
          due: String(f.get("due") || ""),
          phase: String(f.get("phase")),
          priority: f.get("priority") === "high" ? "high" : "normal",
          supplier: "",
          blockedReason: "",
          checklist: [],
          comments: [],
          activity: [
            {
              text: "Tarefa criada pela equipe na demonstração.",
              at: new Date().toISOString(),
            },
          ],
        });
      }}
    >
      <h2>Nova tarefa</h2>
      <div className="production-form-grid">
        <Label label="Título da tarefa">
          <input ref={title} name="title" required maxLength={140} />
        </Label>
        <Label label="Responsável">
          <input name="owner" required placeholder="Nome da pessoa" />
        </Label>
        <Label label="Prazo">
          <input name="due" type="date" />
        </Label>
        <Label label="Fase do evento">
          <select name="phase">
            {productionPhases.map((phase) => (
              <option key={phase}>{phase}</option>
            ))}
          </select>
        </Label>
        <Label label="Prioridade">
          <select name="priority">
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
          </select>
        </Label>
      </div>
      <Label label="Descrição">
        <textarea name="description" rows={2} />
      </Label>
      <div className="actions">
        <Button type="submit" variant="primary">
          Criar tarefa
        </Button>
        <Button onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

function TaskDetail({
  task,
  onBack,
  onPatch,
  onMove,
}: {
  task: ProductionTask;
  onBack: () => void;
  onPatch: (patch: Partial<ProductionTask>, log: string) => void;
  onMove: (status: TaskStatus) => void;
}) {
  const { notify } = useStore();
  const [draft, setDraft] = useState({
    title: task.title,
    description: task.description,
    owner: task.owner,
    due: task.due,
    phase: task.phase,
    priority: task.priority,
    supplier: task.supplier,
    blockedReason: task.blockedReason,
  });
  const [check, setCheck] = useState("");
  const [comment, setComment] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const edit = (key: string, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));
  return (
    <section className="production-task-detail">
      <div className="section-heading">
        <Button icon={ArrowLeft} onClick={onBack}>
          Voltar ao quadro
        </Button>
        <Label label="Status da tarefa">
          <select
            value={task.status}
            onChange={(e) => onMove(e.target.value as TaskStatus)}
          >
            {taskStatuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Label>
      </div>
      <h2 ref={heading} tabIndex={-1}>
        {task.title}
      </h2>
      <div className="production-detail-grid">
        <div>
          <form
            className="panel production-task-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.title.trim()) return;
              if (task.status === "done" && draft.blockedReason.trim()) {
                notify("Reabra a tarefa antes de registrar um bloqueio.");
                return;
              }
              onPatch(
                {
                  ...draft,
                  title: draft.title.trim(),
                  owner: draft.owner.trim(),
                },
                "Detalhes da tarefa atualizados.",
              );
              notify("Detalhes salvos neste navegador.");
            }}
          >
            <Label label="Título">
              <input
                required
                maxLength={140}
                value={draft.title}
                onChange={(e) => edit("title", e.target.value)}
              />
            </Label>
            <Label label="Descrição">
              <textarea
                rows={3}
                value={draft.description}
                onChange={(e) => edit("description", e.target.value)}
              />
            </Label>
            <div className="production-form-grid">
              <Label label="Responsável">
                <input
                  required
                  value={draft.owner}
                  onChange={(e) => edit("owner", e.target.value)}
                />
              </Label>
              <Label label="Prazo">
                <input
                  type="date"
                  value={draft.due}
                  onChange={(e) => edit("due", e.target.value)}
                />
              </Label>
              <Label label="Fase do evento">
                <select
                  value={draft.phase}
                  onChange={(e) => edit("phase", e.target.value)}
                >
                  {productionPhases.map((phase) => (
                    <option key={phase}>{phase}</option>
                  ))}
                </select>
              </Label>
              <Label label="Prioridade">
                <select
                  value={draft.priority}
                  onChange={(e) => edit("priority", e.target.value)}
                >
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                </select>
              </Label>
            </div>
            <Label label="Fornecedor relacionado">
              <input
                value={draft.supplier}
                onChange={(e) => edit("supplier", e.target.value)}
                placeholder="Se houver"
              />
            </Label>
            <Label
              label="Motivo do bloqueio"
              hint="Deixe vazio quando a pendência estiver resolvida. Salve os detalhes antes de concluir a tarefa."
            >
              <textarea
                rows={2}
                value={draft.blockedReason}
                onChange={(e) => edit("blockedReason", e.target.value)}
              />
            </Label>
            <Button type="submit" variant="primary">
              Salvar detalhes
            </Button>
          </form>
          <section className="panel production-checklist">
            <h3>
              Checklist · {task.checklist.filter((i) => i.done).length}/
              {task.checklist.length}
            </h3>
            {!task.checklist.length && (
              <p>
                Nenhum item. Adicione os passos necessários para concluir a
                tarefa.
              </p>
            )}
            {task.checklist.map((item) => (
              <label className="check-label" key={item.id}>
                <input
                  type="checkbox"
                  checked={item.done}
                  disabled={task.status === "done"}
                  onChange={(e) =>
                    onPatch(
                      {
                        checklist: task.checklist.map((i) =>
                          i.id === item.id
                            ? { ...i, done: e.target.checked }
                            : i,
                        ),
                      },
                      `${e.target.checked ? "Concluído" : "Reaberto"} no checklist: ${item.text}`,
                    )
                  }
                />
                <span>{item.text}</span>
              </label>
            ))}
            {task.status === "done" ? (
              <small>Reabra a tarefa para alterar o checklist.</small>
            ) : (
              <form
                className="production-add-check"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!check.trim()) return;
                  onPatch(
                    {
                      checklist: [
                        ...task.checklist,
                        { id: uid(), text: check.trim(), done: false },
                      ],
                    },
                    "Item acrescentado ao checklist.",
                  );
                  setCheck("");
                }}
              >
                <Label label="Novo item do checklist">
                  <input
                    value={check}
                    onChange={(e) => setCheck(e.target.value)}
                    maxLength={180}
                  />
                </Label>
                <Button type="submit" disabled={!check.trim()} icon={Plus}>
                  Adicionar
                </Button>
              </form>
            )}
          </section>
        </div>
        <div>
          <section className="panel production-comments">
            <h3>Conversa da equipe</h3>
            <p className="muted">Comentários locais de demonstração.</p>
            {task.comments.length ? (
              task.comments.map((c) => (
                <div className="production-comment" key={c.id}>
                  <strong>{c.author}</strong>
                  <time>{timeLabel(c.at)}</time>
                  <p>{c.text}</p>
                </div>
              ))
            ) : (
              <p>Nenhum comentário nesta tarefa.</p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!comment.trim()) return;
                onPatch(
                  {
                    comments: [
                      ...task.comments,
                      {
                        id: uid(),
                        text: comment.trim(),
                        author: "Marina Costa",
                        at: new Date().toISOString(),
                      },
                    ],
                  },
                  "Comentário registrado pela equipe.",
                );
                setComment("");
              }}
            >
              <Label label="Comentário">
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </Label>
              <Button type="submit" disabled={!comment.trim()}>
                Registrar comentário
              </Button>
            </form>
          </section>
          <section className="panel production-activity">
            <h3>Histórico da tarefa</h3>
            {task.activity.map((a, i) => (
              <div key={`${a.at}-${i}`}>
                <p>{a.text}</p>
                <time>{timeLabel(a.at)}</time>
              </div>
            ))}
          </section>
        </div>
      </div>
    </section>
  );
}
