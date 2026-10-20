# Referências e triagem de e-mails

Extensão do protótipo aprovada para identificar a qual atendimento pertence uma mensagem antes de revisar seu conteúdo. Todos os e-mails, contatos e anexos são fictícios. Gmail não está conectado; não há chamada de IA ou envio real.

## Referência permanente

Cada demanda recebe uma referência no formato `ADV-ano-sequência`, com sequência de pelo menos quatro dígitos. O ano vem da criação da demanda. A referência acompanha o atendimento ao mudar título, etapa ou proposta; o contador por ano é preservado no estado local. A preparação dos dados existentes atribui referências ausentes e resolve duplicatas locais.

A referência aparece na fila, no cabeçalho do atendimento e nos candidatos da triagem. Pode ser copiada e pesquisada. Os rascunhos de alinhamento do briefing e de envio da proposta incluem o código no assunto e no corpo. Copiar ou registrar o texto continua sendo uma ação local, sem envio de e-mail.

## Entrada e decisão

Acesse **Visão geral → Revisar e-mails** ou `#/emails`. O exemplo inicial contém quatro mensagens em **Para identificar** e uma em **Associados**, reconhecida por código. Os filtros **Para identificar**, **Associados** e **Ignorados** exibem suas contagens.

| Situação recebida | Comportamento |
| --- | --- |
| Um código conhecido, sem conflito | Associação automática simulada por referência. O código pode estar no assunto, corpo ou texto fictício de anexo. |
| Conversa já vinculada a um único atendimento na mesma conta, sem conflito | Associação automática simulada pelo histórico da conversa. |
| Mais de um código, código desconhecido, divergência entre código e conversa, ou conversa ligada a vários atendimentos | Permanece pendente com aviso para revisão humana. |
| Sem associação direta | Exibe até três candidatos com motivos e ressalvas, quando há indícios suficientes. |
| Sem candidato ou IA indisponível | Escolha manual e criação de demanda continuam disponíveis. |

O adaptador de sugestões compara remetente ou domínio corporativo, cliente, código, nome do evento, data, local e termos do histórico. Ordena por regras determinísticas; não faz interpretação semântica por IA nem apresenta percentuais de confiança. Datas diferentes e atendimentos encerrados, recusados ou já aceitos recebem ressalvas.

Nenhum candidato começa selecionado. **Confirmar vínculo** só habilita após escolher explicitamente um radio ou um atendimento na busca manual. O usuário vê o destino antes de confirmar. **Escolher outro atendimento** permite buscar por código, evento ou cliente; **Criar nova demanda** aceita cliente existente ou cadastro de empresa e contato.

## Fontes, revisão e correção

Ao associar, a mensagem entra na conversa do atendimento e os anexos fictícios entram com sua origem. O vínculo registra data, autor demonstrativo, método e destino. O briefing permite voltar à associação pelo histórico da conversa.

Essa operação não preenche campos do briefing, altera quantidades ou valores, salva versão comercial ou aprova proposta. O conteúdo fica disponível para revisão posterior. A mesma mensagem recebida novamente com o mesmo identificador não é duplicada no estado local.

**Corrigir vínculo** move a mensagem original e seus anexos para outro atendimento e registra a correção. Campos estruturados já aplicados não são desfeitos: é preciso conferir os dois briefings. A correção de uma mensagem não transfere todas as demais mensagens da conversa. Se isso deixar a mesma conta/conversa ligada a mais de uma demanda, uma nova resposta permanece pendente.

**Ignorar nesta fila** preserva a mensagem em **Ignorados**. **Restaurar para identificação** a devolve à fila pendente. O histórico mantém essas ações.

## Roteiro para demonstrar

1. Na visão geral, confira a contagem e clique em **Revisar e-mails**. Em **Atualização do Encontro Horizonte**, abra o texto simulado de `ajustes-do-encontro.pdf`, compare os motivos e confirme o atendimento escolhido.
2. Abra o briefing. Confira a mensagem e o anexo no histórico, o código no assunto e a preservação dos campos. Use **Ver associação do e-mail** para voltar e experimente **Corrigir vínculo**.
3. Em **Retorno sobre os nossos eventos**, compare os candidatos da Aurora. Marque **Simular IA indisponível** e use a escolha manual; desmarque para voltar às sugestões.
4. Em **Encaminhamento: qual é a proposta atual?**, confira o aviso de códigos conflitantes. Use **Ignorar nesta fila** e **Restaurar para identificação**.
5. Em **Pedido de evento para a equipe**, use **Criar nova demanda**, selecione **Cadastrar novo cliente** e registre um exemplo fictício. A nova demanda recebe código próprio e a mensagem, mantendo o briefing para revisão.
6. Use **Simular nova resposta** para demonstrar o recebimento pela conversa conhecida. Se houver conflito no histórico, a nova mensagem aparece selecionada em **Para identificar**, com aviso de revisão, sem anunciar associação bem-sucedida.

## Execução e validação

Com as dependências instaladas, mantenha `npm run dev -- --host 127.0.0.1 --port 4173` em execução. O teste de triagem também importa os módulos de origem para verificar os conflitos e precisa do servidor de desenvolvimento. Em outro terminal:

```bash
npm test
node tests/browser.mjs
node tests/inbox-browser.mjs
```

Os testes de navegador usam Chromium do Playwright; instale-o com `npx playwright install chromium` se necessário. `CHROMIUM_PATH` é opcional e `DEMO_URL` permite outra URL nos testes com servidor. `SKIP_SCREENSHOTS=1` desativa capturas em `tests/browser.mjs`; o teste de triagem grava suas próprias evidências.

Para a cópia independente:

```bash
npm run build:standalone
node tests/standalone-inbox.mjs
```

O último teste abre `standalone/adviser-prototipo.html` por `file://`, offline e sem servidor. Verifica associação, referência persistida após recarga, campos preservados e ausência de requisições HTTP e erros de página. Os resultados desta entrega e seu alcance estão em [revisão visual e funcional](REVISAO-VISUAL-TRIAGEM.md).

## Limites do protótipo e implementação do MVP

Mensagens, vínculos e contadores ficam em `localStorage`. Não há banco compartilhado, controle de concorrência ou garantia de unicidade entre usuários. O texto do anexo é fictício; nenhum arquivo foi recebido do Gmail.

Gmail e WhatsApp integrados com IA foram incluídos no MVP em 20/10/2026. Na produção, será necessário integrar as contas, autenticar usuários, validar acesso no servidor, persistir identificadores únicos por canal/conta e auditoria, tratar recebimento repetido e concorrência, armazenar anexos reais e implementar o adaptador de IA com revisão humana. Esses itens não estão implementados na demonstração local. Esta tela simula somente a triagem de e-mails; ver [escopo dos canais](CANAIS-NO-MVP.md).
