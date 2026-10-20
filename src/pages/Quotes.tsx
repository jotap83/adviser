import { useState } from "react";
import { BrandLogo } from "../components/BrandLogo";
import {
  Plus,
  Mail,
  Link,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Send,
  FileText,
} from "lucide-react";
import type { Demand, Quote, Line } from "../types";
import { useStore, go, copy } from "../store";
import { uid } from "../data";
import { money, lineTotal, selectedLines } from "../domain.mjs";
import { scopeSummary } from "../briefing-model";
import {
  Button,
  Label,
  Note,
  Badge,
  Empty,
  LinesEditor,
} from "../components/UI";
export function Quotes({ d }: { d: Demand }) {
  const { state, updateDemand, notify } = useStore();
  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState("all");
  const [picked, setPicked] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const available = state.suppliers.filter(
    (s) =>
      !d.quotes.some((q) => q.supplierId === s.id) &&
      (category === "all" || s.category === category),
  );
  const active = d.quotes.find((q) => q.id === preview);
  const sup = state.suppliers.find((s) => s.id === active?.supplierId);
  const link = (q: Quote) => {
    const url = new URL(location.href);
    url.hash = `/fornecedor/${d.id}/${q.id}`;
    return url.href;
  };
  const scopeContext = active ? scopeSummary(d, active.template.id) : "";
  const email =
    active && sup
      ? `Olá, ${sup.contact}!\n\nEstamos preparando o evento ${d.title}, em ${d.date || "[data a confirmar]"}, para ${d.guests || "[público a confirmar]"} pessoas, em ${d.location || "[local a confirmar]"}.\n\nGostaríamos de receber sua cotação para ${active.template.name.toLowerCase()}. Preencha os itens, valores e condições neste link até ${active.deadline.split("-").reverse().join("/")}:\n\n${link(active)}\n\nObjetivo do evento: ${d.objective || "A confirmar"}.\n\nHorários: ${d.briefingDetails?.hours || "A confirmar"}.\nMontagem e desmontagem: ${d.briefingDetails?.setup || "A confirmar"}.\n\n${scopeContext ? `Escopo a cotar:\n${scopeContext}\n\n` : ""}A solicitação é uma cotação e não representa contratação.\n\nObrigada,\n${d.owner} · Adviser`
      : "";
  function add() {
    const qs: Quote[] = picked.map((id) => {
      const s = state.suppliers.find((s) => s.id === id)!;
      const template = state.templates.find((t) => t.id === s.category)!;
      return {
        id: uid(),
        supplierId: id,
        template: structuredClone(template),
        status: "draft",
        deadline: new Date(Date.now() + 7 * 86400000)
          .toISOString()
          .slice(0, 10),
        fields: {},
        lines: [],
        terms: "",
        attachment: "",
        selected: false,
      };
    });
    updateDemand(
      d.id,
      { quotes: [...d.quotes, ...qs] },
      `${qs.length} solicitações de cotação preparadas.`,
    );
    setPicked([]);
    setAdding(false);
    notify(
      "Solicitações preparadas. Revise o e-mail individual antes de simular o envio.",
    );
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Os fornecedores certos para cada serviço.</h2>
          <p>
            Uma solicitação por fornecedor. Um formato de resposta para cada
            categoria.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          disabled={!d.briefingValid}
          onClick={() => setAdding((v) => !v)}
        >
          Solicitar cotações
        </Button>
      </div>
      {!d.briefingValid && (
        <Note>
          Valide o briefing antes de criar solicitações. As cotações já visíveis
          nesta demanda são exemplos para navegação.
        </Note>
      )}
      {adding && (
        <section className="panel">
          <div className="section-heading">
            <h3>Selecionar fornecedores</h3>
            <select
              aria-label="Categoria de fornecedores"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">Todas as categorias</option>
              {state.templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="supplier-picker">
            {available.map((s) => (
              <label className="selection-row" key={s.id}>
                <input
                  type="checkbox"
                  checked={picked.includes(s.id)}
                  onChange={(e) =>
                    setPicked(
                      e.target.checked
                        ? [...picked, s.id]
                        : picked.filter((id) => id !== s.id),
                    )
                  }
                />
                <span>
                  <strong>{s.name}</strong>
                  <small>
                    {state.templates.find((t) => t.id === s.category)?.name} ·{" "}
                    {s.city}
                  </small>
                </span>
              </label>
            ))}
            {!available.length && (
              <p className="muted">
                Todos os fornecedores desta categoria já foram incluídos.
              </p>
            )}
          </div>
          <div className="actions">
            <Button variant="primary" disabled={!picked.length} onClick={add}>
              Preparar {picked.length || ""} solicitações
            </Button>
            <Button onClick={() => setAdding(false)}>Cancelar</Button>
          </div>
        </section>
      )}
      <div className="quote-stats">
        <span>
          <strong>{d.quotes.length}</strong> fornecedores
        </span>
        <span>
          <strong>
            {d.quotes.filter((q) => q.status === "received").length}
          </strong>{" "}
          respostas recebidas
        </span>
        <span>
          <strong>
            {d.quotes.filter((q) => q.status === "requested").length}
          </strong>{" "}
          aguardando retorno
        </span>
      </div>
      <section className="panel flush">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Fornecedor / serviço</th>
                <th>Status</th>
                <th>Retorno até</th>
                <th>Valor cotado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {d.quotes.map((q) => {
                const s = state.suppliers.find((s) => s.id === q.supplierId);
                return (
                  <tr key={q.id}>
                    <td>
                      <strong>{s?.name}</strong>
                      <small className="cell-sub">
                        {q.template.name} · modelo v{q.template.version}
                      </small>
                    </td>
                    <td>
                      <Badge
                        tone={
                          q.status === "received"
                            ? "green"
                            : q.status === "requested"
                              ? "amber"
                              : "gray"
                        }
                      >
                        {q.status === "received"
                          ? "Recebida"
                          : q.status === "requested"
                            ? "Aguardando"
                            : "Rascunho"}
                      </Badge>
                    </td>
                    <td>
                      <input
                        aria-label={`Prazo de ${s?.name}`}
                        type="date"
                        value={q.deadline}
                        onChange={(e) =>
                          updateDemand(d.id, {
                            quotes: d.quotes.map((x) =>
                              x.id === q.id
                                ? { ...x, deadline: e.target.value }
                                : x,
                            ),
                          })
                        }
                      />
                    </td>
                    <td className="numeric">
                      {q.status === "received"
                        ? money(q.lines.reduce((v, l) => v + lineTotal(l), 0))
                        : "Aguardando"}
                    </td>
                    <td>
                      <div className="actions">
                        <Button
                          icon={Mail}
                          onClick={() =>
                            setPreview(preview === q.id ? null : q.id)
                          }
                        >
                          E-mail
                        </Button>
                        <Button
                          icon={ExternalLink}
                          variant="ghost"
                          onClick={() => go(`/fornecedor/${d.id}/${q.id}`)}
                        >
                          {q.status === "received"
                            ? "Ver resposta"
                            : "Abrir link"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!d.quotes.length && (
          <Empty
            title="Ainda não há solicitações"
            text="Escolha os fornecedores que poderão atender este evento."
          />
        )}
      </section>
      {active && (
        <section className="panel email-panel">
          <div className="section-heading">
            <div>
              <h3>E-mail para {sup?.name}</h3>
              <p>{sup?.email}</p>
            </div>
            <Badge>Envio simulado</Badge>
          </div>
          <Label label="Texto da solicitação">
            <textarea
              key={active.id}
              className="email-draft"
              defaultValue={email}
              id="supplier-email"
            />
          </Label>
          <div className="actions">
            <Button
              icon={Copy}
              onClick={async () => {
                const text = (
                  document.getElementById(
                    "supplier-email",
                  ) as HTMLTextAreaElement
                ).value;
                notify(
                  (await copy(text))
                    ? "Texto copiado."
                    : "Selecione o texto e copie manualmente.",
                );
              }}
            >
              Copiar e-mail
            </Button>
            <Button
              icon={Link}
              onClick={async () =>
                notify(
                  (await copy(link(active)))
                    ? "Link demonstrativo copiado. Os dados são locais a este navegador."
                    : "Abra o link do fornecedor e copie o endereço.",
                )
              }
            >
              Copiar link do fornecedor
            </Button>
            <Button
              variant="primary"
              icon={Send}
              disabled={active.status === "received"}
              onClick={() => {
                updateDemand(
                  d.id,
                  {
                    quotes: d.quotes.map((q) =>
                      q.id === active.id
                        ? {
                            ...q,
                            status: "requested",
                            sentAt: new Date().toISOString(),
                          }
                        : q,
                    ),
                  },
                  `Envio de solicitação a ${sup?.name} simulado.`,
                );
                notify("Envio simulado. Nenhum e-mail foi enviado.");
                setPreview(null);
              }}
            >
              Simular envio
            </Button>
          </div>
          <p className="field-hint">
            O link pertence ao fornecedor. O cliente continua usando seu canal
            habitual.
          </p>
        </section>
      )}
      <div className="bottom-actions">
        <span>
          Cotações recebidas podem ser comparadas por categoria e condições.
        </span>
        <Button
          variant="primary"
          icon={ArrowRight}
          onClick={() => go(`/demandas/${d.id}/compare`)}
        >
          Comparar respostas
        </Button>
      </div>
    </>
  );
}
export function Compare({ d }: { d: Demand }) {
  const { state, updateDemand, notify } = useStore();
  const cats = [
    ...new Set(
      d.quotes.filter((q) => q.status === "received").map((q) => q.template.id),
    ),
  ];
  function select(q: Quote) {
    updateDemand(d.id, {
      quotes: d.quotes.map((x) =>
        x.template.id === q.template.id
          ? { ...x, selected: x.id === q.id ? !q.selected : false }
          : x,
      ),
    });
  }
  function importLines() {
    const lines = selectedLines(d.quotes);
    updateDemand(
      d.id,
      { lines, stage: "proposal", decision: "pending" },
      "Cotações selecionadas transferidas para o rascunho da proposta.",
    );
    notify("Itens importados. Revise valores e condições na proposta.");
    go(`/demandas/${d.id}/proposal`);
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Compare além do preço.</h2>
          <p>
            Escolha uma cotação por categoria, considerando escopo e condições.
          </p>
        </div>
        <Badge>{d.quotes.filter((q) => q.selected).length} selecionadas</Badge>
      </div>
      {!cats.length && (
        <Empty
          title="Aguardando a primeira resposta"
          text="Abra o link de um fornecedor e preencha uma cotação para continuar."
          action={
            <Button onClick={() => go(`/demandas/${d.id}/quotes`)}>
              Ver fornecedores
            </Button>
          }
        />
      )}
      {cats.map((cat) => (
        <section className="comparison-section" key={cat}>
          <h3>{d.quotes.find((q) => q.template.id === cat)?.template.name}</h3>
          <div className="comparison-grid">
            {d.quotes
              .filter((q) => q.template.id === cat && q.status === "received")
              .map((q) => {
                const s = state.suppliers.find((s) => s.id === q.supplierId);
                return (
                  <article
                    className={`comparison-panel ${q.selected ? "selected" : ""}`}
                    key={q.id}
                  >
                    <div className="section-heading">
                      <h3>{s?.name}</h3>
                      {q.selected && (
                        <Badge tone="blue">
                          <Check size={12} /> Selecionada
                        </Badge>
                      )}
                    </div>
                    <div className="quote-amount">
                      {money(q.lines.reduce((n, l) => n + lineTotal(l), 0))}
                    </div>
                    <ul className="quote-lines">
                      {q.lines.map((l) => (
                        <li key={l.id}>
                          <span>
                            {l.description}
                            <small>
                              {l.qty} × {money(l.unit)}
                            </small>
                          </span>
                          <strong>{money(lineTotal(l))}</strong>
                        </li>
                      ))}
                    </ul>
                    <dl className="quote-fields">
                      {q.template.fields.map((f) => (
                        <div key={f.id}>
                          <dt>{f.label}</dt>
                          <dd>{q.fields[f.id] || "Não informado"}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="quote-terms">
                      <strong>Condições</strong>
                      <p>{q.terms}</p>
                      {q.attachment && (
                        <small>Anexo informado: {q.attachment}</small>
                      )}
                    </div>
                    <Button
                      variant={q.selected ? "primary" : "secondary"}
                      icon={q.selected ? Check : Plus}
                      onClick={() => select(q)}
                    >
                      {q.selected ? "Retirar seleção" : "Selecionar cotação"}
                    </Button>
                  </article>
                );
              })}
          </div>
        </section>
      ))}
      <Note>
        A seleção compõe o orçamento. Não confirma a contratação do fornecedor.
        Valores em reais; compare também inclusões, validade e disponibilidade.
      </Note>
      <div className="bottom-actions">
        <span>
          {d.lines.length
            ? "Importar novamente substituirá apenas os itens do rascunho. Versões salvas serão preservadas."
            : "Os itens selecionados serão levados para o rascunho da proposta."}
        </span>
        <Button
          variant="primary"
          icon={ArrowRight}
          disabled={
            !d.quotes.some((q) => q.selected) || d.decision === "accepted"
          }
          onClick={importLines}
        >
          Levar seleção para proposta
        </Button>
      </div>
    </>
  );
}
export function SupplierPortal({ d, q }: { d: Demand; q: Quote }) {
  const { state, updateDemand, notify } = useStore();
  const s = state.suppliers.find((s) => s.id === q.supplierId);
  const [fields, setFields] = useState(q.fields);
  const [lines, setLines] = useState<Line[]>(
    q.lines.length
      ? structuredClone(q.lines)
      : [
          {
            id: uid(),
            category: q.template.name,
            description: "",
            qty: 1,
            unit: 0,
            direct: false,
          },
        ],
  );
  const [terms, setTerms] = useState(q.terms);
  const [attachment, setAttachment] = useState(q.attachment);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !lines.length ||
      lines.some((l) => !l.description.trim() || l.qty <= 0 || l.unit < 0)
    ) {
      setError(
        "Adicione pelo menos um item, com descrição, quantidade maior que zero e valor válido.",
      );
      return;
    }
    if (q.template.fields.some((f) => f.required && !fields[f.id]?.trim())) {
      setError("Preencha os campos obrigatórios do formulário.");
      return;
    }
    updateDemand(
      d.id,
      {
        quotes: d.quotes.map((x) =>
          x.id === q.id
            ? {
                ...x,
                status: "received",
                fields,
                lines,
                terms,
                attachment,
                receivedAt: new Date().toISOString(),
              }
            : x,
        ),
      },
      `Cotação de ${s?.name} recebida na simulação.`,
    );
    setSubmitted(true);
    notify(
      "Cotação registrada neste navegador. Nenhum dado foi enviado a um servidor.",
    );
  }
  const example = () => {
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
    setLines([
      {
        id: uid(),
        category: q.template.name,
        description:
          q.template.id === "food"
            ? "Menu completo por pessoa"
            : "Serviço principal",
        qty: q.template.id === "food" ? 200 : 1,
        unit: q.template.id === "food" ? 125 : 4500,
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
    ]);
    setTerms(
      "30% na confirmação e saldo 5 dias antes do evento. Proposta válida por 15 dias.",
    );
    notify("Exemplo fictício preenchido. Revise e envie a simulação.");
  };
  return (
    <div className="supplier-portal">
      <header className="portal-header">
        <a href="#/" className="brand" aria-label="Adviser, visão geral">
          <BrandLogo />
        </a>
        <Badge>Portal do fornecedor · demonstração</Badge>
        <Button icon={ArrowLeft} onClick={() => go(`/demandas/${d.id}/quotes`)}>
          Voltar ao atendimento
        </Button>
      </header>
      <main className="portal-main">
        <div className="page-heading">
          <div>
            <h1>Vamos construir esse evento?</h1>
            <p>
              Olá, {s?.contact}. Envie os detalhes da sua cotação para a
              Adviser.
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
        {submitted ? (
          <section className="success-screen">
            <Check size={38} />
            <h2>Cotação registrada na demonstração.</h2>
            <p>
              O atendimento já pode visualizar os itens e comparar sua resposta
              neste navegador.
            </p>
            <div className="actions">
              <Button
                variant="primary"
                onClick={() => go(`/demandas/${d.id}/compare`)}
              >
                Ver como o atendimento recebe
              </Button>
              <Button onClick={() => setSubmitted(false)}>
                Revisar minha resposta
              </Button>
            </div>
          </section>
        ) : (
          <form onSubmit={submit}>
            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>{q.template.name}</h2>
                  <p>
                    {s?.name} · modelo v{q.template.version}
                  </p>
                </div>
                <Button icon={FileText} onClick={example}>
                  Preencher exemplo
                </Button>
              </div>
              <p className="muted">
                {d.location || "Local a confirmar"}.{" "}
                {d.objective ||
                  "Detalhes do briefing disponíveis após validação."}
              </p>
              {d.briefingValid && scopeSummary(d, q.template.id) && (
                <details className="supplier-scope" open>
                  <summary>Escopo solicitado pela Adviser</summary>
                  <p>{scopeSummary(d, q.template.id)}</p>
                  <small>
                    Horários: {d.briefingDetails?.hours || "A confirmar"}.
                    Montagem: {d.briefingDetails?.setup || "A confirmar"}.
                  </small>
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
                        type={f.type}
                        required={f.required}
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
            <section className="panel">
              <h2>Itens e valores</h2>
              <p className="muted">
                Separe os serviços em quantas linhas precisar. Informe todos os
                valores em reais.
              </p>
              <LinesEditor
                lines={lines}
                onChange={setLines}
                category={q.template.name}
                allowDirect={false}
              />
              <div className="quote-total">
                <span>Total da cotação</span>
                <strong>
                  {money(lines.reduce((v, l) => v + lineTotal(l), 0))}
                </strong>
              </div>
            </section>
            <section className="panel">
              <Label
                label="Condições comerciais *"
                hint="Inclua pagamento, validade, inclusões e regras de cancelamento."
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
                hint="Nesta demonstração, apenas o nome do arquivo é registrado."
              >
                <input
                  type="file"
                  accept=".pdf,.xlsx,.xls,.png,.jpg"
                  onChange={(e) =>
                    setAttachment(e.target.files?.[0]?.name || "")
                  }
                />
              </Label>
              {attachment && (
                <p className="muted">Arquivo informado: {attachment}</p>
              )}
              <Note>
                Enviar uma cotação não confirma a contratação. Este formulário
                não mostra valores de outros fornecedores.
              </Note>
              {error && (
                <p className="error-text" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" variant="primary" icon={Send}>
                Enviar cotação simulada
              </Button>
            </section>
          </form>
        )}
        <footer className="portal-footer">
          Ambiente de demonstração com dados fictícios. O endereço não possui
          autenticação real e as respostas ficam apenas neste navegador.
        </footer>
      </main>
    </div>
  );
}
