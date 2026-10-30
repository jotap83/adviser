# Atendimento, operações, gestão e aprovações

Mode: Operate. Extensão funcional da identidade Adviser existente, sem troca de marca ou sistema visual. Pedido de 30/10/2026: trabalhar no repositório real, recuperar completude da prévia, corrigir seletores, criar evento desde a primeira mensagem, Operações global e visão gerencial explícita. Commit e publicação autorizados.

## Direction contract

THESIS: O trabalho começa na solicitação e atravessa áreas globais; o evento mantém o contexto sem aprisionar a operação.

OWN-WORLD: Herda integralmente DESIGN.md: DM Sans, azul Adviser, ação laranja, fundo claro, controles e painéis existentes.

STORY: Classificar e criar/vincular; revisar briefing e cotações; pedir aprovação, avisar responsáveis; encaminhar versão aceita a Operações; acompanhar contas e decisões gerenciais.

FIRST VIEWPORT: Atendimento abre com mensagens a atender, até seis eventos em andamento e cadastro direto. Área de trabalho no cabeçalho muda a rota. Carteira em Operações, totais e filtro de todos os eventos no Financeiro, panorama entre áreas na Gestão. Na mensagem, a revisão da classificação precede a escolha explícita entre criar e vincular um evento.

FORM: Listas de carteira e fila de tarefas com detalhe por evento; central de aprovações por pessoa. Extensão prescrita pelo usuário, código sobre componentes existentes; sem novo sorteio de identidade. A classificação é sugestão editável; revisores decidem sobre versão preservada.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Limites

Dados fictícios locais; IA, mensagens, avisos e pagamentos simulados. Sem autenticação nem notificações externas. Aprovações de proposta pertencem ao Atendimento; pagamentos são etapa 3. Novas telas não ampliam o escopo comercial fechado. Conta Azul pode ser mantido/integrado; não há decisão de substituição.

## Extensão do ciclo completo — 30/10/2026

Extensão funcional do mesmo sistema, conforme PRODUCT.md revisado. O evento permanece desde a entrada até o encerramento; solicitações, documentos e decisões pertencem a ele. A apresentação criativa ocupa área própria na elaboração da proposta. Contratos, produção, pós-evento e financeiro mantêm o contexto do evento e as carteiras globais.

- **Navegação do evento naquela revisão:** oito grupos visíveis — Panorama, Entrada e briefing, Elaboração da proposta, Contratos, Produção, Pós-evento, Financeiro e Documentos. Entrada e elaboração têm subnavegação. O grupo consultado usa seleção azul e `aria-current`; consultar uma página não conclui uma etapa. Os controles quebram em linhas e conservam altura mínima de 44px. A simplificação posterior, registrada abaixo, mantém as áreas e altera seus acessos.
- **Panorama e ciclo:** sequência vertical numerada, pendências reais dos registros locais e acesso às ações correspondentes. Contadores não representam resultados de negócio. A fase é derivada do estado, com financeiro acessível durante todo o trabalho.
- **Documentos e solicitações:** lista de versões com detalhe de conteúdo e decisões; solicitações em linhas com responsável, prazo, situação e origem. Formulários, avisos, badges e ações reutilizam os componentes compartilhados. Contratos, cronograma, materiais e pós-evento usam essas mesmas estruturas.
- **Composição responsiva declarada no código:** panorama e documentos passam a uma coluna até 900px; lista de documentos passa de duas colunas a uma até 500px. Formulários e solicitações se reorganizam sem criar outra identidade visual. O comportamento renderizado ainda precisa de recaptura.

### Comparação com o sistema existente

Comparação por fonte de `src/event-lifecycle.css`, `src/App.tsx`, `src/pages/EventLifecycle.tsx`, `src/pages/EventDocuments.tsx`, `src/pages/EventRequests.tsx` e `src/components/UI.tsx` contra `src/styles.css`, DESIGN.md e `.impeccable/design.json`: DM Sans, azul/laranja Adviser, superfícies brancas, contornos finos, foco global e componentes de trabalho preservados. A extensão não adiciona rasters, gradientes, sombras decorativas ou uma família tipográfica. As dimensões específicas de navegação e composição permanecem locais à superfície.

