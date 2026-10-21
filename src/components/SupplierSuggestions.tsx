import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import type { Demand } from "../types";
import { useStore, go } from "../store";
import { scopeBlocks } from "../briefing-model";
import {
  supplierNeeds,
  normalizeSupplierText,
  sameSupplierCity,
  eligibleSupplierIds,
  prepareSupplierRequests,
} from "../supplier-matching";
import { Badge, Button, Empty, Label } from "./UI";
import "../supplier-suggestions.css";

export function SupplierSuggestions({
  d,
  fromBriefing = false,
}: {
  d: Demand;
  fromBriefing?: boolean;
}) {
  const { state, updateDemand, notify } = useStore();
  const [view, setView] = useState("suggested");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const needs = supplierNeeds(d);
  const needByCategory = new Map(needs.map((n) => [n.category, n]));
  const picked = [...new Set(d.supplierShortlist || [])];
  const eligible = eligibleSupplierIds(d, state.suppliers, state.templates);
  const locked =
    d.decision === "accepted" || d.decision === "declined" || d.handoff;
  const categories = new Map([
    ...scopeBlocks.map((b) => [b.id, b.name] as const),
    ...state.templates.map((t) => [t.id, t.name] as const),
    ...state.suppliers.map(
      (s) =>
        [
          s.category,
          state.templates.find((t) => t.id === s.category)?.name ||
            scopeBlocks.find((b) => b.id === s.category)?.name ||
            s.category,
        ] as const,
    ),
  ]);
  const suggested = state.suppliers.filter((s) =>
    needByCategory.has(s.category),
  );
  const filtered = (view === "suggested" ? suggested : state.suppliers)
    .filter((s) => category === "all" || s.category === category)
    .filter((s) =>
      normalizeSupplierText(
        `${s.name} ${s.city} ${categories.get(s.category)}`,
      ).includes(normalizeSupplierText(search)),
    )
    .sort(
      (a, b) =>
        Number(sameSupplierCity(b, d.location)) -
          Number(sameSupplierCity(a, d.location)) ||
        a.name.localeCompare(b.name, "pt-BR"),
    );
  const groups = [...categories].filter(([id]) =>
    filtered.some((s) => s.category === id),
  );
  const uncovered = needs.filter(
    (n) => !state.suppliers.some((s) => s.category === n.category),
  );
  const outsideScope = picked.filter((id) => {
    const supplier = state.suppliers.find((s) => s.id === id);
    return supplier && !needByCategory.has(supplier.category);
  });
  function select(id: string, checked: boolean) {
    if (locked) return;
    updateDemand(d.id, (current) => ({
      ...current,
      supplierShortlist: checked
        ? [...new Set([...(current.supplierShortlist || []), id])]
        : (current.supplierShortlist || []).filter((s) => s !== id),
    }));
  }
  function prepare() {
    if (locked || !d.briefingValid || !eligible.length) return;
    updateDemand(
      d.id,
      (current) =>
        prepareSupplierRequests(
          current,
          state.suppliers,
          state.templates,
          eligible,
        ),
      `${eligible.length} solicitações de cotação preparadas a partir da seleção do atendimento.`,
    );
    notify(
      "Solicitações preparadas como rascunho. Abra o e-mail de cada fornecedor para revisar e simular o envio.",
    );
    if (fromBriefing) go(`/demandas/${d.id}/quotes`);
    else
      document
        .getElementById("quote-requests")
        ?.scrollIntoView({ block: "start", behavior: "instant" });
  }
  return (
    <section
      className="panel supplier-suggestions"
      aria-label="Fornecedores sugeridos"
    >
      <div className="section-heading">
        <div>
          <h2>Fornecedores sugeridos</h2>
          <p>
            Escolha quem consultar para cada serviço do evento. Você pode cotar
            com mais de um fornecedor por categoria.
          </p>
        </div>
        <Badge tone="blue">MVP</Badge>
      </div>
      <p className="supplier-match-disclosure">
        Sugestões demonstrativas a partir das categorias do briefing e do
        cadastro. Disponibilidade, capacidade e valores serão confirmados na
        cotação.
      </p>
      <div
        className="supplier-view"
        role="group"
        aria-label="Origem dos fornecedores"
      >
        <button
          type="button"
          aria-pressed={view === "suggested"}
          onClick={() => setView("suggested")}
        >
          Sugeridos para a demanda <span>{suggested.length}</span>
        </button>
        <button
          type="button"
          aria-pressed={view === "all"}
          onClick={() => setView("all")}
        >
          Todos os fornecedores <span>{state.suppliers.length}</span>
        </button>
      </div>
      <div className="supplier-filters">
        <Label label="Buscar fornecedor">
          <input
            type="search"
            value={search}
            placeholder="Nome, cidade ou serviço"
            onChange={(e) => setSearch(e.target.value)}
          />
        </Label>
        <Label label="Categoria de fornecedores">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Todas as categorias</option>
            {[...categories]
              .filter(([id]) => state.suppliers.some((s) => s.category === id))
              .map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
          </select>
        </Label>
      </div>
      <div className="supplier-results">
        {groups.map(([id, name]) => {
          const need = needByCategory.get(id);
          return (
            <section className="supplier-service" key={id} aria-label={name}>
              <div className="supplier-service-heading">
                <h3>{name}</h3>
                <p>
                  {need
                    ? need.confirmedScope
                      ? "Por que sugerimos: serviço incluído no escopo do evento."
                      : `Possível necessidade identificada em: ${need.source}. Revise antes de cotar.`
                    : "Categoria fora das sugestões atuais. A inclusão é uma escolha do atendimento."}
                </p>
                {need?.evidence && (
                  <details className="supplier-evidence">
                    <summary>Ver contexto do briefing</summary>
                    <p>{need.evidence}</p>
                  </details>
                )}
              </div>
              {filtered
                .filter((s) => s.category === id)
                .map((s) => {
                  const quote = d.quotes.find((q) => q.supplierId === s.id);
                  const hasTemplate = state.templates.some(
                    (t) => t.id === s.category,
                  );
                  const disabled = locked || !!quote || !hasTemplate;
                  return (
                    <label
                      className={`supplier-option${picked.includes(s.id) && !quote ? " is-picked" : ""}${disabled ? " is-unavailable" : ""}`}
                      key={s.id}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${s.name}`}
                        checked={picked.includes(s.id) && !quote}
                        disabled={disabled}
                        onChange={(e) => select(s.id, e.target.checked)}
                      />
                      <span className="supplier-option-main">
                        <strong>{s.name}</strong>
                        <small>
                          {s.city || "Cidade não cadastrada"}
                          {s.contact ? ` · ${s.contact}` : ""}
                        </small>
                      </span>
                      <span className="supplier-option-state">
                        {quote ? (
                          <Badge
                            tone={
                              quote.status === "received" ? "green" : "gray"
                            }
                          >
                            {quote.status === "received"
                              ? "Cotação recebida"
                              : quote.status === "requested"
                                ? "Aguardando resposta"
                                : "Solicitação preparada"}
                          </Badge>
                        ) : !hasTemplate ? (
                          "Configure um modelo para esta categoria"
                        ) : sameSupplierCity(s, d.location) ? (
                          "Cadastrado na cidade do evento"
                        ) : (
                          "Confirmar região de atendimento"
                        )}
                      </span>
                    </label>
                  );
                })}
            </section>
          );
        })}
        {!filtered.length && (
          <Empty
            title={
              search || category !== "all"
                ? "Nenhum fornecedor neste filtro"
                : view === "suggested"
                  ? "Ainda não há fornecedores sugeridos"
                  : "Cadastre os primeiros fornecedores"
            }
            text={
              search || category !== "all"
                ? "Experimente outro nome ou categoria."
                : view === "suggested"
                  ? "Preencha o pedido ou selecione os serviços no escopo. Você também pode escolher diretamente no cadastro."
                  : "Informe a categoria de cada fornecedor para relacioná-lo às demandas."
            }
            action={
              search || category !== "all" ? (
                <Button
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                  }}
                >
                  Limpar filtros
                </Button>
              ) : view === "suggested" && state.suppliers.length ? (
                <Button onClick={() => setView("all")}>
                  Ver todos os fornecedores
                </Button>
              ) : (
                <Button onClick={() => go("/fornecedores")}>
                  Cadastrar fornecedor
                </Button>
              )
            }
          />
        )}
      </div>
      {!!uncovered.length && (
        <p className="supplier-coverage">
          <strong>Serviços sem fornecedores cadastrados:</strong>{" "}
          {uncovered.map((n) => n.name).join(", ")}. Complete o cadastro para
          ampliar as opções.
        </p>
      )}
      <div className="supplier-shortlist">
        <div className="supplier-shortlist-heading">
          <strong aria-live="polite">
            {picked.length}{" "}
            {picked.length === 1
              ? "fornecedor selecionado"
              : "fornecedores selecionados"}
          </strong>
          {!!picked.length && !locked && (
            <Button
              variant="ghost"
              onClick={() => updateDemand(d.id, { supplierShortlist: [] })}
            >
              Limpar seleção
            </Button>
          )}
        </div>
        {!!picked.length && (
          <ul className="supplier-selected-list">
            {picked.map((id) => (
              <li key={id}>
                <span>
                  {state.suppliers.find((s) => s.id === id)?.name ||
                    "Fornecedor removido do cadastro"}
                </span>
                {!locked && (
                  <button
                    type="button"
                    onClick={() => select(id, false)}
                    aria-label={`Remover ${state.suppliers.find((s) => s.id === id)?.name || "fornecedor removido"} da seleção`}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {!!outsideScope.length && (
          <p className="supplier-selection-warning">
            Há {outsideScope.length}{" "}
            {outsideScope.length === 1
              ? "selecionado fora"
              : "selecionados fora"}{" "}
            das sugestões atuais. Confira se os serviços devem ser cotados.
          </p>
        )}
        {eligible.length < picked.length && (
          <p className="supplier-selection-warning">
            Alguns selecionados já têm solicitação, foram removidos ou estão sem
            modelo. Só os {eligible.length} fornecedores aptos serão incluídos.
          </p>
        )}
        <div className="supplier-shortlist-actions">
          <p>
            {locked
              ? "Demanda encerrada. Consulte as solicitações na aba Cotações."
              : !d.briefingValid
                ? "A seleção fica salva. Valide o briefing para preparar as solicitações."
                : "Será preparado um rascunho individual para cada fornecedor, com seu modelo de resposta e link para cotação."}
          </p>
          <Button
            variant="primary"
            icon={ArrowRight}
            disabled={locked || !d.briefingValid || !eligible.length}
            onClick={prepare}
          >
            {eligible.length
              ? `Preparar ${eligible.length} ${eligible.length === 1 ? "solicitação" : "solicitações"}`
              : "Preparar solicitações"}
          </Button>
        </div>
        <p className="field-hint">
          Seleção salva neste navegador. Preparar uma solicitação não envia
          mensagens nem confirma contratação.
        </p>
      </div>
    </section>
  );
}
