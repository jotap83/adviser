# Painel Gerencial, alertas e briefing orientado à proposta

## Decisão de produto

O Painel Gerencial ajuda os sócios a acompanhar o caminho do primeiro contato ao aceite, a contribuição prevista e os pontos que exigem intervenção: demanda parada, responsável sem prazo, fornecedor atrasado, cliente aguardando ou proposta aprovada sem repasse. A extensão aprovada em 21/10/2026 acrescenta leitura de resultados e sua base de cálculo, preservando a distribuição por núcleo, a carga atual e a edição de prazos. Ganhos em horas ou dinheiro só podem ser afirmados após medir a operação real.

O protótipo acrescenta as rotas `#/gestao` e `#/alertas`, além de ampliar o briefing. Todos os exemplos, clientes, preços e mensagens são fictícios. A proposta privada foi usada somente para entender categorias e a estrutura das informações; seu conteúdo não faz parte deste repositório.

## O que já pode ser demonstrado

- **Visão geral:** filtros por período, núcleo e responsável; ciclo até o aceite, conversão, margem prevista, demandas em atenção e **Decisões de hoje**, com motivo, responsável e ação para abrir a etapa correspondente. As sugestões são regras locais, sem análise de IA externa.
- **Carteira e prazos:** distribuição por etapa, núcleos, coordenação, integrantes, complexidade informada e demandas prioritárias; responsável e próxima entrega continuam editáveis.
- **Clientes e fornecedores:** decisões e contribuição prevista por cliente; primeira resposta, prazo, preenchimento e pendências por fornecedor. Revisões e complexidade ajudam a contextualizar esforço; não medem horas trabalhadas ou produtividade individual.
- **Base dos indicadores:** clicar em um indicador abre seus registros; **Revisar registro** permite completar marcos, motivos e custos manualmente. **Metas** ajusta os parâmetros ilustrativos de 10 dias até o aceite e 30% de margem sobre a remuneração.
- Central de alertas com respostas novas/lidas, prazos próximos/vencidos, fornecedor atrasado, falta de atualização, pedido de ajuste e aceite aguardando repasse.
- Simulação de retorno de cliente e fornecedor, incluindo atualização do estado da demanda e da cotação. Não envia mensagens reais.
- Regras configuráveis para prazo próximo e dias corridos sem atualização. Ler um retorno não elimina uma pendência operacional. O atraso do fornecedor some quando a cotação é recebida ou seu prazo é ajustado.
- Sincronização local entre abas do mesmo site no mesmo navegador, via evento de armazenamento. Não equivale a sincronização entre usuários ou dispositivos.
- Briefing por blocos de serviço; perguntas faltantes; sugestão de categorias com trechos da conversa; revisão humana antes de aplicar; funcionamento manual quando a IA simulada está indisponível.
- Informações específicas da categoria seguem para o rascunho da solicitação e, com o briefing validado, para o formulário do fornecedor. Respostas registradas não alteram silenciosamente os campos confirmados.

## Escopo dos indicadores

Os filtros de núcleo e responsável delimitam a carteira. O período oferece últimos 30 dias, últimos 90 dias ou todo o histórico; a data relevante varia conforme a linha abaixo. Os tempos são corridos, não horas úteis. Amostras aparecem junto aos resultados; ausência de base aparece como `—` ou informação ausente, nunca como zero medido.

| Indicador | Base e cálculo |
| --- | --- |
| Contato até o aceite | Média dos dias entre o primeiro contato válido e o aceite, para demandas atualmente aprovadas cujo último aceite registrado está no período. O início é o mais antigo entre o registro manual e as mensagens recebidas; não é a data de cadastro. |
| Preparação e negociação | Contato → primeiro envio e primeiro envio → aceite, somente quando os três marcos estão disponíveis e ordenados. Revisões não reiniciam o contato ou o primeiro envio. |
| Comparação do ciclo | Compara a média com a janela imediatamente anterior de igual duração. Todo o histórico desativa a comparação. O gráfico mantém três janelas fixas de 30 dias, independentemente do período selecionado, com os mesmos filtros de carteira. |
| Conversão e perdas | Aprovações ÷ (aprovações + recusas), pelo último marco correspondente à decisão atual dentro do período. Pendentes ficam fora. Perdas são agrupadas pelo motivo registrado; motivo ausente fica sem classificação. |
| Contribuição e margem previstas | Somente aprovadas no período com custos válidos para a versão aceita. Contribuição = fee da agência − custo interno estimado − outros custos estimados. Margem agregada = soma das contribuições ÷ soma dos fees; não é a média simples dos percentuais. |
| Demandas em atenção | Situação atual, sem recorte temporal: demandas sem repasse e não recusadas, com alerta operacional, negociação além da meta ou margem prevista abaixo da meta. Uma demanda conta uma vez, mesmo com vários sinais. O valor exposto soma uma vez o total da versão enviada de cada negociação em atenção; aprovadas aguardando repasse podem contar como risco, mas não acrescentam valor em negociação. |
| Primeira resposta da equipe | Média em horas desde o primeiro contato até a primeira resposta de saída elegível, para demandas iniciadas no período. Mensagens com marcador de modelo automático são excluídas. Sem resposta registrada, não há duração calculada. |
| Primeiro envio no prazo | Primeiros envios ocorridos no período com compromisso registrado. Compara o dia do envio com o prazo preservado naquele envio; editar o compromisso depois não reescreve a pontualidade passada. |
| Revisões | Quantidade de eventos de revisão ocorridos no período, agrupados por motivo, com número de demandas envolvidas. Nem toda revisão é retrabalho evitável. |
| Fornecedores | Primeiras respostas recebidas no período com datas válidas de solicitação e retorno. Média de resposta em horas; pontualidade sobre respostas com prazo informado; completude sobre respostas com avaliação inicial registrada. Pendências e atrasos são atuais. Completude verifica campos obrigatórios e itens preenchidos no primeiro retorno, sem certificar qualidade ou execução. |

