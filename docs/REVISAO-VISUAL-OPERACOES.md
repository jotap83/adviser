# Revisão — Operações, financeiro e escopo

Registro de 20/10/2026. Extensão em modo **Operate**, construída em código sobre o sistema Adviser existente, com seed herdado `04f14614`. O contrato está em `.impeccable/surfaces/operacoes.md`. O formato de quadro semelhante ao Trello foi solicitado para a etapa 2; não houve nova direção visual ou redesenho da marca.

Esta etapa documental criou somente este registro. `DESIGN.md` e `.impeccable/design.json` foram preservados byte a byte. Foram consultados os documentos do produto e do sistema visual, o contrato da superfície, `docs/OPERACOES-E-ESCOPO.md`, os componentes e estilos da extensão, o modelo de produção, a rotina de teste e o resultado persistido do detector. Não foram repetidos testes, navegador, capturas ou detector.

## Escopo e composição

| Superfície | Implementação e limite comunicado |
| --- | --- |
| Navegação e faixa de escopo | Grupos distinguem Gestão/Atendimento do MVP, evoluções fora do MVP e planejamento. A faixa identifica etapa 1, Operações na etapa 2, financeiro na etapa 3 e e-mails como evolução opcional. |
| Visão de entregas | Seções de atendimento, Operações e financeiro próprio apresentam propósito, capacidades e acesso à demonstração. O texto explica que uma tela demonstrada não implica inclusão na primeira contratação. IA via API está prevista para o MVP, mas continua simulada no protótipo. |
| Quadro de Operações | Seletor de evento, resumo do projeto, ação Nova tarefa e filtros antecedem quatro status: A fazer, Em andamento, Aguardando e Concluído. Cartões mostram responsável, prazo, fase do evento, prioridade, bloqueio e contagens de checklist/comentários. |
| Detalhe da tarefa | Edição, status, motivo do bloqueio, checklist, comentários e histórico ficam dentro da página. Criar, editar e mover são operações locais; o arraste tem alternativa por seletor. Concluir exige checklist completo e ausência de bloqueio. |
| Repasse | A criação explícita de projeto exige aceite, versão aceita existente e repasse preparado. O identificador estável evita duplicidade. Uma cópia da versão, briefing, evidência e condições é preservada; mudanças posteriores no aceite ou repasse são sinalizadas. Essa preservação é comportamento da aplicação local, sem garantia de auditoria no servidor. |
| Financeiro próprio | Prévia da etapa 3 com lançamentos fictícios, filtro de tipo, totais calculados e baixa reversível. Projetos recém-criados começam sem lançamentos. O saldo realizado do exemplo não é apresentado como lucro. |

A etapa da entrega, o status da tarefa e a fase do evento têm papéis distintos. O Trello é referência de interação; não há conexão ou migração implementada. O alcance financeiro e a possível integração ou substituição do Conta Azul continuam sujeitos a levantamento e validação.

## Sistema visual e diferenças registradas

A extensão conserva a logo oficial, DM Sans, navegação azul Adviser, ações principais laranja, superfícies claras e estados acompanhados de texto. O quadro usa colunas tonais e cartões brancos planos, sem novas sombras ou efeitos decorativos. Não há novo raster de produto; as capturas são evidência de revisão, não assets da interface.

O quadro mostra quatro colunas no desktop, duas entre 761px e 1180px e um status por vez até 760px. No celular, quatro controles visíveis permitem trocar o status consultado; a movimentação continua disponível em cada cartão. Formulário e detalhe passam para uma coluna. O financeiro transforma a tabela em blocos com rótulos e ação de baixa; a visão de escopo também se empilha. O breakpoint de 1180px é uma decisão local de composição, sem alteração dos breakpoints do sistema documentado.

| Diferença observada no código | Relação com a referência preservada |
| --- | --- |
| Navegação desktop com altura mínima de 36px e padding vertical de 7px, a partir de 761px | Ajuste introduzido para acomodar os grupos de entrega. `DESIGN.md` e o exemplo de navegação do sidecar descrevem alvos de 44px. É uma divergência documentada; o mínimo móvel de 44px permanece. |
| Seletor de movimentação com altura mínima de 34px no desktop | Variante compacta frente aos campos de 41px descritos no sistema. No celular, o seletor usa 44px e fonte de 16px. |
| Contorno tracejado do destino de arraste em `#91a4bf` | Literal local ausente na paleta normativa. Não foi promovido a token nem acrescentado ao sidecar. |

