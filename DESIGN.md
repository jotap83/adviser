---
name: "Adviser"
description: "Quadro operacional de atendimento e produção de eventos, com uma próxima ação clara por demanda."
colors:
  blue: "#293e91"
  orange: "#e94e1d"
  orange-hover: "#f57143"
  orange-ink: "#1c1c1c"
  canvas: "#f5f7fb"
  paper: "#fff"
  text: "#233149"
  muted: "#62718a"
  secondary-text: "#596d89"
  line: "#e2e7ef"
  control-border: "#cbd4e1"
  focus: "#e94e1d"
  button-text: "#36445b"
  button-border: "#d5dce7"
  button-hover: "#f1f5fc"
  button-hover-border: "#b6c5db"
  ghost-text: "#4c607d"
  quiet-surface: "#edf2fa"
  nav-text: "#e1e6f6"
  nav-hover: "#223479"
  nav-selected: "#fff"
  status-neutral-surface: "#edf1f6"
  status-neutral-text: "#526079"
  status-blue-surface: "#e9f0ff"
  status-blue-text: "#293e91"
  status-green-surface: "#e7f3ed"
  status-green-text: "#246346"
  status-amber-surface: "#fff2dd"
  status-amber-text: "#886017"
  status-red-surface: "#fcebea"
  status-red-text: "#a03131"
  danger: "#b73636"
  danger-hover: "#952929"
  note-surface: "#eef3fc"
  note-text: "#36547d"
typography:
  headline:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "29px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  subtitle:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "-0.015em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  body-compact:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.5
  button:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
  badge:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.5
  navigation:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.5
  table-heading:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.025em"
rounded:
  chip: "5px"
  icon: "6px"
  control: "7px"
  note: "8px"
  toast: "10px"
  panel: "12px"
  circle: "50%"
spacing:
  "4": "4px"
  "6": "6px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "18": "18px"
  "20": "20px"
  "24": "24px"
  "28": "28px"
  "32": "32px"
  "48": "48px"
components:
  button-primary:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.orange-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
  button-primary-hover:
    backgroundColor: "{colors.orange-hover}"
    textColor: "{colors.orange-ink}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.button-text}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
  button-secondary-hover:
    backgroundColor: "{colors.button-hover}"
    textColor: "{colors.button-text}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ghost-text}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
  button-ghost-hover:
    backgroundColor: "{colors.quiet-surface}"
    textColor: "{colors.ghost-text}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.paper}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
  button-danger-hover:
    backgroundColor: "{colors.danger-hover}"
    textColor: "{colors.paper}"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  navigation:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.nav-text}"
    typography: "{typography.navigation}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  navigation-selected:
    backgroundColor: "{colors.nav-selected}"
    textColor: "{colors.blue}"
  badge-neutral:
    backgroundColor: "{colors.status-neutral-surface}"
    textColor: "{colors.status-neutral-text}"
    typography: "{typography.badge}"
    rounded: "{rounded.chip}"
    padding: "4px 8px"
  badge-blue:
    backgroundColor: "{colors.status-blue-surface}"
    textColor: "{colors.status-blue-text}"
    typography: "{typography.badge}"
    rounded: "{rounded.chip}"
    padding: "4px 8px"
  badge-green:
    backgroundColor: "{colors.status-green-surface}"
    textColor: "{colors.status-green-text}"
    typography: "{typography.badge}"
    rounded: "{rounded.chip}"
    padding: "4px 8px"
  badge-amber:
    backgroundColor: "{colors.status-amber-surface}"
    textColor: "{colors.status-amber-text}"
    typography: "{typography.badge}"
    rounded: "{rounded.chip}"
    padding: "4px 8px"
  badge-red:
    backgroundColor: "{colors.status-red-surface}"
    textColor: "{colors.status-red-text}"
    typography: "{typography.badge}"
    rounded: "{rounded.chip}"
    padding: "4px 8px"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "24px"
  note:
    backgroundColor: "{colors.note-surface}"
    textColor: "{colors.note-text}"
    typography: "{typography.body-compact}"
    rounded: "{rounded.note}"
    padding: "14px 16px"
  workflow-step:
    backgroundColor: "transparent"
    textColor: "{colors.secondary-text}"
    typography: "{typography.label}"
    padding: "13px 10px"
  supplier-items:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text}"
    typography: "{typography.body-compact}"
