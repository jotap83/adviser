import { useState } from "react";
import { Mail, Link, ExternalLink, Copy, ArrowRight, Send } from "lucide-react";
import type { Demand, Quote } from "../types";
import { useStore, go, copy } from "../store";
import { quoteRange } from "../quote-model";
import { scopeSummary } from "../briefing-model";
import { Button, Label, Badge, Empty } from "../components/UI";
import { SupplierSuggestions } from "../components/SupplierSuggestions";
export function Quotes({ d }: { d: Demand }) {
  const { state, updateDemand, notify } = useStore();
  const [preview, setPreview] = useState<string | null>(null);
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
      ? `Olá, ${sup.contact}!\n\nEstamos preparando o evento ${d.title}, em ${d.date || "[data a confirmar]"}, para ${d.guests || "[público a confirmar]"} pessoas, em ${d.location || "[local a confirmar]"}.\n\nGostaríamos de receber sua cotação para ${active.template.name.toLowerCase()}. Preencha os itens, valores e condições neste link até ${active.deadline.split("-").reverse().join("/")}:\n\n${link(active)}\n\nObjetivo do evento: ${d.objective || "A confirmar"}.\n\nHorários: ${d.briefingDetails?.hours || "A confirmar"}.\nMontagem e desmontagem: ${d.briefingDetails?.setup || "A confirmar"}.\n\n${scopeContext ? `Escopo a cotar:\n${scopeContext}\n\n` : ""}A solicitação é uma cotação e não representa contratação.\n\nObrigada,\n${d.owner ? `${d.owner} · Adviser` : "Equipe Adviser"}`
      : "";
  return (
    <>
      <SupplierSuggestions key={d.id} d={d} />
      <div className="section-heading" id="quote-requests">
        <div>
          <h2>Solicitações de cotação</h2>
          <p>
            Revise o e-mail e o link de cada fornecedor antes de simular o
            envio.
          </p>
        </div>
      </div>
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
                        {q.adjustmentPending
                          ? "Ajuste solicitado"
                          : q.selection?.confirmedAt
                            ? "Composição confirmada"
                            : q.selection
                              ? "Aguardando confirmação"
                              : q.status === "received"
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
                      {q.status === "received" ? quoteRange(q) : "Aguardando"}
                    </td>
                    <td>
                      <div className="actions">
                        {q.status === "received" && (
                          <Button
                            onClick={() => go(`/demandas/${d.id}/compare`)}
                          >
                            Analisar e negociar
                          </Button>
                        )}
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
                            ? "Visão do fornecedor"
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
              disabled={
                active.status === "received" ||
                !d.briefingValid ||
                d.decision === "accepted" ||
                d.decision === "declined" ||
                d.handoff
              }
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
          Compare alternativas, escolha adicionais e converse com cada
          fornecedor.
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

export { Compare } from "./QuoteCompare";
export { SupplierPortal } from "./SupplierPortal";
