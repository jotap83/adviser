# Validação do protótipo

## Decisões pendentes com a Adviser

- Categorias definitivas e campos de cada modelo. Considerar cinco modelos iniciais no orçamento do MVP.
- Regra exata de fee, margem, descontos, impostos e pagamento direto.
- Formato final de proposta, anexo e forma de registro da aceitação.
- Contas de e-mail utilizadas, domínio e situação Google Workspace.
- Volume real de propostas, fornecedores por demanda e tamanho dos anexos.
- Responsabilidades de aprovação e eventual revisão futura de permissões.
- Contas de hospedagem, banco e provedores de comunicação/IA que receberão o sistema.

## Critérios do MVP

Registrar contato → organizar e revisar briefing → esclarecer com cliente → validar → solicitar cotações → receber respostas por modelo → comparar → montar e versionar proposta → enviar/registrar envio → registrar ajuste, recusa ou aceite → preparar repasse.

As respostas de fornecedores são ligadas à solicitação, não apenas ao e-mail de origem. O atendimento deve revisar associações ambíguas em uma eventual integração futura de Gmail. O sistema deve funcionar sem a IA.

## Verificação técnica disponível

`npm test`: cálculo monetário e pagamento direto, arredondamento, seleção de cotação sem modificar a origem, extração demonstrativa sem preencher dados ausentes.

`node tests/browser.mjs`: navegação ponta a ponta, indisponibilidade da IA, formulário de fornecedor, escolha de cotações, pagamento direto, versões, Excel, aprovação, pacote financeiro, persistência, modelos versionados, cadastro e navegação móvel. As capturas são somente evidência de teste.

Protótipo não validado para uso com dados reais. A versão de produção requer testes de autorização, isolamento do portal, anexos, filas de e-mail, backups e concorrência, além de homologação dos processos da Adviser.

## Extensão gerencial e briefing — 20/10/2026

Validação funcional em `tests/management-browser.mjs`: filtros por núcleo/responsável; persistência de leitura; atrasos preservados após leitura; retorno de cliente; cotação recebida removendo atraso do fornecedor; ausência de aprovação automática; revisão de blocos sugeridos; perguntas por lacuna; escopo passando ao fornecedor; IA indisponível com edição manual; atualização entre abas após envio do fornecedor; navegação móvel sem alargamento da página. Não houve erros de execução da página.

O fluxo original em `tests/browser.mjs` também passou novamente, incluindo versões preservadas, Excel, aceite vinculado à versão, pagamento direto e exportação de repasse. O teste valida o protótipo local, não autenticação, integração Gmail, serviços de e-mail, alertas multiusuário ou entrega real de produção.

A revisão final também confirmou: apagar o prazo gera alerta de entrega sem prazo; blocos sem modelo vinculado explicam seu limite; botão de atraso do fornecedor corresponde ao destino. Pacote independente aberto por `file://`, com zero requisições externas e zero erros de página.
