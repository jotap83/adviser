import { useState } from "react";
import { ArrowLeft, Check, FileText, Plus, Send, Trash2 } from "lucide-react";
import type { Demand, Quote, QuoteOption } from "../types";
import { useStore, go } from "../store";
import { uid } from "../data";
import { money } from "../domain.mjs";
import {
  confirmComposition,
  currentSelection,
  optionTotal,
  quoteOptions,
  quoteRevision,
  selectionSummary,
  submitQuoteRevision,
} from "../quote-model";
import { scopeSummary } from "../briefing-model";
import { BrandLogo } from "../components/BrandLogo";
import { Badge, Button, Label, LinesEditor, Note } from "../components/UI";
import {
  QuoteConversation,
  QuoteHistory,
} from "../components/QuoteConversation";

export function SupplierPortal({ d, q }: { d: Demand; q: Quote }) {
  const { state, updateDemand, notify } = useStore();
  const supplier = state.suppliers.find((s) => s.id === q.supplierId);
  const blank = (): QuoteOption => ({
    id: uid(),
    name: "Opção principal",
    detail: "",
    lines: [
      {
        id: uid(),
        category: q.template.name,
        description: "",
        qty: 1,
        unit: 0,
        direct: false,
      },
    ],
  });
  const [editing, setEditing] = useState(q.status !== "received");
  const [expectedRevision, setExpectedRevision] = useState(
    `${q.status}:${quoteRevision(q)}`,
  );
  const [fields, setFields] = useState(q.fields);
  const [options, setOptions] = useState<QuoteOption[]>(
    q.lines.length ? structuredClone(quoteOptions(q)) : [blank()],
  );
  const [terms, setTerms] = useState(q.terms);
  const [attachment, setAttachment] = useState(q.attachment);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const locked = d.decision === "accepted" || d.handoff;
  const selection = currentSelection(q);
  const change = (id: string, patch: Partial<QuoteOption>) =>
    setOptions((previous) =>
      previous.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    );
  function edit() {
    setExpectedRevision(`${q.status}:${quoteRevision(q)}`);
    setFields(structuredClone(q.fields));
    setOptions(structuredClone(quoteOptions(q)));
    setTerms(q.terms);
    setAttachment(q.attachment);
    setError("");
    setSubmitted(false);
    setEditing(true);
  }
  function example(alternatives = false) {
    const food = q.template.id === "food";
    const qty = food ? d.guests || 200 : 1;
    setFields(
      Object.fromEntries(
        q.template.fields.map((f) => [
          f.id,
          f.type === "number"
            ? "5"
            : f.type === "date"
              ? "2026-11-10"
              : f.type === "textarea"
                ? "Serviço completo para o público informado, com equipe e materiais incluídos."
                : "Conforme o briefing; disponibilidade a confirmar.",
        ]),
      ),
    );
    const principal: QuoteOption = {
      id: uid(),
      name: food ? "Menu Essencial" : "Estrutura Essencial",
      detail:
        "Serviço base com logística e equipe. Valores fictícios para demonstração.",
      lines: [
        {
          id: uid(),
          category: q.template.name,
          description: food ? "Menu completo por pessoa" : "Serviço principal",
          qty,
          unit: food ? 125 : 4500,
          direct: false,
        },
        {
          id: uid(),
          category: q.template.name,
          description: "Logística e equipe de apoio",
          qty: 1,
          unit: 1200,
          direct: false,
        },
      ],
    };
    setOptions(
      alternatives
        ? [
            principal,
            {
              id: uid(),
              name: food ? "Menu Celebração" : "Estrutura Completa",
              detail: food
                ? "Menu ampliado com estação de sobremesas. Open bar incluído na composição apenas se selecionado."
                : "Estrutura ampliada. Hora extra disponível como adicional opcional.",
              lines: [
                {
                  id: uid(),
                  category: q.template.name,
                  description: food
                    ? "Menu Celebração por pessoa"
                    : "Serviço com estrutura ampliada",
                  qty,
                  unit: food ? 155 : 6800,
                  direct: false,
                },
                {
                  id: uid(),
                  category: q.template.name,
                  description: "Logística e equipe de apoio",
                  qty: 1,
                  unit: 1200,
                  direct: false,
                },
                {
                  id: uid(),
                  category: q.template.name,
                  description: food
                    ? "Open bar por pessoa"
                    : "Hora extra de operação",
                  qty: food ? qty : 1,
                  unit: food ? 35 : 650,
                  direct: false,
                  optional: true,
                },
              ],
            },
          ]
        : [principal],
    );
    setTerms(
      "30% na confirmação da contratação e saldo 5 dias antes do evento. Cotação válida por 15 dias. Disponibilidade sujeita à confirmação. Cancelamento: condições a acordar antes da contratação.",
    );
    notify("Exemplo fictício preenchido. Revise as opções antes de enviar.");
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    if (expectedRevision !== `${q.status}:${quoteRevision(q)}`) {
      setError(
        "A cotação mudou em outra aba. Cancele a edição e abra a versão atual antes de continuar.",
      );
      return;
    }
    if (
      !options.length ||
      options.some(
        (o) =>
          !o.name.trim() ||
          !o.lines.length ||
          !o.lines.some((l) => !l.optional) ||
          o.lines.some(
            (l) =>
              !l.description.trim() ||
              !Number.isFinite(l.qty) ||
              l.qty <= 0 ||
              !Number.isFinite(l.unit) ||
              l.unit < 0,
          ),
      )
    ) {
      setError(
        "Cada opção precisa de nome, ao menos um item incluído e valores válidos. Quantidades devem ser maiores que zero.",
      );
      return;
    }
    if (
      !terms.trim() ||
      q.template.fields.some((f) => f.required && !fields[f.id]?.trim())
    ) {
      setError("Preencha as condições comerciais e os campos obrigatórios.");
      return;
    }
    updateDemand(
      d.id,
      (current) => ({
        ...current,
        quotes: current.quotes.map((x) =>
          x.id === q.id &&
          `${x.status}:${quoteRevision(x)}` === expectedRevision
            ? submitQuoteRevision(x, { options, fields, terms, attachment })
            : x,
        ),
      }),
      `Nova versão da cotação de ${supplier?.name} registrada na simulação.`,
    );
    setSubmitted(true);
    setEditing(false);
    setError("");
    notify(
      "Cotação registrada neste navegador. Nenhum dado foi enviado a um servidor.",
    );
  }
  return (
    <div className="supplier-portal">
      <header className="portal-header">
        <a href="#/" className="brand" aria-label="Adviser, visão geral">
          <BrandLogo />
        </a>
        <Badge>Portal do fornecedor · demonstração</Badge>
        <Button
          icon={ArrowLeft}
          onClick={() => go(`/demandas/${d.id}/compare`)}
        >
          Voltar ao atendimento
        </Button>
      </header>
      <main className="portal-main">
        <div className="page-heading">
          <div>
            <h1>Sua cotação, em conversa.</h1>
            <p>
              Olá, {supplier?.contact}. Apresente alternativas, esclareça
              dúvidas e acompanhe a composição escolhida pela Adviser.
            </p>
          </div>
        </div>
        <div className="portal-context">
          <div>
            <span>Evento</span>
            <strong>{d.title}</strong>
          </div>
          <div>
            <span>Data prevista</span>
            <strong>
              {d.date ? d.date.split("-").reverse().join("/") : "A confirmar"}
            </strong>
          </div>
          <div>
            <span>Participantes</span>
            <strong>{d.guests || "A confirmar"}</strong>
          </div>
          <div>
            <span>Retorno até</span>
            <strong>{q.deadline.split("-").reverse().join("/")}</strong>
          </div>
        </div>
        {locked && (
          <Note>
            Esta demanda já foi aprovada pelo cliente. O histórico está
            preservado e a edição da cotação foi encerrada nesta demonstração.
          </Note>
        )}
        {submitted && (
          <section className="note success" role="status">
            <Check size={20} />
            <div>
              <h2>Cotação registrada na demonstração.</h2>
              <p>
                O atendimento já pode revisar a versão {quoteRevision(q)} e
                escolher sua composição.
              </p>
              <Button onClick={() => go(`/demandas/${d.id}/compare`)}>
                Ver como o atendimento recebe
              </Button>
            </div>
          </section>
        )}
        {selection && (
          <section className="panel chosen-composition">
            <div className="section-heading">
              <h2>A Adviser escolheu esta composição</h2>
              <Badge tone={selection.confirmedAt ? "green" : "amber"}>
                {selection.confirmedAt
                  ? "Confirmada por você"
                  : "Aguardando sua confirmação"}
              </Badge>
            </div>
            <p className="preserve-text">{selectionSummary(q)}</p>
            <Button
              variant="primary"
              icon={Check}
              disabled={Boolean(selection.confirmedAt) || locked || editing}
              onClick={() => {
                updateDemand(
                  d.id,
                  (current) => ({
                    ...current,
                    quotes: current.quotes.map((x) =>
                      x.id === q.id ? confirmComposition(x, selection.id) : x,
                    ),
                  }),
                  `Fornecedor confirmou valores e disponibilidade da composição de ${supplier?.name}.`,
                );
                notify(
                  "Confirmação registrada. Isto não autoriza a execução do serviço.",
                );
              }}
            >
              {selection.confirmedAt
                ? "Composição confirmada"
                : "Confirmar valores e disponibilidade"}
            </Button>
            <p className="field-hint">
              Se precisar mudar preços ou condições, envie uma nova versão
              abaixo. A Adviser deverá revisar e escolher novamente.
            </p>
          </section>
        )}
        {q.adjustmentPending && (
          <Note tone="warning">
            A Adviser pediu ajustes. Confira a conversa e envie uma nova versão
            da cotação.
          </Note>
        )}
        {!editing && (
          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Cotação v{quoteRevision(q)}</h2>
                <p>
                  {supplier?.name} · {quoteOptions(q).length} alternativa(s)
                </p>
              </div>
              <Button icon={Plus} disabled={locked} onClick={edit}>
                Preparar nova versão
              </Button>
            </div>
            {quoteOptions(q).map((o) => (
              <div key={o.id} className="sent-option">
                <strong>{o.name}</strong>
                <span>
                  Base {money(optionTotal(o))}
                  {o.lines.some((l) => l.optional) ? " + opcionais" : ""}
                </span>
                <p>{o.detail}</p>
              </div>
            ))}
            <QuoteHistory q={q} />
          </section>
        )}
        {editing && (
          <form onSubmit={submit}>
            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>
                    {q.status === "received"
                      ? `Preparar cotação v${quoteRevision(q) + 1}`
                      : q.template.name}
                  </h2>
                  <p>
                    {supplier?.name} · modelo v{q.template.version}
                  </p>
                </div>
                <div className="actions">
                  <Button icon={FileText} onClick={() => example()}>
                    Preencher exemplo
                  </Button>
                  <Button onClick={() => example(true)}>
                    Exemplo com duas opções
                  </Button>
                </div>
              </div>
              <p className="muted">
                {d.location || "Local a confirmar"}. {d.objective}
              </p>
              {d.briefingValid && scopeSummary(d, q.template.id) && (
                <details className="supplier-scope">
                  <summary>Escopo solicitado pela Adviser</summary>
                  <p>{scopeSummary(d, q.template.id)}</p>
                </details>
              )}
              <div className="form-grid">
                {q.template.fields.map((f) => (
                  <Label
                    key={f.id}
                    label={`${f.label}${f.required ? " *" : ""}`}
                  >
                    {f.type === "textarea" ? (
                      <textarea
                        required={f.required}
                        rows={3}
                        value={fields[f.id] || ""}
                        onChange={(e) =>
                          setFields({ ...fields, [f.id]: e.target.value })
                        }
                      />
                    ) : (
                      <input
                        required={f.required}
                        type={f.type}
                        min={f.type === "number" ? 0 : undefined}
                        value={fields[f.id] || ""}
                        onChange={(e) =>
                          setFields({ ...fields, [f.id]: e.target.value })
                        }
                      />
                    )}
                  </Label>
                ))}
              </div>
            </section>
            <section className="panel options-editor">
              <h2>Alternativas e adicionais</h2>
              <p className="muted">
                Crie uma opção para cada composição que pode ser escolhida.
                Dentro dela, marque os adicionais opcionais. A Adviser escolherá
                uma alternativa por vez.
              </p>
              {options.map((o, i) => (
                <fieldset key={o.id} className="option-editor">
                  <legend>Opção {i + 1}</legend>
                  <div className="form-grid">
                    <Label label={`Nome da opção ${i + 1} *`}>
                      <input
                        required
                        value={o.name}
                        onChange={(e) => change(o.id, { name: e.target.value })}
                      />
                    </Label>
                    <Label label={`Detalhes da opção ${i + 1}`}>
                      <textarea
                        rows={2}
                        value={o.detail}
                        onChange={(e) =>
                          change(o.id, { detail: e.target.value })
                        }
                        placeholder="Inclusões, diferenças e condições específicas desta opção."
                      />
                    </Label>
                  </div>
                  <LinesEditor
                    lines={o.lines}
                    onChange={(lines) => change(o.id, { lines })}
                    category={q.template.name}
                    allowDirect={false}
                  />
                  <div className="optional-lines">
                    <strong>Quais itens são opcionais?</strong>
                    {o.lines.map((l, j) => (
                      <label key={l.id}>
                        <input
                          type="checkbox"
                          checked={Boolean(l.optional)}
                          onChange={(e) =>
                            change(o.id, {
                              lines: o.lines.map((x) =>
                                x.id === l.id
                                  ? { ...x, optional: e.target.checked }
                                  : x,
                              ),
                            })
                          }
                        />
                        {l.description || `Item ${j + 1}`}{" "}
                        <small>adicional opcional</small>
                      </label>
                    ))}
                  </div>
                  <div className="option-footer">
                    <span>
                      Base sem opcionais{" "}
                      <strong>{money(optionTotal(o))}</strong>
                    </span>
                    <Button
                      variant="ghost"
                      icon={Trash2}
                      disabled={options.length === 1}
                      onClick={() =>
                        setOptions(options.filter((x) => x.id !== o.id))
                      }
                    >
                      Remover opção {i + 1}
                    </Button>
                  </div>
                </fieldset>
              ))}
              <Button
                icon={Plus}
                onClick={() =>
                  setOptions([
                    ...options,
                    { ...blank(), name: `Opção ${options.length + 1}` },
                  ])
                }
              >
                Adicionar alternativa
              </Button>
            </section>
            <section className="panel">
              <Label
                label="Condições comerciais *"
                hint="Válidas para todas as opções: pagamento, validade, inclusões e cancelamento."
              >
                <textarea
                  required
                  rows={4}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </Label>
              <Label
                label="Anexo da proposta (opcional)"
                hint="Nesta demonstração, somente o nome do arquivo é registrado."
              >
                <input
                  type="file"
                  accept=".pdf,.xlsx,.xls,.png,.jpg"
                  onChange={(e) =>
                    setAttachment(e.target.files?.[0]?.name || "")
                  }
                />
              </Label>
              {attachment && <p>Arquivo informado: {attachment}</p>}
              <Note>
                {q.status === "received"
                  ? "A nova versão preserva o histórico e exige uma nova escolha da Adviser. "
                  : ""}
                Enviar uma cotação não confirma contratação. Outros fornecedores
                e preços não aparecem neste formulário.
              </Note>
              {error && (
                <p className="error-text" role="alert">
                  {error}
                </p>
              )}
              <div className="actions">
                <Button
                  type="submit"
                  variant="primary"
                  icon={Send}
                  disabled={locked}
                >
                  {q.status === "received"
                    ? "Enviar nova versão simulada"
                    : "Enviar cotação simulada"}
                </Button>
                {q.status === "received" && (
                  <Button
                    onClick={() => {
                      setEditing(false);
                      setError("");
                    }}
                  >
                    Cancelar edição
                  </Button>
                )}
              </div>
            </section>
          </form>
        )}
        <section className="panel">
          <QuoteConversation d={d} q={q} role="supplier" />
        </section>
        <footer className="portal-footer">
          Demonstração com dados fictícios. O link não possui autenticação real;
          respostas e mensagens ficam apenas neste navegador.
        </footer>
      </main>
    </div>
  );
}