O fee considera os itens pagos via Adviser conforme a fórmula demonstrativa da proposta. Pagamentos diretos ao fornecedor, repasses e acréscimos da proposta não compõem essa remuneração. Os custos informados devem ser suportados pelo fee, sem duplicar fornecedores já repassados. Custos vazios não equivalem a zero confirmado; ambos precisam estar preenchidos para formar a previsão. Uma nova versão enviada exige revisar as premissas, e fee zero não produz percentual de margem. Não há cálculo fiscal, lucro líquido realizado, faturamento, recebimento ou previsão de caixa neste indicador. O total de uma proposta ou da negociação exposta não é receita da agência.

## Registros e limites da base

O registro de envio, aceite, recusa e pedido de revisão passa a capturar os respectivos marcos pelas ações normais da interface. O primeiro retorno de fornecedor e sua completude são preservados nas revisões seguintes. Corrigir o motivo atual atualiza o último evento correspondente e recalcula os agrupamentos, mantendo os eventos anteriores. Não há datas inventadas para registros antigos sem marcos.

O editor manual é opcional: permite completar o histórico após registrar envio ou decisão na demanda, rejeita marcos futuros ou fora de ordem e registra a revisão no histórico local. Não muda a decisão comercial sozinho. Datas ausentes ou inválidas ficam fora do cálculo que delas depende; uma decisão sem data não entra no recorte de resultados. A faixa **Qualidade da base** explicita essas lacunas.

A migração acrescenta uma única vez 12 demandas históricas fictícias, sem substituir as alterações locais existentes. O estado permanece em `localStorage`, com atualização entre abas do mesmo site e navegador. Não há persistência compartilhada, autenticação, integração ou IA externa. Os exemplos e suas tendências demonstram a leitura do painel; não são evidência de resultado real da Adviser.

## Engenharia reversa estrutural

O caminho é: grupo da proposta → composição dos itens → decisões necessárias para cotar → perguntas → responsáveis pelas respostas. O documento final não permite recuperar o briefing original, decisões descartadas ou motivos comerciais.

| Bloco | O que o briefing precisa esclarecer | Resultado esperado da cotação |
| --- | --- | --- |
| Local e infraestrutura | capacidade, ambientes, acessibilidade, inclusões, contingência | locação e adicionais discriminados |
| Alimentação e bebidas | público atendido, duração, formato, dietas, consumo e taxas | serviços por pessoa/pacote e adicionais |
| Audiovisual e estrutura | programação, ambientes, equipamentos, operação, logística | equipamentos, equipe e montagem |
| Cenografia e ambientação | conceito, áreas, mobiliário, peças, aprovação | entregas, quantidades e montagem |
| Ativações | objetivo, público, duração, capacidade, infraestrutura | experiência, operação e materiais |
| Atrações e música | perfil, duração, necessidades técnicas, camarim, deslocamento | cachê e despesas explícitas |
| Equipe e operação | funções, quantidade, turnos, alimentação, equipamentos | profissionais, períodos e adicionais |
| Documentação e responsabilidades | exigências a verificar, responsáveis, prazos e estimativas | itens sujeitos à validação competente |
| Logística e apoio | transporte, hospedagem, materiais, serviços complementares | serviços e modalidade de pagamento |

Dados gerais: objetivo, formato/público, data, horários, local, montagem/desmontagem, referência de investimento, composição desse limite, aprovadores e prazo da proposta.

### Distinções necessárias na implementação definitiva

