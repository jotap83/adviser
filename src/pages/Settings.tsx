import { useState } from "react";
import { Download, RotateCcw, PlugZap, ShieldCheck } from "lucide-react";
import { useStore, download } from "../store";
import { clearPresentationFiles } from "../attachments";
import { Title, Button, Label, Badge, Note } from "../components/UI";
import { TeamManagement } from "../components/TeamManagement";
export function Settings({ initialTab }: { initialTab?: string }) {
  const { state, setState, notify, reset } = useStore();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Title
        title="Equipe e IA"
        sub="Configuração da demonstração e decisões para a aplicação de produção."
      />
      <TeamManagement initialTab={initialTab} />
      <div className="briefing-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>Assistente de briefing</h2>
            <PlugZap size={20} />
          </div>
          <Label label="Comportamento da simulação">
            <select
              value={state.aiMode}
              onChange={(e) => {
                setState((s) => ({
                  ...s,
                  aiMode: e.target.value as "available" | "offline",
                }));
                notify("Comportamento da IA alterado para a próxima análise.");
              }}
            >
              <option value="available">IA disponível (simulada)</option>
              <option value="offline">
                IA indisponível — testar caminho manual
              </option>
            </select>
          </Label>
          <Label
            label="Provedor planejado"
            hint="Esta escolha documenta a intenção. Nenhum provedor é chamado neste protótipo."
          >
            <select
              value={state.provider}
              onChange={(e) =>
                setState((s) => ({ ...s, provider: e.target.value }))
              }
            >
              {[
                "Simulador",
                "OpenAI",
                "Anthropic / Claude",
                "Google / Gemini",
                "Mistral",
                "Modelo em infraestrutura própria",
              ].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Label>
          <Note>
            Na produção, o adaptador de IA fica no servidor. As telas, os dados
            e o preenchimento manual continuam independentes do fornecedor do
            modelo.
          </Note>
        </section>
        <section className="panel">
          <h2>Canais do atendimento</h2>
          <div className="integration-row">
            <span className="integration-name">
              <strong>Cadastro direto</strong>
              <small>
                Cadastros, briefing, anexos e retornos preenchidos na
                plataforma, com ou sem IA
              </small>
            </span>
            <Badge tone="green">Disponível na prévia</Badge>
          </div>
          <div className="integration-row">
            <span className="integration-name">
              <strong>Gmail</strong>
              <small>Receber e enviar e-mails, anexos e triagem com IA</small>
            </span>
            <Badge tone="blue">MVP · não conectado</Badge>
          </div>
          <div className="integration-row">
            <span className="integration-name">
              <strong>WhatsApp</strong>
              <small>
                Um número empresarial compartilhado · mensagens, anexos e
                revisão humana
              </small>
            </span>
            <Badge tone="blue">MVP · não conectado</Badge>
          </div>
          <div className="integration-row">
            <span className="integration-name">
              <strong>Conta Azul</strong>
              <small>
                Integração ou migração para financeiro próprio a validar
              </small>
            </span>
            <Badge tone="amber">Etapa 3</Badge>
          </div>
          <div className="integration-row">
            <span className="integration-name">
              <strong>IA própria</strong>
              <small>Mesmo contrato de dados, outro adaptador</small>
            </span>
            <Badge tone="amber">Fora do MVP</Badge>
          </div>
          <p className="muted">
            A central reúne os canais no mesmo atendimento. No WhatsApp, o
            protótipo demonstra a janela de 24h e um modelo fictício para
            retomar conversas. Quantidade de números e uso simultâneo do
            aplicativo serão validados com a Adviser.
          </p>
          <p className="muted">
            As integrações do MVP serão feitas com as contas da Adviser. Incluem
            associação de conversas, anexos, confirmação de vínculos, revisão
            das respostas e tratamento de falhas. Áudios, grupos e histórico a
            importar ainda precisam de definição.
          </p>
        </section>
      </div>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Dados da demonstração</h2>
            <p>
              As alterações ficam no armazenamento deste navegador. Não há dados
              compartilhados entre dispositivos.
            </p>
          </div>
          <ShieldCheck size={21} />
        </div>
        <p className="field-hint">
          A exportação inclui os registros e os textos dos briefings. Os
          arquivos originais das apresentações devem ser baixados separadamente
          na área de criação.
        </p>
        <div className="actions">
          <Button
            icon={Download}
            onClick={() =>
              download(
                "adviser-demonstracao.json",
                JSON.stringify(state, null, 2),
                "application/json",
              )
            }
          >
            Exportar meus dados de teste
          </Button>
          <Button icon={RotateCcw} onClick={() => setConfirm(!confirm)}>
            Reiniciar demonstração
          </Button>
        </div>
        {confirm && (
          <div className="reset-confirm">
            <p>
              Apagar suas alterações locais e recuperar os exemplos fictícios?
            </p>
            <Button
              variant="danger"
              onClick={async () => {
                try {
                  await clearPresentationFiles();
                  reset();
                  setConfirm(false);
                } catch (error) {
                  notify((error as Error).message);
                }
              }}
            >
              Sim, reiniciar os exemplos
            </Button>
            <Button onClick={() => setConfirm(false)}>Cancelar</Button>
          </div>
        )}
      </section>
    </>
  );
}
