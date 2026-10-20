# Validação do protótipo

## Decisões pendentes com a Adviser

- Categorias definitivas e campos de cada modelo. Considerar cinco modelos iniciais no orçamento do MVP.
- Regra exata de fee, margem, descontos, impostos e pagamento direto.
- Formato final de proposta, anexo e forma de registro da aceitação.
- Contas de e-mail utilizadas, domínio e situação Google Workspace; números e modalidade de WhatsApp, áudios, grupos e histórico necessários.
- Volume real de propostas, fornecedores por demanda e tamanho dos anexos.
- Responsabilidades de aprovação e eventual revisão futura de permissões.
- Contas de hospedagem, banco e provedores de comunicação/IA que receberão o sistema.

## Critérios do MVP

Registrar contato → organizar e revisar briefing → esclarecer com cliente → validar → solicitar cotações → receber respostas por modelo → comparar → montar e versionar proposta → enviar/registrar envio → registrar ajuste, recusa ou aceite → preparar repasse.

As respostas de fornecedores são ligadas à solicitação, não apenas ao e-mail de origem. Gmail e WhatsApp com IA fazem parte do MVP: a equipe revisa associações ambíguas e respostas antes de enviar. A implementação deve tratar duplicatas, falhas de conexão e de IA, reenvio e revisão de campos sugeridos, sem confirmar preços ou aceite automaticamente. O sistema deve funcionar manualmente quando a IA ou um canal estiver indisponível.

## Verificação técnica disponível

`npm test`: cálculo monetário e pagamento direto, arredondamento, seleção de cotação sem modificar a origem, extração demonstrativa sem preencher dados ausentes.

`node tests/browser.mjs`: navegação ponta a ponta, indisponibilidade da IA, formulário de fornecedor, escolha de cotações, pagamento direto, versões, Excel, aprovação, pacote financeiro, persistência, modelos versionados, cadastro e navegação móvel. As capturas são somente evidência de teste.

Protótipo não validado para uso com dados reais. A versão de produção requer testes de autorização, isolamento do portal, anexos, filas de e-mail, backups e concorrência, além de homologação dos processos da Adviser.

## Extensão gerencial e briefing — 20/10/2026

Validação funcional em `tests/management-browser.mjs`: filtros por núcleo/responsável; persistência de leitura; atrasos preservados após leitura; retorno de cliente; cotação recebida removendo atraso do fornecedor; ausência de aprovação automática; revisão de blocos sugeridos; perguntas por lacuna; escopo passando ao fornecedor; IA indisponível com edição manual; atualização entre abas após envio do fornecedor; navegação móvel sem alargamento da página. Não houve erros de execução da página.

O fluxo original em `tests/browser.mjs` também passou novamente, incluindo versões preservadas, Excel, aceite vinculado à versão, pagamento direto e exportação de repasse. O teste valida o protótipo local, não autenticação, integração Gmail, serviços de e-mail, alertas multiusuário ou entrega real de produção.

A revisão final também confirmou: apagar o prazo gera alerta de entrega sem prazo; blocos sem modelo vinculado explicam seu limite; botão de atraso do fornecedor corresponde ao destino. Pacote independente aberto por `file://`, com zero requisições externas e zero erros de página.


## Evolução de briefing e criação — 20/10/2026

- Menu expandido e recolhido; preferência após recarga; topo no y=0 durante rolagem; menu sem rolagem em 1366×768.
- Gaveta móvel, Escape, foco e conteúdo sem transbordamento horizontal em 390×844.
- Exemplo sintético com 32 sugestões de campos, cinco campos de planejamento e sete blocos detalhados.
- PDF, DOCX e XLSX sintéticos lidos de fato no navegador; PDF ilegível tratado com entrada manual.
- Reanálise de retorno parcial preserva contexto e perguntas humanas. Lacunas consideram apenas alterações selecionadas. Rascunho de formalização verificado após a revisão.
- Registro manual de envio/retorno com contato diferente; nenhuma mensagem real enviada.
- Duas versões criativas, feedback preservado na anterior e aprovação criativa separada da proposta.
- Arquivo PDF de apresentação persiste após recarga. Reinício limpa seus arquivos locais.
- Resultado de análise bloqueado se o conteúdo foi alterado depois de sua geração.
- HTML independente testado offline: leitores embutidos, arquivo de apresentação persistente e zero requisições HTTP ou erros de página.
- Build TypeScript/Vite e quatro testes de domínio aprovados. Os percursos anteriores de gestão, cotação, comparativo, proposta, aceite, Excel e repasse passaram na regressão.

Testes novos: `tests/briefing-browser.mjs` e `tests/standalone-briefing.mjs`. Não houve teste em aparelhos físicos, Safari ou Firefox; a verificação visual e funcional usou Chromium em larguras desktop e celular. PDFs digitalizados exigem transcrição; não há OCR.


## Alternativas e negociação de cotações

`tests/supplier-negotiation.mjs` passou em Chromium: alternativas exclusivas; adicional opcional; total e itens exatos; confirmação do fornecedor; conversa e pedido de ajuste; revisão com preço novo; cotação e proposta anteriores preservadas; bloqueio de salvar rascunho desatualizado; reimportação; persistência e larguras 1440px/390px sem alargamento horizontal. A confirmação não altera o aceite do cliente. Nenhum erro de página.

`tests/browser.mjs` passou novamente no ciclo comercial completo. `npm test`: cinco testes de domínio, incluindo exclusão de opcionais não escolhidos, alternativas não somadas e rejeição de seleção de versão antiga. Build TypeScript/Vite passou.

`tests/standalone-quotes.mjs` passou por `file://`, offline: duas alternativas, composição sem adicional, confirmação do fornecedor e persistência após recarregar. Zero requisições externas e zero erros de página. Não foram testados Safari/Firefox ou aparelho físico.

A revisão visual usa seis capturas (opções, escolha e confirmação, cada uma em desktop/mobile). Capturas isoladas da escolha ocultam o cabeçalho somente para evitar sobreposição na evidência; o aplicativo mantém o cabeçalho fixo. O detector executou uma vez; duas sugestões tipográficas foram resolvidas com o tamanho já existente de 19px.
