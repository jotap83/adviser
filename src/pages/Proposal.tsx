import { useState } from "react";
import { BrandLogo } from "../components/BrandLogo";
import {
  Save,
  Download,
  Printer,
  Eye,
  ArrowRight,
  Check,
  FileCheck,
  Send,
  RotateCcw,
  Copy,
} from "lucide-react";
import type { Demand, Version } from "../types";
import { referenceText } from "../mail-reference";
import { MailSubject } from "../components/MailSubject";
import { useStore, go, download, copy } from "../store";
import { uid, timestamp } from "../data";
import { money, totals, lineTotal } from "../domain.mjs";
import { staleQuoteLines, currentSelection } from "../quote-model";
import {
  Button,
  Label,
  Note,
  Badge,
  Empty,
  LinesEditor,
} from "../components/UI";
function snapshot(d: Demand, client: string): Version {
  return {
    id: uid(),
    number: d.versions.length + 1,
    at: timestamp(),
    lines: structuredClone(d.lines),
    fee: d.fee,
    tax: d.tax,
    total: totals(d.lines, d.fee, d.tax).total,
    terms: d.terms,
    title: d.title,
    client,
    date: d.date,
    guests: d.guests,
    location: d.location,
  };
}
async function excel(v: Version) {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Proposta");
  ws.columns = [
    { width: 27 },
    { width: 62 },
    { width: 13 },
    { width: 20 },
    { width: 22 },
    { width: 24 },
  ];
  ws.addRow(["PROPOSTA DEMONSTRATIVA — ADVISER"]);
  ws.addRow([v.title, `Cliente: ${v.client}`, `Versão ${v.number}`]);
  ws.addRow([
    `Data: ${v.date}`,
    `Local: ${v.location}`,
    `Pessoas: ${v.guests}`,
  ]);
  ws.addRow([]);
  ws.addRow([
    "Grupo",
    "Item",
    "Quantidade",
    "Unitário (R$)",
    "Total (R$)",
    "Pagamento",
  ]);
  v.lines.forEach((l) =>
    ws.addRow([
      l.category,
      l.description,
      l.qty,
      l.unit,
      lineTotal(l),
      l.direct ? "Cliente direto" : "Via Adviser",
    ]),
  );
  const t = totals(v.lines, v.fee, v.tax);
  ws.addRow([]);
  [
    ["Subtotal de serviços", t.subtotal],
    ["Fee Adviser", t.fee],
    ["Acréscimo informado manualmente", t.tax],
    ["Investimento total", t.total],
    ["Pagamento direto a fornecedores", t.direct],
    ["A pagar à Adviser", t.invoice],
  ].forEach(([k, n]) => ws.addRow([k, "", "", "", n]));
  ws.addRow([]);
  ws.addRow(["Condições", v.terms]);
  ws.addRow(["Valores fictícios. Não representa documento fiscal."]);
  ws.getColumn(4).numFmt = '"R$" #,##0.00';
  ws.getColumn(5).numFmt = '"R$" #,##0.00';
  ws.getRow(5).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(5).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF293E91" },
  };
  ws.eachRow((r) => (r.alignment = { vertical: "top", wrapText: true }));
  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `proposta-v${v.number}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ProposalDocument({ v }: { v: Version }) {
  const t = totals(v.lines, v.fee, v.tax);
  return (
    <article className="proposal-document" id="proposal-document">
      <div className="document-header">
        <div className="document-brand">
          <BrandLogo />
        </div>
        <div>
          Proposta de evento<strong>Versão {v.number || "rascunho"}</strong>
        </div>
      </div>
      <div className="document-intro">
        <h2>{v.title}</h2>
        <p>Preparado para {v.client}</p>
      </div>
      <div className="document-meta">
        <div>
          <span>Data</span>
          <strong>
            {v.date ? v.date.split("-").reverse().join("/") : "A confirmar"}
          </strong>
        </div>
        <div>
          <span>Público</span>
          <strong>{v.guests || "A confirmar"} pessoas</strong>
        </div>
        <div>
          <span>Local</span>
          <strong>{v.location || "A confirmar"}</strong>
        </div>
      </div>
      <div className="table-scroll">
        <table className="document-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qtd.</th>
              <th>Valor unitário</th>
              <th>Valor final</th>
            </tr>
          </thead>
          <tbody>
            {[...new Set(v.lines.map((l) => l.category))].map((cat) => (
              <FragmentRows
                key={cat}
                category={cat}
                lines={v.lines.filter((l) => l.category === cat)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="document-summary">
        <div>
          <span>Subtotal de serviços</span>
          <strong>{money(t.subtotal)}</strong>
        </div>
        <div>
          <span>Fee Adviser ({v.fee}% sobre itens via Adviser)</span>
          <strong>{money(t.fee)}</strong>
        </div>
        <div>
          <span>Acréscimo informado manualmente</span>
          <strong>{money(t.tax)}</strong>
        </div>
        <div className="document-grand">
          <span>Investimento total</span>
          <strong>{money(t.total)}</strong>
        </div>
        {t.direct > 0 && (
          <>
            <div>
              <span>Pago diretamente aos fornecedores</span>
              <strong>{money(t.direct)}</strong>
            </div>
            <div>
              <span>A pagar à Adviser</span>
              <strong>{money(t.invoice)}</strong>
            </div>
          </>
        )}
      </div>
      <div className="document-terms">
        <h3>Condições da proposta</h3>
        <p>{v.terms}</p>
      </div>
      <footer>
        DEMONSTRAÇÃO · Dados e valores fictícios. Não é documento fiscal.
        <br />O aceite desta proposta não confirma automaticamente a contratação
        dos fornecedores.
      </footer>
    </article>
  );
}
function FragmentRows({
  category,
  lines,
}: {
  category: string;
  lines: Version["lines"];
}) {
  return (
    <>
      <tr className="group-row">
        <td colSpan={4}>{category}</td>
      </tr>
      {lines.map((l) => (
        <tr key={l.id}>
          <td>
            {l.description}
            {l.direct && (
              <small className="cell-sub">Pagamento direto pelo cliente</small>
            )}
          </td>
          <td className="numeric">{l.qty}</td>
          <td className="numeric">{money(l.unit)}</td>
          <td className="numeric">{money(lineTotal(l))}</td>
        </tr>
      ))}
    </>
  );
}
export function Proposal({ d }: { d: Demand }) {
  const { state, updateDemand, notify } = useStore();
  const [view, setView] = useState(false);
  const [versionId, setVersionId] = useState("draft");
  const [exporting, setExporting] = useState(false);
  const client = state.clients.find((c) => c.id === d.clientId)?.name || "";
  const t = totals(d.lines, d.fee, d.tax);
  const v =
    versionId === "draft"
      ? { ...snapshot(d, client), number: 0 }
      : d.versions.find((v) => v.id === versionId) || {
          ...snapshot(d, client),
          number: 0,
        };
  const locked = d.decision === "accepted";
  const stale = staleQuoteLines(d);
  const pendingSupplier = d.quotes.some(
    (q) =>
      q.selected && currentSelection(q) && !currentSelection(q)?.confirmedAt,
  );
  const saveable =
    !stale &&
    d.briefingValid &&
    d.lines.length > 0 &&
    d.lines.every((l) => l.description.trim() && l.qty > 0 && l.unit >= 0) &&
    d.terms.trim().length > 0;
  function save() {
    const s = snapshot(d, client);
    updateDemand(
      d.id,
      { versions: [...d.versions, s] },
      `Versão ${s.number} da proposta preservada.`,
    );
    setVersionId(s.id);
    notify(
      `Versão ${s.number} salva. Alterações seguintes permanecem no rascunho.`,
    );
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Uma proposta, todos os detalhes.</h2>
          <p>
            Agrupe serviços e revise o investimento antes de enviar ao cliente.
          </p>
        </div>
        <Button icon={Eye} onClick={() => setView(!view)}>
          {view ? "Voltar à edição" : "Prévia do cliente"}
        </Button>
      </div>
      {stale && !locked && (
        <Note tone="warning">
          Uma cotação ou composição mudou após a importação. Revise as escolhas
          e reimporte os itens antes de salvar outra versão. As versões já
          salvas continuam preservadas.{" "}
          <Button onClick={() => go(`/demandas/${d.id}/compare`)}>
            Revisar composições
          </Button>
        </Note>
      )}
      {pendingSupplier && !view && (
        <Note>
          Há composição escolhida que ainda aguarda confirmação do fornecedor.
          Acompanhe valores e disponibilidade na comparação.
        </Note>
      )}
      <div className="proposal-toolbar">
        <label className="inline-label">
          Visualizar
          <select
            aria-label="Versão da proposta"
            value={versionId}
            onChange={(e) => {
              setVersionId(e.target.value);
              setView(true);
            }}
          >
            <option value="draft">Rascunho atual</option>
            {[...d.versions].reverse().map((v) => (
              <option key={v.id} value={v.id}>
                Versão {v.number} · {v.at}
              </option>
            ))}
          </select>
        </label>
        <div className="actions">
          <Button
            icon={Download}
            busy={exporting}
            disabled={!v.lines.length}
            onClick={async () => {
              setExporting(true);
              try {
                await excel(v);
              } catch {
                notify("Não foi possível gerar a planilha. Tente novamente.");
              } finally {
                setExporting(false);
              }
            }}
          >
            Excel
          </Button>
          <Button
            icon={Printer}
            disabled={!v.lines.length}
            onClick={() => {
              setView(true);
              setTimeout(() => window.print(), 100);
            }}
          >
            Imprimir / salvar PDF
          </Button>
          <Button
            variant="primary"
            icon={Save}
            disabled={!saveable || locked}
            onClick={save}
          >
            Salvar nova versão
          </Button>
        </div>
      </div>
      {view ? (
        <ProposalDocument v={v} />
      ) : (
        <>
          <Note>
            Regra demonstrativa: fee sobre os itens pagos via Adviser. O
            acréscimo é informado em reais, sem cálculo fiscal automático. Essas
            regras precisam ser validadas com a empresa.
          </Note>
          {locked && (
            <Note tone="success">
              A proposta foi aprovada. As versões salvas permanecem preservadas.
              Para negociar mudanças, crie uma revisão.
            </Note>
          )}
          <div className="proposal-layout">
            <section className="panel">
              <div className="section-heading">
                <h3>Itens da proposta</h3>
                <Badge>{d.lines.length} itens</Badge>
              </div>
              <fieldset disabled={locked}>
                <LinesEditor
                  lines={d.lines}
                  onChange={(lines) => {
                    setVersionId("draft");
                    updateDemand(d.id, { lines });
                  }}
                />
                <Label label="Condições apresentadas ao cliente">
                  <textarea
                    rows={4}
                    value={d.terms}
                    onChange={(e) =>
                      updateDemand(d.id, { terms: e.target.value })
                    }
                  />
                </Label>
              </fieldset>
              {!d.briefingValid && (
                <p className="error-text">
                  Valide o briefing antes de salvar uma proposta.
                </p>
              )}
            </section>
            <aside className="panel investment">
              <h3>Investimento</h3>
              <dl>
                <dt>Serviços</dt>
                <dd>{money(t.subtotal)}</dd>
                <dt>Via Adviser</dt>
                <dd>{money(t.agency)}</dd>
                <dt>Cliente direto</dt>
                <dd>{money(t.direct)}</dd>
              </dl>
              <Label label="Fee Adviser (%)">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={d.fee}
                  disabled={locked}
                  onChange={(e) =>
                    updateDemand(d.id, {
                      fee: Math.max(0, Number(e.target.value)),
                    })
                  }
                />
              </Label>
              <Label
                label="Acréscimo manual (R$)"
                hint="Ex.: valor fiscal validado pelo financeiro. Zero até ser definido."
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={d.tax}
                  disabled={locked}
                  onChange={(e) =>
                    updateDemand(d.id, {
                      tax: Math.max(0, Number(e.target.value)),
                    })
                  }
                />
              </Label>
              <dl>
                <dt>Fee calculado</dt>
                <dd>{money(t.fee)}</dd>
                <dt>Acréscimo</dt>
                <dd>{money(t.tax)}</dd>
              </dl>
              <div className="total-box">
                <span>Investimento total</span>
                <strong>{money(t.total)}</strong>
                <small>A pagar à Adviser: {money(t.invoice)}</small>
              </div>
              {d.budget > 0 && (
                <p className={t.total > d.budget ? "error-text" : "muted"}>
                  {t.total > d.budget ? "Acima" : "Dentro"} da referência de{" "}
                  {money(d.budget)} do cliente.
                </p>
              )}
            </aside>
          </div>
        </>
      )}
      <div className="bottom-actions">
        <span>
          {d.versions.length
            ? `${d.versions.length} versões preservadas. O aceite ficará vinculado à versão enviada.`
            : "Salve uma versão para preparar o envio ao cliente."}
        </span>
        <Button
          variant="primary"
          icon={ArrowRight}
          disabled={!d.versions.length}
          onClick={() => go(`/demandas/${d.id}/approval`)}
        >
          Ir para aprovação
        </Button>
      </div>
    </>
  );
}
export function Approval({ d }: { d: Demand }) {
  const { state, updateDemand, notify } = useStore();
  const [chosen, setChosen] = useState(
    d.sentVersion || d.versions.at(-1)?.id || "",
  );
  const client = state.clients.find((c) => c.id === d.clientId);
  const sent = d.versions.find((v) => v.id === d.sentVersion);
  const accepted = d.versions.find((v) => v.id === d.acceptedVersion);
  const version = d.versions.find((v) => v.id === chosen);
  const text = `Olá, ${client?.contact.split(" ")[0] || ""}!\n\nSegue a proposta v${version?.number || ""} para ${version?.title || d.title}, no investimento de ${money(version?.total || 0)}.\n\nFicamos à disposição para revisar os detalhes. Pedimos que a aprovação mencione a versão da proposta.\n\nObrigada,\n${d.owner ? `${d.owner} · Adviser` : "Equipe Adviser"}`;
  function decide(decision: Demand["decision"]) {
    updateDemand(
      d.id,
      {
        decision,
        acceptedVersion: decision === "accepted" ? sent?.id : undefined,
        stage:
          decision === "accepted"
            ? "handoff"
            : decision === "changes"
              ? "proposal"
              : "approval",
        handoff: false,
      },
      decision === "accepted"
        ? `Aceite simulado registrado para a versão ${sent?.number}.`
        : decision === "changes"
          ? "Cliente solicitou ajustes na simulação."
          : "Recusa registrada na simulação.",
    );
    notify(
      decision === "accepted"
        ? "Aceite registrado. Prepare o pacote para Operações."
        : decision === "changes"
          ? "Revisão solicitada. Edite o rascunho e salve uma nova versão."
          : "Proposta encerrada como não aprovada.",
    );
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>A decisão do cliente, registrada.</h2>
          <p>
            O cliente mantém seu canal habitual. A equipe registra o retorno no
            sistema.
          </p>
        </div>
        <Badge
          tone={
            d.decision === "accepted"
              ? "green"
              : d.decision === "declined"
                ? "red"
                : "amber"
          }
        >
          {d.decision === "accepted"
            ? "Aprovada"
            : d.decision === "declined"
              ? "Não aprovada"
              : d.decision === "changes"
                ? "Ajustes solicitados"
                : "Aguardando decisão"}
        </Badge>
      </div>
      {!d.versions.length ? (
        <Empty
          title="Salve a primeira versão"
          text="A aprovação precisa estar vinculada a uma proposta com valores preservados."
          action={
            <Button onClick={() => go(`/demandas/${d.id}/proposal`)}>
              Preparar proposta
            </Button>
          }
        />
      ) : (
        <div className="briefing-grid">
          <section className="panel">
            <h3>Preparar envio</h3>
            <Label label="Versão da proposta">
              <select
                value={chosen}
                onChange={(e) => setChosen(e.target.value)}
              >
                {d.versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    Versão {v.number} · {money(v.total)}
                  </option>
                ))}
              </select>
            </Label>
            <Label label="Destinatário">
              <input value={client?.email || ""} readOnly />
            </Label>
            <Label label="Texto para envio pelo Gmail">
              <textarea
                className="email-draft"
                key={chosen}
                defaultValue={referenceText(text, d)}
                id="client-email"
              />
            </Label>
            <MailSubject
              d={d}
              purpose={`Proposta · versão ${version?.number || ""}`}
            />
            <div className="actions">
              <Button
                icon={Copy}
                onClick={async () =>
                  notify(
                    (await copy(
                      referenceText(
                        (
                          document.getElementById(
                            "client-email",
                          ) as HTMLTextAreaElement
                        ).value,
                        d,
                      ),
                    ))
                      ? "Texto copiado. Anexe o PDF ou Excel antes do envio pelo Gmail."
                      : "Selecione e copie o texto manualmente.",
                  )
                }
              >
                Copiar texto
              </Button>
              <Button
                variant="primary"
                icon={Send}
                disabled={d.decision === "accepted" || !version}
                onClick={() => {
                  updateDemand(
                    d.id,
                    {
                      sentVersion: chosen,
                      decision: "pending",
                      stage: "approval",
                    },
                    `Envio da versão ${version?.number} ao cliente simulado.`,
                  );
                  notify(
                    "Envio registrado na simulação. Nenhum e-mail foi enviado.",
                  );
                }}
              >
                Simular registro de envio
              </Button>
            </div>
            <p className="field-hint">
              Exporte a versão escolhida na tela Proposta. Neste protótipo não
              há envio real nem conexão com Gmail.
            </p>
          </section>
          <section className="panel">
            <h3>Retorno do cliente</h3>
            {sent ? (
              <p>
                Versão enviada:{" "}
                <strong>
                  v{sent.number} · {money(sent.total)}
                </strong>
              </p>
            ) : (
              <Note>
                Registre o envio de uma versão antes de registrar a decisão.
              </Note>
            )}
            <Label
              label="Evidência ou observação do retorno *"
              hint="Na operação real, guardaríamos o e-mail ou documento de aceite."
            >
              <textarea
                rows={6}
                value={d.evidence}
                disabled={d.decision === "accepted"}
                onChange={(e) =>
                  updateDemand(d.id, { evidence: e.target.value })
                }
                placeholder="Exemplo fictício: cliente aprovou por e-mail a versão 1, com os itens e condições apresentados."
              />
            </Label>
            <div className="decision-actions">
              <Button
                variant="primary"
                icon={Check}
                disabled={
                  !sent || !d.evidence.trim() || d.decision === "accepted"
                }
                onClick={() => decide("accepted")}
              >
                Registrar aprovação
              </Button>
              <Button
                disabled={
                  !sent || !d.evidence.trim() || d.decision === "accepted"
                }
                onClick={() => decide("changes")}
              >
                Solicitar ajustes
              </Button>
              <Button
                variant="ghost"
                disabled={
                  !sent || !d.evidence.trim() || d.decision === "accepted"
                }
                onClick={() => decide("declined")}
              >
                Não aprovada
              </Button>
            </div>
            {d.decision === "accepted" && (
              <div className="success-inline">
                <FileCheck size={20} />
                <span>
                  Versão {accepted?.number} aprovada. O orçamento está
                  preservado.
                </span>
              </div>
            )}
            {(d.decision === "changes" || d.decision === "accepted") && (
              <Button
                icon={RotateCcw}
                onClick={() => {
                  if (d.decision === "accepted")
                    updateDemand(
                      d.id,
                      {
                        decision: "changes",
                        stage: "proposal",
                        handoff: false,
                      },
                      "Revisão aberta. O aceite anterior permanece no histórico.",
                    );
                  go(`/demandas/${d.id}/proposal`);
                }}
              >
                {d.decision === "accepted"
                  ? "Abrir revisão da proposta"
                  : "Editar proposta"}
              </Button>
            )}
            <Note>
              O aceite da proposta não contrata fornecedores automaticamente.
            </Note>
          </section>
        </div>
      )}
      <div className="bottom-actions">
        <span>
          {d.decision === "accepted"
            ? "A proposta pode seguir para Operações."
            : "O repasse fica disponível após o aceite."}
        </span>
        <Button
          variant="primary"
          icon={ArrowRight}
          disabled={d.decision !== "accepted"}
          onClick={() => go(`/demandas/${d.id}/handoff`)}
        >
          Preparar repasse
        </Button>
      </div>
    </>
  );
}
export function Handoff({ d }: { d: Demand }) {
  const { state, updateDemand, notify } = useStore();
  const v = d.versions.find((v) => v.id === d.acceptedVersion);
  const client = state.clients.find((c) => c.id === d.clientId);
  const total = v ? totals(v.lines, v.fee, v.tax) : null;
  const pack = () => ({
    demonstracao: true,
    exportadoEm: new Date().toISOString(),
    demanda: d.id,
    cliente: client,
    propostaAprovada: v,
    evidencia: d.evidence,
    fornecedores: d.quotes
      .filter((q) => q.selected)
      .map((q) => ({
        fornecedor: state.suppliers.find((s) => s.id === q.supplierId),
        cotacao: q,
      })),
    resumo: total,
    historico: d.history,
  });
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Da proposta aprovada para Operações.</h2>
          <p>
            O atendimento organiza o repasse para produção e execução. O nome
            Operações e suas responsabilidades ainda serão confirmados com a
            Adviser.
          </p>
        </div>
        <Badge tone={d.handoff ? "green" : "blue"}>
          {d.handoff ? "Repasse preparado" : "Fim do MVP"}
        </Badge>
      </div>
      {d.decision !== "accepted" || !v ? (
        <Empty
          title="Aguardando aprovação"
          text="Registre o aceite de uma versão para liberar o pacote de repasse."
          action={
            <Button onClick={() => go(`/demandas/${d.id}/approval`)}>
              Ver aprovação
            </Button>
          }
        />
      ) : (
        <>
          <div className="handoff-hero">
            <FileCheck size={32} />
            <div>
              <h3>{d.title}</h3>
              <p>
                {client?.name} · proposta v{v.number} aprovada
              </p>
            </div>
            <strong>{money(total?.total || 0)}</strong>
          </div>
          <div className="briefing-grid">
            <section className="panel">
              <h3>O que vai no repasse</h3>
              <ul className="check-list">
                {[
                  "Cliente e dados do evento",
                  "Versão aprovada com itens e valores",
                  "Evidência do aceite",
                  "Fornecedores selecionados e suas condições",
                  "Identificação de pagamentos diretos",
                  "Histórico do atendimento",
                ].map((x) => (
                  <li key={x}>
                    <Check size={16} />
                    {x}
                  </li>
                ))}
              </ul>
              <div className="actions">
                <Button
                  icon={Download}
                  onClick={() =>
                    download(
                      `repasse-${d.id}.json`,
                      JSON.stringify(pack(), null, 2),
                      "application/json",
                    )
                  }
                >
                  Exportar pacote
                </Button>
                <Button
                  variant="primary"
                  disabled={d.handoff}
                  onClick={() => {
                    updateDemand(
                      d.id,
                      { handoff: true, stage: "handoff" },
                      "Pacote de repasse preparado na demonstração.",
                    );
                    notify(
                      "Repasse preparado. O protótipo não envia dados ao Conta Azul.",
                    );
                  }}
                >
                  {d.handoff ? "Repasse preparado" : "Concluir atendimento"}
                </Button>
              </div>
            </section>
            <section className="panel">
              <h3>Resumo para conferência</h3>
              <dl className="financial-summary">
                <dt>Investimento do cliente</dt>
                <dd>{money(total?.total || 0)}</dd>
                <dt>A receber pela Adviser</dt>
                <dd>{money(total?.invoice || 0)}</dd>
                <dt>Pagamento direto a fornecedores</dt>
                <dd>{money(total?.direct || 0)}</dd>
                <dt>Custos via Adviser</dt>
                <dd>{money(total?.agency || 0)}</dd>
                <dt>Fee previsto</dt>
                <dd>{money(total?.fee || 0)}</dd>
              </dl>
              <Note>
                Este pacote não efetua pagamentos, não gera nota fiscal e não
                confirma contratação.
              </Note>
            </section>
          </div>
          <section className="future-banner">
            <div>
              <Badge tone="amber">Próximas etapas</Badge>
              <h3>A partir daqui, nasce o projeto.</h3>
              <p>
                Operações coordena fornecedores, produção e execução, com apoio
                da criação. O financeiro acompanha recebimentos e pagamentos
                durante o projeto e faz o fechamento após o evento.
              </p>
            </div>
            <Button icon={ArrowRight} onClick={() => go("/operacoes")}>
              Explorar Operações · etapa 2
            </Button>
          </section>
        </>
      )}
    </>
  );
}