DESIGN.md e `.impeccable/design.json` permanecem inalterados. Seus exemplos de seis etapas representam o dossiê anterior; a navegação agrupada desta extensão está descrita acima, sem promover a composição local a uma mudança do sistema. Exceção preexistente identificada por fonte e preservada: `src/connected-workspace.css` define altura mínima de 36px para o seletor de área, enquanto DESIGN.md descreve 41px para os campos gerais. Não foi feito reparo nem atualização dos tokens.

### Evidência e pendência

Build concluído e 59 testes aprovados; quatro correções funcionais receberam parecer de resolvidas na revisão por fonte. O detector foi executado uma vez sobre os arquivos alterados, com duas recomendações corrigidas. Uma inspeção anterior do DOM confirmou a separação da apresentação criativa do briefing e os acessos a contratos e produção; ela não substitui inspeção visual final.

**Revisão visual incompleta: disposição `recapture`.** O renderizador ficou indisponível após três tentativas de 300 segundos, incluindo reinicialização. Não há capturas novas de desktop ou celular nem parecer visual de aprovação. A conferência por fonte documenta a extensão, mas não comprova ausência de overflow, sobreposição ou falhas de composição na renderização final. Recapturar ambas as larguras e concluir o parecer visual permanece pendente.

## Correção localizada da Gestão — 30/10/2026

A imagem enviada pelo usuário expôs uma quebra de hierarquia: a tabela do ciclo aparecia antes dos filtros e indicadores. A correção retira essa inserção incondicional e coloca a lista na aba explícita **Ciclo dos eventos**; **Visão geral** continua sendo a abertura padrão. A lista recebe o recorte de núcleo e responsável do painel, acrescenta busca e fase, limita a apresentação a seis eventos por página e informa que o período pertence aos indicadores, enquanto o ciclo mostra a situação atual.

Comparação por fonte de `ManagementDashboard.tsx`, `EventLifecycle.tsx` e `event-lifecycle.css`: preservados DM Sans, corpo de 14px, azul Adviser, fundo branco, contornos e componentes existentes. Título do evento em semibold, cliente/código como contexto, fase em badge e contagens como links recompõem a leitura. Aprovações incluem as de pagamento vinculadas ao evento. Abaixo de 760px, o código reorganiza cada linha em campos empilhados com rótulos; isso ainda não foi confirmado em captura. Os ajustes de tipografia e espaçamento são locais; DESIGN.md e `.impeccable/design.json` permanecem intactos. A regra local de foco dos links usa 2px, frente aos 3px gerais documentados; diferença registrada sem alterar os tokens.

Esta correção destina-se a uma **prévia em branch isolada**, sem atualização de `main` enquanto a checagem visual estiver pendente. A captura do usuário documenta o problema anterior, não valida a correção. O renderizador continua excedendo 300 segundos; a disposição visual permanece **`recapture`**, sem capturas finais de desktop/celular nem aprovação visual. Testes e parecer por fonte devem ser lidos no escopo declarado em `docs/REVISAO-CICLO-COMPLETO.md`.

## Simplificação do Atendimento — 30/10/2026

O usuário relatou excesso de botões e dificuldade para identificar por onde começar. A revisão organiza a entrada e o briefing em decisões sucessivas, preservando o ciclo completo e as regras de aprovação existentes.

