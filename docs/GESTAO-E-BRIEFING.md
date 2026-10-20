# Visão gerencial, alertas e briefing orientado à proposta

## Decisão de produto

O Painel Gerencial precisa ajudar a decidir onde intervir: demanda parada, responsável sem prazo, fornecedor atrasado, cliente aguardando ou proposta aprovada sem repasse. O ganho esperado é menos acompanhamento em planilhas e menos ida e volta por informação faltante. Ganhos em horas ou dinheiro só podem ser afirmados após medir a operação.

O protótipo acrescenta as rotas `#/gestao` e `#/alertas`, além de ampliar o briefing. Todos os exemplos, clientes, preços e mensagens são fictícios. A proposta privada foi usada somente para entender categorias e a estrutura das informações; seu conteúdo não faz parte deste repositório.

## O que já pode ser demonstrado

- Painel dos sócios com filtros por núcleo e responsável; distribuição por etapa; volume por núcleo; demandas prioritárias; responsável e próxima entrega editáveis.
- Indicadores derivados das demandas: andamento, atenção, valor das versões enviadas ainda em negociação e aprovações sobre decisões concluídas. Aprovada não significa faturada; total de propostas não significa receita da agência. O fee não é lucro líquido.
- Central de alertas com respostas novas/lidas, prazos próximos/vencidos, fornecedor atrasado, falta de atualização, pedido de ajuste e aceite aguardando repasse.
- Simulação de retorno de cliente e fornecedor, incluindo atualização do estado da demanda e da cotação. Não envia mensagens reais.
- Regras configuráveis para prazo próximo e dias corridos sem atualização. Ler um retorno não elimina uma pendência operacional. O atraso do fornecedor some quando a cotação é recebida ou seu prazo é ajustado.
- Sincronização local entre abas do mesmo site no mesmo navegador, via evento de armazenamento. Não equivale a sincronização entre usuários ou dispositivos.
- Briefing por blocos de serviço; perguntas faltantes; sugestão de categorias com trechos da conversa; revisão humana antes de aplicar; funcionamento manual quando a IA simulada está indisponível.
- Informações específicas da categoria seguem para o rascunho da solicitação e, com o briefing validado, para o formulário do fornecedor. Respostas registradas não alteram silenciosamente os campos confirmados.

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

1. Abrir Painel Gerencial e localizar uma demanda com atraso. Filtrar um núcleo e abrir a demanda.
2. Na Central de alertas, simular uma cotação de fornecedor para Convenção Conexões. Ver o atraso de resposta desaparecer e a nova cotação aparecer.
3. Marcar o retorno como lido. O prazo de entrega da demanda continua sinalizado até ser tratado.
4. No Encontro Horizonte, organizar a mensagem, analisar o escopo com IA e revisar os blocos sugeridos.
5. Detalhar alimentação, adicionar perguntas ao rascunho, registrar o esclarecimento e validar o briefing.
6. Abrir a solicitação/formulário do fornecedor e conferir o escopo da sua categoria; continuar pelo comparativo e proposta versionada.

## Como medir o ganho no piloto

Levantar uma linha de base antes do uso e comparar com um período de teste: tempo do contato à primeira devolutiva; número de rodadas de esclarecimento; tempo até proposta enviada; percentual de cotações recebidas no prazo; demandas sem próxima ação; ajustes por informações faltantes. Usar mediana e volume observado, sem confundir contagem de propostas ou taxa de aprovação com produtividade individual.

## Efeito no escopo comercial

Painel básico, alertas por regras, roteiro de briefing e integrações Gmail/WhatsApp com IA fazem parte do MVP proposto. BI histórico, comparação semântica completa de versões e indicadores financeiros completos são evoluções separadas. Revisar o esforço do MVP para incluir os conectores, autorização, recebimento, envio e operação dos canais; a demonstração local não é o custo da implementação segura e multiusuário.
