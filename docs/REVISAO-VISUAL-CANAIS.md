# Revisão visual — atendimento centralizado

Registro de 20/10/2026. Extensão em modo **Operate** do quadro de produção de eventos, seed herdado `04f14614`. Cadastro direto, Gmail e WhatsApp convergem para a mesma demanda; a entrada manual e o briefing continuam disponíveis sem IA ou canal conectado.

## Artefatos e adaptação

O contrato está em `.impeccable/surfaces/triagem.md`, apoiado por `PRODUCT.md` e pelo contrato original de `.impeccable/surfaces/atendimento.md`. O comportamento e o escopo vigente estão em [ATENDIMENTO-CENTRALIZADO.md](ATENDIMENTO-CENTRALIZADO.md) e [CANAIS-NO-MVP.md](CANAIS-NO-MVP.md).

| Artefato | Papel na extensão |
| --- | --- |
| `src/channels.ts` | Exemplos dos canais, contatos e janela demonstrativa do WhatsApp. |
| `src/components/ReceiveMessage.tsx`, `ReplyComposer.tsx` | Recebimento editável e resposta revisada, com limites da simulação visíveis. |
| `src/pages/Inbox.tsx`, `src/inbox-workspace.css` | Central em `#/mensagens`, preservando `#/emails`; filtros, vínculo, resposta e adaptação móvel. |
| `src/pages/Home.tsx`, `Briefing.tsx`, `Directory.tsx`, `src/components/ClientConversation.tsx` | Cadastro sem e-mail obrigatório, preenchimento sem IA, contatos e histórico conjunto. |
| `src/store.tsx` | Persistência local e inclusão dos exemplos uma única vez. |

A extensão reutiliza a logo oficial, DM Sans local, azul Adviser e laranja nas ações, superfícies brancas planas, contornos finos, painéis de 12px e controles de 7px. Rótulos acompanham os estados coloridos. A central mantém a composição da triagem: mensagem e associação se empilham até 1250px; até 760px, lista e detalhe ficam em uma coluna e as ações de resposta ocupam a largura disponível. Esses ajustes pertencem à superfície existente.

`DESIGN.md` e `.impeccable/design.json` foram conferidos contra `src/styles.css`, os estilos da central e os componentes novos, e permanecem inalterados. Não há nova direção, família tipográfica, paleta ou raster de produto. As capturas são evidência de revisão, não imagens usadas pela interface.

## Evidência e correções

O construtor abriu as seis capturas válidas, feitas com página inteira em viewports de 1440 × 1000 e 390 × 844, e concluiu a rodada inicial e a confirmação. O lote atual está em `.impeccable/review/`:

| Estado | Desktop | Celular |
| --- | --- | --- |
| Central e canais | `channels-central-desktop.png` | `channels-central-mobile.png` |
| Cadastro direto com IA indisponível | `channels-manual-desktop.png` | `channels-manual-mobile.png` |
| Resposta WhatsApp, modelo e autorização | `channels-whatsapp-desktop.png` | `channels-whatsapp-mobile.png` |

A revisão independente solicitou dois ajustes: remover a confirmação do envio anterior ao editar um novo rascunho, destinatário, janela, modelo ou anexos; e tornar visível, no contexto do vínculo, a ação **Responder pela plataforma**. O código atual limpa a confirmação nesses casos. A ação contextual leva a rolagem ao compositor, foca a seleção de canal e preserva 85px de margem para o cabeçalho aderente.

O parecer final do revisor registrou **ship**, com os dois ajustes resolvidos, as seis recapturas válidas e nenhuma pendência restante no escopo da confirmação. Esse parecer verifica as correções apontadas; não constitui uma nova auditoria integral nem aprovação de produção.

O único detector desta extensão, registrado em `/workspace/scratch/1cd42aaf06fd/channels-detect.json`, apontou um aviso consultivo: o título do resumo usa 18px, fora da escala documentada. O mesmo valor já consta da versão anterior de `src/inbox-workspace.css`; não foi corrigido nem promovido a token global neste trabalho.

O construtor informou aprovação de `tests/channels-browser.mjs` após os dois ajustes. O teste cobre cliente novo sem e-mail, campos sem IA, canais simulados, vínculo sem alterar o briefing, revisão de respostas, janela/modelo/autorização do WhatsApp, histórico conjunto, contato manual, recarga sem duplicar exemplos e ausência de overflow nas duas larguras. Também verifica a limpeza da confirmação e o acesso ao compositor.

Na verificação final reportada, `npm run build` passou e `npm test` concluiu cinco verificações. As regressões `tests/inbox-browser.mjs` e `tests/briefing-browser.mjs` passaram com `CAPTURE=0`, após ajuste dos seletores e exemplos afetados: correção de vínculo, conflitos, isolamento por conta, anexos PDF/DOCX/XLSX, histórico criativo e navegação. Não houve rodada adicional de capturas. Esta documentação não repetiu testes, navegador ou detector. A publicação e a verificação do deploy ainda estavam pendentes ao fechar este registro.

## Persistência e limites

Demandas, clientes, mensagens, respostas e histórico persistem no `localStorage` deste navegador, na chave `adviser-demo-v1`; isso não oferece armazenamento compartilhado ou sincronização multiusuário. Os exemplos são fictícios e acrescentados sem reiniciar os dados locais existentes. Os envios registram nomes de anexos selecionados, sem transmitir arquivos.

Gmail, WhatsApp e IA permanecem simulados. A janela de 24 horas, o modelo de retomada e a confirmação de autorização demonstram o fluxo; não representam conta conectada, modelo aprovado, entrega ou leitura real. A IA usa regras e exemplos determinísticos. Receber, vincular ou responder não aplica campos, valores ou aceite automaticamente. Integrações reais, backend e autorizações pertencem à implementação prevista do MVP; este registro não certifica produção.
