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
