import { useState } from "react";
import type { Demand, DocumentKind, EventDocument } from "../types";
import { useStore, go } from "../store";
import { uid } from "../data";
import { demoPerson } from "../organization";
import { approvalFingerprint, isApproved } from "../approval-model";
import {
  documentLabels,
  documentReady,
  documentTarget,
  needsClientDecision,
  eventProject,
} from "../event-lifecycle";
import { ApprovalRequestPanel } from "../components/ApprovalRequest";
import { ClientDecisionPanel } from "../components/ClientDecision";
import { Button, Badge, Empty, Label, Note } from "../components/UI";
const hints: Record<DocumentKind, string> = {
  contract:
    "Partes, escopo da versão aprovada, valores, parcelas, datas, condições e referência da minuta. Após revisão interna, registre a evidência da assinatura do cliente.",
  supplier_contract:
    "Fornecedor, itens confirmados, valor, prazos, condições, documentação e evidência de assinatura do parceiro. Cotação escolhida não é contrato.",
  schedule:
    "Marcos de aprovação, responsáveis, datas e dependências. Inclua montagem, ensaio, execução, desmontagem e entregas de materiais.",
  material:
    "Identifique a peça, arte, roteiro ou layout; descreva a versão, prazo e alterações. A apresentação conceitual da proposta fica em Criativo.",
  extra:
    "Descreva a mudança, motivo, custo adicional, impacto no preço do cliente e no cronograma. A revisão interna não altera a proposta aceita.",
  supplier_over_budget:
    "Fornecedor, orçamento autorizado, nova cotação, diferença e justificativa. A decisão não contrata nem paga o fornecedor.",
  report:
    "Resultados, público, entregas, ocorrências, fotos (referência), feedbacks e lições aprendidas.",
  accountability:
    "Orçado, contratado, realizado, despesas, notas e comprovantes. Explique divergências e registre a validação do financeiro, atendimento e cliente.",
};
export function EventDocuments({
  d,
  kinds,
  documentId,
}: {
  d: Demand;
  kinds?: DocumentKind[];
  documentId?: string;
}) {
  const { state, setState, notify } = useStore();
  const all = (state.eventDocuments || []).filter(
    (doc) => doc.eventId === d.id,
  );
  const rows = all.filter((doc) => !kinds || kinds.includes(doc.kind));
  const [selected, setSelected] = useState(documentId || "");
  const [adding, setAdding] = useState(false),
    [kind, setKind] = useState<DocumentKind>(kinds?.[0] || "contract"),
    [title, setTitle] = useState(""),
    [content, setContent] = useState(""),
    [url, setUrl] = useState(""),
    [previous, setPrevious] = useState<EventDocument | undefined>(),
    [error, setError] = useState("");
  const current = all.find((doc) => doc.id === selected) || rows.at(-1);
  function start(doc?: EventDocument) {
    setPrevious(doc);
    setKind(doc?.kind || kinds?.[0] || "contract");
    setTitle(doc?.title || "");
    setContent(doc?.content || "");
    setUrl(doc?.url || "");
    setAdding(true);
    setError("");
  }
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Informe o título e o conteúdo que serão revisados.");
      return;
    }
    if (url.trim()) {
      try {
        if (new URL(url).protocol !== "https:") throw Error();
      } catch {
        setError("Use um endereço completo começando com https://.");
        return;
      }
    }
    const doc: EventDocument = {
      proposalVersionId: d.acceptedVersion,
      id: uid(),
      eventId: d.id,
      kind,
      title: title.trim(),
      content: content.trim(),
      url: url.trim(),
      revision: previous ? previous.revision + 1 : 1,
      previousId: previous?.id,
      createdAt: new Date().toISOString(),
      createdBy: demoPerson(state)?.id || "",
    };
    setState((s) => ({
      ...s,
      eventDocuments: [...(s.eventDocuments || []), doc],
    }));
    setSelected(doc.id);
    setAdding(false);
    notify("Versão preservada. Solicite a revisão aos responsáveis.");
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>
            {kinds?.length === 1
              ? documentLabels[kinds[0]]
              : "Documentos e aprovações"}
          </h2>
          <p>
            Cada versão conserva seu conteúdo, responsáveis e decisões.
            Alterações exigem uma nova revisão.
          </p>
        </div>
        <Button variant="primary" onClick={() => start()}>
          Novo documento
        </Button>
      </div>
      {adding && (
        <form className="panel lifecycle-form" onSubmit={save}>
          <h3>
            {previous
              ? `Nova versão de ${previous.title}`
              : "Registrar documento"}
          </h3>
          <div className="form-grid">
            <Label label="Tipo de documento">
              <select
                value={kind}
                disabled={!!previous}
                onChange={(e) => setKind(e.target.value as DocumentKind)}
              >
                {(kinds || (Object.keys(documentLabels) as DocumentKind[])).map(
                  (k) => (
                    <option key={k} value={k}>
                      {documentLabels[k]}
                    </option>
                  ),
                )}
              </select>
            </Label>
            <Label label="Título do documento">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Label>
          </div>
          <Label label="Conteúdo para revisão" hint={hints[kind]}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={7}
              required
            />
          </Label>
          <Label
            label="Link do documento (opcional)"
            hint="O link externo pode mudar. Registre abaixo no conteúdo o que esta versão contempla."
          >
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
              placeholder="https://"
            />
          </Label>
          {error && <p role="alert">{error}</p>}
          <div className="actions">
            <Button type="submit" variant="primary">
              Salvar versão do documento
            </Button>
            <Button onClick={() => setAdding(false)}>Cancelar</Button>
          </div>
        </form>
      )}
      {!rows.length && !adding && (
        <Empty
          title="Nenhum documento registrado"
          text="Cadastre a primeira versão para revisar o conteúdo, avisar os aprovadores e registrar a decisão correspondente."
          action={
            <Button onClick={() => start()}>Registrar primeira versão</Button>
          }
        />
      )}
      {!!rows.length && (
        <div className="document-workspace">
          <nav aria-label="Documentos do evento" className="document-list">
            {rows.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelected(doc.id)}
                aria-current={current?.id === doc.id ? "page" : undefined}
              >
                <strong>{doc.title}</strong>
                <span>
                  {documentLabels[doc.kind]} · v{doc.revision}
                </span>
                <Badge tone={documentReady(state, doc) ? "green" : "amber"}>
                  {documentReady(state, doc)
                    ? "Aprovado"
                    : "Revisão / decisão pendente"}
                </Badge>
              </button>
            ))}
          </nav>
          {current && (
            <article className="panel document-detail" key={current.id}>
              <div className="section-heading">
                <div>
                  <h3>{current.title}</h3>
                  <p>
                    {documentLabels[current.kind]} · versão {current.revision}
                  </p>
                </div>
                <Button onClick={() => start(current)}>
                  Criar nova versão
                </Button>
              </div>
              <p className="document-content">{current.content}</p>
              {current.url && (
                <a
                  href={current.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                >
                  Abrir documento externo
                </a>
              )}
              <ApprovalRequestPanel
                key={current.id}
                target={documentTarget(current)}
              />
              {needsClientDecision(current.kind) && (
                <ClientDecisionPanel
                  value={current.clientDecision}
                  fingerprint={approvalFingerprint(
                    state,
                    documentTarget(current),
                  )}
                  disabled={!isApproved(state, documentTarget(current))}
                  contract={current.kind === "contract"}
                  onChange={(value) => {
                    setState((s) => ({
                      ...s,
                      eventDocuments: s.eventDocuments?.map((doc) =>
                        doc.id === current.id
                          ? { ...doc, clientDecision: value }
                          : doc,
                      ),
                    }));
                    notify(
                      "Decisão do cliente registrada com evidência nesta versão.",
                    );
                  }}
                />
              )}
              {current.kind === "schedule" && eventProject(state, d.id) && (
                <Button
                  onClick={() =>
                    go(`/operacoes/${eventProject(state, d.id)!.id}`)
                  }
                >
                  Conferir tarefas e prazos no quadro
                </Button>
              )}
              {["extra", "supplier_over_budget"].includes(current.kind) && (
                <Note>
                  Esta decisão não altera a proposta aceita, não contrata e não
                  paga. Registre os desdobramentos comerciais, operacionais e
                  financeiros no mesmo evento.
                </Note>
              )}
            </article>
          )}
        </div>
      )}
    </>
  );
}
