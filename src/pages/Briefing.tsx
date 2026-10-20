import { useState } from "react";
import {
  Sparkles,
  Check,
  Copy,
  Mail,
  ArrowRight,
  Paperclip,
  AlertCircle,
} from "lucide-react";
import type { Demand, AIResult } from "../types";
import { useStore, go, copy } from "../store";
import { DemoBriefingAI } from "../ai";
import { Button, Label, Note, Badge, SaveMark } from "../components/UI";
import { BriefingScope } from "../components/BriefingScope";
export function Briefing({ d }: { d: Demand }) {
  const { state, updateDemand, notify } = useStore();
  const [result, setResult] = useState<AIResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [aligned, setAligned] = useState(d.briefingValid);
  const patch = (p: Partial<Demand>) => {
    setAligned(false);
    updateDemand(d.id, { ...p, briefingValid: false });
  };
  async function organize() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(
        await new DemoBriefingAI(state.aiMode === "offline").organize(
          d.message,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function apply() {
    if (!result) return;
    patch({
      title: result.title || d.title,
      date: result.date || d.date,
      guests: result.guests || d.guests,
      budget: result.budget || d.budget,
      location: result.location || d.location,
      objective: result.objective || d.objective,
      questions: result.questions.join("\n"),
    });
    setResult(null);
    notify(
      "Sugestões aplicadas. Confira os campos antes de validar o briefing.",
    );
  }
  const client = state.clients.find((c) => c.id === d.clientId);
  const email = `Olá, ${client?.contact.split(" ")[0] || "tudo bem"}!\n\nPelo que entendemos, vamos organizar ${d.title}, para ${d.guests || "[público a confirmar]"} pessoas${d.date ? ` em ${d.date.split("-").reverse().join("/")}` : ""}${d.location ? `, em ${d.location}` : ""}.\n\nObjetivo: ${d.objective || "[objetivo a confirmar]"}\n\nPrecisamos confirmar:\n${d.questions || "• Data e horários\n• Escopo dos serviços\n• Restrições e condições de contratação"}\n\nPode nos confirmar esses pontos?\n\nObrigada,\n${d.owner} · Adviser`;
  const valid = Boolean(
    d.title.trim() &&
    d.date &&
    d.guests > 0 &&
    d.location.trim() &&
    d.objective.trim(),
  );
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Primeiro, entender o evento.</h2>
          <p>Traga a conversa para cá. Revise o entendimento antes de cotar.</p>
        </div>
        <SaveMark />
      </div>
      <div className="briefing-grid">
        <section className="panel">
          <div className="section-heading">
            <h3>Contato do cliente</h3>
            <Badge tone="blue">Entrada manual</Badge>
          </div>
          <Label label="Origem do contato">
            <select
              value={d.source}
              onChange={(e) => patch({ source: e.target.value })}
            >
              <option>E-mail</option>
              <option>Ligação</option>
              <option>Outro</option>
            </select>
          </Label>
          <Label
            label={
              d.source === "Ligação"
                ? "Anotações da ligação"
                : "Cole a mensagem recebida"
            }
            hint="O Gmail não está conectado nesta versão."
          >
            <textarea
              className="email-text"
              value={d.message}
              onChange={(e) => patch({ message: e.target.value })}
              placeholder="Cole o e-mail ou descreva o que o cliente pediu..."
            />
          </Label>
          <div className="split-actions">
            <Button
              variant="primary"
              icon={Sparkles}
              busy={busy}
              onClick={organize}
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
            <div className="ai-review">
              <div className="section-heading">
                <h3>Entendimento sugerido</h3>
                <Badge tone="blue">Revisão humana</Badge>
              </div>
              <dl className="detail-list">
                <dt>Evento</dt>
                <dd>{result.title || "Não identificado"}</dd>
                <dt>Público</dt>
                <dd>
                  {result.guests
                    ? `${result.guests} pessoas`
                    : "Não identificado"}
                </dd>
                <dt>Data</dt>
                <dd>
                  {result.date
                    ? result.date.split("-").reverse().join("/")
                    : "Não identificada"}
                </dd>
                <dt>Local</dt>
                <dd>{result.location || "Não identificado"}</dd>
              </dl>
              <h4>Pontos para confirmar</h4>
              <ul className="plain-list">
                {result.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
              <p className="muted">
                A demonstração identifica padrões simples do texto. Não
                substitui uma análise por IA real.
              </p>
              <div className="actions">
                <Button variant="primary" icon={Check} onClick={apply}>
                  Aplicar e revisar nos campos
                </Button>
                <Button variant="ghost" onClick={() => setResult(null)}>
                  Descartar
                </Button>
              </div>
            </div>
          )}
        </section>
        <section className="panel">
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
      <BriefingScope d={d} patch={patch} />
      <div className="briefing-grid secondary-grid">
        <section className="panel">
          <div className="section-heading">
            <h3>Devolver o entendimento ao cliente</h3>
            <Mail size={18} />
          </div>
          <p className="muted">Revise o texto, copie e envie pelo Gmail.</p>
          <textarea
            aria-label="Texto sugerido de formalização"
            className="email-draft"
            value={reply || email}
            onChange={(e) => setReply(e.target.value)}
          />
          <Button
            icon={Copy}
            onClick={async () =>
              notify(
                (await copy(reply || email))
                  ? "Texto copiado. Revise e envie pelo Gmail."
                  : "A cópia automática não ficou disponível. Selecione o texto e copie manualmente.",
              )
            }
          >
            Copiar texto
          </Button>
          <div className="divider" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const text = String(f.get("reply")).trim();
              if (!text) return;
              updateDemand(
                d.id,
                { briefingLog: [...d.briefingLog, text], briefingValid: false },
                "Resposta do cliente registrada manualmente.",
              );
              e.currentTarget.reset();
              setAligned(false);
              notify(
                "Resposta registrada. Atualize os campos do briefing com os pontos confirmados.",
              );
            }}
          >
            <Label label="Registrar retorno do cliente">
              <textarea
                name="reply"
                required
                rows={3}
                placeholder="Cole aqui a resposta recebida ou anote o retorno da ligação."
              />
            </Label>
            <Button type="submit">Salvar retorno</Button>
          </form>
          {d.briefingLog.map((r, i) => (
            <div className="reply-log" key={i}>
              <strong>Retorno {i + 1}</strong>
              <p>{r}</p>
            </div>
          ))}
        </section>
        <section className="panel creative-block">
          <div className="section-heading">
            <h3>Referências de criação</h3>
            <Badge tone="amber">Apoio ao briefing</Badge>
          </div>
          <p className="muted">
            O conceito criativo pode ser elaborado antes da proposta. No MVP,
            registramos apenas a referência.
          </p>
          <Label label="Conceito, observações ou link da apresentação">
            <textarea
              rows={5}
              value={d.creative}
              onChange={(e) => updateDemand(d.id, { creative: e.target.value })}
              placeholder="Ex.: direção criativa a desenvolver e referência da apresentação no Google Slides."
            />
          </Label>
          <label className="upload-control">
            <Paperclip size={16} /> Anexar referência fictícia
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.pptx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  updateDemand(d.id, {
                    creative: `${d.creative}\nAnexo demonstrativo: ${f.name}`,
                  });
                  notify(
                    "Nome do arquivo registrado. O protótipo não armazena o conteúdo do anexo.",
                  );
                }
              }}
            />
          </label>
          <Note>
            Gestão de tarefas, peças e aprovações da criação fica para a etapa
            2.
          </Note>
        </section>
      </div>
      <section className="panel alignment-confirmation">
        <h3>Concluir o alinhamento com o cliente</h3>
        <p className="muted">
          Confirme que as dúvidas necessárias para cotar foram resolvidas. O
          alinhamento pode ter ocorrido por e-mail ou ligação, ou o briefing
          inicial já pode estar completo.
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
