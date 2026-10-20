# Entregas e prévia de Operações

## Escopo proposto

MVP: atendimento até aceite e repasse, incluindo cadastros, IA assistiva, anexos, comunicação manual com cliente, referências por demanda, links para fornecedores, negociação, versões, propostas, gestão, alertas e apoio criativo. Alertas do MVP dependem de dados e retornos registrados na plataforma; leitura automática do Gmail é opcional futura. Proposta e estudo comercial dependem das definições de valores e visibilidade ainda em aberto.

Etapa 2: produção e execução com quadro por evento, equipe, checklist, cronograma de tarefas, bloqueios, comentários, histórico e apoio da criação. O Trello atual é referência de uso, não uma integração implementada. Nome da área, colunas, migração e regras finais serão validados.

Etapa 3: financeiro próprio. Prévia de lançamentos a pagar/receber e baixa reversível de demonstração; a implementação completa deverá definir parcelas, pagamentos diretos, comprovantes, aprovações, conciliação e fechamento. A possível substituição do Conta Azul depende do inventário de funcionalidades usadas e plano de migração. Não implica prometer um ERP fiscal/contábil completo.

## Demonstração navegável

- `#/escopo` mostra capacidades por entrega. `#/roadmap` preserva o acesso antigo.
- `#/operacoes` e `#/operacoes/ID` mostram o quadro e o seletor de projetos.
- `#/financeiro` e `#/financeiro/ID` mostram a prévia financeira do projeto.
- `#/emails` permanece como evolução opcional. O bloco correspondente na tela inicial também é identificado.

Estado de produção adicionado sem substituir demandas existentes. A migração de demonstração semeia projetos fictícios uma única vez. Reiniciar a demonstração também restaura os exemplos operacionais e financeiros. Todos os dados permanecem em localStorage e são incluídos na exportação da demonstração.

O projeto a partir do atendimento exige decisão aceita, versão aceita existente e repasse preparado. A criação é explícita e usa identificador estável para não duplicar projetos. O projeto preserva uma cópia da versão, briefing, evidência e condições dos fornecedores. Mudanças posteriores no aceite/repasse são sinalizadas sem alterar o snapshot. Não há contratação automática ou geração automática de obrigações financeiras.

Tarefas têm status, fase do evento, prioridade, responsável, prazo, fornecedor em texto, motivo de bloqueio, checklist, comentários e histórico. A movimentação por arraste tem alternativa por seletor. Concluir exige checklist completo e ausência de bloqueio. Reabrir permite alterar o checklist. Filtros de texto, responsável, atraso e bloqueio são locais ao quadro. Atraso usa a data local e exclui tarefas concluídas.

O financeiro deriva os totais dos lançamentos demonstrativos do projeto. Baixas são reversíveis e não representam pagamento bancário, conciliação real ou lucro contábil. Projetos recém-criados começam sem lançamentos.

## Limites de produção

Ainda necessários: backend, autenticação, autorização por recurso, sincronização entre usuários, auditoria no servidor, controle de concorrência, arquivos, integrações, validação das regras e notificações. Operações não importa cartões do Trello. Arquivos reais e informações privadas de clientes não são usados nos exemplos.
