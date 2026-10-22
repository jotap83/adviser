import { useEffect, useRef, useState } from "react";
import {
  Mail,
  MessageCircle,
  Paperclip,
  FileText,
  ArrowRight,
} from "lucide-react";
import { AIBadge, Badge, Button, Label, Note } from "./UI";
import { readBriefingFile } from "../attachments";
import { financeDocument } from "../intelligence-model";
import { billingExample } from "../billing-example";
import { useStore } from "../store";
import "../finance-intake.css";

type Receipt = {
  origin: string;
  sender: string;
  title: string;
  text: string;
  file?: File;
  url?: string;
  detail?: string;
};
type Fields = { description: string; amount: string; due: string };
const emptyFields: Fields = { description: "", amount: "", due: "" };
function documentText(fields: Fields) {
  return `Descrição: ${fields.description.trim()}\nValor: ${fields.amount.trim()}\nVencimento: ${fields.due}`;
}

export function FinanceDocumentIntake({
  projectId,
  onReviewed,
}: {
  projectId: string;
  onReviewed: (text: string, origin: string) => void;
}) {
  const { state } = useStore();
  const [mode, setMode] = useState<"manual" | "gmail" | "whatsapp">("manual");
  const [receipt, setReceipt] = useState<Receipt>();
  const [pasted, setPasted] = useState("");
  const [fields, setFields] = useState<Fields>(emptyFields);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reading, setReading] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const fieldsHeading = useRef<HTMLHeadingElement>(null);
  const offline = state.aiMode === "offline";
  const parsed = financeDocument(documentText(fields));
  const valid =
    !!parsed.description && parsed.value !== undefined && !!parsed.due;
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  useEffect(
    () => () => {
      if (receipt?.url) URL.revokeObjectURL(receipt.url);
    },
    [receipt?.url],
  );
  function receive(next?: Receipt) {
    request.current++;
    setReceipt(next);
    setFields(emptyFields);
    setReviewed(false);
    setReading("");
    setError("");
    setBusy(false);
    onReviewed("", "");
  }
  function choose(channel: typeof mode) {
    setMode(channel);
    receive();
    if (channel !== "manual") {
      const example = billingExample(state, projectId, channel);
      if (example) receive(example);
      else
        setError(
          "Este evento ainda não tem um lançamento a pagar para o exemplo. Anexe ou cole uma cobrança para seguir manualmente.",
        );
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Use um arquivo de até 10 MB ou cole o texto da cobrança.");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (
      !["pdf", "docx", "xlsx", "txt", "png", "jpg", "jpeg", "webp"].includes(
        ext,
      )
    ) {
      setError("Escolha PDF, DOCX, XLSX, TXT, PNG, JPG ou WEBP.");
      return;
    }
    const token = ++request.current;
    setBusy(true);
    setError("");
    try {
      let text = "",
        detail = "";
      if (["png", "jpg", "jpeg", "webp"].includes(ext))
        detail =
          "Imagem disponível para conferência. OCR está previsto; transcreva os dados abaixo nesta demonstração.";
      else if (ext === "txt") {
        text = (await file.text()).slice(0, 100000);
        detail = "Texto lido localmente. Confira o conteúdo com o original.";
      } else {
        const read = await readBriefingFile(file);
        text = read.text;
        detail = read.detail;
      }
      if (token !== request.current) return;
      receive({
        origin: "Cadastro manual · arquivo anexado",
        sender: "Arquivo informado pela equipe",
        title: file.name,
        text,
        file,
        url: URL.createObjectURL(file),
        detail,
      });
    } catch {
      if (token === request.current)
        setError(
          "Não foi possível abrir o arquivo. Tente novamente ou cole o texto da cobrança.",
        );
    } finally {
      if (token === request.current) setBusy(false);
    }
  }
  function change(patch: Partial<Fields>) {
    setFields((old) => ({ ...old, ...patch }));
    setReviewed(false);
    onReviewed("", "");
  }
  function extract() {
    if (!receipt || offline) return;
    const found = financeDocument(receipt.text);
    change({
      description: found.description || "",
      amount:
        found.value === undefined
          ? ""
          : found.value.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
      due: found.due || "",
    });
    setReading(
      found.description && found.value !== undefined && found.due
        ? "Sugestões preenchidas. Confira os três campos com a mensagem ou o arquivo original."
        : "A leitura demonstrativa não reconheceu todos os campos. Complete os dados manualmente; o original está disponível acima.",
    );
    fieldsHeading.current?.focus({ preventScroll: true });
  }
  return (
    <div className="billing-intake">
      <section
        className="billing-receive"
        aria-labelledby="billing-receive-title"
        data-tour="billing-receive"
      >
        <h3 id="billing-receive-title">1. Receber ou anexar cobrança</h3>
        <p>Comece pela mensagem ou pelo documento enviado pelo fornecedor.</p>
        <div
          className="billing-sources"
          role="group"
          aria-label="Origem da cobrança"
        >
          <Button
            icon={Paperclip}
            aria-pressed={mode === "manual"}
            onClick={() => choose("manual")}
          >
            Anexar ou colar
          </Button>
          <Button
            icon={Mail}
            aria-pressed={mode === "gmail"}
            onClick={() => choose("gmail")}
          >
            Simular Gmail
          </Button>
          <Button
            icon={MessageCircle}
            aria-pressed={mode === "whatsapp"}
            onClick={() => choose("whatsapp")}
          >
            Simular WhatsApp
          </Button>
        </div>
        {mode === "manual" && !receipt && (
          <div className="billing-manual">
            <input
              className="sr-only"
              tabIndex={-1}
              ref={input}
              type="file"
              accept=".pdf,.docx,.xlsx,.txt,.png,.jpg,.jpeg,.webp"
              aria-label="Arquivo da cobrança"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                void upload(file);
              }}
            />
            <Button
              icon={Paperclip}
              busy={busy}
              onClick={() => input.current?.click()}
            >
              Anexar documento
            </Button>
            <p className="field-hint">
              PDF, DOCX, XLSX, TXT ou imagem · até 10 MB. Arquivo disponível
              nesta tela enquanto ela estiver aberta.
            </p>
            <Label
              label="Texto recebido do fornecedor"
              hint="Cole o e-mail, a mensagem ou a transcrição do documento."
            >
              <textarea
                rows={4}
                maxLength={100000}
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder="Cole aqui a cobrança recebida..."
              />
            </Label>
            <Button
              disabled={!pasted.trim() || busy}
              icon={ArrowRight}
              onClick={() =>
                receive({
                  origin: "Cadastro manual · texto colado",
                  sender: "Texto informado pela equipe",
                  title: "Cobrança recebida do fornecedor",
                  text: pasted.trim(),
                })
              }
            >
              Usar texto informado
            </Button>
          </div>
        )}
        {error && (
          <p className="note error" role="alert">
            {error}
          </p>
        )}
        {receipt && (
          <div className="billing-original" data-tour="billing-original">
            <div className="section-heading">
              <div>
                <strong>{receipt.title}</strong>
                <p>{receipt.origin}</p>
              </div>
              <Badge>
                {receipt.file
                  ? "Arquivo recebido"
                  : mode === "manual"
                    ? "Texto recebido"
                    : "Exemplo fictício"}
              </Badge>
            </div>
            <p className="field-hint">{receipt.sender}</p>
            {receipt.text && (
              <details open>
                <summary>Mensagem ou texto do documento recebido</summary>
                <pre>{receipt.text}</pre>
              </details>
            )}
            {receipt.url && receipt.file && (
              <>
                <div className="actions">
                  <a
                    className="btn secondary"
                    href={receipt.url}
                    download={receipt.file.name}
                  >
                    <FileText size={16} />
                    Baixar original
                  </a>
                  <Button
                    onClick={() => {
                      const frame = document.getElementById(
                        "billing-file-preview",
                      );
                      frame?.scrollIntoView({ block: "center" });
                    }}
                  >
                    Ver original abaixo
                  </Button>
                </div>
                {/\.(png|jpe?g|webp)$/i.test(receipt.file.name) ? (
                  <img
                    id="billing-file-preview"
                    className="billing-preview-image"
                    src={receipt.url}
                    alt={`Documento recebido: ${receipt.file.name}`}
                  />
                ) : /\.pdf$/i.test(receipt.file.name) ? (
                  <iframe
                    id="billing-file-preview"
                    className="billing-preview-pdf"
                    sandbox=""
                    title={`Original: ${receipt.file.name}`}
                    src={receipt.url}
                  />
                ) : (
                  <p id="billing-file-preview" className="field-hint">
                    Use Baixar original para abrir o arquivo no aplicativo
                    correspondente.
                  </p>
                )}
                <p className="field-hint">{receipt.detail}</p>
              </>
            )}
            {mode !== "manual" && (
              <p className="field-hint">
                Mensagem de demonstração criada ao clicar no canal. Nenhuma
                conta está conectada. O adicional fictício permite testar uma
                diferença de R$ 450.
              </p>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                setMode("manual");
                receive();
              }}
            >
              Trocar cobrança
            </Button>
          </div>
        )}
      </section>
      <section
        className="billing-review"
        aria-labelledby="billing-review-title"
        data-tour="billing-review"
      >
        <div className="section-heading">
          <h3 id="billing-review-title" ref={fieldsHeading} tabIndex={-1}>
            2. Revisar os dados da cobrança
          </h3>
          <AIBadge />
        </div>
        {!receipt ? (
          <p className="muted">
            Receba uma mensagem, anexe um documento ou informe o texto para
            continuar.
          </p>
        ) : (
          <>
            <p>
              A IA poderá sugerir os campos a partir do documento. Você também
              pode preencher tudo manualmente.
            </p>
            <Button
              onClick={extract}
              disabled={offline || !receipt.text.trim()}
            >
              Extrair dados com IA <AIBadge decorative />
            </Button>
            <p className="field-hint">
              Simulação: reconhece as linhas Descrição:, Valor: no padrão
              brasileiro e Vencimento: AAAA-MM-DD. Leitura livre e OCR dependem
              da IA de produção.
            </p>
            {offline && (
              <Note>
                IA indisponível. Consulte o original e preencha os campos
                manualmente.
              </Note>
            )}
            {reading && (
              <p role="status" className="billing-reading">
                {reading}
              </p>
            )}
            <div className="billing-fields">
              <Label label="Descrição cobrada">
                <input
                  value={fields.description}
                  onChange={(e) => change({ description: e.target.value })}
                />
              </Label>
              <Label label="Valor cobrado (R$)" hint="Ex.: 8.250,00">
                <input
                  inputMode="decimal"
                  value={fields.amount}
                  onChange={(e) => change({ amount: e.target.value })}
                />
              </Label>
              <Label label="Vencimento da cobrança">
                <input
                  type="date"
                  value={fields.due}
                  onChange={(e) => change({ due: e.target.value })}
                />
              </Label>
            </div>
            <label className="check-label">
              <input
                type="checkbox"
                disabled={!valid}
                checked={reviewed}
                onChange={(e) => {
                  setReviewed(e.target.checked);
                  onReviewed(
                    e.target.checked ? documentText(fields) : "",
                    `${receipt.origin} · ${receipt.title}`,
                  );
                }}
              />
              Conferi os dados com a mensagem ou o documento original
            </label>
            {!valid && (
              <p className="field-hint">
                Preencha descrição, valor no padrão brasileiro e uma data válida
                para confirmar a revisão.
              </p>
            )}
            {reviewed && (
              <p role="status" className="billing-reviewed">
                Dados revisados. Escolha abaixo o lançamento do mesmo evento
                para comparar.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
