<!-- impeccable:product-schema 1 -->
# Adviser

## Product
Sistema sob medida para atendimento de uma agência de eventos físicos. A Adviser será proprietária do software produzido para ela, com entrega de fonte, documentação e instruções de operação. O repositório do usuário é jotap83/adviser.

## People and tasks
Atendimento: cerca de 20 pessoas, quatro núcleos com quatro a cinco clientes. No MVP toda a equipe de atendimento pode consultar custos, editar, aprovar e preparar o envio de propostas. Cadastro de clientes e fornecedores, briefing, esclarecimentos, cotação, comparação, proposta versionada, registro de aceite e repasse para Operações (nome e responsabilidades a confirmar).

## Journey
Contato por e-mail ou ligação; registro manual; IA sugere interpretação e perguntas; revisão humana; esclarecimento com cliente; briefing validado; solicitação de cotação; fornecedor preenche link individual com template da sua categoria e múltiplos preços; comparação; proposta; ajustes ou aceite; pacote para Operações. A criação pode contribuir antes da proposta. Nas etapas futuras, Operações recebe o escopo aprovado, coordena fornecedores, produz e executa o evento; o financeiro acompanha pagamentos e recebimentos durante o projeto e fecha após o evento. Nome da área Operações e suas responsabilidades são hipótese a validar com a Adviser. Gestão de criação, operações, financeiro e integração Conta Azul continuam fora do MVP.

## Prototype contract
Protótipo navegável autorizado. Dados inteiramente fictícios. PDF privado apenas como referência estrutural: cabeçalho de evento, grupos de itens, quantidade, unitário, total e resumo. Nunca copiar nomes, preços, contatos ou detalhes do arquivo. Nada de API real, envio de e-mail real ou autenticação ficticiamente apresentada como segura. Operações locais ao navegador com indicação explícita. Deve demonstrar IA indisponível e preenchimento manual.

## Platform and constraints
Web responsiva em português brasileiro, desktop como uso principal. Frontend React com TypeScript e Vite; deploy de prévia na Vercel. Estado local e adaptador de IA simulada substituível. Integrações reais, autenticação e dados compartilhados só na implementação de produção. Provedor externo inicialmente; possibilidade de um adaptador de modelo próprio futuramente.

## Confirmed non-goals
Não impor portal ao cliente. Não criar site de evento ou inscrição no MVP. Não implementar financeiro ou cálculo fiscal no MVP. Cotação não é contratação. Aprovar proposta não contrata fornecedor automaticamente. Financeiro próprio está previsto na etapa 3, com alcance e possível substituição do Conta Azul a validar.

## Open questions
Regras comerciais e fiscais; categorias e templates definitivos; volume real; contas Gmail/Workspace; fórmula de margem e pagamento direto; formatos de exportação finais. Trinta propostas mensais é hipótese.

## Brand
Usar a logo oficial da Agência Adviser e suas cores: azul #293E91 e laranja #E94E1D. Identidade registrada em docs/IDENTIDADE-VISUAL.md. Não redesenhar a marca.

## Gestão e planejamento do briefing
A extensão do protótipo inclui visão dos sócios, alertas acionáveis e detalhamento por nove blocos de serviço. Indicadores são calculados a partir dos exemplos, sem alegações de receita ou ganho de produtividade. A proposta privada fundamenta somente a taxonomia e as perguntas. Histórico real, notificações multiusuário, automação de Gmail e regras comerciais/fiscais dependem da implementação e validação de produção. Ver docs/GESTAO-E-BRIEFING.md.

## Referência do atendimento e triagem de e-mails
Extensão aprovada: referência permanente por demanda e fila de mensagens para identificar, com candidatos, motivos e confirmação humana explícita. O protótipo associa automaticamente apenas código único conhecido ou conversa conhecida da mesma conta, sem conflito; as demais sugestões usam regras determinísticas simuladas. Permite escolha manual, nova demanda/cliente, ignorar/restaurar e correção auditada do vínculo. Associar inclui mensagem e anexos fictícios na conversa, sem aplicar campos do briefing, valores ou aceite. Corrigir move as fontes e preserva dados já aplicados. Gmail, IA externa, envio real, sincronização multiusuário e unicidade dos códigos em produção continuam futuros. Ver docs/TRIAGEM-DE-EMAILS.md.

## Entregas e Operações

Escopo proposto em 20/10/2026: MVP de atendimento, cadastros, IA assistiva via API, briefing/anexos, comunicação manual com cliente, cotações e negociação com fornecedores, propostas, aceite, repasse, visão gerencial, alertas e apoio criativo por referências/apresentações/feedback. A integração de IA faz parte da implementação prevista do MVP, mas permanece simulada neste protótipo. Gmail automático, correlação de mensagens importadas, portal do cliente e IA em infraestrutura própria são evoluções opcionais fora do MVP.

Etapa 2: Operações com quadro de tarefas por evento, responsáveis, prazos, bloqueios, checklist, comentários e histórico. A empresa usa Trello hoje; nenhuma conexão ou migração foi implementada. A prévia permite criar um projeto explicitamente após aceite e repasse preparado, preservando uma cópia da versão e evitando duplicidade. Etapa 3: financeiro próprio, contas a pagar/receber, caixa, previsto/realizado e fechamento. Conta Azul poderá ser integrado ou substituído conforme levantamento das funções atuais; a retirada não foi decidida. Não há transações reais. Ver docs/OPERACOES-E-ESCOPO.md.