- **Abertura:** `AtendimentoHome` ocupa `/`, com mensagens como ação principal, até seis eventos em andamento na visão **Meus eventos** ou **Todos os eventos**, e link para a carteira completa em `/eventos`. Cada evento mostra uma ação explícita e abre a área correspondente; Contratos, Produção e Pós-evento têm precedência sobre a etapa comercial anterior. Encerrados e recusados ficam fora dessa lista de retomada. **Novo evento** abre `/novo-evento` com o formulário dedicado; a carteira não aparece abaixo dele. **Explorar ciclo completo** passa a ficar dentro de **Conhecer o protótipo** na abertura.
- **Mensagens:** `/mensagens` começa pela revisão da classificação sugerida pela IA simulada. **Confirmar e continuar** leva à escolha entre **Criar novo evento** e **Vincular a evento existente**; só a escolha abre o formulário correspondente. A classificação e o vínculo manuais continuam disponíveis quando a IA está indisponível. Simulação de recebimento, detalhes adicionais, outras ações e respostas ficam em seções expansíveis.
- **Briefing:** **Pedido**, **Dados e escopo** e **Revisão e aprovação** mostram uma etapa por vez. Os painéis continuam montados, com os demais ocultos, para preservar os rascunhos locais dos componentes ao alternar etapas. Fontes e análise ficam em Pedido; campos e escopo, na segunda etapa; conversa expansível, revisão interna, decisão do cliente com evidência e liberação para cotação, na terceira. Navegar entre etapas não aprova o briefing. As verificações da fonte atual continuam controlando a liberação.
- **Navegação e ferramentas:** Atendimento, Mensagens, Eventos e Solicitações abrem a navegação principal. Fornecedores, Clientes e Modelos de cotação ficam em **Cadastros**; fluxo e escopo, em **Sobre o protótipo**. No evento, Panorama, Entrada e briefing e Elaboração da proposta continuam diretamente visíveis; Contratos, Produção, Pós-evento, Financeiro e Documentos passam ao seletor **Mais áreas do evento**. A escolha de fornecedores fica em **Elaboração da proposta → Cotações**. Ferramentas adicionais de IA ficam em uma seção expansível; os roteiros abrem as etapas/seções necessárias e o roteiro de fornecedores aponta para Cotações.
- **Celular e foco, por fonte:** até 760px, a central alterna lista e detalhe. **Voltar às mensagens** restaura o foco no item selecionado; mudanças de etapa do briefing e da triagem focam seu cabeçalho. Os rótulos das seções do menu permanecem na gaveta móvel, mesmo com preferência de recolhimento salva no desktop; ocultá-los no trilho recolhido se limita a larguras a partir de 761px.

### Comparação com o sistema existente

Comparação por fonte de `src/service-workspace.css`, `AtendimentoHome.tsx`, `Inbox.tsx`, `Briefing.tsx`, `Home.tsx`, `App.tsx` e componentes alterados contra DESIGN.md, `.impeccable/design.json` e os componentes compartilhados: DM Sans, azul/laranja Adviser, superfícies brancas, linhas finas, campos e botões existentes preservados. O título do resumo de mensagens usa 19px, alinhado ao título de seção do sistema após a única recomendação do detector nesta revisão. Os novos controles de etapas, seções expansíveis e mensagens preservam alvos mínimos de 44px; o foco local usa contorno laranja de 3px. A largura máxima de 1120px da abertura/briefing e a exposição progressiva são escolhas desta superfície, não novos tokens globais. Não há novos rasters. DESIGN.md e `.impeccable/design.json` permanecem inalterados.

O build final passou e a suíte aprovou **68 de 68 testes** após as correções. O revisor considerou resolvidos por fonte os três achados: rótulos móveis do menu, retorno de foco e próxima ação com destino específico para retomar o evento.

**Disposição visual: `recapture`.** A comparação acima e as correções foram conferidas por fonte. Não houve nova tentativa de captura nesta revisão: o serviço permanece indisponível após os timeouts de 300 segundos já registrados, inclusive após reinicialização. Não há evidência visual final de desktop ou celular, nem aprovação visual. Esta alteração segue apenas para a prévia protegida de `fix/management-lifecycle-layout`, junto à correção da Gestão; `main` permanece em `e7ddb33`. Validação automatizada e seus limites estão registrados em `docs/REVISAO-CICLO-COMPLETO.md`.
