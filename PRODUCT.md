<!-- impeccable:product-schema 1 -->
# Adviser

## Product
Sistema sob medida para atendimento de uma agência de eventos físicos. A Adviser será proprietária do software produzido para ela, com entrega de fonte, documentação e instruções de operação. O repositório do usuário é jotap83/adviser.

## People and tasks
Atendimento: cerca de 20 pessoas, quatro núcleos com quatro a cinco clientes. No MVP toda a equipe de atendimento pode consultar custos, editar, aprovar e preparar o envio de propostas. Cadastro de clientes e fornecedores, briefing, esclarecimentos, cotação, comparação, proposta versionada, registro de aceite e repasse ao financeiro.

## Journey
Contato por e-mail ou ligação; registro manual; IA sugere interpretação e perguntas; revisão humana; esclarecimento com cliente; briefing validado; solicitação de cotação; fornecedor preenche link individual com template da sua categoria e múltiplos preços; comparação; proposta; ajustes ou aceite; pacote para financeiro. A criação pode contribuir antes da proposta. Gestão de criação, produção, execução, financeiro e integração Conta Azul são etapas futuras.

## Prototype contract
Protótipo navegável autorizado. Dados inteiramente fictícios. PDF privado apenas como referência estrutural: cabeçalho de evento, grupos de itens, quantidade, unitário, total e resumo. Nunca copiar nomes, preços, contatos ou detalhes do arquivo. Nada de API real, envio de e-mail real ou autenticação ficticiamente apresentada como segura. Operações locais ao navegador com indicação explícita. Deve demonstrar IA indisponível e preenchimento manual.

## Platform and constraints
Web responsiva em português brasileiro, desktop como uso principal. Frontend React com TypeScript e Vite; deploy de prévia na Vercel. Estado local e adaptador de IA simulada substituível. Integrações reais, autenticação e dados compartilhados só na implementação de produção. Provedor externo inicialmente; possibilidade de um adaptador de modelo próprio futuramente.

## Confirmed non-goals
Não impor portal ao cliente. Não criar site de evento ou inscrição no MVP. Não implementar ERP ou cálculo fiscal. Cotação não é contratação. Aprovar proposta não contrata fornecedor automaticamente.

## Open questions
Regras comerciais e fiscais; categorias e templates definitivos; volume real; contas Gmail/Workspace; fórmula de margem e pagamento direto; formatos de exportação finais. Trinta propostas mensais é hipótese.

## Brand
Usar a logo oficial da Agência Adviser e suas cores: azul #293E91 e laranja #E94E1D. Identidade registrada em docs/IDENTIDADE-VISUAL.md. Não redesenhar a marca.

## Gestão e planejamento do briefing
A extensão do protótipo inclui visão dos sócios, alertas acionáveis e detalhamento por nove blocos de serviço. Indicadores são calculados a partir dos exemplos, sem alegações de receita ou ganho de produtividade. A proposta privada fundamenta somente a taxonomia e as perguntas. Histórico real, notificações multiusuário, automação de Gmail e regras comerciais/fiscais dependem da implementação e validação de produção. Ver docs/GESTAO-E-BRIEFING.md.

## Referência do atendimento e triagem de e-mails
Extensão aprovada: referência permanente por demanda e fila de mensagens para identificar, com candidatos, motivos e confirmação humana explícita. O protótipo associa automaticamente apenas código único conhecido ou conversa conhecida da mesma conta, sem conflito; as demais sugestões usam regras determinísticas simuladas. Permite escolha manual, nova demanda/cliente, ignorar/restaurar e correção auditada do vínculo. Associar inclui mensagem e anexos fictícios na conversa, sem aplicar campos do briefing, valores ou aceite. Corrigir move as fontes e preserva dados já aplicados. Gmail, IA externa, envio real, sincronização multiusuário e unicidade dos códigos em produção continuam futuros. Ver docs/TRIAGEM-DE-EMAILS.md.
