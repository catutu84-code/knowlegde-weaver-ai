# Atualização completa do Tutor IA Catoala

## Objetivo
Evoluir o aplicativo existente como uma jornada única de aprendizagem — material → compreensão → livro/aula/resumo → prática → revisão → progresso — preservando autenticação, dados, identidade, temas, Cato e todas as funções já operacionais.

## O que será preservado
- Biblioteca dinâmica por curso, matéria e assunto, uploads e extração de arquivos.
- Professora Catoala com fontes, 18 linguagens e preferências salvas.
- Modo Livro, Estúdio, Quiz, Simulados, Flashcards, Mapas, Revisões, Caderno de Erros, Meu Ritmo, Pausa, Comunidade e temas.
- Banco atual, isolamento por usuário e políticas de acesso; mudanças serão somente aditivas e compatíveis.

## Fases de implementação

### 1. Início como central da jornada
- Reorganizar “Hoje” para responder rapidamente o que é o Catoala, o que fazer e como começar.
- Reaproveitar os atalhos existentes, acrescentando somente os destinos faltantes: enviar material, criar livro, explicar, questões, flashcards, simulado e conversa.
- Melhorar “Continue de onde você parou” com livro/atividade, etapa atual, progresso, último acesso e ação correta.
- Adicionar “Como você quer estudar hoje?” com seis caminhos funcionais.
- Transformar “Não sei por onde começar” em orientação curta por etapas, usando materiais, prova, tempo e dificuldades reais, com plano aceito/editável.
- Integrar meta diária, sequência, revisão pendente e recomendação da Professora Catoala sem excesso visual.

### 2. Fluxo único a partir do material
- Melhorar o envio para exibir arquivos selecionados, status individual, confirmação de identificação e erros por arquivo.
- Após processamento, oferecer ações reais no mesmo contexto: livro, resumo, explicação, flashcards, questões, simulado, mapa e plano de revisão.
- Na página do material, mostrar uma visualização adequada do conteúdo recebido e manter fontes rastreáveis nas gerações.
- Garantir que cada ação carregue o material/assunto selecionado, evitando o usuário refazer filtros.

### 3. Modo Livro completo e contínuo
- Corrigir abertura/leitura inicial, restauração exata de capítulo e página, salvamento contínuo do progresso e conclusão do livro.
- Mostrar capa, subtítulo, introdução, sumário, capítulos/subcapítulos, páginas e navegação anterior/próxima de forma consistente.
- Reforçar a geração de capítulos com explicação, exemplos identificados, conceitos-chave, resumo, perguntas e referências do material.
- Fazer ações do capítulo usarem o conteúdo daquele capítulo, não todo o conjunto de materiais.
- Manter chat contextual, destaques, anotações, mudança de estilo, versões e inclusão de novos materiais.
- Completar o PDF paginado com capa, subtítulo, introdução, sumário correto, capítulos completos, referências e numeração.

### 4. Prática, avaliação e revisão conectadas
- Quiz: manter quantidade/dificuldade/tipo; melhorar retorno do erro com conceito, fonte e ação “Estudar este assunto”.
- Simulados: adicionar tempo opcional, resultado final consistente, dificuldades detectadas e ações para revisar erros/gerar flashcards/estudar assuntos.
- Corrigir o registro da pontuação final e consolidar tentativas no progresso.
- Flashcards: registrar “Já sei/Ainda não sei”, datas de revisão e priorizar cartões vencidos/erros, mantendo geração por material/capítulo/resumo.
- Revisão inteligente: priorizar erros frequentes, respostas demoradas, itens vencidos e conteúdos antigos.
- Mapas mentais: expansão/recolhimento por ramo e retorno ao conteúdo de origem.

### 5. Plano, ritmo, lembretes e progresso
- Tornar o plano adaptável a materiais, capítulos, dificuldade, tempo disponível, prova, desempenho e erros; permitir ajustar e iniciar cada etapa.
- Ampliar lembretes com dias, horários, conteúdo e tipo escolhidos, preservando consentimento, silêncio, limite e ativação/desativação.
- Integrar avisos gentis de meta pendente, sequência em risco, retorno, material pronto, revisão, prova e conquista usando Cato sem culpa ou pressão.
- Completar “Meu Progresso” com conteúdos/capítulos concluídos, questões, acertos, tempo, sequência e itens em andamento em uma leitura simples.
- Manter controle do usuário sobre preferências e histórico acadêmico.

### 6. Coesão, segurança e qualidade
- Criar ações contextuais entre resumo, livro, flashcards, questões, revisão e simulado para formar um ciclo contínuo.
- Manter respostas fundamentadas, separar complemento da IA e expor fontes quando disponíveis.
- Ajustar somente o necessário no banco, com migrações não destrutivas, permissões explícitas e isolamento por usuário.
- Revisar português, acessibilidade, foco, contraste, temas, Cato, carregamentos e estados vazios.
- Corrigir controles nativos inconsistentes em fluxos alterados usando os componentes visuais existentes.

## Alterações técnicas previstas
- Evoluir registros atuais de sessão, tentativa, flashcard, livro, plano e lembrete em vez de duplicar entidades.
- Acrescentar apenas campos necessários para tempo de resposta, conclusão/progresso, agenda de lembretes e origem contextual.
- Criar utilitários compartilhados para transportar contexto entre páginas e registrar atividades de modo uniforme.
- Manter operações sensíveis em funções autenticadas e consultas sempre vinculadas ao usuário.

## Validação obrigatória
- Testar com sessão real: upload → material identificado → geração → livro → leitura → questões → erro → revisão → progresso.
- Testar retomada de livro após recarregar e PDF completo.
- Testar quiz, simulado temporizado, flashcards agendados, mapa expansível e plano editável.
- Testar lembretes somente após consentimento, com dias/horários e desativação.
- Verificar isolamento entre usuários e políticas de todas as tabelas alteradas.
- Verificar todas as páginas nos cinco temas, Cato oculto, animações reduzidas, celular e desktop sem cortes ou botões inativos.
- Confirmar compilação, erros de execução, console e fluxos principais antes da entrega.

## Ordem de entrega
1. Início e continuidade.
2. Material e ações contextuais.
3. Modo Livro e PDF.
4. Quiz, simulados, flashcards, mapas e revisão.
5. Plano, lembretes e progresso.
6. Auditoria final de segurança, mobile, desktop e temas.
