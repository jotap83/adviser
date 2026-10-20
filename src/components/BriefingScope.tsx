import { useState } from "react";
import { Sparkles, ArrowRight, Check, ListChecks, Mail } from "lucide-react";
import type { Demand } from "../types";
import {
  briefingFields,
  scopeBlocks,
  briefingGaps,
  scopeSuggestions,
} from "../briefing-model";
import { useStore } from "../store";
import { Badge, Button, Label, Note } from "./UI";

export function BriefingScope({
  d,
  patch,
}: {
  d: Demand;
  patch: (p: Partial<Demand>) => void;
}) {
  const { state, notify, updateDemand } = useStore();
  const [selected, setSelected] = useState("local");
  const [review, setReview] = useState<ReturnType<
    typeof scopeSuggestions
  > | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const block = scopeBlocks.find((b) => b.id === selected)!;
  const linkedToQuote = state.templates.some((t) => t.id === block.id);
  const scope = d.scope || {};
  const enabled = scopeBlocks.filter((b) => scope[b.id]?.included);
  const gaps = briefingGaps(d);
  const total =
    4 +
    briefingFields.length +
    enabled.reduce((n, b) => n + b.fields.length, 0);
  const complete = total - gaps.length;
  function toggle(id: string, included: boolean) {
    patch({
      scope: {
        ...scope,
        [id]: { included, answers: scope[id]?.answers || {} },
      },
    });
    setSelected(id);
  }
  async function analyze() {
    setBusy(true);
    setReview(null);
    setError("");
    await new Promise((r) => setTimeout(r, 650));
    if (state.aiMode === "offline")
      setError(
        "A IA está indisponível nesta simulação. Você pode selecionar os blocos e preencher todos os campos manualmente.",
      );
    else {
      const results = scopeSuggestions(
        [d.message, ...d.briefingLog].join("\n"),
      );
      setReview(results);
      setPicked(results.map((r) => r.block.id));
    }
    setBusy(false);
  }
  function addQuestions() {
    const existing = d.questions.split("\n").filter(Boolean);
    patch({
      questions: [
        ...new Set([
          ...existing,
          ...gaps.map((g) => `[${g.group}] ${g.question}`),
        ]),
      ].join("\n"),
    });
    notify(
      "Perguntas adicionadas ao rascunho. Revise quem deve responder antes de enviar.",
    );
  }
  return (
    <section
      className="briefing-scope"
      aria-label="Planejamento detalhado do briefing"
    >
      <div className="section-heading">
        <div>
          <h2>Do briefing à composição do evento</h2>
          <p>Desdobre o pedido nos serviços que precisarão ser cotados.</p>
        </div>
        <Badge tone="blue">{enabled.length} blocos no escopo</Badge>
      </div>
      <div className="scope-layout">
        <div className="scope-main">
          <section className="panel">
            <div className="section-heading">
              <div>
                <h3>Planejamento do atendimento</h3>
                <p>As decisões que orientam todas as cotações.</p>
              </div>
            </div>
            <div className="form-grid">
              <Label label="Próxima entrega ao cliente">
                <input
                  type="date"
                  value={d.dueAt || ""}
                  onChange={(e) =>
                    updateDemand(
                      d.id,
                      { dueAt: e.target.value },
                      "Prazo da próxima entrega atualizado.",
                    )
                  }
                />
              </Label>
              {briefingFields.map((f) => (
                <Label key={f.id} label={f.label}>
                  <textarea
                    aria-label={f.label}
                    rows={2}
                    placeholder={f.example}
                    value={d.briefingDetails?.[f.id] || ""}
                    onChange={(e) =>
                      patch({
                        briefingDetails: {
                          ...d.briefingDetails,
                          [f.id]: e.target.value,
                        },
                      })
                    }
                  />
                </Label>
              ))}
            </div>
          </section>
          <section className="panel">
            <div className="section-heading">
              <div>
                <h3>Quais serviços entram no evento?</h3>
                <p>Selecione os blocos. Os detalhes aparecem abaixo.</p>
              </div>
              <Button icon={Sparkles} busy={busy} onClick={analyze}>
                {busy ? "Analisando..." : "Analisar escopo com IA"}
              </Button>
            </div>
            <div className="scope-options">
              {scopeBlocks.map((b) => (
                <label
                  key={b.id}
                  className={scope[b.id]?.included ? "selected" : ""}
                >
                  <input
                    type="checkbox"
                    checked={!!scope[b.id]?.included}
                    onChange={(e) => toggle(b.id, e.target.checked)}
                  />
                  <span>{b.name}</span>
                </label>
              ))}
            </div>
            {error && (
              <div className="note error" role="alert">
                {error}
              </div>
            )}
            {review && (
              <div className="scope-ai-review">
                <div className="section-heading">
                  <h3>Blocos sugeridos a partir da conversa</h3>
                  <Badge>IA simulada</Badge>
                </div>
                <p>
                  As menções são pistas, inclusive se o texto contiver uma
                  negativa. Confirme o escopo antes de aplicar.
                </p>
                {review.length ? (
                  review.map((r) => (
                    <label key={r.block.id} className="scope-suggestion">
                      <input
                        type="checkbox"
                        checked={picked.includes(r.block.id)}
                        onChange={(e) =>
                          setPicked(
                            e.target.checked
                              ? [...picked, r.block.id]
                              : picked.filter((id) => id !== r.block.id),
                          )
                        }
                      />
                      <span>
                        <strong>{r.block.name}</strong>
                        <small>Trecho identificado: “{r.evidence}”</small>
                      </span>
                    </label>
                  ))
                ) : (
                  <p>
                    Nenhuma categoria identificada. Selecione os serviços
                    manualmente.
                  </p>
                )}
                <div className="actions">
                  <Button
                    variant="primary"
                    icon={Check}
                    disabled={!picked.length}
                    onClick={() => {
                      const next = { ...scope };
                      picked.forEach((id) => {
                        next[id] = {
                          included: true,
                          answers: scope[id]?.answers || {},
                        };
                      });
                      patch({ scope: next });
                      setSelected(picked[0]);
                      setReview(null);
                      notify(
                        "Blocos incluídos. As informações que não vieram do cliente continuam em aberto.",
                      );
                    }}
                  >
                    Aplicar blocos selecionados
                  </Button>
                  <Button onClick={() => setReview(null)}>Descartar</Button>
                </div>
              </div>
            )}
            {enabled.length ? (
              <>
                <div
                  className="scope-section-tabs"
                  aria-label="Bloco em edição"
                >
                  {enabled.map((b) => (
                    <button
                      key={b.id}
                      className={selected === b.id ? "active" : ""}
                      aria-pressed={selected === b.id}
                      onClick={() => setSelected(b.id)}
                    >
                      {b.name}
                      <small>
                        {
                          b.fields.filter((f) =>
                            scope[b.id]?.answers[f.id]?.trim(),
                          ).length
                        }
                        /{b.fields.length}
                      </small>
                    </button>
                  ))}
                </div>
                {scope[block.id]?.included ? (
                  <div className="scope-fields">
                    <h3>{block.name}</h3>
                    {block.fields.map((f) => (
                      <Label key={f.id} label={f.label} hint={f.question}>
                        <textarea
                          aria-label={f.label}
                          rows={2}
                          placeholder={f.example}
                          value={scope[block.id]?.answers[f.id] || ""}
                          onChange={(e) =>
                            patch({
                              scope: {
                                ...scope,
                                [block.id]: {
                                  included: true,
                                  answers: {
                                    ...scope[block.id]?.answers,
                                    [f.id]: e.target.value,
                                  },
                                },
                              },
                            })
                          }
                        />
                      </Label>
                    ))}
                    <div className="scope-output">
                      <ArrowRight size={17} />
                      <div>
                        <strong>
                          {linkedToQuote
                            ? "Este bloco alimenta a cotação"
                            : "Modelo de cotação a validar"}
                        </strong>
                        <p>
                          {linkedToQuote
                            ? block.output
                            : "Estas informações ficam registradas no briefing. Este bloco ainda não tem um modelo de cotação vinculado; a categoria e seus campos precisam ser validados com a Adviser."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="muted">
                    Escolha um bloco acima para detalhar o serviço.
                  </p>
                )}
              </>
            ) : (
              <div className="scope-empty">
                <ListChecks size={24} />
                <p>
                  Comece pelos serviços mencionados pelo cliente. O roteiro
                  ajuda a identificar custos e dependências antes de pedir
                  preços.
                </p>
              </div>
            )}
          </section>
        </div>
        <aside className="scope-checklist panel">
          <h3>O que ainda falta confirmar</h3>
          <div className="coverage-summary">
            <strong>
              {complete} de {total}
            </strong>
            <span>campos de planejamento preenchidos</span>
          </div>
          <div
            className="coverage-track"
            role="progressbar"
            aria-label="Campos de planejamento preenchidos"
            aria-valuenow={complete}
            aria-valuemin={0}
            aria-valuemax={total}
          >
            <span style={{ width: `${(complete / total) * 100}%` }} />
          </div>
          <p className="field-hint">
            Preenchimento não significa validação. A equipe confirma o
            entendimento com o cliente e os fornecedores.
          </p>
          {!enabled.length && (
            <p className="scope-warning">
              O escopo de serviços ainda não foi selecionado.
            </p>
          )}
          {gaps.length ? (
            <>
              <ul className="briefing-gap-list">
                {gaps.slice(0, 5).map((g, i) => (
                  <li key={i}>
                    <small>{g.group}</small>
                    <span>{g.question}</span>
                  </li>
                ))}
              </ul>
              {gaps.length > 5 && (
                <details>
                  <summary>Ver mais {gaps.length - 5} perguntas</summary>
                  <ul className="briefing-gap-list">
                    {gaps.slice(5).map((g, i) => (
                      <li key={i}>
                        <small>{g.group}</small>
                        <span>{g.question}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <Button icon={Mail} onClick={addQuestions}>
                Adicionar perguntas ao rascunho
              </Button>
            </>
          ) : (
            <p className="note success">
              Campos preenchidos. Revise o conteúdo e confirme o alinhamento.
            </p>
          )}
          <p className="field-hint">
            O atendimento revisa o destinatário de cada pergunta. Dimensões,
            equipamentos e documentos podem precisar de confirmação técnica do
            fornecedor.
          </p>
        </aside>
      </div>
      <details className="panel reverse-map">
        <summary>Como o briefing vira uma proposta?</summary>
        <p>
          Cada grupo da proposta começa com decisões no briefing e termina com
          itens comparáveis de cotação.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Bloco do briefing</th>
                <th>O que precisamos levantar</th>
                <th>O que aparece na cotação</th>
              </tr>
            </thead>
            <tbody>
              {scopeBlocks.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong>{b.name}</strong>
                  </td>
                  <td>{b.fields.map((f) => f.label).join("; ")}.</td>
                  <td>{b.output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>
          O documento final ajuda a reconstruir as perguntas, mas não recupera
          as conversas ou decisões originais. Aqui usamos somente a estrutura,
          com exemplos fictícios.
        </Note>
      </details>
    </section>
  );
}
