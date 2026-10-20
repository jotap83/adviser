# Adviser — protótipo de gestão de eventos

Protótipo navegável para validar o fluxo de uma aplicação sob medida para a Agência Adviser. Todos os dados são fictícios. A IA e os envios são simulados. Nenhuma credencial é necessária.

## Executar

Requer Node.js 22.12+ ou 24 e npm.

```bash
npm ci
npm run dev
```

A interface utiliza rotas por hash, de modo que o mesmo pacote funciona como site estático na Vercel. Em ambientes com restrição de interfaces de rede, use `npm run dev -- --host 127.0.0.1`.

```bash
npm run build
npm run preview
npm test
```

Para o teste de navegação, em outro terminal com o app em execução na porta 4173:

```bash
npx playwright install chromium
node tests/browser.mjs
```

`DEMO_URL` permite testar outra URL. `CHROMIUM_PATH` é opcional. As capturas ficam em `.impeccable/review/` e não são versionadas.

## Roteiro de demonstração

1. Na visão geral, clique em **Encontro Horizonte** na seção **Sua fila de trabalho**.
2. Clique em **Organizar com IA**, aplique as sugestões, revise, confirme o alinhamento com o cliente e valide o briefing.
3. Em **Cotações**, abra o link de **Mesa & Afeto**. Preencha o exemplo e envie a cotação simulada.
4. No **Comparativo**, escolha a alternativa e os adicionais de cada fornecedor, confirme a composição e leve somente os itens escolhidos para a proposta. A conversa permite dúvidas, pedido de ajustes e novas versões.
5. Ajuste itens, fee e pagamentos diretos. Salve uma versão e exporte Excel ou imprima em PDF.
6. Em **Aprovação**, simule o registro do envio, escreva uma evidência fictícia e registre o aceite.
7. Em **Repasse**, exporte o pacote e conclua o atendimento.
8. Em **Equipe e IA**, simule a IA indisponível e confirme que o preenchimento manual permanece disponível.

Também é possível criar clientes, fornecedores e demandas; editar modelos de cotação; consultar o histórico; explorar a sequência em **Fluxo do sistema** e a separação das entregas em **Escopo e etapas**.

## Operações e entregas

A navegação e as páginas identificam **MVP**, **etapa 2**, **etapa 3** e **evolução opcional**. Em **Operações**, selecione um evento, crie uma tarefa, abra os detalhes, marque o checklist, registre um comentário e mova a tarefa por arraste ou pelo seletor. Tarefas bloqueadas ou com checklist pendente não podem ser concluídas. No celular, escolha a coluna pelos botões acima do quadro.

Para testar a continuidade do atendimento, prepare o repasse de uma demanda aprovada. Em Operações, use **Receber do atendimento** para criar o projeto. A versão recebida fica preservada. Criar o projeto não contrata fornecedores nem gera contas automaticamente. Em **Financeiro**, simule e desfaça baixas de lançamentos fictícios. Veja [funcionamento e escopo](docs/OPERACOES-E-ESCOPO.md).

Teste do fluxo: `node tests/operations-browser.mjs`, com servidor em 4173. O teste usa `CHROMIUM_PATH` quando informado.

Para demonstrar a negociação, use **Exemplo com duas opções** no link do fornecedor. Consulte [cotação, alternativas e negociação](docs/COTACOES-E-NEGOCIACAO.md).

## Limites explícitos

- Registros em `localStorage` e arquivos de apresentações em IndexedDB, com versão de esquema e opção de reiniciar. Atualização entre abas do mesmo site/navegador; sem banco de dados ou sincronização entre dispositivos/usuários.
- Portal do fornecedor demonstrativo: não oferece autenticação, isolamento ou segurança de acesso real. Não use com informações reais. O frontend contém todos os exemplos.
- Briefing: leitura local de texto de PDF, DOCX e XLSX; sem OCR ou interpretação real por IA. Apresentações: arquivos persistidos em IndexedDB neste navegador, com prévia de PDF/imagens; PPTX pode ser baixado. Anexos de cotações continuam registrando apenas o nome.
- Não há chamadas de IA, Gmail, e-mail transacional ou Conta Azul.
- Não há autenticação, convites ou controle de permissões reais. Os cadastros de usuários demonstram a interface.
- O exportador Excel é carregado apenas quando solicitado; ExcelJS e o leitor PDF.js usam chunks maiores que o aviso padrão do Vite e são carregados sob demanda.
- Impressão em PDF utiliza o diálogo do navegador.
- Nenhum arquivo privado usado como referência foi incluído neste repositório.

