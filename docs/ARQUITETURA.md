# Arquitetura e evolução

## O que já é executável no protótipo

React + TypeScript + Vite, com fonte DM Sans local, ícones Lucide, layout responsivo e persistência local. O domínio numérico não depende da interface. `BriefingAI` define o contrato de interpretação do briefing; `DemoBriefingAI` é a implementação simulada. As bibliotecas ExcelJS, JSZip e PDF.js são importadas sob demanda. Textos dos anexos do briefing ficam no estado local; arquivos de apresentações usam IndexedDB. Nenhuma chave ou credencial é necessária ou incluída.

`src/types.ts` registra as entidades. `src/domain.mjs` concentra cálculos e extração demonstrativa. `src/store.tsx` gerencia o estado local. `src/briefing-analysis.ts` reúne sugestões e fontes; `src/attachments.ts` e `src/read-pdf.ts` fazem a leitura local. Páginas separam os fluxos de atendimento, cadastros e próximos módulos. `public/fluxo.svg` é o diagrama sequencial.

## MVP de produção previsto

Substituir o armazenamento local por API, banco, armazenamento de arquivos e autenticação. Implementar autorização no servidor para todos os recursos, trilha de auditoria, controle de concorrência, backups e restauração. O cadastro visual de perfis não substitui esses controles.

O portal de fornecedor precisa de tokens de acesso limitados por solicitação, expiração, revogação, autorização de cada operação no servidor, validação de campos e arquivos e proteção contra abuso. Não pode expor o estado completo da agência como faz esta demonstração.

E-mails de fornecedores: composição, revisão humana, envio transacional, fila/reenvio e registro do estado real. No início, mensagens do cliente continuam com entrada manual. O Gmail completo é um pacote separado, sujeito à situação de cada conta, consentimento e escopos necessários.

Propostas: regras comerciais confirmadas, testes monetários, versões imutáveis em banco, geração consistente de PDF/Excel e aprovação vinculada à versão. Aceite não gera contratação automaticamente.

`src/quote-model.ts` demonstra alternativas, itens opcionais, versões, conversa e confirmação da composição. A importação conserva a origem de cada item; revisões posteriores sinalizam o rascunho desatualizado. Essas invariantes precisam ser validadas novamente no servidor e persistidas transacionalmente em produção. Consulte [negociação de cotações](COTACOES-E-NEGOCIACAO.md).

## Provedor de IA substituível

O frontend envia o texto ao backend da Adviser, que chama um adaptador. Adaptadores de API externa e de modelo próprio devem devolver o mesmo esquema validado. Prompts, contexto recuperado e regras ficam no domínio da aplicação. Chaves ficam apenas no servidor. Persistir a origem e permitir revisão humana antes de aplicar dados.

A interface já usa um contrato independente do fornecedor, porém **não há integração externa ou modelo próprio implementado**. Trocar o provedor de produção exigirá implementar e avaliar o adaptador, testar a qualidade em português e operar a infraestrutura. Não é apenas trocar uma URL.

Falhas de IA preservam o texto e permitem preenchimento manual. Preferir retries limitados e diagnóstico de falha. Um modo futuro exclusivamente local não deve usar um provedor externo silenciosamente. Treinar um modelo com todo o histórico não é pré-requisito: começar com instruções, esquema e exemplos autorizados; avaliar necessidade de busca de conhecimento ou ajuste posterior.

## Evolução

Etapa 2 — Operações (nome da área e responsabilidades a confirmar): recebe o pacote do atendimento e cria o projeto/evento a partir da versão aceita. Tarefas, responsabilidades, criação e suas aprovações, produção, fornecedores contratados, execução e encerramento operacional. A criação pode começar antes do aceite; o projeto formal pode nascer depois. O MVP termina com o aceite e a preparação desse repasse.

Etapa 3: financeiro próprio por evento, previstos/realizados, recebimentos, pagamentos, conciliação e fechamento. Pagamentos acontecem ao longo do projeto; o fechamento vem após a execução. Mapear o uso atual do Conta Azul para decidir integração, migração e cobertura necessária antes de uma eventual retirada. Não há compromisso de equivalência fiscal, bancária ou contábil nesta prévia.

Opcional: Gmail completo; portal do cliente conforme interesse e compliance; IA em infraestrutura própria. Não incluir inscrição/site do evento no MVP.

## Entrega e propriedade

Fonte e documentação do software próprio são parte da entrega sob medida. Prever migração para contas de infraestrutura da Adviser, inventário de serviços/dependências, instruções de deploy, configuração sem segredos versionados, backup/restauração e capacitação. Condições da cessão e de suporte dependem do contrato; bibliotecas e serviços externos não passam a ser propriedade da Adviser.

## Dossiê colaborativo do briefing

A demonstração mantém histórico manual com o cliente e versões de apresentações com feedback. O contrato de IA aceita fontes nomeadas e devolve sugestões por campo, com trecho de origem. A aplicação depende de confirmação humana e evita aplicar resultado desatualizado. Esse dossiê leve não implementa tarefas, produção, autenticação ou aprovação pelo cliente em portal. Consulte [briefing e criação](BRIEFING-E-CRIACAO.md).
