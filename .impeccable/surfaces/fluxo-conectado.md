# Atendimento, operações, gestão e aprovações

Mode: Operate. Extensão funcional da identidade Adviser existente, sem troca de marca ou sistema visual. Pedido de 30/10/2026: trabalhar no repositório real, recuperar completude da prévia, corrigir seletores, criar evento desde a primeira mensagem, Operações global e visão gerencial explícita. Commit e publicação autorizados.

## Direction contract

THESIS: O trabalho começa na solicitação e atravessa áreas globais; o evento mantém o contexto sem aprisionar a operação.

OWN-WORLD: Herda integralmente DESIGN.md: DM Sans, azul Adviser, ação laranja, fundo claro, controles e painéis existentes.

STORY: Classificar e criar/vincular; revisar briefing e cotações; pedir aprovação, avisar responsáveis; encaminhar versão aceita a Operações; acompanhar contas e decisões gerenciais.

FIRST VIEWPORT: Área de trabalho no cabeçalho muda a rota. Carteira em Operações, totais e filtro de todos os eventos no Financeiro, panorama entre áreas na Gestão. Na associação, criar novo evento aparece antes das sugestões.

FORM: Listas de carteira e fila de tarefas com detalhe por evento; central de aprovações por pessoa. Extensão prescrita pelo usuário, código sobre componentes existentes; sem novo sorteio de identidade. A classificação é sugestão editável; revisores decidem sobre versão preservada.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Limites

Dados fictícios locais; IA, mensagens, avisos e pagamentos simulados. Sem autenticação nem notificações externas. Aprovações de proposta pertencem ao Atendimento; pagamentos são etapa 3. Novas telas não ampliam o escopo comercial fechado. Conta Azul pode ser mantido/integrado; não há decisão de substituição.

## Extensão do ciclo completo — 30/10/2026

Extensão funcional do mesmo sistema, conforme PRODUCT.md revisado. O evento permanece desde a entrada até o encerramento; solicitações, documentos e decisões pertencem a ele. A apresentação criativa ocupa área própria na elaboração da proposta. Contratos, produção, pós-evento e financeiro mantêm o contexto do evento e as carteiras globais.

- **Navegação do evento:** oito grupos — Panorama, Entrada e briefing, Elaboração da proposta, Contratos, Produção, Pós-evento, Financeiro e Documentos. Entrada e elaboração têm subnavegação. O grupo consultado usa seleção azul e `aria-current`; consultar uma página não conclui uma etapa. Os controles quebram em linhas e conservam altura mínima de 44px.
- **Panorama e ciclo:** sequência vertical numerada, pendências reais dos registros locais e acesso às ações correspondentes. Contadores não representam resultados de negócio. A fase é derivada do estado, com financeiro acessível durante todo o trabalho.
- **Documentos e solicitações:** lista de versões com detalhe de conteúdo e decisões; solicitações em linhas com responsável, prazo, situação e origem. Formulários, avisos, badges e ações reutilizam os componentes compartilhados. Contratos, cronograma, materiais e pós-evento usam essas mesmas estruturas.
- **Composição responsiva declarada no código:** panorama e documentos passam a uma coluna até 900px; lista de documentos passa de duas colunas a uma até 500px. Formulários e solicitações se reorganizam sem criar outra identidade visual. O comportamento renderizado ainda precisa de recaptura.

### Comparação com o sistema existente

Comparação por fonte de `src/event-lifecycle.css`, `src/App.tsx`, `src/pages/EventLifecycle.tsx`, `src/pages/EventDocuments.tsx`, `src/pages/EventRequests.tsx` e `src/components/UI.tsx` contra `src/styles.css`, DESIGN.md e `.impeccable/design.json`: DM Sans, azul/laranja Adviser, superfícies brancas, contornos finos, foco global e componentes de trabalho preservados. A extensão não adiciona rasters, gradientes, sombras decorativas ou uma família tipográfica. As dimensões específicas de navegação e composição permanecem locais à superfície.

DESIGN.md e `.impeccable/design.json` permanecem inalterados. Seus exemplos de seis etapas representam o dossiê anterior; a navegação agrupada desta extensão está descrita acima, sem promover a composição local a uma mudança do sistema. Exceção preexistente identificada por fonte e preservada: `src/connected-workspace.css` define altura mínima de 36px para o seletor de área, enquanto DESIGN.md descreve 41px para os campos gerais. Não foi feito reparo nem atualização dos tokens.

### Evidência e pendência

Build concluído e 59 testes aprovados; quatro correções funcionais receberam parecer de resolvidas na revisão por fonte. O detector foi executado uma vez sobre os arquivos alterados, com duas recomendações corrigidas. Uma inspeção anterior do DOM confirmou a separação da apresentação criativa do briefing e os acessos a contratos e produção; ela não substitui inspeção visual final.

**Revisão visual incompleta: disposição `recapture`.** O renderizador ficou indisponível após três tentativas de 300 segundos, incluindo reinicialização. Não há capturas novas de desktop ou celular nem parecer visual de aprovação. A conferência por fonte documenta a extensão, mas não comprova ausência de overflow, sobreposição ou falhas de composição na renderização final. Recapturar ambas as larguras e concluir o parecer visual permanece pendente.
