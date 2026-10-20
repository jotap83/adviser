# Revisão visual — cotações e negociação

Registro de 20/10/2026. Extensão em modo **Operate** do sistema Adviser existente. A superfície mantém a identidade e os componentes vigentes; não houve mudança aprovada do sistema visual. `DESIGN.md` e `.impeccable/design.json` permanecem como referências, sem alteração nesta documentação.

## Composição implementada

- **Portal do fornecedor:** conserva logo, cabeçalho próprio, contexto do evento e painéis de formulário. Alternativas são grupos numerados com nome, detalhes, itens e base sem opcionais. O editor de itens existente reorganiza os campos no celular. Quando existe uma escolha, a composição e a ação de confirmar valores e disponibilidade aparecem antes da cotação e da conversa.
- **Escolha no comparativo:** cada fornecedor ocupa um bloco vertical com versão, estado, alternativas por radio e adicionais por checkbox. Itens incluídos têm identificação explícita. Total e ação de confirmar seguem os itens; escopo, condições, anexo e versões ficam em detalhes expansíveis. No celular, alternativas, valores e ações quebram em linhas, preservando os rótulos.
- **Conversa e versões:** mensagens mostram autor, versão e data/hora. O formulário distingue dúvida de pedido de ajuste e nova versão. O histórico apresenta versões anteriores em ordem decrescente, com alternativas, inclusões, valores e condições. Solicitar ajuste suspende a escolha; uma nova versão exige nova revisão, conforme o contrato funcional documentado.
- **Lista de cotações:** reutiliza tabela, badges e ações existentes para indicar retorno, valores e acesso à análise. O envio de solicitação continua explicitamente simulado.

## Comparação com o sistema vigente

| Aspecto | Evidência na extensão | Resultado |
| --- | --- | --- |
| Marca e cores | Logo existente; azul para seleção e total, laranja nas ações principais; `--blue`, `--muted` e `--line`. O fundo selecionado `#eef3fc` já corresponde a `colors.note-surface`. | Sem nova paleta ou asset. |
| Tipografia | DM Sans herdada; total em 19px, legendas em 16px, valores em 14px e metadados em 12px. | Valores compatíveis com a hierarquia existente. |
| Forma e densidade | Contorno fino, raio de controle de 7px, padding de 24px no comparativo e 20px no celular; gaps recorrentes de 12, 16 e 24px. | Reutiliza os padrões de controles e painéis. Ajustes locais de composição não criam uma escala global. |
| Componentes | `Button`, `Badge`, `Label`, `Note`, `LinesEditor` e `BrandLogo` existentes; radio, checkbox, fieldset e details nativos. | Sem substituição de componentes ou navegação. |
| Responsividade e profundidade | Reorganização no breakpoint existente de 760px; superfícies planas e separadores. | Sem novo breakpoint, sombra ou movimento. |

O único detector registrado encontrou dois avisos consultivos de tamanho tipográfico, 24px e 20px. O código final usa 19px em ambos os pontos, conforme `DESIGN.md`; o detector não foi repetido neste registro. A revisão também deixou como consultiva a cor verde dos estados “Ajuste solicitado” e “Aguardando confirmação” na tabela, derivada do status recebido. Essa observação permanece localizada e não altera o significado normativo de pendência no sistema.

## Evidência e alcance

Foram lidos `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, o brief `.impeccable/surfaces/fornecedores.md`, `docs/COTACOES-E-NEGOCIACAO.md`, os componentes `QuoteChoice` e `QuoteConversation`, as páginas `SupplierPortal`, `QuoteCompare` e `Quotes`, e `src/quote-workspace.css`. Também foram inspecionados o resultado do detector, os dois relatórios de revisão e as seis capturas renovadas em `.impeccable/review/`:

| Estado | Desktop | Celular |
| --- | --- | --- |
| Editor de alternativas | `supplier-options-desktop.png` · 1440 × 3633 | `supplier-options-mobile.png` · 390 × 5104 |
| Composição escolhida | `supplier-choice-desktop.png` · 1142 × 1935 | `supplier-choice-mobile.png` · 350 × 2882 |
| Confirmação do fornecedor | `supplier-confirmation-desktop.png` · 1440 × 2623 | `supplier-confirmation-mobile.png` · 390 × 3813 |

As capturas de escolha mostram o componente integral em viewports de 1440px e 390px; a topbar foi ocultada apenas na captura. Elas não comprovam o shell completo. As capturas renovadas preservam a leitura, as ações e as quebras esperadas, sem corte ou sobreposição visível nas três situações registradas.

`quote-finish-review.md` registrou uma correção material de texto. `quote-finish-verdict.md` encerrou esse achado como **RESOLVED** e a extensão como **SHIP**, após conferir a frase “Open bar incluído na composição apenas se selecionado.” e a integridade das seis capturas renovadas. A verificação final foi limitada a essa correção; não reabriu os pontos consultivos nem certificou a aplicação inteira.

Esta etapa documental não executou navegador, testes, build ou outro detector. Os resultados funcionais citados nos relatórios pertencem às verificações do construtor e estão registrados separadamente em `docs/VALIDACAO.md`.

## Limites preservados

Escolher uma composição e confirmar valores/disponibilidade não autorizam contratação ou execução. Alternativas não se somam; mudanças de inclusão ou preço exigem nova versão do fornecedor. A importação usa os itens escolhidos e preserva propostas já versionadas, conforme `docs/COTACOES-E-NEGOCIACAO.md`.

Dados, mensagens e confirmações continuam locais ao navegador. O portal mostra a solicitação correspondente na interface, sem autenticação ou isolamento real; anexos guardam apenas o nome. A revisão cobre a apresentação desta extensão demonstrativa, sem ampliar seu contrato para produção ou outras superfícies.
