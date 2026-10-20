# Briefing, comunicação e apresentação criativa

Esta evolução amplia a demonstração solicitada pela Adviser. O conteúdo de exemplo foi criado para o protótipo; nenhum dado de documentos privados foi copiado.

## Navegação

O menu lateral foi compactado para caber em uma tela de notebook de 1366 × 768 sem rolagem. Em alturas menores, mantém rolagem fina para não perder opções. O botão do cabeçalho recolhe o menu para um trilho de ícones com nomes acessíveis; a preferência persiste no navegador. No celular, o menu é uma gaveta com fechamento por botão, fundo ou Escape e foco contido. O cabeçalho permanece no topo durante a rolagem. Atalhos levam às quatro partes do briefing.

## Entrada e análise

- Mensagem inicial, anotações de ligação e anexos ficam associados à demanda.
- PDF: leitura local de texto com PDF.js. Até 30 páginas; PDF digitalizado ou protegido pode exigir transcrição manual. Não há OCR.
- DOCX: leitura dos parágrafos do corpo do documento com JSZip e DOMParser. Não interpreta imagens, cabeçalhos ou notas.
- XLSX: leitura de texto/valores das primeiras 10 planilhas, até 1.000 linhas e 40 células não vazias por linha, com ExcelJS. Não calcula fórmulas; usa os valores disponíveis no arquivo.
- Até 10 anexos de 10 MB, com até 100 mil caracteres de texto por anexo. Leitura parcial é sinalizada. Textos podem ser conferidos, corrigidos e excluídos da análise.
- São persistidos texto e metadados dos anexos do briefing, sem cópia do arquivo original. Para anexos de um retorno posterior, selecione sua mensagem de origem.

O exemplo completo de Encontro Horizonte contém 32 campos reconhecíveis: seis dados principais, cinco de planejamento e 21 respostas em sete blocos de serviços. Contém também premissas ainda não confirmadas. Preenchimento não equivale à aprovação do cliente.

A leitura dos arquivos é real; a **interpretação continua simulada**. O adaptador usa padrões e rótulos explícitos, mostra a fonte e o trecho por sugestão, compara com o valor atual e permite selecionar quais alterações aplicar. Retornos posteriores têm precedência nos campos explicitamente mencionados. As lacunas são calculadas sobre o briefing consolidado mais as alterações selecionadas; um retorno parcial não apaga o contexto nem volta a perguntar dados preenchidos. Perguntas humanas e pendências explícitas são preservadas. Edições feitas depois de uma análise invalidam sua aplicação; o atendimento pode analisar novamente ou preencher manualmente.

## Ciclo com o cliente

1. Estruturar mensagem e anexos; revisar sugestões.
2. Conferir escopo e listar perguntas pendentes.
3. Gerar e editar a formalização, copiar para o Gmail e registrar manualmente o envio.
4. Definir data de acompanhamento; quando devida, a central de alertas sinaliza a resposta aguardada.
5. Registrar retorno de qualquer contato, por e-mail, ligação ou reunião. O registro invalida a confirmação anterior do briefing.
6. Analisar as alterações do retorno, revisar os campos e marcar o retorno como revisado.
7. Confirmar alinhamento e validar o briefing antes de cotar.

O histórico guarda textos enviados e recebidos, contato, canal e momento do registro. Não existe sincronização com Gmail nem envio real. Marcar um retorno como revisado não valida automaticamente o briefing.

## Apresentações

- Uma versão pode usar link HTTPS do Google Slides/outro serviço, PDF, PPTX, PNG/JPG ou uma apresentação fictícia de três páginas.
- Cada versão guarda título, conceito, mudanças, data e origem. Criar outra versão preserva a anterior.
- PDF/imagem têm prévia; PPTX pode ser baixado. Links abrem no serviço de origem, com suas permissões. O conteúdo de um link pode mudar externamente; para preservar o material enviado, registre um PDF.
- Arquivos são guardados em IndexedDB **neste navegador**, não em um servidor. A exportação JSON não inclui os binários: use o download da apresentação. Reiniciar a demonstração limpa os arquivos locais.
- O atendimento registra o envio e o feedback com responsável e evidência. Estados: rascunho, aguardando feedback, ajustes solicitados e aprovada pelo cliente.
- Aprovação criativa não aprova a proposta comercial, não contrata fornecedores e não confirma custos.

## Produção e próximas etapas

O MVP pode incluir esse dossiê básico. Armazenamento central, auditoria, autenticação, autorização, validação de arquivos, limites no servidor, tratamento de documentos complexos/OCR e API de IA precisam de implementação e orçamento de produção. Integração Gmail e gestão completa de criação/produção permanecem pacotes posteriores. A tela de demonstração não altera automaticamente o escopo comercial contratado.

## Validação

`tests/briefing-browser.mjs`: navegação fixa/recolhível, exemplo completo, mudanças de cliente, anexos sintéticos nos três formatos, recuperação manual, apresentações versionadas, persistência de PDF, proteção contra análise desatualizada e celular. `tests/standalone-briefing.mjs`: mesmos leitores e persistência no HTML independente, com rede offline e nenhuma requisição HTTP. Os testes anteriores de gestão e fluxo comercial continuam aplicáveis.
