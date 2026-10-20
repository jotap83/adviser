<!-- impeccable:product-schema 1 -->
# Adviser

## Product
Sistema sob medida para atendimento de uma agência de eventos físicos. A Adviser será proprietária do software produzido para ela, com entrega de fonte, documentação e instruções de operação. O repositório do usuário é jotap83/adviser.

## People and tasks
Atendimento: cerca de 20 pessoas, quatro núcleos com quatro a cinco clientes. No MVP toda a equipe de atendimento pode consultar custos, editar, aprovar e preparar o envio de propostas. Cadastro de clientes e fornecedores, briefing, esclarecimentos, cotação, comparação, proposta versionada, registro de aceite e repasse para Operações (nome e responsabilidades a confirmar).

## Journey
Contato por Gmail, WhatsApp ou ligação; integrações recebem mensagens e anexos; associação por referência ou conversa e sugestão por IA para casos sem vínculo seguro; equipe confirma ambiguidades; IA sugere interpretação e perguntas; revisão humana; esclarecimento com cliente; briefing validado; solicitação de cotação; fornecedor preenche link individual com template da sua categoria e múltiplos preços; comparação; proposta; ajustes ou aceite; pacote para Operações. Respostas preparadas com IA passam por revisão antes do envio pelo sistema. Entrada manual permanece disponível. A criação pode contribuir antes da proposta. Nas etapas futuras, Operações recebe o escopo aprovado, coordena fornecedores, produz e executa o evento; o financeiro acompanha pagamentos e recebimentos durante o projeto e fecha após o evento. Nome da área Operações e suas responsabilidades são hipótese a validar com a Adviser. Gestão de criação, operações, financeiro e integração Conta Azul continuam fora do MVP.

## Prototype contract
Protótipo navegável autorizado. Dados inteiramente fictícios. PDF privado apenas como referência estrutural: cabeçalho de evento, grupos de itens, quantidade, unitário, total e resumo. Nunca copiar nomes, preços, contatos ou detalhes do arquivo. Nada de API real, envio de e-mail real ou autenticação ficticiamente apresentada como segura. Operações locais ao navegador com indicação explícita. Deve demonstrar IA indisponível e preenchimento manual.

## Platform and constraints
Web responsiva em português brasileiro, desktop como uso principal. Frontend React com TypeScript e Vite; deploy de prévia na Vercel. Estado local e adaptador de IA simulada substituível. Integrações reais, autenticação e dados compartilhados só na implementação de produção. Provedor externo inicialmente; possibilidade de um adaptador de modelo próprio futuramente.

## Confirmed non-goals
Não impor portal ao cliente. Não criar site de evento ou inscrição no MVP. Não implementar financeiro ou cálculo fiscal no MVP. Cotação não é contratação. Aprovar proposta não contrata fornecedor automaticamente. Financeiro próprio está previsto na etapa 3, com alcance e possível substituição do Conta Azul a validar.

## Open questions
Regras comerciais e fiscais; categorias e templates definitivos; volume real; contas Gmail/Workspace e quantidade; números de WhatsApp e modalidade atual; necessidade de áudios, grupos e histórico; fórmula de margem e pagamento direto; formatos de exportação finais. Trinta propostas mensais é hipótese.

## Brand
Usar a logo oficial da Agência Adviser e suas cores: azul #293E91 e laranja #E94E1D. Identidade registrada em docs/IDENTIDADE-VISUAL.md. Não redesenhar a marca.

## Gestão e planejamento do briefing
A extensão do protótipo inclui Painel Gerencial, alertas acionáveis e detalhamento por nove blocos de serviço. Indicadores são calculados a partir dos exemplos, sem alegações de receita ou ganho de produtividade. A proposta privada fundamenta somente a taxonomia e as perguntas. Histórico real, notificações multiusuário, automação de Gmail e regras comerciais/fiscais dependem da implementação e validação de produção. Ver docs/GESTAO-E-BRIEFING.md.

## Referência do atendimento e triagem de e-mails
Extensão aprovada: referência permanente por demanda e fila de mensagens para identificar, com candidatos, motivos e confirmação humana explícita. O protótipo associa automaticamente apenas código único conhecido ou conversa de e-mail conhecida da mesma conta, sem conflito; no WhatsApp, telefone ou conversa por número isoladamente não bastam; as demais sugestões usam regras determinísticas simuladas. Permite escolha manual, nova demanda/cliente, ignorar/restaurar e correção auditada do vínculo. Associar inclui mensagem e anexos fictícios na conversa, sem aplicar campos do briefing, valores ou aceite. Corrigir move as fontes e preserva dados já aplicados. Gmail, WhatsApp, IA externa, envio real, sincronização multiusuário e unicidade dos códigos fazem parte da implementação prevista do MVP; ainda não estão implementados nesta demonstração. A central atual simula recebimento e envio por Gmail e WhatsApp, com cadastro direto, histórico compartilhado e revisão humana. Ver docs/TRIAGEM-DE-EMAILS.md e docs/CANAIS-NO-MVP.md.

## Entregas e Operações

Escopo corrigido por solicitação do usuário em 20/10/2026: MVP de atendimento, cadastros, Gmail e WhatsApp integrados com IA, recebimento e envio de mensagens/anexos, correlação e confirmação de vínculos, briefing, cotações e negociação com fornecedores, propostas, aceite, repasse, visão gerencial, alertas e apoio criativo por referências/apresentações/feedback. Respostas e alterações sugeridas passam por revisão humana. Comunicação e preenchimento manuais continuam disponíveis. A IA e as integrações pertencem ao MVP de produção, mas permanecem simuladas ou não conectadas neste protótipo. Portal do cliente e IA em infraestrutura própria são evoluções opcionais fora do MVP.

Etapa 2: Operações com quadro de tarefas por evento, responsáveis, prazos, bloqueios, checklist, comentários e histórico. A empresa usa Trello hoje; nenhuma conexão ou migração foi implementada. A prévia permite criar um projeto explicitamente após aceite e repasse preparado, preservando uma cópia da versão e evitando duplicidade. Etapa 3: financeiro próprio, contas a pagar/receber, caixa, previsto/realizado e fechamento. Conta Azul poderá ser integrado ou substituído conforme levantamento das funções atuais; a retirada não foi decidida. Não há transações reais. Ver docs/OPERACOES-E-ESCOPO.md.

## Atendimento centralizado — 20/10/2026

Cadastro direto, Gmail e WhatsApp alimentam a mesma demanda. É possível cadastrar cliente sem e-mail, informar telefone, descrever o pedido, preencher campos e anexar arquivos sem IA ou conexão. A Central de atendimento (`#/mensagens`, mantendo `#/emails` como alias) demonstra entrada de ambos os canais, confirmação de vínculo, criação de demanda/cliente e resposta revisada. Um número empresarial compartilhado é a hipótese inicial. O WhatsApp demonstra janela de 24 horas e modelo fictício para retomada com confirmação de autorização; elegibilidade, números e coexistência com aplicativo ainda serão validados. Receber, associar e responder não altera automaticamente campos, valores ou aceite. Todos os envios são locais e simulados. Ver docs/ATENDIMENTO-CENTRALIZADO.md.
