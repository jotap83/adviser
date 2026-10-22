# Tours de apresentação

Mode: Operate. Extensão autorizada: menu superior para escolher um roteiro completo do nascimento da demanda ao aceite, além de tours das demais funcionalidades.

THESIS: orientar a fala e a navegação de quem apresenta o sistema aos sócios, com uma área em destaque por vez.

OWN-WORLD: preservar a marca Adviser, DM Sans, azul, laranja, controles e superfícies existentes. Guia discreto fixo na base e menu de roteiros no cabeçalho; sem refazer as telas.

STORY: escolher tour, percorrer capítulos e cenas de um evento fictício, experimentar as ações reais da interface, pausar ou saltar uma parada, concluir e escolher outro roteiro. Atendimento completo tem 25 paradas agrupadas em seis capítulos; tours curtos cobrem gestão, canais, cadastros, nove oportunidades de IA, operações, financeiro e visão da plataforma.

FIRST VIEWPORT: botão Tours ao lado de Explorar IA. Menu com finalidade e tamanho de cada roteiro. Durante o tour, trecho destacado, instrução concreta, fala opcional para os sócios, posição, seletor de etapa, Anterior, Próximo, Pausar e Encerrar.

FORM: extensão direta do mundo existente. No celular o guia reflow em uma coluna, com altura limitada e rolagem própria. Sem avanço automático ou tour obrigatório.

QUALITY BAR: cenas explicitamente preparadas, sem fingir que uma ação comercial ocorreu ao clicar Próximo. Estado de apresentação temporário separado do estado salvo; voltar ou pular prepara uma nova cena e não muda os registros do usuário. Progresso local permite retomar após recarga, a partir de uma nova cena. Mensagem inicial sem demanda, briefing sem validação automática, versões preservadas, aceite com evidência e referência correta. Nada é enviado, contratado ou pago. Histórico, valores e pessoas totalmente fictícios.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Evidências de encerramento — 22/10/2026

**Veredito da revisão independente: ship.** A revisão final confirmou TYPE, MATERIAL, GROUND e os cinco compromissos da superfície, sem correções materiais pendentes. A adaptação móvel foi considerada coerente com o uso do guia. O mundo visual estabelecido permanece: `DESIGN.md` e `.impeccable/design.json` foram preservados.

| Verificação final | Evidência |
| --- | --- |
| Testes e compilação | 35/35 testes aprovados; TypeScript, build Vite e build independente aprovados; `git diff --check` limpo. |
| Cobertura dos roteiros | Oito tours, 63 paradas; alvo real encontrado em todas as 63. O roteiro principal tem 25 paradas em seis capítulos. |
| Ações demonstradas | 32 sugestões do briefing aplicadas; aprovação da proposta v2 registrada por clique. |
| Isolamento dos dados | Nome temporário editado durante o tour; ao encerrar, os 20 registros originais retornaram e o nome temporário estava ausente. |
| Continuidade | Pausa, retomada, salto, conclusão e recarga verificados. Foco levado a Retomar tour na pausa, ao título na retomada e ao título de conclusão. |
| Responsividade | No iframe de 390 × 844, largura útil e largura rolável iguais a 375 px; sem transbordamento horizontal da página. |

Capturas finais locais, ignoradas pelo Git: `.impeccable/review/tour-desktop-menu.jpg`, `.impeccable/review/tour-desktop-guide.jpg` e `.impeccable/review/tour-mobile-final.jpg`. Nenhum novo recurso raster integra a entrega. O detector foi executado uma vez; seus nove apontamentos consultivos de paleta e tamanho de texto foram corrigidos com os tokens existentes.

O uso, a sequência de apresentação e a diferença entre progresso salvo e cenas descartáveis estão documentados em `docs/TOURS-DE-APRESENTACAO.md`, com entrada preferencial no `README.md` e roteiro manual mantido. As evidências verificam a execução local e o arquivo independente; não atestam publicação na Vercel.
