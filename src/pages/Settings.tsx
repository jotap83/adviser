import { useState } from "react";
import {
  Plus,
  Download,
  RotateCcw,
  PlugZap,
  ShieldCheck,
  Server,
  ArrowRight,
} from "lucide-react";
import { useStore, download } from "../store";
import { uid } from "../data";
import { clearPresentationFiles } from "../attachments";
import { Title, Button, Label, Badge, Note } from "../components/UI";
export function Settings() {
  const { state, setState, notify, reset } = useStore();
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Title
        title="Equipe e IA"
        sub="Configuração da demonstração e decisões para a aplicação de produção."
      />
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Equipe de atendimento</h2>
            <p>
              Todos os núcleos compartilham a visão dos clientes e das
              propostas.
            </p>
          </div>
          <Button icon={Plus} onClick={() => setAdding(!adding)}>
            Adicionar pessoa
          </Button>
        </div>
        {adding && (
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setState((s) => ({
                ...s,
                users: [
                  ...s.users,
                  {
                    id: uid(),
                    name: String(f.get("name")),
                    email: String(f.get("email")),
                    role: "Atendimento",
                    active: true,
                  },
                ],
              }));
              setAdding(false);
              notify(
                "Pessoa adicionada à demonstração. Nenhum convite foi enviado.",
              );
            }}
          >
            <Label label="Nome">
              <input name="name" required />
            </Label>
            <Label label="E-mail fictício">
              <input name="email" type="email" required />
            </Label>
            <Button type="submit" variant="primary">
              Salvar pessoa
            </Button>
          </form>
        )}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Pessoa</th>
                <th>Perfil</th>
                <th>Acesso demonstrativo</th>
              </tr>
            </thead>
            <tbody>
              {state.users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    <small className="cell-sub">{u.email}</small>
                  </td>
                  <td>
                    <select
                      aria-label={`Perfil de ${u.name}`}
                      value={u.role}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          users: s.users.map((x) =>
                            x.id === u.id ? { ...x, role: e.target.value } : x,
                          ),
                        }))
                      }
                    >
                      <option>Atendimento</option>
                      <option>Administrador</option>
                      <option>Financeiro (futuro)</option>
                      <option>Criação (futuro)</option>
                    </select>
                  </td>
                  <td>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={u.active}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            users: s.users.map((x) =>
                              x.id === u.id
                                ? { ...x, active: e.target.checked }
                                : x,
                            ),
                          }))
                        }
                      />
                      {u.active ? "Ativo" : "Inativo"}
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="field-hint">
          Cadastros demonstrativos. Autenticação, permissões e convites reais
          serão implementados na versão de produção.
        </p>
      </section>
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
          <h2>Integrações previstas</h2>
          <div className="integration-row">
            <span className="integration-name">
              <strong>Gmail</strong>
              <small>Copiar e colar no MVP</small>
            </span>
            <Badge>Não conectado</Badge>
          </div>
          <div className="integration-row">
            <span className="integration-name">
              <strong>Conta Azul</strong>
              <small>Pacote de repasse no MVP</small>
            </span>
            <Badge>Etapa futura</Badge>
          </div>
          <div className="integration-row">
            <span className="integration-name">
              <strong>IA própria</strong>
              <small>Mesmo contrato de dados, outro adaptador</small>
            </span>
            <Badge>Opcional</Badge>
          </div>
          <p className="muted">
            Uma integração futura deve tratar autorização por conta, associação
            de conversas, anexos, reenvios e respostas de outros contatos.
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
