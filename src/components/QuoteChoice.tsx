import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { Demand, Quote } from "../types";
import { copy, go, useStore } from "../store";
import {
  addQuoteMessage,
  currentSelection,
  optionTotal,
  quoteOptions,
  quoteRevision,
  selectComposition,
  selectionSummary,
} from "../quote-model";
import { lineTotal, money } from "../domain.mjs";
import { Badge, Button, Note } from "./UI";
import { QuoteConversation, QuoteHistory } from "./QuoteConversation";

export function QuoteChoice({ d, q }: { d: Demand; q: Quote }) {
  const { state, updateDemand, notify } = useStore();
  const options = quoteOptions(q);
  const saved = currentSelection(q);
  const [optionId, setOptionId] = useState(saved?.optionId || options[0].id);
  const option = options.find((o) => o.id === optionId) || options[0];
  const [lineIds, setLineIds] = useState(
    saved?.lineIds || option.lines.filter((l) => !l.optional).map((l) => l.id),
  );
  const [expectedRevision] = useState(quoteRevision(q));
  const selected = option.lines
    .filter((l) => !l.optional || lineIds.includes(l.id))
    .map((l) => l.id);
  const unchanged =
    saved?.optionId === option.id &&
    selected.length === saved.lineIds.length &&
    selected.every((id) => saved.lineIds.includes(id));
  const locked = d.decision === "accepted" || d.handoff;
  const supplier = state.suppliers.find((s) => s.id === q.supplierId);
  function confirm() {
    if (locked || q.adjustmentPending || quoteRevision(q) !== expectedRevision)
      return;
    updateDemand(
      d.id,
      (current) => ({
        ...current,
        quotes: current.quotes.map((x) =>
          x.id === q.id
            ? quoteRevision(x) === expectedRevision
              ? selectComposition(x, option.id, selected)
              : x
            : x.template.id === q.template.id && x.selected
              ? addQuoteMessage(
                  { ...x, selected: false, selection: undefined },
                  "adviser",
                  "message",
                  "A seleção desta composição foi retirada do orçamento. Nenhuma contratação foi autorizada.",
                )
              : x,
        ),
      }),
      `Composição de ${supplier?.name} escolhida para orçamento; confirmação solicitada ao fornecedor.`,
    );
    notify(
      "Composição registrada. Abra a visão do fornecedor para simular a confirmação.",
    );
  }
  return (
    <article
      className={`comparison-panel quote-choice ${q.selected ? "selected" : ""}`}
      id={`quote-${q.id}`}
    >
      <div className="section-heading">
        <div>
          <h3>{supplier?.name}</h3>
          <p>
            {q.template.name} · cotação v{quoteRevision(q)}
          </p>
        </div>
        <Badge
          tone={saved?.confirmedAt ? "green" : q.selected ? "blue" : "gray"}
        >
          {saved?.confirmedAt
            ? "Fornecedor confirmou"
            : q.selected
              ? "Composição escolhida"
              : "Em análise"}
        </Badge>
      </div>
      <fieldset
        className="quote-option-picker"
        disabled={locked || q.adjustmentPending}
      >
        <legend>Escolha uma alternativa</legend>
        {options.map((o) => (
          <label key={o.id} className={option.id === o.id ? "active" : ""}>
            <input
              type="radio"
              name={`option-${q.id}`}
              checked={option.id === o.id}
              onChange={() => {
                setOptionId(o.id);
                setLineIds(o.lines.filter((l) => !l.optional).map((l) => l.id));
              }}
            />
            <span>
              <strong>{o.name}</strong>
              <small>
                Base {money(optionTotal(o))}{" "}
                {o.lines.some((l) => l.optional) ? "+ opcionais" : ""}
              </small>
            </span>
          </label>
        ))}
      </fieldset>
      {option.detail && <p className="option-detail">{option.detail}</p>}
      <ul className="choice-lines">
        {option.lines.map((l) => (
          <li key={l.id}>
            <label>
              <input
                type="checkbox"
                checked={!l.optional || lineIds.includes(l.id)}
                disabled={!l.optional || locked || q.adjustmentPending}
                onChange={(e) =>
                  setLineIds(
                    e.target.checked
                      ? [...lineIds, l.id]
                      : lineIds.filter((id) => id !== l.id),
                  )
                }
              />
              <span>
                <strong>{l.description}</strong>
                <small>
                  {l.optional ? "Adicional opcional" : "Incluído nesta opção"} ·{" "}
                  {l.qty} × {money(l.unit)}
                </small>
              </span>
            </label>
            <strong>{money(lineTotal(l))}</strong>
          </li>
        ))}
      </ul>
      <div className="composition-total">
        <span>Total da composição</span>
        <strong>{money(optionTotal(option, selected))}</strong>
      </div>
      <p className="field-hint">
        As alternativas não se somam. Para remover um item incluído ou combinar
        alternativas, peça uma nova versão ao fornecedor.
      </p>
      <details className="quote-detail">
        <summary>Escopo, condições e anexo</summary>
        <dl className="quote-fields">
          {q.template.fields.map((f) => (
            <div key={f.id}>
              <dt>{f.label}</dt>
              <dd>{q.fields[f.id] || "Não informado"}</dd>
            </div>
          ))}
        </dl>
        <p className="preserve-text">{q.terms}</p>
        {q.attachment && <p>Anexo informado: {q.attachment}</p>}
      </details>
      {q.adjustmentPending && (
        <Note tone="warning">
          Ajuste solicitado. Aguarde a nova versão para confirmar outra
          composição.
        </Note>
      )}
      {saved && !unchanged && (
        <Note tone="warning">
          Você alterou a composição. Confirme novamente para substituir a
          escolha anterior.
        </Note>
      )}
      {saved && unchanged && q.selected && (
        <Note tone={saved.confirmedAt ? "success" : "info"}>
          {saved.confirmedAt
            ? "Valores e disponibilidade confirmados para esta composição."
            : "Aguardando o fornecedor confirmar valores e disponibilidade."}{" "}
          A escolha pode compor o orçamento; a contratação depende de
          autorização específica.
        </Note>
      )}
      <div className="actions">
        <Button
          variant="primary"
          icon={Check}
          disabled={
            locked ||
            q.adjustmentPending ||
            !selected.length ||
            Boolean(unchanged && q.selected)
          }
          onClick={confirm}
        >
          {unchanged && q.selected
            ? "Composição registrada"
            : "Confirmar composição escolhida"}
        </Button>
        {q.selected && (
          <Button
            disabled={locked}
            onClick={() =>
              updateDemand(d.id, (current) => ({
                ...current,
                quotes: current.quotes.map((x) =>
                  x.id === q.id
                    ? addQuoteMessage(
                        { ...x, selected: false, selection: undefined },
                        "adviser",
                        "message",
                        "A seleção desta composição foi retirada do orçamento. Nenhuma contratação foi autorizada.",
                      )
                    : x,
                ),
              }))
            }
          >
            Retirar seleção
          </Button>
        )}
        <Button
          variant="ghost"
          icon={ExternalLink}
          onClick={() => go(`/fornecedor/${d.id}/${q.id}`)}
        >
          Visão do fornecedor
        </Button>
        {saved && (
          <Button
            variant="ghost"
            icon={Copy}
            onClick={async () =>
              notify(
                (await copy(selectionSummary(q)))
                  ? "Composição copiada para o e-mail."
                  : "Copie a composição no histórico da conversa.",
              )
            }
          >
            Copiar composição
          </Button>
        )}
      </div>
      <QuoteConversation d={d} q={q} role="adviser" />
      <QuoteHistory q={q} />
    </article>
  );
}