---

# Design System: Adviser

## Overview

**Creative North Star: "Quadro de produção de eventos"**

A Adviser organiza o trabalho do atendimento em uma fila legível e um dossiê numerado por evento. A navegação usa o azul da logo da Adviser, com superfícies brancas, linhas finas e ações principais em laranja. A logo oficial aparece no menu, cabeçalho móvel, portal e proposta. A densidade serve à leitura de escopo, responsáveis, condições e valores; não depende de ilustrações ou efeitos decorativos.

Este registro descreve o protótipo implementado em React, TypeScript e Vite. O estado é local ao navegador, a IA e os envios são simulados, e as etapas futuras recebem identificação explícita. A comunicação visual dessas limitações faz parte do sistema; a documentação não certifica prontidão para produção.

**Key Characteristics:**

- Fila de demandas com responsável, fase e próxima ação visíveis.
- Dossiê numerado e fluxo vertical com início e fim explícitos.
- DM Sans local, hierarquia compacta e números tabulares.
- Superfícies planas, contornos finos e cor funcional para estados.

Extraído de src/styles.css, src/App.tsx, src/components/UI.tsx e das telas de atendimento. PRODUCT.md define os limites do produto; .impeccable/surfaces/atendimento.md preserva a direção desta superfície. O frontmatter é a referência dos tokens observados; .impeccable/design.json acrescenta exemplos e metadados.

## Colors

A paleta principal vem da logo oficial: azul #293E91 e laranja #E94E1D. Branco e neutros claros apoiam a leitura; verde, âmbar e vermelho mantêm significado operacional. A origem dos arquivos está em docs/IDENTIDADE-VISUAL.md.

### Primary

- **Azul Adviser:** navegação, links, caret, campos, seleção do fluxo e cabeçalhos de proposta.
- **Laranja Adviser:** ações principais e foco. Botões usam texto #1C1C1C para contraste mínimo de 4,5:1; o hover usa laranja mais claro. A seleção da navegação usa branco sobre o trilho azul.

### Neutral

- **Papel branco e fundo claro:** painéis, formulários e área de trabalho. Faixas azuis suaves contextualizam avisos e a demonstração.
- **Tinta e textos secundários:** conteúdo, contexto e metadados, com cores separadas para texto principal, muted e texto auxiliar recorrente.
- **Linhas e contornos:** separação entre linhas de tabela, campos e painéis; o laranja de foco aparece com contorno deslocado; no trilho azul, o contorno é branco.

### Functional states

Os pares de superfície/texto de badges são normativos: neutro para contexto, azul para andamento ou seleção, verde para recebido/aprovado, âmbar para pendência e vermelho para recusa/erro. A cor acompanha texto; não é o único sinal. Avisos informativos, de sucesso, alerta e erro têm fundos suaves próprios na implementação. As rampas do sidecar são amostras derivadas para o painel de design, não novas cores de uso no CSS.

## Typography

**Fonte única:** DM Sans, carregada localmente por @fontsource nas espessuras 400, 500, 600 e 700; fallback sans-serif. A família compacta e sem ornamento favorece leitura contínua de formulários e valores. O documento usa números tabulares globalmente, inclusive nas colunas numéricas alinhadas à direita.

A hierarquia normativa está no frontmatter: headline para título da tela, title e subtitle para seções, body para leitura, label para campos, button para ações e badge para estado. A marca é a imagem original da Adviser, incorporada localmente e preservada em suas proporções; não é recriada com uma fonte. Títulos de página equilibram quebras; descrições de abertura ficam em até 75ch. Tabelas usam cabeçalhos pequenos em caixa alta e conteúdo compacto; metadados existentes variam entre 9 e 13px, sem aplicar essa densidade à entrada móvel.

No breakpoint móvel, o título de página passa a 26px, o título do evento a 23px e inputs dentro de campos passam a 16px. O título do evento no desktop é uma variante de 27px. Essas diferenças pertencem à composição, não a novas famílias tipográficas.

