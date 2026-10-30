<!-- impeccable:product-schema 1 -->
# Adviser

## Product and current source of truth
Software sob medida para a agência de eventos Adviser. Repositório: jotap83/adviser. Esta definição substitui as hipóteses de fluxo anteriores. Revisão autorizada em 30/10/2026 contra o levantamento fornecido pelo usuário; não copiar o documento privado nem nomes, contatos ou valores reais para o repositório.

## People and tasks
Atendimento/produção organizado em quatro núcleos; criação, comercial, diretoria, sócios e financeiro têm responsabilidades ao longo do ciclo. Os usuários da demonstração são fictícios. Cada evento tem responsável próprio e um cliente com núcleo e responsável pela conta. A gestão é transversal; operações e financeiro também têm carteiras globais.

## Journey and vocabulary
**Evento** é o registro contínuo desde a oportunidade/pedido inicial até o pós-evento e fechamento. **Solicitação** (demanda de trabalho) pertence a um evento: pedido inicial, alteração, criação, visita técnica ou financeiro. Uma mensagem pode compor a conversa de um evento, sem automaticamente aprovar escopo, contratar ou pagar.

1. Entrada por indicação, prospecção, recorrência, contrato, sazonalidade ou procura espontânea. Cadastro direto e mensagem recebida podem criar cliente e evento.
2. Briefing: fontes, anexos, interpretação assistida, esclarecimento, revisão interna e evidência da validação do cliente antes de cotar.
3. Elaboração da proposta: cotações, comparação, composição, orçamento e **apresentação criativa em área própria**, separada do briefing.
4. Revisão interna, apresentação/negociação e aceite da versão comercial. Alterações preservam versões anteriores e exigem revisão própria.
5. Análise e registro de contratos de cliente e fornecedores. Contrato do cliente se vincula à versão comercial aceita; revisão e evidência de assinatura liberam o repasse.
6. Produção: visitas técnicas podem preceder o fechamento. Cronograma, materiais criativos, extras, contratação, logística, montagem, execução e desmontagem ficam no contexto do mesmo evento.
7. Pós-evento: resultados, prestação de contas, satisfação, lições e próximo contato. Conferência das pendências antes de encerrar.
8. Financeiro acompanha o ciclo: orçamento, compromissos, parcelas, lançamentos/documentos, aprovação, baixa integral, conciliação manual e fechamento. Saldo de caixa não é lucro.

## Approvals
Revisão interna separada da decisão do cliente. Entregas: briefing, proposta, apresentação, contrato, contrato de fornecedor, cronograma, materiais, extras/estouros, fornecedor acima do orçamento, relatório, prestação de contas e pagamento. A solicitação preserva o conteúdo e cria aviso para cada revisor; o resultado avisa o solicitante. Alterar a fonte invalida a aprovação. Cronograma inclui os campos de planejamento das tarefas; prestação de contas inclui os lançamentos. Cada nova versão recebe decisão própria.

Os papéis orientam a seleção: atendimento/diretoria no briefing e proposta; criação/atendimento nos materiais; sócios nos contratos e estouros; financeiro/atendimento nas contas. Pagamentos distinguem fornecedor dentro do orçamento, extra, despesa fixa, salários e reembolso. O levantamento contém variações sobre participação da diretoria e alternativas “e/ou”; portanto a seleção é explícita e editável. Todos os revisores selecionados precisam concordar e o solicitante não revisa o próprio pedido nesta demonstração. Isso é regra ilustrativa, não motor de alçadas ou autenticação de produção.

## Prototype contract
React/TypeScript/Vite, português brasileiro, responsivo, estado local. IA e Gmail/WhatsApp simulados, sem APIs, envios reais, cobrança ou assinatura eletrônica. Leitura de texto de PDF/DOCX/XLSX é local; interpretação é demonstrativa, com fontes e revisão. Apresentações mantêm versões, prévia e arquivos locais via IndexedDB. Modelos de cotação por categoria, alternativas, opcionais, negociação, planilha e proposta são preservados.

As nove demonstrações de IA continuam disponíveis: comparar, revisar proposta, impacto de mudanças, resumo, consulta gerencial, memória, criação, planejamento e conferência de cobrança. Sugestões não executam decisões. Deve haver caminho manual e estado de IA indisponível.

## Commercial boundaries
Escopo inicial fechado: Atendimento. Operações é etapa 2; Financeiro é etapa 3. A demonstração completa não amplia automaticamente o contrato. Conta Azul pode permanecer integrado; substituição não decidida. Sem percentuais inventados de ganho, sem prometer prazo/economia. Entregas utilizáveis por ciclos e prioridade adaptável no modelo mensal. A propriedade/repasse do software segue a proposta comercial, não regras inventadas no protótipo.

## Brand and platform
Preservar logo oficial Adviser, azul #293E91 e laranja #E94E1D, fonte DM Sans, tabelas legíveis e interfaces de trabalho. DESIGN.md e sua implementação são a referência visual. Modo Operate; sem substituir a identidade por um redesign.

## Persistence and compatibility
`EventRecord` é o tipo central; `Demand` é alias legado. `state.demands` e rotas antigas continuam compatíveis. `ProductionProject.eventId` liga a visão operacional ao evento central; dados comuns são sincronizados, o aceite comercial é um snapshot. Migração aditiva, não apagar registros salvos. EventRequests e EventDocuments guardam solicitações e versões. Nenhum documento privado é versionado.

## Validation and remaining production work
Ver docs/REVISAO-CICLO-COMPLETO.md. Permanecem por implementar em produção: autenticação/permissões, persistência compartilhada, automações e avisos reais, provedor de IA, integrações bancárias/Conta Azul, regras comerciais/fiscais e alçadas definitivas, assinatura eletrônica, pagamento parcial, armazenamento central e OCR. RH/marketing não foram incluídos na revisão do ciclo de eventos.
