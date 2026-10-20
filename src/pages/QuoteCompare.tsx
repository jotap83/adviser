import { ArrowRight } from "lucide-react";
import type { Demand } from "../types";
import { useStore, go } from "../store";
import { selectedLines } from "../domain.mjs";
import { currentSelection, quoteRevision } from "../quote-model";
import { Badge, Button, Empty, Note } from "../components/UI";
import { QuoteChoice } from "../components/QuoteChoice";

export function Compare({ d }: { d: Demand }) {
  const { updateDemand, notify } = useStore();
  const cats = [
    ...new Set(
      d.quotes.filter((q) => q.status === "received").map((q) => q.template.id),
    ),
  ];
  const pending = d.quotes.filter(
    (q) => q.selected && !currentSelection(q)?.confirmedAt,
  );
  function importLines() {
    updateDemand(
      d.id,
      (current) => ({
        ...current,
        lines: selectedLines(current.quotes),
        stage: "proposal",
        decision: "pending",
      }),
      "Composições escolhidas transferidas para o rascunho da proposta.",
    );
    notify(
      "Somente os itens escolhidos foram importados. Revise as condições na proposta.",
    );
    go(`/demandas/${d.id}/proposal`);
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Escolha a composição. Acerte os detalhes.</h2>
          <p>
            Compare fornecedores, escolha uma alternativa e acrescente os
            opcionais que fazem sentido para o evento.
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
          <p className="muted">
            Uma composição por categoria. Para mudar inclusões ou combinar
            alternativas, peça um ajuste na conversa.
          </p>
          <div className="negotiation-grid">
            {d.quotes
              .filter((q) => q.template.id === cat && q.status === "received")
              .map((q) => (
                <QuoteChoice
                  key={`${q.id}-${quoteRevision(q)}-${q.selection?.id || "none"}-${q.adjustmentPending || false}`}
                  d={d}
                  q={q}
                />
              ))}
          </div>
        </section>
      ))}
      <Note>
        A escolha compõe o orçamento e solicita confirmação ao fornecedor. Não
        autoriza contratação ou execução. As propostas já versionadas para o
        cliente são preservadas.
      </Note>
      {pending.length > 0 && (
        <Note tone="warning">
          {pending.length} composição(ões) ainda aguardam confirmação de valores
          e disponibilidade. Você pode preparar o orçamento com essa pendência;
          acompanhe o retorno antes de assumir compromissos.
        </Note>
      )}
      <div className="bottom-actions">
        <span>
          {d.lines.length
            ? "Reimportar substitui os itens do rascunho. As versões salvas permanecem intactas."
            : "Apenas os itens das composições confirmadas pela Adviser serão importados."}
        </span>
        <Button
          variant="primary"
          icon={ArrowRight}
          disabled={
            !selectedLines(d.quotes).length ||
            d.decision === "accepted" ||
            d.handoff
          }
          onClick={importLines}
        >
          Levar seleção para proposta
        </Button>
      </div>
    </>
  );
}
