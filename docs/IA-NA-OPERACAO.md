# IA na operação

A extensão reúne nove oportunidades de IA para discutir a evolução da plataforma com a Adviser, inclusive além do MVP. Acesse **Explorar IA** no cabeçalho ou **Explorar possibilidades com IA** em **Escopo e etapas**. A entrada geral é `#/escopo/ia`.

Todas as análises são simulações determinísticas sobre registros fictícios locais. Não há modelo de IA conectado. As prioridades marcadas servem à conversa sobre um possível trabalho mensal; não definem contratação, prazo, escopo comercial ou ganho garantido.

## Como identificar a IA prevista

A etiqueta azul **IA prevista** identifica os apoios planejados: interpretação do briefing, sugestões de escopo, vínculo de mensagens, preparação de respostas, sugestões de fornecedores e redação das solicitações de cotação. Ela também aparece nas nove oportunidades, em **Fluxo do sistema**, em **Escopo e etapas** e no diagrama exportável. A tela de cada oportunidade começa pelo nome da tarefa e uma legenda curta da simulação; **Ver etapas** fica ao final.

A etiqueta indica uso previsto de IA, separado de **MVP**, **etapa 2**, **etapa 3** e **evolução opcional**. Não representa uma integração ativa nem muda o alcance contratado. Cálculos de valores, cadastros, aceite e pagamentos continuam com seus próprios controles; na cobrança, a IA poderá apoiar a leitura, enquanto a comparação usa regras aritméticas do sistema.

## As nove demonstrações

| Possibilidade | O que demonstra | Fonte e limite principal |
| --- | --- | --- |
| **Comparar cotações** | Compara alternativas por categoria, separa base obrigatória e opcionais, destaca condições e campos a esclarecer. | Cotações recebidas e campos do briefing. Capacidade só é confrontada quando há público registrado. Não escolhe fornecedor nem consulta disponibilidade. |
| **Revisar a proposta** | Aponta dados incompletos, briefing não validado, composições não confirmadas, verba excedida e diferenças de data, público ou local em relação à versão enviada. | Rascunho, briefing, cotações e versão enviada. É uma conferência limitada; valores vêm das fórmulas do sistema e versões salvas são preservadas. |
| **Entender uma mudança** | Usa novo público e nova data informados pela pessoa para listar categorias que precisam de revisão. | Campos atuais e alteração hipotética. Não interpreta uma mensagem livre, altera o briefing ou recalcula preços por pessoa. |
| **Retomar o atendimento** | Reúne contexto, últimas três mensagens, perguntas, cotações pendentes e decisão registrada. | Registros da demanda com referências. Uma mensagem não atualiza automaticamente o briefing nem comprova aceite. |
| **Consultar a gestão** | Responde às três perguntas disponíveis: onde agir hoje, tempo até o aceite e conversão. | Mesmas regras e métricas do Painel Gerencial, sobre a carteira completa, sem herdar seus filtros. Ciclo e conversão usam os últimos 30 dias; não há chat livre ou inferência de causa. |
| **Consultar a memória** | Busca até cinco referências em outras demandas com aceite registrado. | Busca por termos nos registros locais; vazia, mostra as referências disponíveis. Não é busca semântica ou leitura de documentos históricos. Aceite não comprova execução ou qualidade. |
| **Explorar o criativo** | Apresenta três caminhos ilustrativos, com conceito e estrutura textual de apresentação. | Objetivo do briefing e direção selecionada. Não gera imagens ou slides nem presume aprovação. A equipe pode registrar o texto revisado na direção criativa. |
| **Planejar a operação** | Sugere tarefas com checklist; permite selecionar quais entram no quadro e revisar responsável e prazo. | Em projetos vinculados, usa a cópia da proposta aceita no repasse. O projeto de exemplo sem vínculo usa as fases do quadro atual. Não atribui prazo automaticamente nem contrata fornecedores. |
| **Conferir cobrança do fornecedor** | Recebe mensagem simulada, arquivo ou texto; permite extrair ou preencher os dados, revisar e comparar com uma conta a pagar do evento. | Original e origem visíveis; leitura local de PDF, DOCX, XLSX e TXT, sem IA real ou OCR. A correspondência é escolhida pela pessoa. Não valida documento fiscal ou bancário, identifica duplicidade, cria lançamento, autoriza pagamento ou efetua baixa. |

Os atalhos **Apoio com IA** aparecem no briefing, cotações, comparativo, proposta, aprovação e repasse; também em Apresentação criativa, Painel Gerencial, Operações e Financeiro. Eles levam o contexto da tela para a demonstração. É possível trocar a demanda ou o projeto no seletor e usar **Abrir tela de origem** para conferir os registros.

## Conferir cobrança do fornecedor

A tela começa sem cobrança ou lançamento selecionado. Confira o **Projeto de referência** e siga as três etapas:

1. **Receber ou anexar cobrança:** use **Anexar ou colar** para escolher um arquivo ou informar o texto recebido. **Simular Gmail** e **Simular WhatsApp** criam uma mensagem fictícia somente ao clicar; nenhuma conta está conectada. O original, a origem e o remetente ficam visíveis para conferência.
2. **Revisar os dados da cobrança:** use **Extrair dados com IA** ou preencha **Descrição cobrada**, **Valor cobrado (R$)** e **Vencimento da cobrança** manualmente. Confira os três campos com o original e marque **Conferi os dados com a mensagem ou o documento original**. Alterar um campo retira essa confirmação e invalida a comparação anterior.
3. **Conferir com o valor previsto:** escolha a conta a pagar correspondente entre os lançamentos do mesmo evento e execute a conferência. Trocar o lançamento preserva a cobrança recebida e exige uma nova comparação. O resultado mostra valor, diferença, vencimento e descrição; não altera contas nem autoriza pagamentos.

