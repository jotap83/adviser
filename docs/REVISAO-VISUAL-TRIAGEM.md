# Revisão — triagem de e-mails

Registro de 20/10/2026. Extensão em modo **Operate**, construída em código sobre o sistema Adviser existente. O contrato está em `.impeccable/surfaces/triagem.md`, com seed herdado `04f14614`; não houve nova direção visual. `DESIGN.md` e `.impeccable/design.json` foram preservados byte a byte nesta documentação.

## Composição e sistema visual

| Aspecto | Implementação observada |
| --- | --- |
| Entrada | Bloco compacto na visão geral com contagem de pendentes, estado simulado e acesso à revisão. A fila de demandas mantém o código permanente. |
| Decisão | Lista de mensagens, conteúdo original e área de associação. Motivos e ressalvas ficam junto de cada candidato; a confirmação exige seleção explícita. |
| Estado concluído | Destino, método, aviso de campos preservados, acesso ao briefing, correção e histórico de associação. |
| Marca e tipografia | Logo oficial existente, DM Sans, azul Adviser na navegação e seleção, laranja nas ações principais. Sem nova família, paleta ou asset. |
| Formas | Superfícies brancas planas, contornos finos, painéis de 12px e controles de 7px. Badges combinam cor e rótulo. Sem nova sombra ou efeito decorativo. |
| Responsividade | Lista e detalhe lado a lado no desktop. Até 1250px, mensagem e associação se empilham dentro do detalhe; até 760px, a lista também passa para cima. A escolha de mensagem no celular leva foco e rolagem ao detalhe. |

O breakpoint de 1250px pertence à composição local da triagem. Não exige mudança nos tokens globais. Não foi identificado desvio material do sistema visual no código e nos relatórios consultados. Não há novo raster de produto nesta extensão; as capturas abaixo são evidência de revisão, não assets da interface.

## Evidência visual e parecer

Foram consultados `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, o contrato de direção, os componentes/modelos da triagem, os pontos de integração e os relatórios `inbox-finish-review.md` e `inbox-finish-verdict.md`. As nove capturas estão em `.impeccable/review/` e não são versionadas:

| Captura | Dimensões | Estado |
| --- | --- | --- |
| `inbox-home-desktop.png` | 1440 × 1489 | Entrada e contagem na visão geral. |
| `inbox-home-mobile.png` | 390 × 2312 | Entrada móvel e referências na fila. |
| `inbox-review-desktop.png` | 1440 × 1371 | Mensagem, anexo, motivos e confirmação. |
| `inbox-review-mobile.png` | 390 × 2639 | Mensagem e decisão empilhadas. |
| `inbox-ambiguous-desktop.png` | 1440 × 1180 | Candidatos sem escolha inicial; confirmação desabilitada. |
| `inbox-linked-desktop.png` | 1440 × 1182 | Destino, método, correção e histórico. |
| `inbox-conflict-desktop.png` | 1440 × 1443 | Aviso de múltiplos códigos. |
| `inbox-new-desktop.png` | 1440 × 1000 | Sem candidato; escolha manual e nova demanda. |
| `inbox-thread-conflict-desktop.png` | 1440 × 1514 | Nova resposta pendente após conflito de conversa. |

O construtor abriu todas as capturas. O revisor independente abriu as oito iniciais, depois as reabriu e conferiu a nona no parecer final. Os relatórios registram conteúdo válido, topo do documento visível e ausência de regiões vazias ou quebradas.

A revisão inicial teve disposição **fix**: depois de uma correção dividir uma conversa entre duas demandas, o modelo preservava a nova resposta como pendente, mas a interface anunciava associação e abria o filtro errado. A correção passou a usar o estado efetivamente recebido para selecionar mensagem/filtro e formular o aviso.

O parecer final registrou **ship**, com o único achado material marcado **Resolved**. Conferiu o handler, as asserções da regressão e as nove capturas. Esse parecer cobre a correção pontuada; não representa uma nova aprovação integral da superfície. Não houve novo navegador, servidor, captura ou detector pelo revisor na etapa de parecer.

O detector foi invocado uma vez e retornou saída de zero bytes. O resultado é evidência indisponível, não certificação de ausência de problemas.

## Validação funcional reportada

Os resultados abaixo foram informados pelo construtor. Esta etapa documental não repetiu testes, build ou navegador.

| Verificação | Resultado e alcance |
| --- | --- |
| `npm run build` | Passou antes da correção final do aviso. |
| `npm test` | Cinco verificações de domínio passaram. |
| `SKIP_SCREENSHOTS=1 node tests/browser.mjs` | Regressão existente de navegação e fluxo comercial passou. |
| `node tests/inbox-browser.mjs` | Passou após a correção final: referências, seleção explícita, origem/correção, resposta por conversa, conflito após correção, códigos conflitantes, trabalho manual offline, ignorar/restaurar, nova demanda/cliente, recarga, idempotência e isolamento de conversa por conta. Verificou overflow em 1440px e 390px. |
| `tsc --noEmit` | Passou após a correção final. |
| `npm run build:standalone` | Reconstruiu `standalone/adviser-prototipo.html` após a correção. |
| `node tests/standalone-inbox.mjs` | Passou após a reconstrução, por `file://` offline, sem requisições HTTP nem erros de página. |

Não houve verificação de deploy Vercel nesta entrega. Os testes com servidor usam a porta 4173; o standalone dispensa servidor. Os comandos reproduzíveis estão em [TRIAGEM-DE-EMAILS.md](TRIAGEM-DE-EMAILS.md).

## Limites preservados

Sugestões são regras demonstrativas, sem IA semântica real ou percentuais de confiança. Código único ou conversa conhecida sem conflito podem gerar associação automática simulada; conteúdo sugerido depende de confirmação humana. O vínculo inclui fontes sem aplicar campos, valores ou aceite. A correção move as fontes e não desfaz dados estruturados já aplicados.

Estado e contadores são locais ao navegador. Gmail, IA externa, envio real, autenticação de produção, sincronização multiusuário e unicidade dos códigos em produção não foram implementados nem avaliados por esta revisão.
