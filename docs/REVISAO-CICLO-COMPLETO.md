# Revisão do ciclo completo — 30/10/2026

Revisão contra o levantamento do cliente, usando exclusivamente dados fictícios no protótipo. Este documento registra a cobertura e substitui as interpretações de fluxo em documentos anteriores. Não reproduz o arquivo privado.

| Referência | Necessidade | Comportamento revisado |
|---|---|---|
| 1–6 | Áreas, núcleos e responsabilidade | Carteiras e equipe preservadas; papéis fictícios de atendimento, diretoria, criação, financeiro e sócios disponíveis na revisão. Não representa permissões reais. |
| 7–12 | Cadastro e histórico de clientes | CNPJ, endereço, segmento, origem, contatos adicionais, sistema de faturamento, situação e histórico de eventos acrescentados. Indicadores de ticket continuam baseados nos registros de exemplo, não em valores imputados. |
| 13–16 | Nascimento e ciclo do evento | Evento contínuo desde o pedido; origem da oportunidade; solicitações separadas; panorama navegável até pós-evento e financeiro. |
| 17–18 | Gargalos e erros | Preserva fontes, histórico, versões e comparação; distingue interpretação, aprovação, contratação e execução. Nenhuma promessa de redução de tempo. |
| 19, 41 | Aprovações de entregas | Briefing, criativo, proposta, contratos, cronograma, materiais, extras, fornecedor acima do orçamento, relatório e prestação de contas. Conteúdo preservado, responsáveis avisados, decisão do cliente com evidência. |
| 20–25 | Comercial e criação de propostas | Origem/pipeline, cotações e comparação preservadas. Criativo movido do briefing para elaboração da proposta; conceito é distinto dos materiais de produção. Versão comercial preserva a referência da apresentação. |
| 26 | Visita antes de fechar | Atividade de viabilidade cria/usa o quadro do mesmo evento antes do contrato, sem gerar contratação ou recebíveis. |
| 27–31 | Fornecedores, produção e prazos | Cotações e negociação mantidas; contratos de fornecedores, cronograma, materiais, extras, tarefas, bloqueios e fases operacionais. Montagem exige contrato e cronograma aprovado; materiais/contratos pendentes impedem a passagem demonstrativa à execução. |
| 32–37 | Financeiro ao longo do evento | Visão global e por evento, administrativo, natureza da despesa, documento de origem, parcelas a partir do contrato, revisão, baixa/estorno e conciliação manual. Conta Azul permanece uma opção de integração. |
| 38–42 | Documentos e versões | Registro por evento com conteúdo, link, autor, versão e vínculo à versão anterior; revisões e decisões preservadas. Arquivos criativos continuam locais. |
| 43–46 | Comunicação e decisões | Gmail, WhatsApp, registros manuais e anexos preservados. Associação não aplica campos, aceita proposta ou realiza pagamento. Avisos de revisão são locais. |
| 47–50 | Visão gerencial | Painel anterior preservado; tabela transversal de fase do evento, responsável, solicitações e aprovações acrescentada. Sem indicadores ficticiamente apresentados como históricos reais. |
| 51–60 | IA e consolidação | Nove demonstrações preservadas com revisão humana; classificação da mensagem, briefing, comparação de cotações, mudanças, criação, planejamento e conferência financeira. Exemplos e cálculos são identificados como simulação. |

## Decisões de modelagem

- UI chama o projeto de **evento** e os pedidos vinculados de **solicitações**. Alias e chave legada `Demand`/`demands` permanecem para não descartar dados locais.
- Operações é uma carteira global. A operação de um evento aponta para seu identificador central e reutiliza o quadro existente ao receber o repasse.
- Contrato atual se vincula à proposta aceita. Um novo aceite não reutiliza automaticamente o contrato anterior.
- Alterar planejamento de tarefas invalida a aprovação do cronograma; apenas movimentar a tarefa entre estados não muda o planejamento.
- Alterar lançamentos invalida a prestação de contas. Parcelas não duplicam a mesma versão contratada e excluem pagamentos diretos aos fornecedores.
- Pós-evento não equivale a financeiro encerrado: a conferência lista tarefas, solicitações, documentos e contas ainda pendentes.
- Revisores sugeridos por papel são editáveis. Há variações no levantamento sobre diretoria e alternativas “e/ou”. A demonstração exige todos os selecionados e exclui autoaprovação; isso não é regra corporativa validada nem autorização real.
- Cadastros existentes e exemplos previamente aprovados são preservados. Novas alterações entram nas verificações atuais; não são inventadas decisões históricas de pessoas reais.

