import {
  ArrowDown,
  ArrowRight,
  Phone,
  ClipboardList,
  Sparkles,
  Mail,
  FileCheck,
  Coins,
  Palette,
  Check,
  Download,
} from "lucide-react";
import { Title, Button, Badge, Note } from "../components/UI";
import { go } from "../store";
const flow = [
  {
    n: 1,
    title: "Cliente entra em contato",
    desc: "E-mail ou ligação com a Adviser.",
    owner: "Cliente → Atendimento",
    icon: Phone,
  },
  {
    n: 2,
    title: "Atendimento registra a demanda",
    desc: "Registra e-mail, ligação e anexos PDF, DOCX ou XLSX. Vincula cliente, responsável e código da demanda.",
    owner: "Atendimento",
    icon: ClipboardList,
  },
  {
    n: 3,
    title: "IA sugere o briefing e as perguntas",
    desc: "A equipe revisa os campos e completa manualmente o que faltar.",
    owner: "Atendimento + IA",
    icon: Sparkles,
  },
  {
    n: 4,
    title: "Cliente e atendimento alinham o entendimento",
    desc: "A Adviser formaliza por e-mail. O cliente responde no seu canal habitual.",
    owner: "Atendimento ↔ Cliente",
    icon: Mail,
    branch:
      "Se faltarem informações, repete-se o alinhamento. Só avança com o briefing validado.",
  },
  {
    n: 5,
    title: "Atendimento solicita cotações",
    desc: "Seleciona serviços e fornecedores. Prepara e-mails individuais com links de preenchimento.",
    owner: "Atendimento → Fornecedores",
    icon: Mail,
  },
  {
    n: 6,
    title: "Fornecedores preenchem suas propostas",
    desc: "Formulário por categoria, com opções, itens, preços, condições e anexos. O atendimento pode pedir ajustes e confirmar a composição escolhida.",
    owner: "Fornecedores → Atendimento",
    icon: ClipboardList,
  },
  {
    n: 7,
    title: "Atendimento compara e monta a proposta",
    desc: "Seleciona cotações, ajusta valores e condições. Salva uma versão e prepara PDF ou Excel.",
    owner: "Atendimento",
    icon: FileCheck,
    creative: true,
  },
  {
    n: 8,
    title: "Cliente recebe e decide",
    desc: "A proposta segue pelo canal habitual. O atendimento registra a resposta e a evidência.",
    owner: "Atendimento ↔ Cliente",
    icon: Check,
    branch:
      "Pediu ajustes? Retorna à etapa 7 e gera uma nova versão. Recusou? Encerra a demanda sem repasse. Aprovou? Segue abaixo.",
  },
  {
    n: 9,
    title: "Atendimento prepara o repasse para Operações",
    desc: "Reúne briefing, versão aprovada, aceite, fornecedores selecionados, condições e pendências.",
    owner: "Atendimento → Operações",
    icon: FileCheck,
  },
];
export function Flow() {
  return (
    <>
      <Title
        title="Do primeiro contato ao fechamento"
        sub="Atendimento → Operações → fechamento financeiro. Leia de cima para baixo; o financeiro acompanha os pagamentos durante o projeto."
        actions={
          <Button
            icon={Download}
            onClick={() =>
              window.open(
                (window as Window & { adviserDiagramUrl?: string })
                  .adviserDiagramUrl || "/fluxo.svg",
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            Abrir diagrama
          </Button>
        }
      />
      <div className="flow-legend">
        <Badge tone="blue">Atendimento · MVP</Badge>
        <Badge tone="amber">Criação · apoio à proposta</Badge>
        <Badge tone="blue">Operações · etapa 2</Badge>
        <Badge tone="green">Financeiro · etapa 3</Badge>
      </div>
      <div className="flow-diagram">
        <div className="flow-terminal start">INÍCIO</div>
        {flow.map((s) => (
          <div className="flow-unit" key={s.n}>
            <ArrowDown className="flow-arrow" size={22} />
            <div className="flow-node">
              <span className="flow-number">{s.n}</span>
              <div>
                <span className="flow-owner">{s.owner}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {s.branch && <div className="flow-branch">{s.branch}</div>}
                {s.creative && (
                  <div className="flow-creative">
                    <Palette size={18} />
                    <div>
                      <strong>Criação contribui aqui</strong>
                      <p>
                        Conceito e apresentação podem ser desenvolvidos durante
                        o briefing e antes da proposta. No MVP, apenas
                        referências e anexos.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <ArrowDown className="flow-arrow" size={22} />
        <div className="flow-terminal end">
          FIM DO MVP · aceite e repasse organizados
        </div>
        <div className="flow-future">
          <ArrowDown className="flow-arrow" size={22} />
          <h2>Evolução após o MVP</h2>
          <div className="future-flow-row">
            <span className="flow-number">10</span>
            <div>
              <Badge tone="blue">Operações · etapa 2</Badge>
              <h3>Proposta aceita vira projeto: produzir e executar</h3>
              <p>
                Receber o escopo aprovado, confirmar contratações, coordenar
                fornecedores e cronograma, produzir e executar o evento. A
                criação apoia os desdobramentos necessários.
              </p>
              <div className="flow-branch">
                Operações: nome da área e responsabilidades a confirmar com a
                Adviser.
              </div>
            </div>
          </div>
          <ArrowDown className="flow-arrow" size={22} />
          <div className="future-flow-row">
            <span className="flow-number">11</span>
            <div>
              <Badge tone="green">Financeiro · etapa 3</Badge>
              <h3>Controlar e fechar o financeiro</h3>
              <p>
                Recebimentos e pagamentos ocorrem ao longo do projeto. Depois do
                evento: conciliação, previsto × realizado e fechamento, com
                integração ao Conta Azul a validar.
              </p>
            </div>
          </div>
          <ArrowDown className="flow-arrow" size={22} />
          <div className="flow-terminal final">
            FIM DO PROCESSO COMPLETO · evento e financeiro encerrados
          </div>
        </div>
      </div>
    </>
  );
}
export function Roadmap() {
  const [tab, setTab] = useState("project");
  const [done, setDone] = useState<string[]>([]);
  const [creative, setCreative] = useState(0);
  const [paid, setPaid] = useState(false);
  return (
    <>
      <Title
        title="Depois da proposta, o projeto continua."
        sub="Visão de evolução. As interações abaixo são exemplos de etapas futuras, fora do MVP de atendimento."
      />
      <div className="roadmap-tabs" role="tablist" aria-label="Etapas futuras">
        {[
          ["project", "Operações"],
          ["creative", "Criação"],
          ["finance", "Financeiro"],
          ["integrations", "Integrações"],
        ].map(([id, label]) => (
          <button
            role="tab"
            aria-selected={tab === id}
            key={id}
            onClick={() => setTab(id)}
            className={tab === id ? "active" : ""}
          >
            {label}
          </button>
        ))}
      </div>
      <Note tone="warning">
        Funcionalidades futuras em simulação. Não geram contratos, tarefas
        reais, pagamentos nem integrações.
      </Note>
      {tab === "project" && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Encontro Horizonte · projeto ilustrativo</h2>
              <p>
                Operações receberá o briefing, a proposta aprovada e os
                fornecedores. Nome da área e responsabilidades a confirmar.
              </p>
            </div>
            <Badge tone="amber">Etapa 2</Badge>
          </div>
          <div className="future-task-list">
            {[
              "Confirmar contratos e disponibilidade",
              "Organizar cronograma de montagem",
              "Revisar plano de operação",
              "Confirmar responsáveis por área",
              "Executar o evento",
              "Registrar encerramento operacional",
            ].map((t, i) => (
              <label key={t} className="selection-row">
                <input
                  type="checkbox"
                  checked={done.includes(t)}
                  onChange={(e) =>
                    setDone(
                      e.target.checked
                        ? [...done, t]
                        : done.filter((x) => x !== t),
                    )
                  }
                />
                <span>
                  <strong>{t}</strong>
                  <small>
                    {i < 3
                      ? "Pré-produção"
                      : i < 5
                        ? "Produção e execução"
                        : "Pós-evento"}
                  </small>
                </span>
              </label>
            ))}
          </div>
          <p className="muted">
            {done.length} de 6 atividades marcadas nesta simulação.
          </p>
        </section>
      )}
      {tab === "creative" && (
        <section className="panel">
          <div className="section-heading">
            <h2>Conceito e materiais criativos</h2>
            <Badge tone="amber">Etapa 2</Badge>
          </div>
          <p>
            O trabalho criativo pode começar antes da proposta. No futuro, terá
            tarefas, versões de peças e aprovações próprias.
          </p>
          <div className="creative-demo">
            <Palette size={30} />
            <div>
              <h3>Conceito “Encontros que aproximam”</h3>
              <p>Exemplo fictício para explorar o fluxo de criação.</p>
              <Badge tone={creative === 2 ? "green" : "blue"}>
                {
                  ["Em elaboração", "Em revisão", "Aprovado na simulação"][
                    creative
                  ]
                }
              </Badge>
            </div>
            <Button
              variant="primary"
              disabled={creative === 2}
              onClick={() => setCreative((v) => v + 1)}
            >
              {creative === 0
                ? "Enviar para revisão"
                : creative === 1
                  ? "Simular aprovação"
                  : "Aprovado"}
            </Button>
          </div>
        </section>
      )}
      {tab === "finance" && (
        <section className="panel">
          <div className="section-heading">
            <h2>Previsto, realizado e conciliação</h2>
            <Badge tone="green">Etapa 3</Badge>
          </div>
          <p>
            Controle financeiro do evento conectado ao Conta Azul, conforme
            viabilidade da integração.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Lançamento fictício</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Sinal do cliente</td>
                  <td>Receber</td>
                  <td>R$ 15.000,00</td>
                  <td>
                    <Badge tone="green">Recebido</Badge>
                  </td>
                  <td>Exemplo</td>
                </tr>
                <tr>
                  <td>Reserva de espaço</td>
                  <td>Pagar</td>
                  <td>R$ 2.500,00</td>
                  <td>
                    <Badge tone={paid ? "green" : "amber"}>
                      {paid ? "Conciliado (demo)" : "Previsto"}
                    </Badge>
                  </td>
                  <td>
                    <Button disabled={paid} onClick={() => setPaid(true)}>
                      Simular conciliação
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Note>
            Pagamentos podem ocorrer antes, durante e depois do evento. O
            fechamento consolida custos, receitas e resultado final.
          </Note>
        </section>
      )}
      {tab === "integrations" && (
        <section className="panel">
          <h2>Evoluir sem amarrar a operação.</h2>
          <div className="roadmap-lines">
            <div>
              <h3>Gmail</h3>
              <p>
                Importação de mensagens e anexos, associação à demanda e fila de
                revisão para contatos ou conversas sem vínculo.
              </p>
            </div>
            <div>
              <h3>Conta Azul</h3>
              <p>
                Sincronização dos dados financeiros acordados, com conferência e
                prevenção de duplicidade.
              </p>
            </div>
            <div>
              <h3>Modelos de IA</h3>
              <p>
                Adaptadores para APIs externas ou infraestrutura própria. O
                núcleo do sistema continua funcionando manualmente.
              </p>
            </div>
            <div>
              <h3>Acompanhamento do cliente</h3>
              <p>
                Portal opcional a validar com os donos e com o compliance de
                cada cliente.
              </p>
            </div>
          </div>
        </section>
      )}
      <div className="bottom-actions">
        <span>O MVP termina no atendimento e no pacote de repasse.</span>
        <Button icon={ArrowRight} onClick={() => go("/fluxo")}>
          Ver a sequência completa
        </Button>
      </div>
    </>
  );
}
import { useState } from "react";