- Pedido do cliente, sugestão da IA, decisão criativa, confirmação do fornecedor e validação humana devem ter origem e autoria distintas.
- Marcar campo preenchido não comprova qualidade ou veracidade. O protótipo exibe cobertura de preenchimento, não uma pontuação de inteligência ou garantia de prontidão.
- Parte das perguntas vai ao cliente; parte vai ao fornecedor; parte é decisão interna. O atendimento revisa os destinatários antes de enviar.
- Número de participantes, quantidade contratada, unidade de cobrança, duração e quantidade de profissionais são conceitos diferentes. Não inferir a fórmula de cobrança da diagramação do PDF.
- Itens incluídos em um pacote não devem ser somados de novo como adicionais. Tratar alternativas, estimativas, exclusões e pagamento direto explicitamente na versão definitiva.
- Taxas, tributos e responsabilidades documentais dependem de validação dos donos, do financeiro e de responsáveis competentes. Nenhuma regra fiscal foi deduzida do exemplo.
- Um bloco de briefing não exige uma categoria única de fornecedor: um fornecedor pode cobrir vários serviços. A Adviser precisa validar essa taxonomia e seu mapeamento aos templates de cotação. O protótipo liga automaticamente as cinco categorias existentes; as outras quatro demonstram o roteiro de levantamento, e seus templates definitivos ainda precisam ser validados.

## Alertas no MVP e evolução

No protótipo, retornos são registrados ou simulados. No MVP de produção, Gmail e WhatsApp integrados recebem mensagens e geram alertas, com confirmação dos vínculos ambíguos. Uma resposta enviada pelo formulário do fornecedor também poderá gerar um evento no servidor. Não presumir que apenas o endereço ou o número do remetente identifica um evento; a mesma empresa pode ter várias demandas.

Em produção: eventos persistidos, idempotência, leitura por usuário, destinatários por responsabilidade, histórico de mudanças, tarefas agendadas para prazos, atualização da tela, autenticação e regras de acesso. Na indisponibilidade da IA, entrada manual permanece. Não contratar fornecedores, aprovar propostas ou enviar comunicações automaticamente a partir de uma sugestão.

Evoluções sugeridas: resumo gerencial diário, escalonamento de atrasos, classificação assistida de respostas, detecção de divergência de escopo e comparação de custo previsto/realizado quando houver financeiro. A implantação de Gmail e a execução de envios reais permanecem fora desta demonstração.

## Como demonstrar aos sócios

1. Abrir **Painel Gerencial** (`#/gestao`). Alternar 30/90 dias e núcleo/responsável; conferir as amostras, a comparação do ciclo e o aviso de carteira atual.
2. Clicar em **Contato até o aceite** e conferir contato, primeiro envio e aceite na **Base dos indicadores**. Em **Revisar registro**, completar um marco ausente ou revisar premissas fictícias e usar **Salvar registro e recalcular**.
3. Abrir **Margem prevista**, ler a fórmula e comparar o fee com os dois custos estimados da versão aceita. Conferir o tratamento de **Sem previsão válida**; não apresentar os totais como lucro realizado.
4. Em **Decisões de hoje**, abrir uma intervenção. Voltar a **Carteira e prazos**, filtrar uma etapa e editar responsável ou próxima entrega. Explorar **Clientes e fornecedores** e usar **Ver registros** ou **Ver cotações** para chegar à evidência.
5. Na **Central de alertas**, simular uma cotação de fornecedor para Convenção Conexões. Ver o atraso de resposta desaparecer e a nova cotação aparecer. Marcar o retorno como lido: o prazo da demanda continua sinalizado até ser tratado.
6. Em **Encontro Horizonte**, organizar a mensagem, analisar o escopo com IA e revisar os blocos sugeridos. Detalhar alimentação, registrar o esclarecimento e validar o briefing. Conferir o escopo na solicitação/formulário do fornecedor e continuar pelo comparativo e proposta versionada.

Para verificar a instrumentação, registrar um envio e uma decisão fictícios pela demanda e retornar à base do painel. Ao corrigir o motivo de uma recusa ou revisão atual, o agrupamento deve mudar sem criar outra rodada. Os exemplos iniciais são relativos à data em que foram acrescentados; valores mudam conforme o tempo e as edições locais.

## Como medir o ganho no piloto

Levantar uma linha de base antes do uso e comparar com um período de teste: tempo do contato à primeira devolutiva; número de rodadas de esclarecimento; tempo até proposta enviada; percentual de cotações recebidas no prazo; demandas sem próxima ação; ajustes por informações faltantes. Usar mediana e volume observado, sem confundir contagem de propostas ou taxa de aprovação com produtividade individual.

## Efeito no escopo comercial

Painel Gerencial com marcos, indicadores e contribuição estimada, alertas por regras, roteiro de briefing e integrações Gmail/WhatsApp com IA fazem parte do MVP proposto. BI com histórico real consolidado, comparação semântica completa de versões e indicadores financeiros completos são evoluções separadas. Execução e cumprimento no evento pertencem à etapa 2, Operações; resultado realizado, previsto × realizado, recebimentos e caixa pertencem à etapa 3, Financeiro. Revisar o esforço do MVP para incluir os conectores, autorização, recebimento, envio e operação dos canais; a demonstração local não é o custo da implementação segura e multiusuário.