Essas diferenças não foram reparadas por esta etapa documental nem transformadas silenciosamente em novas regras globais. A revisão recebida manteve disposição **ship**, sem correção material solicitada. A leitura realizada não equivale a uma auditoria integral de todos os estilos anteriores ou a uma certificação de acessibilidade.

## Evidência visual e parecer

O coordenador informou que o revisor inspecionou as oito capturas abaixo e devolveu as cinco seções exigidas pelo contrato de revisão, com disposição final **ship** e sem achados materiais. Este registro não substitui esse parecer por uma segunda revisão visual. A existência e as dimensões dos arquivos foram conferidas sem gerar novas imagens.

| Captura em `.impeccable/review/` | Dimensões | Superfície |
| --- | --- | --- |
| `operations-desktop.png` | 1440 × 1659 | Quadro de tarefas no desktop. |
| `operations-mobile.png` | 390 × 2142 | Quadro móvel e seleção de status. |
| `task-desktop.png` | 1440 × 1729 | Detalhe, checklist, comentários e histórico. |
| `task-mobile.png` | 390 × 2805 | Detalhe empilhado no celular. |
| `scope-desktop.png` | 1440 × 1842 | Escopo por entrega no desktop. |
| `scope-mobile.png` | 390 × 2848 | Escopo por entrega no celular. |
| `finance-desktop.png` | 1440 × 1430 | Totais e tabela financeira fictícia. |
| `finance-mobile.png` | 390 × 2537 | Lançamentos financeiros em blocos. |

O detector foi executado uma vez. O arquivo `operations-detector.json` contém **cinco achados advisory** de escala: raio de 9px e fontes de 22px, 18px, 15px e 21px. O construtor fez correções mecânicas: raio para 8px; fontes de 22px, 18px e 21px para 19px; fonte de 15px para 16px. Esses valores corrigidos estão no CSS consultado. Não houve repetição do detector; o arquivo conserva o resultado anterior às correções e não representa uma nova aprovação automática.

## Validação funcional reportada

O construtor informou aprovação de `tests/operations-browser.mjs`. A leitura da rotina confirma o alcance abaixo; esta etapa não a executou novamente.

| Verificação | Alcance da rotina |
| --- | --- |
| Conclusão e bloqueios | Rejeita conclusão com checklist incompleto e com motivo de bloqueio; permite concluir após marcar os itens. |
| Tarefas e conversa | Cria tarefa, registra comentário, move por seletor e por arraste. A recarga verifica persistência do status concluído. A rotina não afirma cobertura completa de cada campo de edição. |
| Repasse | Cria projeto a partir do fluxo preparado, verifica referência da demanda e identificador da versão copiada, e impede nova criação duplicada. Não simula alteração posterior da origem; a preservação da cópia e o aviso de mudança foram observados no código. |
| Financeiro | Confere ausência de lançamentos no novo projeto e a mudança para a ação Desfazer baixa após uma baixa simulada. Não executa transação nem conciliação real. |
| Larguras e execução | Asserções de ausência de overflow horizontal nas rotas de Operações, escopo e financeiro em 1440px e 390px. Captura o detalhe da tarefa nas duas larguras. Verifica ausência de erros de página nas páginas monitoradas. |

Nenhuma conclusão sobre novo build, standalone, deploy ou integração externa é acrescentada por este registro. A evidência descrita cobre o protótipo e os caminhos exercitados, não prontidão de produção.

## Limites preservados

Dados, tarefas, comentários, histórico e baixas são fictícios e persistidos no navegador. Não há APIs reais, envio de e-mail, operação bancária, integração Trello/Conta Azul ou colaboração multiusuário. Criar projeto e aprovar proposta não contratam fornecedores nem geram obrigações financeiras automaticamente.

Backend, autenticação, autorização, sincronização, auditoria de servidor, concorrência, arquivos reais, notificações e regras comerciais, fiscais e financeiras continuam dependentes da implementação de produção. O escopo funcional detalhado e as questões de validação estão em [OPERACOES-E-ESCOPO.md](OPERACOES-E-ESCOPO.md).