## Regras da demonstração

Valores por linha = quantidade × preço unitário, arredondados em centavos. Fee = percentual sobre itens pagos via Adviser. Acréscimo = valor absoluto informado manualmente. Investimento total = serviços + fee + acréscimo. Total devido à Adviser = investimento total − itens pagos diretamente pelo cliente.

Essas fórmulas são **demonstrativas** e exigem validação comercial/financeira antes da implementação real. Não constituem cálculo fiscal. Modelos de cotação são copiados ao criar uma solicitação; editar um modelo não altera solicitações existentes. Versões salvas da proposta são cópias preservadas, e o aceite identifica a versão enviada.

## Entrega de produção

O software solicitado será entregue sob medida à Adviser, com fonte, documentação e instruções de implantação. A cessão e as condições de entrega deverão constar na contratação. Dependências de terceiros mantêm suas respectivas licenças. Este repositório não concede uma licença pública de reutilização do código próprio.

Veja [arquitetura e evolução](docs/ARQUITETURA.md) e [critérios de validação](docs/VALIDACAO.md).

## Cópia independente para demonstração

`npm run build:standalone` gera `standalone/adviser-prototipo.html`, com a aplicação, fontes, diagrama e exportador Excel embutidos. Abra esse arquivo em um navegador moderno. Ele não depende de hospedagem nem de instalação. O arquivo gerado não é versionado; o script e o lockfile permitem reproduzi-lo.

## Identidade visual
Logo oficial e cores azul/laranja da Adviser incorporadas ao protótipo, inclusive portal, proposta e diagrama. Consulte [origem e aplicação da marca](docs/IDENTIDADE-VISUAL.md). Os arquivos são locais e não exigem acesso ao site da agência.

## Gestão e briefing detalhado

Acesse **Visão dos sócios** e **Central de alertas** no menu. Simule um retorno e veja as pendências mudarem. No briefing, selecione os blocos do evento, analise as sugestões de escopo e leve os pontos ainda abertos ao rascunho de esclarecimento. Consulte [escopo e roteiro gerencial](docs/GESTAO-E-BRIEFING.md).

Teste adicional: `node tests/management-browser.mjs` com o app na porta 4173.

## Briefing e colaboração

Menu lateral recolhível e cabeçalho fixo durante a rolagem. No briefing, experimente o exemplo completo, os anexos PDF/DOCX/XLSX, a linha do tempo com o cliente e a revisão de apresentações por versão. Veja [funcionamento e limites](docs/BRIEFING-E-CRIACAO.md).

Testes: `node tests/briefing-browser.mjs` com app na porta 4173 e `node tests/standalone-briefing.mjs` após `npm run build:standalone`.

## Triagem de e-mails

Na visão geral, clique em **Revisar e-mails** ou acesse `#/emails`. O exemplo inicial tem quatro mensagens para identificar e uma associada por código. Compare os motivos das sugestões, selecione um atendimento e confirme o vínculo. Depois, abra o briefing para revisar o conteúdo. Também é possível escolher outro atendimento, criar demanda/cliente, ignorar e restaurar mensagens ou corrigir um vínculo.

Cada demanda conserva uma referência `ADV-ano-sequência`, exibida na fila e nos assuntos e textos preparados para envio. As sugestões são uma simulação por regras; Gmail não está conectado. Associar uma mensagem inclui conversa e anexos fictícios, sem alterar campos, valores ou aceite da proposta. Consulte [funcionamento e roteiro](docs/TRIAGEM-DE-EMAILS.md) e [registro da revisão](docs/REVISAO-VISUAL-TRIAGEM.md).

Com o servidor de desenvolvimento na porta 4173, execute `node tests/inbox-browser.mjs`. Para o arquivo independente, execute `npm run build:standalone` e depois `node tests/standalone-inbox.mjs`; este teste abre `standalone/adviser-prototipo.html` offline, sem servidor. `CHROMIUM_PATH` é opcional nos dois testes; `DEMO_URL` altera a URL do teste com servidor.