## Layout

O desktop usa navegação fixa à esquerda (230px), topbar aderente ao topo durante a rolagem (67px) e conteúdo central de até 1550px com padding de 35px 34px 20px. A partir de 761px, o controle do cabeçalho alterna a navegação expandida e um trilho de ícones (76px); a área de trabalho acompanha essa largura. A preferência é local ao navegador. A fila é o conteúdo principal; a atividade secundária ocupa uma coluna de 235px. O resumo de fases tem seis colunas. Briefing e comparação usam duas colunas, enquanto a proposta pode reservar 275px ao resumo financeiro.

O menu lateral usa espaçamento compacto sem reduzir seus alvos de interação. A lista tem rolagem vertical própria quando a altura disponível não comporta todas as opções; marca e identificação da pessoa permanecem fora dessa rolagem. O cabeçalho preserva o contexto e o controle do menu durante a leitura de páginas longas.

Painéis usam o espaçamento amplo da escala; formulários agrupam campos com gap horizontal de 18px. Há ritmos intermediários observados no CSS: controles com padding assimétrico, linhas de demanda com 22px e telas com margens próprias. Não há uma grade estrita de múltiplos de oito.

| Consulta de mídia | Comportamento implementado |
| --- | --- |
| Até 1200px | Navegação expandida de 210px; no desktop, o trilho recolhido continua com 76px. Padding lateral de 25px; resumo financeiro passa abaixo da edição. |
| Até 1000px | Fila, briefing e navegação de templates se reorganizam; formulários de três colunas passam a duas. |
| Até 760px | Navegação em gaveta de 235px com backdrop; topbar aderente ao topo de 58px; conteúdo com 20px laterais; resumo de fases em três colunas; formulários e comparativos em uma coluna. |
| A partir de 1500px | Mais espaço ao status da demanda; a próxima ação já permanece visível em todas as larguras pelas regras finais da folha. |

No celular, a próxima ação ocupa a linha inferior da demanda; abas de etapas rolam horizontalmente. O editor de itens troca a tabela por blocos de duas colunas com descrição em largura total e rótulos de quantidade, unitário e total. Tabelas de consulta continuam com rolagem dentro do próprio contêiner, sem alargar a página.

O portal do fornecedor tem cabeçalho próprio, contexto do evento e conteúdo de até 1040px. A proposta imprimível tem até 980px; a impressão mostra somente o documento em A4, com margens de 14mm, cabeçalho de tabela repetível e blocos financeiros sem quebra interna.

## Elevation & Depth

**The Plano por padrão Rule.** Painéis e tabelas se separam por cor de fundo e contorno; a sombra existente pertence ao aviso flutuante.

O aviso flutuante usa a sombra 0 10px 30px -8px #15274426, registrada no sidecar. O cabeçalho aderente fica no nível 30, a navegação no 40, seu backdrop no 35 e o aviso no 100. Não há blur, gradiente ou elevação persistente nos cartões.

## Shapes

Painéis têm cantos moderados; controles são mais contidos e badges são pequenos retângulos arredondados. A escala de raios no frontmatter corresponde aos valores em uso. Círculos ficam reservados a avatares, marcadores e números de etapa, não ao corpo dos formulários. Contornos comuns têm 1px; a aba ativa usa uma linha inferior de 2px. Formas tracejadas distinguem trechos futuros no fluxo.

## Components

### Buttons

Quatro variantes reais: primary, secondary, ghost e danger. Mantêm label explícito e ícone opcional de 16px, com altura mínima de 40px. Ações se agrupam em linhas que quebram quando necessário. Busy desativa o botão e troca o ícone por um indicador de processamento; disabled usa opacidade de 0,52 e cursor de indisponível. Botões apenas com ícone são de 36px e recebem nome acessível.

Hover de botões e borda de campos transitam em 150ms. O foco de teclado usa outline laranja de 3px, com offset de 3px; no menu azul o outline é branco. Não há escala ou deslocamento decorativo em ações. O menu móvel entra por transformação em 200ms ease-out; o spinner gira em 800ms linear. A preferência por movimento reduzido remove transições, reduz animações a 0,01ms e mantém rolagem automática.

