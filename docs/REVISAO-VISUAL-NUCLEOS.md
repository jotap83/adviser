# Revisão visual — núcleos e carteiras

20/10/2026. **Parecer: entregar (`ship`), sem correções materiais pendentes.** Extensão ordinária do protótipo Adviser; preserva o sistema existente e não cria uma nova identidade visual.

## Persistência (`persistence`)

Pessoas, núcleos, coordenação e carteiras usam o estado local. A migração aditiva preserva os dados anteriores. A sugestão do responsável pela conta pode ser revista na criação da demanda; transferir a carteira não redistribui demandas existentes. O acesso do atendimento continua compartilhado. “Visualizar como” é demonstração, sem autenticação real. Dados, IA, recebimentos e envios continuam fictícios ou simulados; não há integrações reais nem sincronização entre usuários.

## Fidelidade (`fidelity`)

O revisor de acabamento confirmou as promessas de `.impeccable/surfaces/nucleos.md` e a direção herdada de `atendimento.md`: abas Pessoas/Núcleos e edição no próprio painel, carteira do cliente, filtros antes da fila e resumo gerencial com coordenação, clientes e integrantes. A assinatura de responsável sugerido com atribuições independentes corresponde ao código amostrado e aos testes fornecidos. As adaptações móveis preservam os controles e a leitura; tabelas rolam dentro dos contêineres.

A comparação com `DESIGN.md` e `.impeccable/design.json` confirma:

- Azul Adviser `#293e91`, laranja `#e94e1d`, papel branco e cores funcionais de estado.
- DM Sans; títulos de tela/seção em 29/19px, corpo em 14px e conteúdo compacto em 12px.
- Painéis planos de 12px, controles de 7px, contornos finos e labels persistentes.
- Regra **Ação visível**: próxima ação legível na fila nas duas larguras.
- Regras **Estado verdadeiro** e **Plano por padrão** preservadas; nenhuma nova animação decorativa.

Foco azul de 2px e sublinhado de 3px das novas abas são variantes locais; não redefinem os padrões globais.

## Alcance da verificação (`ceiling`)

O revisor examinou as oito capturas completas `nuclei-{settings,portfolio,home,management}-{desktop,mobile}.png`, em `.impeccable/review/`, com viewports de 1440×1000 e 390×844. A documentação conferiu a presença/dimensões das oito imagens e amostrou visualmente configurações desktop e atendimento móvel. A leitura de código foi amostral nas superfícies alteradas, não uma auditoria integral de arquivos inalterados.

Foram conferidos `src/organization.css`, `src/organization.ts`, `src/components/TeamManagement.tsx`, trechos de `styles.css` e `UI.tsx`, alterações de Settings, Directory, Home, Inbox, Management e App, os dois contratos, `PRODUCT.md`, `docs/NUCLEOS-CARTEIRAS.md` e `tests/organization-browser.mjs`.

Resultados fornecidos pela implementação: cinco testes em `npm test`, `npm run build`, suíte `organization-browser` e regressão `channels-browser` com `CAPTURE=0` aprovados. A suíte de organização cobre migração, vínculos, transferência de carteira, responsável independente, entrada direta/Gmail/WhatsApp, filtros, acesso compartilhado, recarga e overflow. Esses resultados não foram executados novamente nesta etapa documental.

## Correções materiais (`material_fixes`)

Nenhuma pendente no parecer de acabamento. O único aviso de `nuclei-detector.json` apontava `#a12622`; o código final usa o vermelho existente `#a03131` (`status-red-text`). Foi uma correção mecânica, sem ampliar a paleta. O relatório permanece como evidência da execução original; não houve segunda rodada do detector. Nenhum raster novo foi incorporado ao produto, portanto não há nova obrigação de proveniência de assets.

## Preservar (`keep`)

`DESIGN.md` e `.impeccable/design.json` foram preservados sem alteração. Seus hashes SHA-256 antes e depois deste registro são, respectivamente, `8e7904880cb0b7a63fcb53def0c7ae0d56174693dc7500aab68bb603a1266058` e `7c903710f9c4cba96d0cb76dcb08b70e6dff781ddf81c87035e225d5531a4412`.

Deriva preexistente observada: `styles.css` já possui um breakpoint de 1150px para gestão/escopo, ausente do inventário canônico de breakpoints; sua presença no HEAD foi confirmada. Não foi corrigido nem canonizado porque esta entrega amplia superfícies do sistema existente, sem autorizar sua revisão global. O guia funcional permanece em `docs/NUCLEOS-CARTEIRAS.md`.
