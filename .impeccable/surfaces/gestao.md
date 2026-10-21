# Painel Gerencial e briefing — extensão do protótipo

Mode: Operate. Extensão do sistema existente, aprovada em 21/10/2026. O título vigente é **Painel Gerencial**; substitui a antiga referência a “Visão dos sócios”. Preservar identidade Adviser, navegação, distribuição por núcleo, carga, responsáveis, prazos e fluxo de atendimento. A proposta privada fundamenta somente categorias e perguntas do briefing, nunca clientes, preços ou descrições particulares.

## Direction contract

THESIS: apoiar decisões dos sócios com tempo do primeiro contato ao aceite, conversão e perdas, contribuição estimada, riscos e evidências acessíveis.

OWN-WORLD: continuar o sistema de DESIGN.md e .impeccable/design.json: navegação azul, identidade oficial, DM Sans, área clara, painéis planos, contornos finos, estados textuais e tabelas operacionais. Não houve autorização para redesenhar a identidade ou substituir tokens globais.

STORY: filtrar resultados e carteira; entender o ciclo e o que exige intervenção; abrir registros, marcos e premissas; agir na demanda. A indicação de dados fictícios, amostras e ausências acompanha a leitura.

FIRST VIEWPORT: título Painel Gerencial, Metas e Central de alertas; filtros de período/núcleo/responsável; quatro indicadores de ciclo, conversão, margem e atenção. A Visão geral põe evolução do ciclo ao lado de Decisões de hoje. Carteira e prazos, Clientes e fornecedores e Base dos indicadores oferecem detalhamento progressivo. Assinatura: cada indicador abre a base auditável na mesma tela.

FORM: controles compartilhados, metas editáveis, ações com rótulo, foco visível, formulário manual e estados vazios. No celular, indicadores e abas ficam em duas colunas; painéis principais e formulário passam a uma coluna. Tabelas de consulta mantêm rolagem contida. O briefing continua permitindo revisão humana e operação manual quando a IA simulada está indisponível.

QUALITY BAR: indicadores explicam base e ausência de dados; alertas oferecem ação; o briefing distingue escopo não definido de informação não confirmada e não infere o pedido original a partir da proposta. Privacidade preservada, nenhuma mensagem real enviada e nenhuma simulação apresentada como integração de produção.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Contrato de dados e estados

- Ciclo, conversão, perdas e contribuição usam decisões registradas no período; primeira resposta usa início da demanda, pontualidade usa primeiro envio, revisões usam a data da rodada e fornecedores usam primeiro retorno. Risco, carga e pendências são atuais. O gráfico de ciclo usa três janelas fixas de 30 dias.
- Contribuição = fee da agência − custos internos e outros custos estimados explícitos; margem sobre fee, ponderada pela remuneração. Custos devem corresponder à versão enviada/aceita. Pagamentos diretos e repasses ficam fora da remuneração; não há motor fiscal nem lucro líquido realizado.
- Risco e valor exposto contam cada demanda uma vez. Decisões de hoje mostra motivo, responsável e ação derivada de regras locais. Ler um retorno não elimina atraso operacional.
- Dados ausentes não viram zero; datas inválidas saem do cálculo correspondente. Prever ausência de amostra, histórico sem marcos, custos não estimados ou de outra versão, motivo sem classificação, carteira filtrada vazia e nenhum alerta.
- Ações normais capturam envio, decisão e revisão. Correção do motivo atual atualiza o último evento correspondente e preserva o histórico anterior. Editor manual opcional registra revisão local. Migração fictícia aditiva, `localStorage`, sem IA externa, integração ou sincronização multiusuário.

Fórmulas completas e roteiro de demonstração: `docs/GESTAO-E-BRIEFING.md`.

## Encerramento da extensão — 21/10/2026

**Aderência ao sistema existente:** componentes reutilizam Title, Button, Label, Badge, Empty e Note; a carteira mantém os padrões anteriores de tabela, núcleo e edição de prazo. As capturas de desktop e celular mostram a mesma navegação, tipografia, superfícies e hierarquia operacional. O gráfico comunica duração e amostra, sem imagem decorativa ou nova linguagem de marca. DESIGN.md e .impeccable/design.json foram preservados.

**Evidência visual:** `.impeccable/review/management-desktop.jpg`, `management-mobile.jpg` e `management-mobile-details.jpg`. Nas capturas móveis, a aplicação ocupa o iframe de 390px à esquerda; o branco restante é o ambiente de captura. São evidências de revisão, não ativos de interface. Nenhum novo raster de entrega foi adicionado; os ativos oficiais existentes permanecem.

**Revisão:** o revisor identificou uma correção de motivo que não atualizava o evento usado pelo indicador. A correção foi aplicada e testada; a reavaliação do mesmo revisor marcou o ponto como resolvido, com disposição **ship** nesse escopo. Build e 22 testes passaram. Isso não certifica operação de produção.

**Deriva consultiva registrada:** uma execução do detector gerou 118 avisos, todos `advisory`, em `src/styles.css`: 59 de cor, 52 de tamanho de fonte e 7 de raio. Desses, 108 antecedem o bloco desta extensão; 10 estão no CSS gerencial novo. Valores locais e deriva anterior não foram promovidos a tokens nem reparados por esta documentação. Resultado em `.impeccable/review/management-detector.json`; não representa ausência de deriva do sistema.
