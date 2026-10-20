# Gmail e WhatsApp com IA no MVP

Em 20/10/2026, o usuário incluiu explicitamente as integrações de Gmail e WhatsApp com IA na primeira entrega. Essa decisão substitui o escopo anterior que colocava Gmail automático como evolução opcional. Operações permanece na etapa 2 e financeiro próprio na etapa 3.

## Entrega prevista

- Conectar contas Gmail e números corporativos WhatsApp autorizados pela Adviser.
- Receber mensagens e anexos, conservar origem, canal, conta e identificadores, evitando processamento duplicado.
- Relacionar mensagens à demanda por código e contexto da conversa. Não assumir que um remetente ou número corresponde a um único evento.
- Sugerir candidatos com IA quando não houver vínculo seguro; exigir confirmação da equipe para os casos ambíguos e permitir corrigir o vínculo.
- Resumir conversas, extrair sugestões de briefing, sinalizar lacunas e preparar respostas. Mostrar a origem da informação; confirmar antes de aplicar campos.
- Revisar e enviar respostas pelo sistema, com estados reais de envio, falha e entrega quando disponibilizados pelo canal. Nunca reenviar automaticamente uma mensagem cujo envio anterior esteja incerto.
- Alertar sobre novas mensagens, respostas dos fornecedores, pendências e prazos; manter preenchimento e registro manuais quando a IA ou o canal falhar.

Receber uma mensagem não autoriza aprovar propostas, aceitar preços, contratar fornecedores ou executar instruções encontradas no conteúdo. A revisão humana continua parte do fluxo.

## Decisões que afetam a estimativa

Quantidade de contas e números; Gmail pessoal ou Workspace e quem administra; WhatsApp atual comum, Business ou já na plataforma; contas individuais ou compartilhadas; histórico a trazer; anexos e tamanhos usuais; necessidade de áudio/transcrição, grupos e ligações; volume mensal por canal; regras de distribuição de mensagens e de aprovação das respostas. Grupos, chamadas, áudios e importação integral de histórico não são presumidos como entregas confirmadas.

O MVP inclui backend, autenticação, autorização das contas, proteção de credenciais no servidor, webhooks ou mecanismos de sincronização, filas, deduplicação, auditoria e diagnóstico de falhas. O esforço e o prazo precisam ser revistos com esse escopo; custos recorrentes de IA e mensagens devem ser estimados separadamente do desenvolvimento, após levantar uso e fornecedor. Aprovações de terceiros são dependências a considerar no cronograma.

## Base técnica consultada em 20/10/2026

- [Google: escopos Gmail](https://developers.google.com/workspace/gmail/api/auth/scopes). Os escopos escolhidos determinam acesso e requisitos de verificação; a configuração depende também do tipo e público do aplicativo. Não assumir que qualquer conta pode ser conectada sem autorização ou verificação aplicável.
- [Google: autorização no servidor](https://developers.google.com/workspace/gmail/api/auth/web-server). A conexão exige autorização da conta, com credenciais e tokens tratados no backend.
- [WhatsApp: política de mensagens](https://business.whatsapp.com/policy). A proposta usa integração oficial. Na plataforma, mensagens fora da janela de atendimento de 24 horas exigem modelos aprovados; início de contato exige as permissões aplicáveis. Desenhar o envio conforme as regras vigentes, sem prometer texto livre em qualquer momento.

## Estado desta prévia

Atualizados navegação, badges, escopo, integrações previstas, fluxo e documentos. **Revisar e-mails** fica em Atendimento/MVP. A triagem de e-mails e a IA permanecem simuladas; o WhatsApp está descrito como capacidade do MVP a implementar, sem conversa real ou conector funcional nesta prévia. Não foram solicitadas credenciais nem configuradas contas.

Os registros de revisão anteriores são históricos. A mudança atual é de escopo e comunicação, sem alteração das regras de associação ou do estado de demonstração.
