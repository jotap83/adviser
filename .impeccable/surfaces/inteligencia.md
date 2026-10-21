# IA na operação — extensão autorizada

Mode: Operate. O usuário autorizou incorporar todas as oportunidades de IA à demonstração, sem restringi-las ao MVP. Entregas futuras serão priorizadas num possível pacote mensal; nenhuma data, escopo contratual ou ganho está garantido.

## Direction contract

THESIS: demonstrar como uma sugestão contextual, com fonte e revisão, se transforma em trabalho útil para a Adviser.

OWN-WORLD: preservar a identidade Adviser e os componentes e tokens existentes. Superfícies claras, azul na navegação, laranja na ação e tipografia DM Sans.

STORY: escolher uma oportunidade, identificar a demanda ou projeto, simular a análise, consultar as fontes, editar e guardar o resultado ou criar tarefas revisadas.

FIRST VIEWPORT: título IA na operação, explicação de evolução contínua, navegação compacta pelas nove oportunidades e formulário contextual com uma ação principal. O resultado ocupa a área de leitura e oferece evidências e próximo passo. Atalhos nas telas de origem tornam as oportunidades encontráveis.

FORM: extensão em código das telas existentes e do planejamento, sem troca de identidade nem rodada de conceitos. No celular, a seleção de oportunidade precede o formulário em uma coluna. Ações têm nomes específicos, estados vazios, revisão e indisponibilidade.

QUALITY BAR: simulações identificadas; resultados derivados dos dados locais; ausência de dados não vira fato; cálculos determinísticos; contratos, preços e envios nunca são aplicados automaticamente. Novas possibilidades não são promessa de entrega mensal.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Fechamento da extensão

Revisão de acabamento: **SHIP**, sem correções materiais pendentes. As nove oportunidades foram integradas em `#/escopo/ia`, com acesso pelo cabeçalho e por atalhos contextuais. Identidade e tokens existentes foram preservados; `DESIGN.md` e `.impeccable/design.json` não exigiram alteração. Esta extensão não acrescenta imagens de produto.

Os nove fluxos foram exercitados no navegador. Foram confirmados o registro de uma análise revisada, a aplicação explícita da direção criativa, cinco tarefas revisadas adicionadas ao quadro (9 → 14) e a diferença financeira fictícia de R$ 450,00. Os 29 testes passaram, incluindo sete novos; build, pacote independente e `git diff --check` passaram. O detector `.impeccable/review/ia-detector.json` retornou `[]`.

Evidência visual: `.impeccable/review/ia-desktop-top.jpg`, `ia-desktop.jpg`, `ia-mobile.jpg` e `ia-mobile-result.jpg`. As capturas são de viewport; a tentativa de página inteira excedeu o tempo disponível. Nas móveis, o iframe de 390 px à esquerda é a superfície avaliada; a área branca restante é externa ao app. Cabeçalho e seletor móvel foram conferidos após os ajustes.

Fontes e limites documentados em `docs/IA-NA-OPERACAO.md`: briefing inicial incompleto é intencional; mensagens não sobrescrevem campos; gestão usa três perguntas delimitadas e a carteira completa; o projeto sem proposta aceita usa o quadro atual; projetos vinculados usam a cópia aceita e bloqueiam repasse obsoleto. Somente direção criativa e tarefas revisadas podem ser aplicadas localmente. Não há IA externa, interpretação livre de documentos, envios ou transações reais. O README inclui o acesso e o guia contém um roteiro curto para apresentação.
