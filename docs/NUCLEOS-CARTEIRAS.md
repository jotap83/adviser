# Núcleos, carteiras e responsáveis

Extensão do MVP aprovada em 20/10/2026. A implementação atual é uma demonstração local, com dados fictícios, sem autenticação ou integrações reais.

## Onde usar

| Tela | O que fazer |
| --- | --- |
| Equipe e IA → Núcleos | Criar e renomear núcleos; definir coordenação e integrantes; abrir a carteira. |
| Equipe e IA → Pessoas | Cadastrar ou editar pessoas; definir núcleo principal, participação em outros núcleos, perfil e situação. |
| Clientes | Definir núcleo e responsável pela conta; filtrar a carteira por núcleo e pessoa. |
| Atendimento / Demandas | Alternar Todos, Meus atendimentos, Meu núcleo e A distribuir; filtrar núcleo e responsável. |
| Dentro da demanda | Trocar o responsável por aquele trabalho ou abrir a carteira do cliente. |
| Painel Gerencial | Ver coordenação, integrantes ativos, clientes, demandas em andamento e pendências por núcleo. |

O seletor **Visualizar como · demonstração** simula a pessoa usando a plataforma. Não é login nem controle de acesso. Todos os usuários de atendimento continuam podendo consultar clientes, custos e propostas.

## Regras de distribuição

- Cada pessoa pode participar de vários núcleos, com um principal. Meu núcleo usa apenas esse principal; os demais continuam disponíveis nos filtros.
- O coordenador também é integrante. Ao associar uma pessoa a um novo núcleo, seu núcleo principal atual é preservado; sem principal, o primeiro vínculo torna-se principal.
- Cada cliente pode ter um núcleo responsável e uma pessoa responsável pela conta. A colaboração entre núcleos é permitida.
- Cada demanda tem seu próprio responsável, que pode ser diferente do responsável pela conta.
- Cadastro direto, Gmail e WhatsApp sugerem o responsável ativo pela conta ao selecionar um cliente para **uma nova demanda**. A equipe pode trocar ou deixar A distribuir antes de criar.
- Um cliente novo começa sem núcleo e sem responsável pela conta. A demanda pode receber um responsável imediatamente, mesmo enquanto a carteira aguarda distribuição.
- Associar uma mensagem a uma demanda já existente mantém o responsável dessa demanda.
- Mudar a carteira do cliente não troca os responsáveis das demandas já abertas. A demanda passa a aparecer sob a carteira atual do cliente nos filtros por núcleo. Isso não representa um histórico de carga por núcleo.
- A distribuir reúne demandas sem núcleo válido, sem responsável ativo pela conta ou sem responsável ativo pelo atendimento. Desativar uma pessoa não transfere automaticamente seu trabalho.
- Os números da fila incluem as demandas cadastradas; o Painel Gerencial aplica sua definição existente de demandas em andamento. Integrantes e clientes no resumo do núcleo representam a carteira atual; demandas e alertas obedecem aos filtros gerenciais.

## Dados e compatibilidade

`AppState.nuclei` guarda núcleos com identificador estável, nome e `coordinatorId`. Pessoas guardam `primaryNucleusId` e `nucleusIds`. Clientes guardam `nucleusId` e `accountOwnerId`, preservando também o nome legado `nucleus` para compatibilidade. As demandas do protótipo ainda usam o campo legado `owner` por nome; renomear a pessoa atualiza sua atribuição nas demandas, preservando o histórico textual já registrado. A versão de produção deverá usar a identidade autenticada e IDs estáveis para responsáveis, trilha de auditoria e permissões no servidor.

`withOrganization` roda uma única vez sobre os dados locais: converte os nomes de núcleos já salvos, preserva clientes e demandas e inicializa os vínculos dos exemplos fictícios. Não reinicia os dados nem restaura vínculos que a equipe removeu depois. Alterações ficam somente neste navegador. O JSON de exportação inclui a nova estrutura.

## Verificação

- `npm test`: regras existentes de valores, cotações e extração simulada.
- `npm run build`: TypeScript e compilação Vite.
- `CHROMIUM_PATH=<chromium> node tests/organization-browser.mjs`: migração, núcleos, integrantes, transferência de carteira, responsável independente, cadastro direto/Gmail/WhatsApp, filtros, persistência e capturas desktop/mobile. Use `CAPTURE=0` para executar sem capturas.
- `CAPTURE=0 CHROMIUM_PATH=<chromium> node tests/channels-browser.mjs`: regressão dos canais, revisão humana e histórico compartilhado.

A suíte de organização inicia e encerra seu próprio servidor de teste. O caminho do Chromium depende do ambiente.
