# Atendimento centralizado

Solicitação de 20/10/2026: concentrar o atendimento na plataforma, preservando cadastro direto e recebimento por Gmail ou WhatsApp.

## Caminhos demonstráveis

1. **Direto:** Nova demanda / Cadastrar demanda, cliente existente ou novo, origem, responsável e anotações. E-mail e telefone opcionais. No briefing, preencher campos sem IA, anexar PDF/DOCX/XLSX, registrar retorno de reunião ou ligação e seguir para cotações.
2. **Gmail:** Central de atendimento → Simular Gmail → revisar mensagem fictícia → receber. Código conhecido vincula a demanda; sem vínculo seguro, confirmar sugestão, escolher manualmente ou criar demanda/cliente. Anexos acompanham a fonte.
3. **WhatsApp:** mesma central e regras de revisão. Telefone ou conversa por número não vinculam automaticamente um evento. Código conhecido ou referência explícita a mensagem recebida já vinculada, sem conflito, podem identificar a demanda. Vários eventos do mesmo contato permanecem distinguíveis.

O endereço principal é `#/mensagens`; `#/emails` continua funcionando para links antigos. Novos exemplos são adicionados uma vez, preservando os dados locais existentes. Todos os exemplos são fictícios.

## Resposta e continuidade

Após associar, responder na central ou no histórico do briefing. Escolher Gmail, WhatsApp ou registro manual, escrever livremente ou carregar sugestão determinística de IA, selecionar anexos do atendimento e revisar antes de simular o envio. Registros guardam autor, canal, destinatário, referência, data e indicação de simulação. O preenchimento e a resposta manual continuam disponíveis no modo de IA indisponível.

O WhatsApp demonstra a janela de 24 horas a partir de mensagem recebida do contato. Fora da janela, selecionar modelo fictício de retomada e confirmar autorização do contato. O controle “Demonstrar janela encerrada” é exclusivamente didático. Não há modelo aprovado, conta conectada, API, entrega real ou leitura confirmada. O protótipo registra os nomes dos anexos selecionados; não os transmite.

Receber, associar ou responder não aplica dados ao briefing, aceita proposta ou contrata fornecedor. A revisão dos campos e o aceite seguem ações próprias. A IA desta prévia usa exemplos/regras e não interpreta semanticamente qualquer texto livre.

## Produção futura, dentro do MVP

Uma conta empresarial de WhatsApp compartilhada é a premissa inicial; quantidade de números, modalidade atual, coexistência com aplicativo e provedor oficial devem ser validados. A implementação real exige backend, autorizações Google/Meta, notificações recebidas, fila e repetição segura, arquivos armazenados, logs, controle de acesso e gestão de falhas. O mesmo telefone pode tratar de múltiplos eventos. Resposta a uma mensagem enviada também deverá ser resolvida pelo seu identificador externo e conta/canal corretos.

## Verificação

`tests/channels-browser.mjs` verifica cadastro direto de cliente sem e-mail, briefing sem IA, recebimento por Gmail/WhatsApp, vínculo sem alteração automática de campos, respostas com revisão, janela/template/autorização, registros diretos, persistência e larguras desktop/celular. O teste inicia o Vite quando `DEMO_URL` não é informado. `npm run build` valida TypeScript e empacotamento; `npm test` preserva as verificações financeiras existentes.
