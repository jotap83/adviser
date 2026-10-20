import { useEffect, useState } from "react";
import {
  Presentation as PresentationIcon,
  ExternalLink,
  FileText,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  MessageSquare,
  Send,
} from "lucide-react";
import type { Demand, Presentation } from "../types";
import { useStore } from "../store";
import { getPresentationFile, savePresentationFile } from "../attachments";
import { Badge, Button, Label, Note } from "./UI";

const statusText = {
  draft: "Rascunho",
  sent: "Aguardando feedback",
  changes: "Ajustes solicitados",
  approved: "Aprovada pelo cliente",
};
export function CreativePresentations({ d }: { d: Demand }) {
  const { updateDemand, notify } = useStore();
  const versions = d.presentations || [];
  const [selected, setSelected] = useState(versions.at(-1)?.id || "");
  const current = versions.find((v) => v.id === selected) || versions.at(-1);
  const [form, setForm] = useState(false);
  const [title, setTitle] = useState("Conexões que ficam");
  const [concept, setConcept] = useState(d.creative);
  const [changes, setChanges] = useState("");
  const [source, setSource] = useState<Presentation["source"]>("link");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [slide, setSlide] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [by, setBy] = useState("");
  useEffect(() => {
    setSlide(0);
    setFeedback("");
    setBy("");
    setPreview("");
    setPreviewError("");
    let disposed = false;
    let objectUrl = "";
    if (current?.source === "file")
      getPresentationFile(current.id)
        .then((blob) => {
          if (disposed) return;
          if (!blob) {
            setPreviewError(
              "Arquivo não encontrado neste navegador. Abra a demonstração no navegador em que ele foi adicionado ou registre uma nova versão.",
            );
            return;
          }
          objectUrl = URL.createObjectURL(blob);
          setPreview(objectUrl);
        })
        .catch((e) => !disposed && setPreviewError(e.message));
    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [current?.id]);
  async function save() {
    if (!title.trim()) {
      setError("Dê um título à apresentação.");
      return;
    }
    if (source === "link") {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:") throw new Error();
      } catch {
        setError("Cole um link completo que comece com https://.");
        return;
      }
    }
    if (source === "file" && !file) {
      setError("Selecione o arquivo da apresentação.");
      return;
    }
    if (
      file &&
      source === "file" &&
      (file.size > 10 * 1024 * 1024 ||
        !/\.(pdf|pptx|png|jpe?g)$/i.test(file.name))
    ) {
      setError("Use PDF, PPTX, PNG ou JPG com até 10 MB.");
      return;
    }
    setSaving(true);
    setError("");
    const version: Presentation = {
      id: crypto.randomUUID(),
      number: (versions.at(-1)?.number || 0) + 1,
      title: title.trim(),
      concept: concept.trim(),
      changes: changes.trim(),
      source,
      url: source === "link" ? url.trim() : undefined,
      fileName: source === "file" ? file!.name : undefined,
      fileType: source === "file" ? file!.type : undefined,
      at: new Date().toISOString(),
      status: "draft",
    };
    try {
      if (source === "file") await savePresentationFile(version.id, file!);
      updateDemand(
        d.id,
        (cur) => ({
          ...cur,
          presentations: [...(cur.presentations || []), version],
        }),
        `Apresentação criativa v${version.number} registrada.`,
      );
      setSelected(version.id);
      setForm(false);
      setChanges("");
      setFile(null);
      notify("Nova versão criada. A versão anterior permanece no histórico.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  function patch(p: Partial<Presentation>, log: string) {
    if (!current) return;
    updateDemand(
      d.id,
      (cur) => ({
        ...cur,
        presentations: (cur.presentations || []).map((v) =>
          v.id === current.id ? { ...v, ...p } : v,
        ),
      }),
      log,
    );
  }
  return (
    <section id="briefing-criacao" className="briefing-section">
      <div className="section-heading">
        <div>
          <h2>Apresentação criativa</h2>
          <p>Conceito, versões e feedback no mesmo dossiê do evento.</p>
        </div>
        <Button
          icon={Plus}
          onClick={() => {
            setForm(!form);
            setError("");
            setTitle(current?.title || "Conexões que ficam");
            setConcept(current?.concept || d.creative);
          }}
        >
          Nova versão
        </Button>
      </div>
      {!current && !form && (
        <div className="panel creative-empty">
          <PresentationIcon size={32} />
          <div>
            <h3>Da ideia ao material apresentado</h3>
            <p>
              Vincule o Google Slides ou guarde um PDF, PPTX ou imagem para
              consultar junto do briefing.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setSource("demo");
              setTitle("Conexões que ficam");
              setConcept(
                "Celebrar as conquistas e criar encontros entre equipes. Uma direção criativa fictícia, com acolhimento, histórias compartilhadas e música brasileira.",
              );
              setForm(true);
            }}
          >
            Experimentar apresentação fictícia
          </Button>
        </div>
      )}
      {form && (
        <section className="panel presentation-form">
          <h3>Preparar versão {versions.length + 1}</h3>
          <div className="form-grid">
            <Label label="Título da apresentação">
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Label>
            <Label label="Origem da apresentação">
              <select
                value={source}
                onChange={(e) =>
                  setSource(e.target.value as Presentation["source"])
                }
              >
                <option value="link">
                  Link do Google Slides ou outro serviço
                </option>
                <option value="file">Arquivo PDF, PPTX ou imagem</option>
                <option value="demo">
                  Apresentação fictícia da demonstração
                </option>
              </select>
            </Label>
          </div>
          {source === "link" && (
            <Label
              label="Link da apresentação"
              hint="O link é aberto no serviço original, respeitando as permissões de acesso. Links podem mudar; use um PDF para preservar exatamente o material enviado."
            >
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/presentation/d/..."
              />
            </Label>
          )}
          {source === "file" && (
            <Label
              label="Arquivo da apresentação"
              hint="Até 10 MB. Guardado apenas neste navegador. Prévia de PDF e imagem; PPTX disponível para download."
            >
              <input
                type="file"
                accept=".pdf,.pptx,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </Label>
          )}
          <Label label="Conceito e direcionamento">
            <textarea
              rows={3}
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
            />
          </Label>
          <Label label="O que muda nesta versão">
            <textarea
              rows={2}
              value={changes}
              onChange={(e) => setChanges(e.target.value)}
              placeholder="Ex.: alternativa de ambientação e revisão da área de convivência."
            />
          </Label>
          {error && (
            <p className="note error" role="alert">
              {error}
            </p>
          )}
          <div className="actions">
            <Button variant="primary" busy={saving} onClick={save}>
              Salvar nova versão
            </Button>
            <Button onClick={() => setForm(false)}>Cancelar</Button>
          </div>
        </section>
      )}
      {current && (
        <div className="panel creative-workspace">
          <div
            className="presentation-versions"
            aria-label="Versões da apresentação"
          >
            {versions.map((v) => (
              <button
                key={v.id}
                className={current.id === v.id ? "active" : ""}
                aria-pressed={current.id === v.id}
                onClick={() => setSelected(v.id)}
              >
                Versão {v.number}
                <small>{statusText[v.status]}</small>
              </button>
            ))}
          </div>
          <div className="creative-layout">
            <div className="creative-preview">
              <div className="section-heading">
                <div>
                  <h3>{current.title}</h3>
                  <small className="muted">
                    Versão {current.number} ·{" "}
                    {new Date(current.at).toLocaleDateString("pt-BR")}
                    {current.id !== versions.at(-1)?.id
                      ? " · versão anterior"
                      : " · versão mais recente"}
                  </small>
                </div>
                <Badge
                  tone={
                    current.status === "approved"
                      ? "green"
                      : current.status === "changes"
                        ? "amber"
                        : "blue"
                  }
                >
                  {statusText[current.status]}
                </Badge>
              </div>
              {current.source === "demo" ? (
                <>
                  <div
                    className={`creative-slide slide-${slide}`}
                    aria-label={`Slide ${slide + 1} de 3`}
                  >
                    {slide === 0 ? (
                      <>
                        <h3>{current.title}</h3>
                        <p>
                          {current.concept ||
                            "Uma celebração das conexões entre as equipes."}
                        </p>
                        <span className="slide-signature">
                          Adviser · {d.title} · Exemplo fictício
                        </span>
                      </>
                    ) : slide === 1 ? (
                      <>
                        <h3>Uma experiência em três momentos.</h3>
                        <ol>
                          <li>
                            <strong>Chegar e se conectar</strong>
                            <span>
                              Recepção acolhedora e encontros entre equipes.
                            </span>
                          </li>
                          <li>
                            <strong>Celebrar as histórias</strong>
                            <span>
                              Conquistas do ano e reconhecimento coletivo.
                            </span>
                          </li>
                          <li>
                            <strong>Compartilhar o próximo capítulo</strong>
                            <span>Convivência, jantar e música.</span>
                          </li>
                        </ol>
                      </>
                    ) : (
                      <>
                        <h3>O que precisa ser validado.</h3>
                        <p>
                          Direção visual, ambientação e adequação ao
                          investimento disponível.
                        </p>
                        <ul>
                          <li>Conceito sujeito à aprovação do cliente.</li>
                          <li>Peças e produção dependem de cotação.</li>
                          <li>
                            {current.changes ||
                              "Primeira apresentação para discussão."}
                          </li>
                        </ul>
                      </>
                    )}
                  </div>
                  <div className="slide-controls">
                    <Button
                      icon={ChevronLeft}
                      disabled={slide === 0}
                      onClick={() => setSlide(slide - 1)}
                    >
                      Anterior
                    </Button>
                    <span>{slide + 1} / 3</span>
                    <Button
                      icon={ChevronRight}
                      disabled={slide === 2}
                      onClick={() => setSlide(slide + 1)}
                    >
                      Próximo
                    </Button>
                  </div>
                </>
              ) : current.source === "link" ? (
                <div className="linked-presentation">
                  <PresentationIcon size={34} />
                  <h4>Apresentação no serviço original</h4>
                  <p>
                    {current.concept ||
                      "Abra o material para conferir a direção criativa."}
                  </p>
                  <a
                    className="btn primary"
                    href={current.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={16} />
                    Abrir apresentação
                  </a>
                  <small>
                    O conteúdo do link pode ser atualizado fora do sistema.
                  </small>
                </div>
              ) : (
                <>
                  {previewError ? (
                    <Note tone="error">{previewError}</Note>
                  ) : preview ? (
                    /\.(png|jpe?g)$/i.test(current.fileName || "") ? (
                      <img
                        className="presentation-image"
                        src={preview}
                        alt={current.title}
                      />
                    ) : /\.pdf$/i.test(current.fileName || "") ? (
                      <iframe
                        className="presentation-pdf"
                        src={preview}
                        title={`Prévia de ${current.fileName}`}
                      />
                    ) : (
                      <div className="linked-presentation">
                        <FileText size={32} />
                        <h4>{current.fileName}</h4>
                        <p>Baixe o PPTX para abrir a apresentação.</p>
                      </div>
                    )
                  ) : (
                    <p role="status">Carregando arquivo…</p>
                  )}
                  {preview && (
                    <a
                      href={preview}
                      download={current.fileName}
                      className="btn"
                    >
                      <FileText size={16} />
                      Baixar {current.fileName}
                    </a>
                  )}
                </>
              )}
            </div>
            <aside className="creative-review">
              <h3>Revisão desta versão</h3>
              <p>{current.concept || "Conceito ainda não descrito."}</p>
              {current.changes && (
                <>
                  <h4>O que mudou</h4>
                  <p>{current.changes}</p>
                </>
              )}
              {current.status === "draft" && (
                <>
                  <Note>
                    Compartilhe o material pelo canal habitual do cliente e
                    registre o envio.
                  </Note>
                  <Button
                    icon={Send}
                    onClick={() => {
                      patch(
                        { status: "sent", sentAt: new Date().toISOString() },
                        `Envio da apresentação v${current.number} registrado manualmente.`,
                      );
                      notify(
                        "Envio registrado. O protótipo não envia e-mails ou arquivos.",
                      );
                    }}
                  >
                    Registrar envio da apresentação
                  </Button>
                </>
              )}
              {current.sentAt && (
                <p className="field-hint">
                  Envio registrado em{" "}
                  {new Date(current.sentAt).toLocaleString("pt-BR")}
                </p>
              )}
              {current.status === "sent" && (
                <>
                  <h4>Registrar feedback do cliente</h4>
                  <Label label="Responsável pelo feedback">
                    <input
                      value={by}
                      onChange={(e) => setBy(e.target.value)}
                      placeholder="Nome ou e-mail de quem respondeu"
                    />
                  </Label>
                  <Label label="Feedback e evidência do retorno">
                    <textarea
                      rows={5}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Cole a resposta ou registre os ajustes e a referência da conversa."
                    />
                  </Label>
                  <div className="actions">
                    <Button
                      icon={MessageSquare}
                      disabled={!feedback.trim() || !by.trim()}
                      onClick={() =>
                        patch(
                          {
                            status: "changes",
                            feedback: feedback.trim(),
                            feedbackBy: by.trim(),
                            feedbackAt: new Date().toISOString(),
                          },
                          `Ajustes solicitados na apresentação v${current.number}.`,
                        )
                      }
                    >
                      Registrar ajustes
                    </Button>
                    <Button
                      variant="primary"
                      icon={Check}
                      disabled={!feedback.trim() || !by.trim()}
                      onClick={() =>
                        patch(
                          {
                            status: "approved",
                            feedback: feedback.trim(),
                            feedbackBy: by.trim(),
                            feedbackAt: new Date().toISOString(),
                          },
                          `Aprovação criativa da v${current.number} registrada manualmente com evidência.`,
                        )
                      }
                    >
                      Registrar aprovação
                    </Button>
                  </div>
                </>
              )}
              {current.feedback && (
                <div className="creative-feedback">
                  <Badge
                    tone={current.status === "approved" ? "green" : "amber"}
                  >
                    {statusText[current.status]}
                  </Badge>
                  <p className="message-body">{current.feedback}</p>
                  <small>
                    {current.feedbackBy} ·{" "}
                    {new Date(current.feedbackAt!).toLocaleString("pt-BR")}
                  </small>
                  {current.status === "changes" && (
                    <Button
                      onClick={() => {
                        setTitle(current.title);
                        setConcept(current.concept);
                        setChanges("");
                        setForm(true);
                        setSource(current.source);
                        setUrl(current.url || "");
                      }}
                    >
                      Preparar próxima versão
                    </Button>
                  )}
                </div>
              )}
              <p className="field-hint">
                Aprovação criativa é registrada pelo atendimento. Não aprova a
                proposta comercial nem contrata fornecedores.
              </p>
            </aside>
          </div>
        </div>
      )}
      {!current && d.creative && (
        <div className="panel">
          <h3>Referência já registrada</h3>
          <p className="message-body">{d.creative}</p>
        </div>
      )}
    </section>
  );
}
