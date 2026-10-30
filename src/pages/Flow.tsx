import { ArrowRight, Bell } from "lucide-react";
import { AIBadge, Title, Button, Badge, Note } from "../components/UI";
import { useStore, go } from "../store";
import { withLifecycleExample, LIFECYCLE_EVENT } from "../lifecycle-example";
const flow = [
  [
    "Entrada e oportunidade",
    "Prospecção, indicação, cliente recorrente, contrato em andamento ou pedido espontâneo. A mensagem é classificada, o cliente é identificado e a equipe cria um evento ou confirma o vínculo com um existente.",
    "Atendimento / comercial",
    "overview",
    "Classificação e associação sugeridas pela IA, com confirmação humana.",
  ],
  [
    "Briefing e validação",
    "Mensagens e anexos viram informações estruturadas. Pendências retornam ao cliente. Cliente, gerente e diretoria de atendimento validam o entendimento antes de orçar.",
    "Atendimento e cliente",
    "briefing",
    "Extração com fontes, perguntas pendentes, resumo e rascunho de resposta.",
  ],
  [
    "Elaboração da proposta",
    "Cotações, comparação, negociação com fornecedores, orçamento e apresentação criativa compõem a proposta. Conceito e apresentação ficam separados do levantamento inicial do briefing.",
    "Atendimento, fornecedores e criação",
    "proposal",
    "Comparação de alternativas, leitura das condições e revisão de conteúdo.",
  ],
  [
    "Revisão, apresentação e negociação",
    "Gerência, diretoria e/ou sócios revisam conteúdo e margem. O cliente recebe a planilha e a apresentação, pede ajustes ou aceita uma versão. Alterações preservam o histórico.",
    "Aprovadores internos e cliente",
    "approval",
    "Análise do impacto das mudanças, sem modificar valores ou aceite automaticamente.",
  ],
  [
    "Contratos e fechamento",
    "Analisar os contratos de cliente e fornecedores, revisar condições e registrar evidências de assinatura. Proposta aceita e contrato liberam o repasse para execução no mesmo evento.",
    "Sócios, atendimento e contratantes",
    "contracts",
    "A aprovação de uma cotação não confirma contratação.",
  ],
  [
    "Produção e execução",
    "Visitas técnicas podem ocorrer antes do fechamento. Depois: cronograma, contratação, materiais, logística, montagem, execução e desmontagem. Cada tarefa tem responsável e prazo.",
    "Atendimento / produção, criação e fornecedores",
    "production",
    "Sugestões de tarefas e checklists, aplicadas somente após revisão.",
  ],
  [
    "Pós-evento e continuidade",
    "Relatório de resultados, feedbacks, pesquisa de satisfação, prestação de contas e próximo contato comercial. Encerramento depende da conferência das pendências.",
    "Atendimento, financeiro e cliente",
    "post",
    "Resumo do histórico e apoio à consolidação de informações.",
  ],
];
export function Flow() {
  const { setState } = useStore();
  const open = (tab: string) => {
    setState((s) => withLifecycleExample(s));
    go(`/eventos/${LIFECYCLE_EVENT}/${tab}`);
  };
  return (
    <>
      <Title
        title="Ciclo completo do evento"
        sub="Uma referência desde o nascimento do pedido até a entrega e a prestação de contas. O financeiro acompanha o evento ao longo do ciclo."
        actions={
          <Button variant="primary" onClick={() => open("overview")}>
            Navegar pelo exemplo completo
          </Button>
        }
      />
      <Note>
        Evento é o projeto completo. Solicitações são os pedidos e alterações
        vinculados a ele. Operações é a visão transversal das tarefas de todos
        os eventos.
      </Note>
      <div className="flow-diagram">
        {flow.map(([title, desc, owner, tab, ai], i) => (
          <section className="flow-node" key={title}>
            <span className="flow-number">{i + 1}</span>
            <div>
              <h2>{title}</h2>
              <p>{desc}</p>
              <p>
                <strong>Responsáveis:</strong> {owner}
              </p>
              <p className="ai-feature-note">
                {i !== 4 && <AIBadge />} {ai}
              </p>
              <Button icon={ArrowRight} onClick={() => open(tab)}>
                Abrir esta fase no exemplo
              </Button>
            </div>
          </section>
        ))}
      </div>
      <section className="panel lifecycle-section">
        <h2>Financeiro durante todo o ciclo</h2>
        <p>
          Orçamento previsto, compromissos de contratos e fornecedores, parcelas
          a receber, notas e comprovantes, aprovação dos pagamentos, conciliação
          manual e fechamento. Recebido menos pago é saldo de caixa, não lucro.
        </p>
        <p>
          O Conta Azul pode ser mantido e integrado. A decisão sobre integração
          ou substituição continua aberta.
        </p>
        <Button onClick={() => open("finance")}>
          Abrir financeiro do evento
        </Button>
      </section>
      <section className="panel">
        <h2>Aprovações com aviso e evidência</h2>
        <p>
          Briefing, proposta, apresentação, contrato, cronograma, materiais,
          extras, fornecedor acima do orçamento, pagamentos, relatório e
          prestação de contas têm revisão própria. Cada responsável recebe um
          aviso interno; o solicitante acompanha o resultado. Cliente e
          fornecedor permanecem nos canais habituais.
        </p>
        <Button icon={Bell} onClick={() => go("/aprovacoes/todas")}>
          Abrir central de aprovações
        </Button>
      </section>
      <div className="flow-legend">
        <Badge tone="blue">Atendimento · etapa 1</Badge>
        <Badge tone="amber">Operações · etapa 2</Badge>
        <Badge tone="green">Financeiro · etapa 3</Badge>
      </div>
      <p className="field-hint">
        A navegação demonstra o ciclo completo. As etapas comerciais continuam
        separadas. IA, comunicação e decisões deste protótipo usam dados
        fictícios e estado local.
      </p>
    </>
  );
}