### Inputs / Fields

Labels persistentes, dicas abaixo do controle e fundo branco. Campos têm altura mínima de 41px, borda própria e foco azul. Textareas crescem verticalmente e usam entrelinha de 1,65. Checkbox nativo usa a cor primária. Erros são textuais e aparecem próximos à ação ou ao formulário; campos desativados recebem fundo claro.

### Navigation

A navegação principal combina ícone, label e estado ativo preenchido. Seus alvos têm pelo menos 44px de altura e usam o padding compacto do frontmatter. Recolhida no desktop, mantém os ícones, a seleção e os nomes acessíveis; o controle de recolher/expandir tem 44px e informa seu estado. No celular, a gaveta aberta contém o foco e bloqueia a interação com a área de trabalho; pode ser fechada pelo botão, backdrop ou Escape, com retorno do foco ao controle de origem. As abas do dossiê usam numeração circular, sublinhado azul na aba consultada e check verde nas etapas concluídas pelo estado salvo.

**The Estado verdadeiro Rule.** A etapa consultada pode mudar sem concluir o fluxo. A conclusão visual deriva do estado salvo e a validação do briefing exige confirmação humana do alinhamento.

### Chips / Notes

Badges compactos identificam etapa, recebimento, seleção e limites de escopo. Notas usam ícone informativo, texto e fundo tonal; o protótipo mantém uma faixa persistente de demonstração. O portal do fornecedor repete o limite de dados locais e ausência de autenticação real. O aviso flutuante é anunciado como status e pode ser fechado; desaparece após sete segundos.

### Cards / Containers

Painel branco com contorno fino e padding amplo é o contêiner básico. A variante sem padding recebe tabelas. Cartões de comparação mostram fornecedor, valor, itens e condições; a seleção muda contorno e fundo, além do badge textual e do botão. Estados vazios explicam a situação e oferecem uma ação contextual quando há caminho de saída.

### Work queue / Dossier / Flow

A linha de demanda reúne monograma do cliente, nome do evento, contexto, fase, responsável e próxima ação. O dossiê conserva cabeçalho do evento, histórico e seis etapas: Briefing, Cotações, Comparativo, Proposta, Aprovação e Repasse. O fluxo explicativo é vertical, com números, responsáveis, setas e marcadores de início/fim; os trechos futuros têm texto e contorno distintos.

**The Ação visível Rule.** Cada demanda mantém sua próxima ação legível no desktop e no celular; um ícone isolado não substitui o texto.

A confirmação de alinhamento fica depois dos esclarecimentos e exige ação humana antes de validar o briefing. A edição dos itens mantém descrição, grupo, quantidade, unitário, total e, quando aplicável, modalidade de pagamento. A proposta agrupa linhas por categoria, destaca o total e mantém versão e condições legíveis; alterações no rascunho não devem sugerir que uma versão salva foi substituída.

## Do's and Don'ts

### Do:

- Do preservar o trilho azul Adviser e a área clara de trabalho nas novas telas operacionais.
- Do usar laranja nas ações principais e azul em links e seleção, com rótulos explícitos junto aos estados coloridos.
- Do manter labels, foco visível, formatação pt-BR e números tabulares nas interfaces de orçamento.
- Do conservar a próxima ação nas duas larguras, os itens editáveis com rótulos no celular e a rolagem contida das tabelas de leitura.
- Do identificar protótipo, dados locais, simulações e módulos futuros no contexto em que aparecem.
- Do oferecer preenchimento manual e revisão humana quando a IA estiver indisponível.

### Don't:

- Don't introduzir gradientes, gráficos decorativos, ilustrações ou imitação de papel e materiais nesta direção visual.
- Don't substituir etapas e ações por métricas de negócio inventadas.
- Don't marcar uma etapa como concluída apenas porque sua aba foi aberta, nem validar o briefing apenas porque os campos estão completos.
- Don't apresentar seleção de cotação como contratação, aceite como contratação automática, ou demonstração como integração e autenticação reais.
- Don't esconder o estado ou a próxima ação para caber no celular; reorganize os elementos usando os padrões existentes.
