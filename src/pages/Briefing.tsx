import { useState } from "react";
import { Sparkles, Check, ArrowRight, AlertCircle } from "lucide-react";
import type { Demand, AIResult, ClientMessage } from "../types";
import { useStore, go } from "../store";
import { DemoBriefingAI } from "../ai";
import { Button, Label, Badge, SaveMark } from "../components/UI";
import { BriefingScope } from "../components/BriefingScope";
import { BriefingAttachments } from "../components/BriefingAttachments";
import { ClientConversation } from "../components/ClientConversation";
import { CreativePresentations } from "../components/CreativePresentations";
import { completeBriefingExample } from "../briefing-example";
import {
  briefingSources,
  applySuggestions,
  currentSuggestionValue,
  questionsAfterReview,
} from "../briefing-analysis";
export function Briefing({ d }: { d: Demand }) {
  const { state, updateDemand, notify } = useStore();
  const [result, setResult] = useState<AIResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [snapshot, setSnapshot] = useState("");
  const sources = briefingSources(d);
  const signature = JSON.stringify({
    sources,
    title: d.title,
    date: d.date,
    guests: d.guests,
    budget: d.budget,
    location: d.location,
    objective: d.objective,
    details: d.briefingDetails,
    scope: d.scope,
  });
  const [aligned, setAligned] = useState(d.briefingValid);
  const patch = (p: Partial<Demand>) => {
    setAligned(false);
    updateDemand(d.id, { ...p, briefingValid: false });
  };
  async function organize(message?: ClientMessage) {
    setBusy(true);
    setError("");
    setResult(null);
    setSnapshot(signature);
    const input = message
      ? [
          { name: `Retorno de ${message.contact}`, text: message.text },
          ...(d.attachments || [])
            .filter(
              (a) => a.messageId === message.id && a.included && a.text.trim(),
            )
            .map((a) => ({ name: a.name, text: a.text })),
        ]
      : sources;
    document
      .getElementById("briefing-entrada")
      ?.scrollIntoView({ block: "start", behavior: "instant" });
    try {
      const next = await new DemoBriefingAI(
        state.aiMode === "offline",
      ).organize(input.map((s) => s.text).join("\n"), input);
      setResult(next);
      setSelected((next.suggestions || []).map((s) => s.path));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function apply() {
    if (!result || signature !== snapshot) return;
    const suggestions = (result.suggestions || []).filter((s) =>
      selected.includes(s.path),
    );
    patch({
      ...applySuggestions(d, suggestions),
      questions: [
        ...new Set([
          ...d.questions.split("\n").filter(Boolean),
          ...questionsAfterReview(d, result, selected),
        ]),
      ].join("\n"),
    });
    setResult(null);
    notify(
      `${suggestions.length} sugestões aplicadas. Confira os campos antes de validar o briefing.`,
    );
  }
  const displayValue = (path: string, value: string | number) =>
    path === "budget" && typeof value === "number"
      ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : path === "date" && value
        ? String(value).split("-").reverse().join("/")
        : String(value);
  const reviewQuestions = result
    ? questionsAfterReview(d, result, selected)
    : [];
  const valid = Boolean(
    d.title.trim() &&
    d.date &&
    d.guests > 0 &&
    d.location.trim() &&
    d.objective.trim(),
  );
  return (
    <>
      <nav className="briefing-jumps" aria-label="Seções do briefing">
        {[
          ["entrada", "Mensagem e anexos"],
          ["escopo", "Escopo do evento"],
          ["conversa", "Conversa com o cliente"],
          ["criacao", "Apresentação criativa"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() =>
              document
                .getElementById(`briefing-${id}`)
                ?.scrollIntoView({ block: "start", behavior: "instant" })
            }
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="section-heading briefing-section" id="briefing-entrada">
        <div>
          <h2>Primeiro, entender o evento.</h2>
          <p>
            Preencha diretamente ou revise as informações de Gmail e WhatsApp
            antes de cotar.
          </p>
        </div>
        <SaveMark />
      </div>
      <div className="briefing-grid">
        <section className="panel">
          <div className="section-heading">
            <h3>Pedido e fontes do briefing</h3>
            <Badge tone="blue">{d.source}</Badge>
          </div>
          <Label label="Origem do contato">
            <select
              value={d.source}
              onChange={(e) => patch({ source: e.target.value })}
            >
              <option>E-mail</option>
              <option>Gmail</option>
              <option>WhatsApp</option>
              <option>Cadastro direto</option>
              <option>Ligação</option>
              <option>Reunião</option>
              <option>Outro</option>
            </select>
          </Label>
          <Label
            label={
              d.source === "Ligação"
                ? "Anotações da ligação"
                : "Pedido ou anotações do cliente"
            }
            hint="Preenchimento direto disponível. Mensagens associadas e anexos também entram na análise, após sua revisão."
          >
            <textarea
              className="email-text"
              value={d.message}
              onChange={(e) => patch({ message: e.target.value })}
              placeholder="Descreva o pedido, cole uma mensagem ou preencha diretamente os campos ao lado..."
            />
          </Label>
          <div className="actions intake-actions">
            <Button
              onClick={() => {
                document
                  .getElementById("briefing-dados")
                  ?.scrollIntoView({ block: "start" });
                document
                  .querySelector<HTMLInputElement>("#briefing-dados input")
                  ?.focus({ preventScroll: true });
              }}
            >
              Preencher sem IA
            </Button>
            <Button variant="ghost" onClick={() => go("/mensagens")}>
              Ver Gmail e WhatsApp
            </Button>
          </div>
          <details className="example-picker">
            <summary>Experimentar um briefing completo</summary>
            <p>
              Exemplo fictício com programação, montagem, alimentação,
              audiovisual, criação, equipe e logística. Substitui apenas o texto
              da entrada; os campos preenchidos só mudam após a revisão da
              análise.
            </p>
            <Button
              onClick={() => {
                patch({ message: completeBriefingExample });
                setResult(null);
                notify(
                  "Exemplo fictício carregado. Clique em Organizar com IA para revisar as sugestões.",
                );
              }}
            >
              Carregar exemplo completo
            </Button>
          </details>
          <BriefingAttachments
            d={d}
            invalidate={() => {
              setAligned(false);
              setResult(null);
            }}
          />
          <div className="split-actions">
            <Button
              variant="primary"
              icon={Sparkles}
              busy={busy}
              onClick={() => organize()}
            >
              {busy ? "Organizando..." : "Organizar com IA"}
            </Button>
            <small>Simulação sem API externa</small>
          </div>
          {error && (
            <div className="note error" role="alert">
              <AlertCircle size={18} />
              <div>{error}</div>
            </div>
          )}
          {result && (
            <div className="ai-review" aria-live="polite">
              <div className="section-heading">
                <h3>Entendimento sugerido</h3>
                <Badge tone="blue">Revisão humana</Badge>
              </div>
              <p className="muted">
                {result.suggestions?.length || 0} campos identificados em{" "}
                {result.evidence.length} fonte(s). Selecione o que aplicar. Os
                retornos mais recentes têm prioridade quando mencionam o mesmo
                campo.
              </p>
              {signature !== snapshot && (
                <div className="note error" role="alert">
                  As informações mudaram depois da análise. Organize novamente
                  antes de aplicar.
                </div>
              )}
              <div className="ai-suggestions">
                {(result.suggestions || []).map((s) => {
                  const previous = currentSuggestionValue(d, s.path);
                  const changed =
                    Boolean(previous) && String(previous) !== String(s.value);
                  return (
                    <div className="ai-suggestion" key={s.path}>
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={selected.includes(s.path)}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [...selected, s.path]
                                : selected.filter((p) => p !== s.path),
                            )
                          }
                        />
                        <strong>{s.label}</strong>
                        {changed && <Badge tone="amber">Alteração</Badge>}
                      </label>
                      {changed && (
                        <p className="previous-value">
                          Atual: {displayValue(s.path, previous)}
                        </p>
                      )}
                      <p>{displayValue(s.path, s.value)}</p>
                      <details>
                        <summary>Fonte: {s.source}</summary>
                        <blockquote>{s.excerpt}</blockquote>
                      </details>
                    </div>
                  );
                })}
              </div>
              {reviewQuestions.length > 0 && (
                <details>
                  <summary>Pontos para revisar com o cliente</summary>
                  <ul>
                    {reviewQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                  <p className="field-hint">
                    Serão acrescentados às perguntas existentes.
                  </p>
                </details>
              )}
              <p className="field-hint">
                Simulação por padrões e campos nomeados, sem API externa. A
                leitura dos arquivos é real; a interpretação não substitui uma
                IA de produção.
              </p>
              <div className="actions">
                <Button
                  variant="primary"
                  icon={Check}
                  disabled={!selected.length || snapshot !== signature}
                  onClick={apply}
                >
                  Aplicar e revisar nos campos
                </Button>
                <Button variant="ghost" onClick={() => setResult(null)}>
                  Descartar
                </Button>
              </div>
            </div>
          )}
        </section>
        <section className="panel" id="briefing-dados">
          <div className="section-heading">
            <h3>Briefing estruturado</h3>
            {d.briefingValid ? (
              <Badge tone="green">Validado</Badge>
            ) : (
              <Badge>Em revisão</Badge>
            )}
          </div>
          <Label label="Nome do evento *">
            <input
              value={d.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </Label>
          <div className="form-grid">
            <Label
              label="Data prevista *"
              hint={
                d.date
                  ? `Data registrada: ${d.date.split("-").reverse().join("/")}`
                  : undefined
              }
            >
              <input
                type="date"
                aria-label="Data prevista *"
                value={d.date}
                onChange={(e) => patch({ date: e.target.value })}
              />
            </Label>
            <Label label="Participantes *">
              <input
                type="number"
                min="1"
                value={d.guests || ""}
                onChange={(e) => patch({ guests: Number(e.target.value) })}
                placeholder="A confirmar"
              />
            </Label>
          </div>
          <Label label="Cidade ou local *">
            <input
              value={d.location}
              onChange={(e) => patch({ location: e.target.value })}
              placeholder="A confirmar"
            />
          </Label>
          <Label label="Investimento de referência (R$)">
            <input
              type="number"
              min="0"
              value={d.budget || ""}
              onChange={(e) => patch({ budget: Number(e.target.value) })}
              placeholder="Ainda não informado"
            />
          </Label>
          <Label label="Objetivo do evento *">
            <textarea
              rows={3}
              value={d.objective}
              onChange={(e) => patch({ objective: e.target.value })}
              placeholder="O que o cliente quer alcançar?"
            />
          </Label>
          <Label label="Perguntas para o cliente">
            <textarea
              rows={4}
              value={d.questions}
              onChange={(e) => patch({ questions: e.target.value })}
              placeholder="O que ainda precisamos saber?"
            />
          </Label>
          <p className="field-hint">
            * Campos necessários para validar. Também podem ser preenchidos sem
            IA.
          </p>
        </section>
      </div>
      <div id="briefing-escopo" className="briefing-section">
        <BriefingScope d={d} patch={patch} />
      </div>
      <ClientConversation
        d={d}
        invalidate={() => {
          setAligned(false);
          setResult(null);
        }}
        analyzeReply={organize}
      />
      <CreativePresentations d={d} />
      <section className="panel alignment-confirmation">
        <h3>Concluir o alinhamento com o cliente</h3>
        <p className="muted">
          Confirme que as dúvidas necessárias para cotar foram resolvidas. O
          alinhamento pode ter ocorrido por e-mail, WhatsApp, reunião ou
          ligação, ou o briefing inicial já pode estar completo.
        </p>
        <label className="check-label alignment-check">
          <input
            type="checkbox"
            checked={aligned}
            disabled={d.briefingValid}
            onChange={(e) => setAligned(e.target.checked)}
          />
          <span>
            Confirmo que o briefing está alinhado com o cliente e pronto para
            cotação.
          </span>
        </label>
        <Button
          variant="primary"
          icon={Check}
          disabled={!valid || !aligned || d.briefingValid}
          onClick={() => {
            updateDemand(
              d.id,
              { briefingValid: true, stage: "quotes" },
              "Alinhamento com o cliente confirmado; briefing revisado e validado pelo atendimento.",
            );
            notify("Briefing validado. Você já pode solicitar cotações.");
          }}
        >
          {d.briefingValid ? "Briefing validado" : "Validar briefing"}
        </Button>
      </section>
      <div className="bottom-actions">
        <span>
          {d.briefingValid
            ? "Tudo certo para avançar."
            : "Valide o briefing para iniciar a cotação."}
        </span>
        <Button
          variant="primary"
          icon={ArrowRight}
          disabled={!d.briefingValid}
          onClick={() => go(`/demandas/${d.id}/quotes`)}
        >
          Ir para cotações
        </Button>
      </div>
    </>
  );
}
