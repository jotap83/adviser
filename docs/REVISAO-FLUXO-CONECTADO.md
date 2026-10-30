# Revisão do fluxo conectado

Data: 30/10/2026. Resultado da revisão de encerramento: **ship**, para o protótipo demonstrativo. A revisão final foi limitada às três correções abaixo; não constitui auditoria exaustiva de interface, acessibilidade, segurança ou prontidão para produção.

## Três correções verificadas

| Correção | Evidência | Resultado |
| --- | --- | --- |
| Revisão vinculada ao conteúdo e à versão exatos | Com v1 enviada, a solicitação de v2 mostrou itens, unitário de R$ 42.000, fee de 10%, total de R$ 46.200 e condições novas. O retorno à origem abriu v2 e preservou o envio anterior de v1. | Resolvida |
| Avisos abrem a solicitação correspondente, inclusive resultados | Aviso concluído abriu o registro exato. Após Joana pedir ajustes, Marina abriu o aviso e encontrou Ajustes solicitados com o comentário preservado. | Resolvida |
| Busca transversal coerente nas duas visões de Operações | Buscar Receber documentação técnica na carteira retornou um evento; buscar Grupo Horizonte na fila retornou nove tarefas do cliente. Os predicados cobrem evento, cliente e tarefa nas duas visões. | Resolvida |

Capturas da rodada: proposta v2 (evidência local), resultado de ajustes (evidência local) e central em 390px (evidência local).

As capturas e o roteiro detalhado de QA são evidências locais não versionadas; este documento conserva os resultados verificáveis da rodada.

## Validação funcional registrada

A evidência funcional (evidência local) registra a execução de UI com `cua_repl` sobre o Vite em `http://terminal.local:4173/`. O estado final passou no build TypeScript/Vite e em **47 testes unitários**, incluindo rotas exatas de aprovação e busca cruzada. O registro inicial de 45 testes foi sucedido pela rodada final de 47.

Também foram exercitados: criação desde o primeiro contato com cadastro de novo cliente; preservação da origem e anexos; seletores de pessoa e área; Operações e Financeiro globais; pagamento com aprovação, aviso e baixa; panorama gerencial; rejeição de revisores não autorizados, unanimidade, ajustes e invalidação por versão/valor nos testes unitários. O pedido original passou a aparecer também no campo Pedido após o ensaio de criação, sem preenchimento automático do briefing estruturado.

A checagem responsiva usou o aplicativo real em iframe de **390 × 844**, não um dispositivo físico. Após compactar o controle de tours, a medição registrou `body.clientWidth = 375` e `scrollWidth = 375`, com scrollbar no viewport de 390px. Não houve overflow horizontal da página nessa configuração; a tabela de itens mantém rolagem interna. O fundo cinza externo das capturas pertence à página que contém o iframe.

As capturas anteriores de triagem (evidência local), Operações desktop (evidência local), Operações móvel (evidência local) e Gestão (evidência local) complementam esse registro. Não representam uma segunda auditoria completa nesta rodada documental.

## Continuidade visual e documentação

Foram consultados [PRODUCT.md](../PRODUCT.md), [DESIGN.md](../DESIGN.md), o [sidecar](../.impeccable/design.json), o [brief da superfície](../.impeccable/surfaces/fluxo-conectado.md) e o código das telas/componentes envolvidos. A extensão segue o modo Operate e herda o mundo Adviser: DM Sans, azul de navegação, ação laranja, superfícies claras, bordas finas, estados com texto e controles existentes. Os tokens de base conferidos em `src/styles.css` correspondem aos registrados em DESIGN.md.

O sidecar mantém seus metadados anteriores, com `generatedAt` de 20/10/2026 e exemplos do sistema existente; não é um inventário completo das telas adicionadas em 30/10. Essa defasagem descritiva foi registrada sem regenerar tokens, DESIGN.md ou sidecar. Não foi feita reparação incidental de outras divergências preexistentes. Comparação de cotações, Inteligência e os demais módulos foram preservados; a revisão final não os recertificou integralmente.

Nenhum novo raster de produto foi criado. Os JPGs citados são evidências de captura do protótipo; os ativos de marca continuam regidos por [IDENTIDADE-VISUAL.md](IDENTIDADE-VISUAL.md).

## Limitações da revisão

O detector Impeccable não executou: uma tentativa anterior de download externo pelo launcher foi recusada pela revisão automática de aprovação. A continuidade usou os documentos existentes, inspeção de código, testes e evidência de UI; não houve nova tentativa do launcher nem alegação de detector aprovado.

IA, integrações, notificações e pagamentos permanecem locais ou simulados. A regra de responsáveis/unanimidade é demonstrativa, sem alçada de produção confirmada. O parecer permite apresentar a extensão do protótipo; não confirma publicação, autenticação, notificações externas, transações reais ou substituição do Conta Azul. O guia de uso e fases está em [FLUXO-CONECTADO.md](FLUXO-CONECTADO.md).
