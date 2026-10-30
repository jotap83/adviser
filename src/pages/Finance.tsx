import { contractReady, receivablesFromContract } from "../event-lifecycle";
import { totals } from "../domain.mjs";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { Badge, Button, Empty, Label, Note, Title } from "../components/UI";
import { IntelligenceEntry } from "../components/Intelligence";
import { ApprovalRequestPanel } from "../components/ApprovalRequest";
import { isApproved } from "../approval-model";
import { go, useStore } from "../store";
import { money } from "../domain.mjs";
import { uid } from "../data";
export function Finance({ projectId }: { projectId?: string }) {
  const { state, setState, notify } = useStore();
  const [kind, setKind] = useState(""),
    [status, setStatus] = useState(""),
    [adding, setAdding] = useState(false),
    [reviewing, setReviewing] = useState("");
  const projects = [
      ...(state.productionProjects || []),
      {
        id: "administrativo",
        title: "Despesas administrativas",
        client: "Adviser · demonstração",
        date: "",
        location: "",
        owner: "",
        tasks: [],
        eventId: undefined,
        source: undefined,
      },
    ],
    project = projects.find((p) => p.id === projectId);
  const entries = (state.financeEntries || []).filter(
    (e) => !projectId || e.projectId === projectId,
  );
  const visible = entries.filter(
    (e) =>
      (!kind || e.direction === kind) &&
      (!status || (status === "settled") === e.settled),
  );
  const sum = (direction: string, settled: boolean) =>
    entries
      .filter((e) => e.direction === direction && e.settled === settled)
      .reduce((n, e) => n + e.amount, 0);
  const approvalEntry = entries.find((e) => e.id === reviewing);
  const event = state.demands.find(
    (d) => d.id === (project?.eventId || project?.source?.demandId),
  );
  const accepted = event?.versions.find((v) => v.id === event.acceptedVersion);
  const budget = accepted
    ? totals(accepted.lines, accepted.fee, accepted.tax)
    : undefined;
  const canGenerate =
    event &&
    accepted &&
    contractReady(state, event) &&
    !entries.some((e) => e.sourceKey?.startsWith(`contract:${event.id}:`));

  if (projectId && !project)
    return (
      <Empty
        title="Evento não encontrado"
        text="Escolha um evento disponível na visão financeira geral."
        action={
          <Button onClick={() => go("/financeiro")}>Financeiro geral</Button>
        }
      />
    );
  return (
    <>
      {project && (
        <div className="cross-area-links">
          <Button icon={ArrowLeft} onClick={() => go("/financeiro")}>
            Todos os eventos no financeiro
          </Button>
          <Button onClick={() => go(`/operacoes/${project.id}`)}>
            Operação deste evento
          </Button>
          {project.eventId && (
            <Button onClick={() => go(`/eventos/${project.eventId}/overview`)}>
              Ciclo completo do evento
            </Button>
          )}
          {project.source && (
            <Button
              onClick={() => go(`/eventos/${project.source!.demandId}/handoff`)}
            >
              Proposta de origem
            </Button>
          )}
        </div>
      )}
      <Title
        title={project ? `Financeiro · ${project.title}` : "Financeiro"}
        sub={
          project
            ? `${project.client} · contas, aprovações e movimentações deste evento.`
            : "Contas a pagar e receber de todos os eventos. Filtre a carteira ou abra o detalhe de um evento."
        }
        actions={
          <Button
            icon={Plus}
            variant="primary"
            onClick={() => setAdding(!adding)}
          >
            {adding ? "Fechar cadastro" : "Novo lançamento"}
          </Button>
        }
      />
      <Note>
        A Adviser pode manter a integração com o Conta Azul ou ampliar o
        financeiro próprio durante a evolução. Essa decisão permanece aberta.
        Neste protótipo, não há sincronização nem movimentação de dinheiro.
      </Note>
      <IntelligenceEntry ids={["finance"]} contextId={project?.id} />
      {event && (
        <section className="panel lifecycle-section">
          <h2>Orçamento, compromissos e realizado</h2>
          <div className="global-summary">
            <span>
              Orçamento via Adviser:{" "}
              <strong>
                {budget ? money(budget.invoice) : "Sem proposta aceita"}
              </strong>
            </span>
            <span>
              Custo orçado via Adviser:{" "}
              <strong>
                {budget ? money(budget.agency) : "Não disponível"}
              </strong>
            </span>
            <span>
              Compromissos a pagar:{" "}
              <strong>{money(sum("pay", false) + sum("pay", true))}</strong>
            </span>
            <span>
              Custo pago: <strong>{money(sum("pay", true))}</strong>
            </span>
          </div>
          <p className="field-hint">
            Valores de caixa não representam lucro líquido. Pagamentos diretos
            do cliente aos fornecedores ficam fora das parcelas a receber pela
            Adviser.
          </p>
          {canGenerate ? (
            <form
              className="lifecycle-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                setState((s) =>
                  receivablesFromContract(
                    s,
                    event.id,
                    Number(f.get("deposit")),
                    String(f.get("firstDue")),
                    String(f.get("balanceDue")),
                  ),
                );
                notify(
                  "Parcelas criadas a partir da versão aceita. Confira datas e condições antes de usar.",
                );
              }}
            >
              <h3>Preparar recebimentos do contrato</h3>
              <p>
                Confirme a divisão e os vencimentos conforme o contrato. Os 50%
                são apenas um exemplo editável.
              </p>
              <div className="form-grid">
                <Label label="Percentual do sinal">
                  <input
                    name="deposit"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    defaultValue="50"
                    required
                  />
                </Label>
                <Label label="Vencimento do sinal">
                  <input name="firstDue" type="date" required />
                </Label>
                <Label label="Vencimento do saldo">
                  <input name="balanceDue" type="date" required />
                </Label>
              </div>
              <Button variant="primary" type="submit">
                Gerar parcelas deste contrato
              </Button>
            </form>
          ) : (
            <p className="field-hint">
              {entries.some((e) =>
                e.sourceKey?.startsWith(`contract:${event.id}:`),
              )
                ? "Este evento já tem parcelas de contrato. Se o preço foi revisado, confira os recebimentos e ajuste os lançamentos em aberto manualmente; o valor integral não será gerado novamente."
                : "Para gerar parcelas, conclua o aceite comercial, a revisão do contrato e o registro da assinatura do cliente."}
            </p>
          )}
        </section>
      )}

      <div className="workspace-filter-row">
        <Label label="Evento no financeiro">
          <select
            value={projectId || ""}
            onChange={(e) => {
              setReviewing("");
              setAdding(false);
              go(
                e.target.value
                  ? `/financeiro/${e.target.value}`
                  : "/financeiro",
              );
            }}
          >
            <option value="">Todos os eventos</option>
            {projects.map((p) => (
              <option value={p.id} key={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </Label>
        <Label label="Tipo de lançamento">
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">Pagar e receber</option>
            <option value="pay">A pagar</option>
            <option value="receive">A receber</option>
          </select>
        </Label>
        <Label label="Situação financeira">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todas</option>
            <option value="open">Em aberto</option>
            <option value="settled">Baixadas</option>
          </select>
        </Label>
      </div>
      <dl className="finance-summary">
        <div>
          <dt>A receber em aberto</dt>
          <dd>{money(sum("receive", false))}</dd>
        </div>
        <div>
          <dt>A pagar em aberto</dt>
          <dd>{money(sum("pay", false))}</dd>
        </div>
        <div>
          <dt>Saldo realizado</dt>
          <dd>{money(sum("receive", true) - sum("pay", true))}</dd>
        </div>
      </dl>
      <p className="field-hint">
        Totais de {project ? "todo este evento" : "todos os eventos"}; os
        filtros de tipo e situação afetam a lista abaixo. Saldo de caixa não é
        lucro.
      </p>
      {adding && (
        <form
          className="panel finance-entry-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              pid = String(f.get("project")),
              description = String(f.get("description") || "").trim(),
              amount = Number(f.get("amount")),
              direction = String(f.get("direction"));
            if (
              !description ||
              !Number.isFinite(amount) ||
              amount <= 0 ||
              !projects.some((p) => p.id === pid) ||
              !["pay", "receive"].includes(direction)
            )
              return;
            setState((s) => ({
              ...s,
              financeEntries: [
                ...(s.financeEntries || []),
                {
                  id: uid(),
                  projectId: pid,
                  description,
                  direction: direction as "pay" | "receive",
                  amount: Math.round(amount * 100) / 100,
                  due: String(f.get("due")),
                  settled: false,
                  category: String(f.get("category") || "event") as
                    "event" | "extra" | "fixed" | "payroll" | "reimbursement",
                  documentRef: String(f.get("documentRef") || "").trim(),
                },
              ],
            }));
            setAdding(false);
            notify(
              "Lançamento criado na demonstração. Contas a pagar exigem aprovação antes da baixa.",
            );
          }}
        >
          <h2>Novo lançamento financeiro</h2>
          <div className="workspace-filter-row">
            <Label label="Evento do lançamento">
              <select name="project" required defaultValue={projectId || ""}>
                <option value="">Selecione o evento</option>
                {projects.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </Label>
            <Label label="Tipo">
              <select name="direction">
                <option value="pay">Conta a pagar</option>
                <option value="receive">Conta a receber</option>
              </select>
            </Label>
            <Label label="Descrição">
              <input name="description" required />
            </Label>
            <Label label="Valor (R$)">
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
              />
            </Label>
            <Label label="Natureza / alçada">
              <select name="category">
                <option value="event">Fornecedor dentro do orçamento</option>
                <option value="extra">Extra / estouro de orçamento</option>
                <option value="fixed">Despesa fixa administrativa</option>
                <option value="payroll">Salários / pró-labore</option>
                <option value="reimbursement">Reembolso com comprovante</option>
              </select>
            </Label>
            <Label label="Documento / origem">
              <input
                name="documentRef"
                placeholder="Contrato, pedido de compra, NF ou comprovante"
              />
            </Label>
            <Label label="Vencimento">
              <input name="due" type="date" required />
            </Label>
          </div>
          <div className="actions">
            <Button variant="primary" type="submit">
              Salvar lançamento
            </Button>
            <Button onClick={() => setAdding(false)}>Cancelar</Button>
          </div>
        </form>
      )}
      {approvalEntry && (
        <section className="panel">
          <div className="section-heading">
            <h2>
              {approvalEntry.description} · {money(approvalEntry.amount)}
            </h2>
            <Button onClick={() => setReviewing("")}>Fechar revisão</Button>
          </div>
          <ApprovalRequestPanel
            key={approvalEntry.id}
            target={{ kind: "payment", targetId: approvalEntry.id }}
          />
        </section>
      )}
      <section className="panel finance-entries">
        <div className="section-heading">
          <h2>
            {project
              ? "Lançamentos do evento"
              : "Lançamentos de todos os eventos"}
          </h2>
          <Badge>{visible.length} registros</Badge>
        </div>
        {visible.length ? (
          <div className="table-scroll">
            <table className="finance-table">
              <thead>
                <tr>
                  <th>Descrição / evento</th>
                  <th>Tipo</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Situação</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((entry) => {
                  const allowed =
                    entry.direction === "receive" ||
                    isApproved(state, { kind: "payment", targetId: entry.id });
                  return (
                    <tr key={entry.id}>
                      <td className="finance-entry-description">
                        {entry.description}
                        {entry.documentRef && (
                          <small className="snapshot-category">
                            Origem: {entry.documentRef}
                          </small>
                        )}

                        {!project && (
                          <button
                            className="portfolio-link"
                            onClick={() => go(`/financeiro/${entry.projectId}`)}
                          >
                            {projects.find((p) => p.id === entry.projectId)
                              ?.title || "Evento não localizado"}
                          </button>
                        )}
                      </td>
                      <td data-label="Tipo">
                        {entry.direction === "pay" ? "Pagar" : "Receber"}
                      </td>
                      <td data-label="Vencimento">
                        {entry.due.split("-").reverse().join("/")}
                      </td>
                      <td data-label="Valor">{money(entry.amount)}</td>
                      <td data-label="Situação">
                        <Badge
                          tone={
                            entry.settled ? "green" : allowed ? "blue" : "amber"
                          }
                        >
                          {entry.settled
                            ? entry.reconciled
                              ? "Baixado e conciliado · manual"
                              : "Baixado · demo"
                            : allowed
                              ? "Em aberto"
                              : "Requer aprovação"}
                        </Badge>
                      </td>
                      <td>
                        {!entry.settled &&
                        entry.direction === "pay" &&
                        !allowed ? (
                          <Button onClick={() => setReviewing(entry.id)}>
                            Revisar pagamento
                          </Button>
                        ) : (
                          <div className="actions">
                            <Button
                              onClick={() => {
                                setState((s) => {
                                  const current = s.financeEntries?.find(
                                    (x) => x.id === entry.id,
                                  );
                                  if (
                                    !current ||
                                    (!current.settled &&
                                      current.direction === "pay" &&
                                      !isApproved(s, {
                                        kind: "payment",
                                        targetId: current.id,
                                      }))
                                  )
                                    return s;
                                  return {
                                    ...s,
                                    financeEntries: s.financeEntries?.map(
                                      (x) =>
                                        x.id === current.id
                                          ? {
                                              ...x,
                                              settled: !x.settled,
                                              reconciled: false,
                                            }
                                          : x,
                                    ),
                                  };
                                });
                                notify(
                                  entry.settled
                                    ? "Baixa desfeita na demonstração."
                                    : "Baixa simulada. Nenhum dinheiro foi movimentado.",
                                );
                              }}
                            >
                              {entry.settled
                                ? "Desfazer baixa"
                                : "Simular baixa"}
                            </Button>
                            {entry.settled && (
                              <Button
                                onClick={() =>
                                  setState((s) => ({
                                    ...s,
                                    financeEntries: s.financeEntries?.map(
                                      (x) =>
                                        x.id === entry.id
                                          ? { ...x, reconciled: !x.reconciled }
                                          : x,
                                    ),
                                  }))
                                }
                              >
                                {entry.reconciled
                                  ? "Desfazer conciliação"
                                  : "Conferir com extrato · manual"}
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Sem lançamentos neste recorte"
            text="Ajuste os filtros ou cadastre uma conta. Receber um evento não cria obrigações financeiras automaticamente."
          />
        )}
      </section>
      {!project && (
        <section className="panel">
          <h2>Previsto e realizado por evento</h2>
          <p>
            Visão de todas as contas, sem aplicar os filtros da lista. A
            previsão inclui valores já baixados.
          </p>
          {projects.map((p) => {
            const e = (state.financeEntries || []).filter(
                (x) => x.projectId === p.id,
              ),
              total = (dir: string, paid = false) =>
                e
                  .filter((x) => x.direction === dir && (!paid || x.settled))
                  .reduce((n, x) => n + x.amount, 0);
            return (
              <article className="portfolio-event" key={p.id}>
                <div>
                  <h3>{p.title}</h3>
                  <p>
                    Receita prevista {money(total("receive"))} · pagamentos
                    previstos {money(total("pay"))}
                  </p>
                  <p>
                    Recebido {money(total("receive", true))} · pago{" "}
                    {money(total("pay", true))}
                  </p>
                </div>
                <Button
                  icon={ArrowRight}
                  onClick={() => go(`/financeiro/${p.id}`)}
                >
                  Abrir financeiro
                </Button>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}