## Como explorar

Na entrada, **Explorar ciclo completo** abre um exemplo fictício conectado. A navegação do evento tem Panorama, Entrada/briefing, Elaboração da proposta (cotações, comparativo, criativo, orçamento, revisão/negociação), Contratos, Produção, Pós-evento, Financeiro e Documentos. Solicitações e aprovações têm também visões globais. O exemplo não substitui registros locais existentes.

## Limites materiais

IA, canais e avisos são simulados; decisões e documentos são locais ao navegador. Não há assinatura, envio, pagamento, autenticação, autorização multiusuário, conciliação bancária automática nem integração com Conta Azul. Despesas são lançadas manualmente; pagamento parcial e rotinas fiscais permanecem fora desta demonstração. Campos de satisfação e próximo contato são registros manuais; não há disparo de pesquisa. A presença da tela não constitui implementação de produção nem ampliação automática do escopo comercial.

## Validação

`npm run build` concluído com sucesso. A suíte final aprovou **59 testes: 47 existentes e 12 do ciclo de eventos**. Os testes abrangem migração/idempotência, visita pré-venda, aprovação e evidência de briefing, notificações de cada tipo de entrega, vínculo contrato/versão, alterações de cronograma e prestação de contas, parcelas sem duplicidade, exemplos e roteiros existentes.

Correções técnicas verificadas na revisão final por fonte e nos testes de `tests/event-lifecycle.test.mjs`:

- Recebíveis de uma versão contratual anterior impedem nova geração automática de parcelas que duplicaria a obrigação do evento.
- A identificação do conteúdo aprovado do cronograma inclui descrição, fornecedor e conteúdo do checklist. Marcar execução/conclusão de tarefas e itens não altera o planejamento aprovado.
- A conferência de encerramento considera todos os documentos atuais, inclusive entregas que não sejam relatório ou prestação de contas.
- Nova obrigação em evento encerrado o devolve ao pós-evento uma única vez, preservando o histórico sem duplicar o registro de reabertura.

O revisor por fonte considerou as quatro correções resolvidas e confirmou os 12 testes do ciclo. O detector de design foi executado uma vez sobre os arquivos alterados; suas duas recomendações foram corrigidas. Não foram acrescentados rasters.

A comparação da extensão com o sistema visual foi feita por fonte, cobrindo navegação agrupada, panorama, documentos, solicitações e páginas do ciclo. Componentes compartilhados, paleta, fonte, superfícies, contornos e foco existentes foram preservados. DESIGN.md e `.impeccable/design.json` não foram alterados. A composição local e a exceção preexistente identificada estão registradas em `.impeccable/surfaces/fluxo-conectado.md`.

**Revisão visual incompleta — disposição `recapture`.** Uma inspeção anterior do DOM confirmou a apresentação criativa fora do briefing e a navegação de contratos e produção. A tentativa de capturar a versão final falhou: o renderizador excedeu o tempo em três tentativas de 300 segundos, incluindo reinicialização. Não existem capturas novas de desktop ou celular nem aprovação visual final. Build e testes não validam a composição renderizada; permanecem pendentes a recaptura nas duas larguras e o parecer visual sobre legibilidade, overflow e sobreposição.

## Correção da Gestão após a imagem do usuário

A lista do ciclo passa para a aba **Ciclo dos eventos**, preservando a abertura em **Visão geral** e a precedência dos filtros e indicadores. Respeita núcleo/responsável, oferece busca e filtro de fase e pagina em seis eventos. A leitura distingue título, cliente/código, fase e responsável; solicitações e aprovações pendentes são links, incluindo aprovações de pagamento. O código prevê campos empilhados no celular. Paleta, fonte e componentes existentes foram comparados por fonte; DESIGN.md e `.impeccable/design.json` permanecem inalterados.

Foram acrescentadas regressões para a hierarquia inicial do painel, resultados recortados/paginados e associação de aprovações de pagamento. O build passou e a suíte final aprovou **61 de 61 testes**, sem alterações funcionais posteriores. Os 59 testes registrados acima pertencem à revisão anterior. O novo revisor considerou as quatro correções resolvidas por fonte.

**Prévia isolada; revisão visual pendente (`recapture`).** A imagem enviada pelo usuário foi examinada como evidência do problema anterior. Não há captura da correção: o renderizador segue excedendo 300 segundos. O parecer por fonte não substitui a checagem visual. A publicação prevista é na branch `fix/management-lifecycle-layout`; `main` permanece em `e7ddb33` enquanto essa checagem estiver pendente.