Arquivos de até **10 MB** são lidos neste navegador. PDF com texto, DOCX, XLSX e TXT podem fornecer texto para a simulação. PNG, JPG, JPEG e WEBP ficam disponíveis para consulta visual; imagens e PDFs sem texto exigem transcrição manual, pois não há OCR. PDFs e imagens têm prévia; **Baixar original** permite consultar o arquivo no aplicativo correspondente. O arquivo recebido é temporário nesta tela: ao sair ou recarregar, ele deixa de estar disponível. Guardar uma análise não guarda o original.

A extração demonstrativa reconhece somente linhas com `Descrição:`, `Valor:` no padrão brasileiro e `Vencimento:` no formato `AAAA-MM-DD`. Se o conteúdo não seguir esse formato, complete os campos manualmente. Valores ambíguos e datas impossíveis impedem a confirmação da revisão. Com a IA indisponível em **Equipe e IA**, a extração fica desativada, mas a leitura local, o preenchimento manual, a revisão e a comparação continuam disponíveis.

Os exemplos de Gmail e WhatsApp acrescentam **R$ 450,00** a uma conta a pagar do projeto para apresentar uma divergência. Essa mensagem só é criada pela ação de simular o canal; selecione o lançamento correspondente para mostrar a diferença. Identidade, duplicidade, correspondência e autorização continuam sob conferência humana. Use apenas dados fictícios na demonstração.

## Revisar, guardar e aplicar

Os resultados disponíveis para revisão apresentam observações, fontes e limites, além de um texto editável. Depois de conferir o conteúdo, marque **Revisei o conteúdo e as fontes** para guardar a análise ou copiar o rascunho. Alterar o texto exige nova confirmação. As análises guardadas ficam neste navegador, associadas à possibilidade e ao contexto; não enviam mensagens nem substituem a proposta.

As únicas aplicações desta extensão sobre o trabalho são explícitas:

- **Adicionar à direção criativa** acrescenta o rascunho revisado ao campo de direção criativa da demanda, sem alterar apresentações ou aprovações.
- **Adicionar tarefas revisadas** cria no quadro local apenas as tarefas selecionadas, com responsável, prazo opcional e checklist. Tarefas já presentes são sinalizadas e não são adicionadas novamente pela mesma origem ou título.

Se os registros mudarem depois da análise, é preciso executá-la novamente antes de guardar, copiar ou aplicar. No planejamento operacional, um repasse cujo aceite ou versão deixou de corresponder ao atendimento bloqueia a aplicação até a revisão do repasse. **Priorizar para conversa** guarda apenas uma preferência local, sem invalidar as fontes da análise.

Em **Equipe e IA**, a opção de indisponibilidade desativa as sugestões simuladas de IA. O acesso à tela de origem e o preenchimento manual continuam disponíveis; na cobrança, a comparação aritmética também permanece disponível. Nenhuma dessas ações chama LLM, Gmail, WhatsApp, banco ou serviço de pagamento, nem realiza envio externo.

## Cuidados com os exemplos

**Encontro Horizonte** começa com campos estruturados do briefing em branco de propósito, mesmo havendo informações na conversa. Organize e revise o briefing pelo fluxo existente se quiser completar essa base. A demonstração conserva a diferença entre uma mensagem recebida e um dado confirmado; campos ausentes são apresentados como pendentes.

## Roteiro curto de apresentação

1. Abra **Explorar IA** e apresente as nove possibilidades. Use **Priorizar para conversa** em uma delas para mostrar como registrar o interesse dos sócios.
2. Em **Comparar cotações**, escolha uma demanda com retornos recebidos e analise uma categoria. Mostre base, opcionais, condições e um link de fonte. Em **Revisar a proposta**, apresente as pendências da mesma demanda.
3. Em **Entender uma mudança**, altere hipoteticamente público ou data e veja os pontos a reconfirmar. Passe a **Retomar o atendimento**, confira as mensagens e edite o resumo; marque a revisão, guarde e abra **Ver análises guardadas**.
4. Abra **Consultar a gestão** e alterne as três perguntas. Em **Consultar a memória**, busque um termo ou deixe a busca vazia para ver as referências aceitas disponíveis.
5. Em **Explorar o criativo**, escolha uma direção, confira o objetivo de origem e revise o texto. Use **Adicionar à direção criativa** e abra a tela de origem para verificar o registro.
6. Em **Planejar a operação**, leia a fonte do projeto, escolha as tarefas e confira responsáveis e prazos. Confirme a revisão, adicione as tarefas e abra o quadro para verificar o resultado.
7. Em **Conferir cobrança do fornecedor**, confira o projeto e clique em **Simular Gmail** ou **Simular WhatsApp**. Mostre a origem e a mensagem, extraia ou preencha os dados, confirme a revisão e escolha o lançamento correspondente. Use **Conferir com o valor previsto** para mostrar a diferença fictícia de R$ 450,00. Como alternativa, anexe um documento fictício ou cole seu texto; demonstre o preenchimento manual com a IA indisponível. Encerre nas prioridades escolhidas para discutir qual problema vale implementar e como medir o resultado.

## Validação

Revisão de acabamento da extensão de cobranças e etiquetas: **SHIP**. Passaram os **37 testes**, o build, o pacote independente e `git diff --check`. No navegador foram verificados o início vazio, os exemplos dos dois canais, a revisão invalidada após edição, a preservação da cobrança ao trocar o lançamento, a leitura local de TXT e a disponibilização do original para download, o caminho manual com IA indisponível e a largura móvel de 375 px sem transbordamento. O fechamento está em `.impeccable/surfaces/cobrancas-e-ia.md`; a revisão anterior das nove oportunidades permanece em `.impeccable/surfaces/inteligencia.md`.
