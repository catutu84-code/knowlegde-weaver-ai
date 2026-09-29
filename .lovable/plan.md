# Catoala Game Lab — implementação integrada

## Objetivo
Criar dentro do Tutor IA Catoala uma experiência de aprendizagem ativa para adultos, gerada dinamicamente a partir dos materiais privados do próprio usuário. O fluxo será material → conceitos → desafios → explicação → nova tentativa → domínio → revisão, sem substituir ou duplicar Quiz, Caderno de Erros, XP, Biblioteca e demais recursos existentes.

## Experiência principal
- Adicionar **Game Lab** ao menu e às ações de cada material pronto, preservando o contexto selecionado entre páginas.
- Exibir a análise do material com temas, subtópicos, conceitos, processos e pontos importantes antes de iniciar uma partida.
- Criar a central do Game Lab com Cato personalizado, nível/XP/moedas, Desafio Agora, modos disponíveis, conquistas, evolução e materiais recentes.
- Manter linguagem adulta, acolhedora e objetiva; o Cato acompanha sem infantilizar, culpar ou pressionar.

## Modos de jogo
1. **Desafio do Conteúdo**
   - Misturar múltipla escolha, verdadeiro/falso, completar, associação, ordenar etapas, classificar, comparar, identificar erro e responder com palavras próprias.
   - Pedir justificativa quando útil e distinguir domínio de possível chute.
2. **Investigador**
   - Missão em seis fases: identificar informação, reconhecer conceito, decidir, justificar, observar consequência e resolver o caso.
   - O cenário pode ser fictício; todo conhecimento necessário permanece rastreável ao material.
3. **Desafio 360°**
   - Progressão por memória, compreensão, relação, aplicação, raciocínio e domínio.
   - Combinar mais conceitos conforme o desempenho melhora.
4. **Batalha Final**
   - Avaliar os conceitos centrais e entregar relatório com domínio, revisão necessária, maior dificuldade e próximo passo.
5. **Desafio Agora**
   - Criar uma missão curta de 3–5 minutos com material estudado recentemente e sem repetir perguntas anteriores.

## Aprendizagem adaptativa
- Registrar resposta, tempo, uso de pista, justificativa, tentativas e conceito avaliado.
- Ajustar cinco níveis cognitivos com base no histórico individual, sem apenas facilitar após um erro.
- No erro, explicar o objetivo, conceito, falha de raciocínio, solução e oferecer nova tentativa equivalente.
- O botão **Não entendi** pausa o jogo e oferece explicação simples, exemplo, analogia ou passo a passo; depois gera uma atividade nova sobre o mesmo conceito.
- Reforçar conceitos frágeis no Caderno de Erros e nas Revisões existentes.

## Fidelidade e IA
- Gerar um mapa pedagógico estruturado de cada material processado e manter referência ao trecho/material usado em cada desafio.
- Usar prioritariamente o conteúdo selecionado; quando algo não estiver nele, informar isso claramente.
- Variar contexto, ordem, formato, alternativas, dificuldade e combinação de conceitos sem inventar conteúdo.
- Implementar geração e avaliação no servidor com o modelo padrão da plataforma, respostas estruturadas validadas, erros seguros e sem exposição de chaves.

## Progressão e personalização
- Integrar o XP e a sequência já existentes; acrescentar moedas virtuais e níveis Curioso → Mentor, deixando claro que não são certificação.
- Conquistas: Primeira Missão, Raciocínio Afiado, Modo Foco, Sem Chute, Evolução e Material Dominado.
- Comparar apenas o usuário consigo mesmo, mostrando recordes e evolução por conceito/material.
- Criar inventário cosmético e editor por camadas para expressão, olhos, óculos, roupa, acessório, ambiente e cores.
- Ampliar o SVG atual do Cato com estados de início, pensamento, acerto, sequência, erro, ajuda, espera, conclusão, nível e desbloqueio, respeitando tema, mascote oculto e movimento reduzido.
- Aplicar roupa/ambiente temático apenas como adaptação visual, sem mudar conteúdo ou dificuldade.

## Dados e segurança
- Fazer migrações somente aditivas para análises de material, partidas, desafios/respostas, domínio por conceito, perfil de jogo, inventário e itens cosméticos.
- Toda tabela terá permissões explícitas, acesso restrito ao proprietário e exclusão em cascata quando o material for removido.
- Reutilizar `materials`, `study_sessions`, `user_errors`, `achievements` e `profiles`; não criar cópias dessas entidades.
- Validar propriedade do material e da partida em todas as funções autenticadas.

## Interface e integração
- Visual mais tecnológico e energético usando os tokens rosa, azul e lilás atuais, sem perder os cinco temas nem criar aparência infantil.
- Controles grandes para toque, estados sem depender de hover, progresso estável e layout completo em celular, tablet e desktop.
- Integrar entradas em Início, página do material e Biblioteca; resultados alimentam Meu Progresso, Caderno de Erros, Revisões e recomendações.
- Nenhum botão será decorativo: personalizar, equipar, continuar, tentar novamente, excluir e revisar terão comportamento real.

## Ordem de entrega
1. Dados privados, tipos, funções autenticadas e geração estruturada baseada no material.
2. Central Game Lab, análise do material, Desafio Agora e Desafio do Conteúdo.
3. Motor adaptativo, Não entendi, tratamento pedagógico de erros e relatórios.
4. Investigador, Desafio 360° e Batalha Final.
5. XP/moedas/conquistas/recordes e editor completo do Cato.
6. Integrações com as páginas existentes e validação final.

## Validação obrigatória
- Testar com sessão real: material pronto → análise → partida → erro/acerto → explicação → nova tentativa → conclusão → revisão/progresso.
- Confirmar que partidas do mesmo material variam sem perder fidelidade e que referências são exibidas.
- Verificar isolamento entre usuários, exclusão associada, pontuação idempotente e ausência de recompensas duplicadas.
- Testar todos os modos, retomada de partida, recorde pessoal, desbloqueio/equipamento e preferências persistentes.
- Verificar cinco temas, Cato oculto, movimento reduzido, teclado/leitor de tela, celular, tablet e desktop.
- Confirmar compilação, console, rede e chamadas de IA antes da entrega.
