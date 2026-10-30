> Registro anterior: as regras de ciclo e navegação foram revistas em 30/10/2026. Consulte [Revisão do ciclo completo](REVISAO-CICLO-COMPLETO.md) e PRODUCT.md para o comportamento vigente.

# Fluxo conectado entre áreas

Registro de 30/10/2026. A extensão trabalha no aplicativo React do repositório Adviser e conecta a primeira solicitação, atendimento, aprovações, operações, financeiro e gestão. Preserva os módulos existentes, incluindo comparação de cotações e Inteligência, e a identidade definida em [DESIGN.md](../DESIGN.md).

## Entradas e navegação

| Entrada | Comportamento |
| --- | --- |
| Área de trabalho, no cabeçalho | Navega para Atendimento, Operações, Financeiro, Visão gerencial ou Aprovações. |
| Visualizar como | Troca a pessoa simulada; na carteira de atendimento, ativa Meus atendimentos e atualiza a fila. Também permite demonstrar os avisos e decisões de cada responsável. |
| Central de atendimento (`#/mensagens`) | Recebe os exemplos Gmail/WhatsApp, permite classificar, criar um evento ou vincular a um existente. `#/emails` continua como alias. |
| Operações (`#/operacoes`) | Abre a carteira global, com alternativa de fila de tarefas entre eventos. |
| Financeiro (`#/financeiro`) | Abre contas e totais consolidados, com filtro por evento. |
| Visão gerencial (`#/gestao`) | Mantém os indicadores e filtros do atendimento e acrescenta um panorama de todas as áreas com acessos diretos. |
| Aprovações (`#/aprovacoes`) | Reúne propostas e pagamentos, responsáveis e histórico. A visão de todas as aprovações é acessível em `#/aprovacoes/todas`. |

Trocar a pessoa é uma simulação de uso, sem autenticação ou controle de acesso real. O panorama entre áreas é global; os filtros do atendimento abaixo dele não limitam seus totais.

## Começar pela primeira mensagem

1. Na Central de atendimento, abra uma mensagem pendente. **Criar novo evento** aparece antes das sugestões de vínculo e funciona mesmo sem eventos anteriores.
2. Use **Classificar com IA** para obter uma sugestão simulada, ou escolha manualmente o tipo. Revise a prioridade e confirme a classificação. A prioridade confirmada ordena a triagem; classificar não cria nem vincula o evento.
3. Crie o evento com um cliente existente ou cadastre empresa e contato. Escolha o responsável e confirme.
4. O briefing abre com a origem preservada, o pedido original, a mensagem na conversa e seus anexos. A associação não aplica automaticamente campos estruturados, valores ou aceite; a equipe revisa o briefing.

Quando a IA está indisponível, a classificação manual continua disponível. Para uma demanda existente, a equipe pode confirmar o vínculo sem criar outro evento. O cadastro direto também permanece disponível.

## Aprovar a versão certa

Na etapa Aprovação da proposta, escolha os responsáveis e use **Solicitar aprovação e avisar**. A central mostra a cópia preservada da versão solicitada, incluindo itens, quantidades, valores, fee, total e condições. Alterar o rascunho não muda essa cópia. **Abrir registro de origem** seleciona a versão correspondente, inclusive quando uma versão anterior já foi enviada.

A regra demonstrativa exige outra pessoa ativa para revisar; o solicitante não aprova o próprio pedido. Todos os revisores designados precisam aprovar. Pedir ajustes exige motivo, preserva o histórico e permite outra rodada. Outra versão ou alteração relevante no pagamento exige revisão própria. Essa regra é ilustrativa e precisa ser validada com a Adviser: não representa uma alçada de produção confirmada.

Os responsáveis recebem avisos internos locais. O resultado retorna ao solicitante. Abrir um aviso leva à solicitação exata, incluindo aprovações concluídas e pedidos de ajuste, mesmo quando ela não aparece no filtro pessoal de pendências.

Novos envios de proposta e novas baixas de contas a pagar ficam condicionados à aprovação interna correspondente. Exemplos legados já enviados ou baixados não são alterados retroativamente. Aprovação interna, aceite pelo cliente e contratação são ações distintas; aprovar não envia, contrata ou paga automaticamente.

## Trabalhar entre eventos

Operações reúne todos os projetos recebidos. **Todos os eventos** oferece contexto, responsáveis e pendências; **Tarefas entre eventos** reúne o trabalho transversal e permite filtrar tarefas abertas, atrasadas ou bloqueadas. Ambas as visões buscam por evento, cliente e tarefa. O detalhe por evento conserva quadro, checklist, comentários, histórico e retorno ao atendimento.

O recebimento de um novo projeto continua explícito: exige proposta aceita e repasse preparado, preserva a versão de origem e evita duplicidade. Abrir a carteira não cria projetos automaticamente.

Financeiro consolida contas a pagar e receber e permite detalhar um evento. Para demonstrar pagamento: solicite aprovação na conta a pagar, alterne para o revisor, registre sua decisão, retorne ao solicitante e faça a baixa simulada. A aprovação libera a ação; a baixa é uma confirmação separada e atualiza os totais locais.

O Painel Gerencial acrescenta eventos em operação e tarefas atrasadas, aprovações pendentes e contas a pagar/receber, com navegação para cada área. Os valores vêm dos exemplos salvos no protótipo.

## Fases de entrega

| Fase | Escopo que a demonstração ajuda a explicar |
| --- | --- |
| 1 — Atendimento | Cadastros, Gmail/WhatsApp e IA previstos na implementação, briefing, cotações e negociação, propostas, aprovação interna, aceite, repasse, visão gerencial, alertas e apoio criativo. |
| 2 — Operações | Coordenação por evento, tarefas, responsáveis, prazos, bloqueios, checklist, comentários e histórico. |
| 3 — Financeiro | Contas a pagar/receber, aprovação de pagamentos, caixa, previsto/realizado e fechamento. |

As telas Fluxo do sistema e Escopo e etapas explicam essa separação. A existência de uma demonstração navegável não amplia o escopo comercial fechado. Não há migração ou integração com Trello. A Adviser ainda decidirá se mantém, integra ou substitui funções do Conta Azul.

## Roteiro breve de demonstração

1. Abra a primeira solicitação de Carolina/Vereda, revise a classificação e crie evento e cliente. Confira origem, pedido e conversa no briefing.
2. Troque **Visualizar como** para Rafael Lima e observe Meus atendimentos; use **Área** para abrir Operações e alternar carteira/fila de tarefas.
3. Busque **Receber documentação técnica** na carteira e **Grupo Horizonte** nas tarefas. Abra um evento para examinar seu contexto.
4. Em uma proposta com v1 enviada, salve v2 com novas condições e solicite revisão a Joana. Confira a cópia da v2 na central e o retorno à mesma versão. Peça ajustes e abra o resultado como solicitante.
5. No Financeiro, percorra solicitar aprovação → aviso ao revisor → decisão → aviso ao solicitante → baixa simulada. Termine no Painel Gerencial e navegue pelo panorama entre áreas.

Nomes e contagens são dados fictícios e podem mudar após ações locais ou restauração dos exemplos. Os tours existentes continuam disponíveis para apresentações guiadas.

## Limites

Estado local ao navegador, sem persistência compartilhada ou autenticação real. IA, mensagens, avisos e pagamentos são simulados; não há envio externo nem transação financeira. Revisão humana e entrada manual permanecem disponíveis. A validação desta entrega está em [REVISAO-FLUXO-CONECTADO.md](REVISAO-FLUXO-CONECTADO.md).
