import { ArrowRight } from "lucide-react";
import { Badge, Button, Note, Title } from "../components/UI";
import { go } from "../store";

const deliveries = [
  {
    title: "Atendimento",
    label: "MVP · etapa 1",
    tone: "blue",
    purpose:
      "Do primeiro contato à proposta aprovada, com o repasse organizado.",
    action: "Explorar atendimento",
    path: "/",
    rows: [
      [
        "Cadastros e equipe",
        "Clientes, fornecedores, categorias, modelos de cotação, usuários e perfis básicos.",
      ],
      [
        "Briefing e comunicação",
        "Entrada manual de e-mail, ligação e anexos PDF, DOCX e XLSX; referência da demanda e histórico de esclarecimentos.",
      ],
      [
        "IA assistiva",
        "Extrair sugestões do briefing, apontar dúvidas e preparar textos. Revisão humana e preenchimento manual sempre disponíveis.",
      ],
      [
        "Cotações e negociação",
        "Link individual para fornecedor, opções, itens opcionais, revisões, conversa e confirmação da composição.",
      ],
      [
        "Proposta e aceite",
        "Orçamento por grupo, condições, versões, PDF/Excel, registro da decisão e pacote para Operações.",
      ],
      [
        "Gestão e alertas",
        "Visão dos sócios, responsáveis, prazos, demandas paradas e retornos registrados no sistema.",
      ],
      [
        "Apoio criativo",
        "Referências, apresentação, versões e registro manual de feedback, ligados ao atendimento.",
      ],
    ],
  },
  {
    title: "Operações",
    label: "Etapa 2 · fora do MVP",
    tone: "amber",
    purpose:
      "Transformar o repasse aprovado em planejamento, produção e execução do evento.",
    action: "Abrir quadro de operações",
    path: "/operacoes",
    rows: [
      [
        "Projetos e repasse",
        "Projeto vinculado à versão aceita, briefing, fornecedores, condições e pendências.",
      ],
      [
        "Quadro de tarefas",
        "Colunas, responsáveis, prazos, prioridade, checklist, comentários e histórico.",
      ],
      [
        "Produção e criação",
        "Pré-produção, montagem, evento, desmontagem e pós-evento; tarefas da criação e aprovações.",
      ],
      [
        "Acompanhamento",
        "Pendências por evento, atrasos, bloqueios e coordenação dos fornecedores. Migração do Trello a avaliar.",
      ],
    ],
  },
  {
    title: "Financeiro próprio",
    label: "Etapa 3 · fora do MVP",
    tone: "amber",
    purpose:
      "Acompanhar o dinheiro durante o projeto e consolidar o fechamento após o evento.",
    action: "Explorar financeiro",
    path: "/financeiro",
    rows: [
      [
        "Contas a pagar e receber",
        "Parcelas, vencimentos, pagamentos diretos, comprovantes e aprovações a definir.",
      ],
      [
        "Caixa e resultado",
        "Fluxo de caixa, previsto × realizado, custos por evento, conciliação e fechamento.",
      ],
      [
        "Transição do Conta Azul",
        "Mapear o uso atual para decidir o que integrar, migrar ou substituir. A retirada depende da cobertura necessária.",
      ],
    ],
  },
];
export function ScopeOverview() {
  return (
    <>
      <Title
        title="O que entra em cada entrega"
        sub="Proposta de escopo para validar com a Adviser. Ter uma tela na demonstração não significa que ela faz parte da primeira contratação."
      />
      <Note>
        Os percentuais comerciais, a coluna “Estudo”, os campos internos da
        proposta e as regras de pagamento ainda precisam de confirmação. A IA
        real será integrada na implementação; hoje é simulada.
      </Note>
      <div className="delivery-list">
        {deliveries.map((phase) => (
          <section className="delivery-section" key={phase.title}>
            <div className="delivery-intro">
              <Badge tone={phase.tone}>{phase.label}</Badge>
              <h2>{phase.title}</h2>
              <p>{phase.purpose}</p>
              <Button icon={ArrowRight} onClick={() => go(phase.path)}>
                {phase.action}
              </Button>
            </div>
            <dl>
              {phase.rows.map(([title, desc]) => (
                <div key={title}>
                  <dt>{title}</dt>
                  <dd>{desc}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <section className="panel scope-options">
        <h2>Evoluções opcionais</h2>
        <Badge tone="gray">Fora do MVP · sem etapa fechada</Badge>
        <p>
          Importação automática do Gmail e triagem por IA, portal de
          acompanhamento do cliente e modelos de IA em infraestrutura própria.
          Serão dimensionados separadamente.
        </p>
        <Button onClick={() => go("/emails")} icon={ArrowRight}>
          Ver simulação de e-mails
        </Button>
      </section>
    </>
  );
}
