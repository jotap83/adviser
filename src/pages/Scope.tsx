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
        "Cadastro direto completo, Gmail e WhatsApp na mesma central; mensagens, ligações, reuniões e anexos PDF, DOCX e XLSX no histórico da demanda. Todos os campos podem ser preenchidos sem IA.",
      ],
      [
        "Gmail e WhatsApp integrados com IA",
        "Recebimento de mensagens e anexos, associação por código ou conversa e sugestões de vínculo por conteúdo. Casos ambíguos ficam para confirmação da equipe; respostas são revisadas antes do envio pelo sistema.",
      ],
      [
        "IA assistiva",
        "Interpretar mensagens e anexos, resumir a conversa, sugerir campos do briefing, apontar dúvidas e preparar respostas. Revisão humana antes de aplicar dados ou enviar mensagens.",
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
        "Visão dos sócios, responsáveis, prazos, demandas paradas, novas mensagens, retornos dos fornecedores e associações pendentes de confirmação.",
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
        real, Gmail e WhatsApp fazem parte do MVP a implementar. Hoje a IA e a
        comunicação por Gmail e WhatsApp são simuladas; nenhuma conta está
        conectada.
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
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Comunicação integrada no MVP</h2>
            <p>
              O cliente continua nos seus canais habituais. A equipe reúne as
              mensagens, confirma o atendimento e revisa as sugestões da IA.
            </p>
          </div>
          <Badge tone="blue">MVP · etapa 1</Badge>
        </div>
        <p>
          A prévia reúne cadastro direto e simulações de recebimento e resposta
          pelos dois canais. A conexão com Gmail e WhatsApp, o recebimento real
          e os envios serão implementados com as contas da Adviser. Quantidade
          de contas e números, áudios, grupos e histórico a importar precisam
          ser definidos no levantamento.
        </p>
        <Button onClick={() => go("/mensagens")} icon={ArrowRight}>
          Explorar central de atendimento
        </Button>
      </section>
      <section className="panel scope-options">
        <h2>Evoluções opcionais</h2>
        <Badge tone="gray">Fora do MVP · sem etapa fechada</Badge>
        <p>
          Portal de acompanhamento do cliente e modelos de IA em infraestrutura
          própria. Serão dimensionados separadamente.
        </p>
      </section>
    </>
  );
}
