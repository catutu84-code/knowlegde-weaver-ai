# Atualização Mestre — Tutor IA Catoala

O pedido é grande demais para uma entrega única confiável. Abaixo está o que já existe, o que será construído e em que ordem. Tudo continua gratuito, sem paywall, sem remover nada.

## Já existe hoje (será preservado e reaproveitado)
- Biblioteca (Curso > Matéria > Assunto), upload e extração de PDF/Word/Excel/Slides/HTML/TXT/imagem, Modo Livro completo (capa, capítulos, leitura paginada, PDF), Quiz, Simulados, Flashcards, Mapas mentais, Caderno de erros, Revisões, Plano de estudos, Desempenho, Tutor IA, Favoritos, Comunidade.
- Identidade rosa/azul-bebê, menu lateral recolhível, autenticação e RLS por usuário.

## Fase 1 — Professora Catoala (chat que ensina)
- Renomear a aba Tutor IA para **Professora Catoala** (rota atual mantida).
- Três fontes visíveis no chat: **Só meus materiais**, **Materiais + conhecimento geral**, **Pergunta geral**. Quando a resposta não estiver no material, a IA diz isso e oferece usar conhecimento geral em vez de inventar.
- Seletor de **modos de explicação** (Professora, Passo a Passo, Acadêmico, Técnico, Simples, Super Simples, Prático, Fofoca, Futebol, Série/Filme, História, Conversa entre Amigas, Analogia do Cotidiano, Visual, Socrático, ENEM/Prova, Revisão Relâmpago, Personalizado) + tamanho (curta/média/detalhada), nível (iniciante/intermediário/avançado), com/sem exemplos, com/sem perguntas de checagem. Modos criativos sempre encerram com a seção "Agora na linguagem da matéria".
- Preferências salvas como padrão da conta.
- Ações abaixo de cada resposta que realmente funcionam: Explique de outro jeito, Deixe mais simples, Aprofunde, Dê um exemplo, Faça uma analogia, Transforme em resumo, Teste meu conhecimento, Adicionar ao caderno de erros, Salvar na biblioteca. "Ouvir explicação" entra com a leitura por voz do navegador.
- Histórico de conversas persistido (tabelas de chat já existentes).

## Fase 2 — Tela "Hoje" e Meu Ritmo
- Nova tela **Hoje** substituindo o painel inicial: saudação com nome, meta diária, próxima matéria, o que revisar, livro/aula incompleta, tempo estudado na semana, ritmo atual, próxima prova, e os botões **Sessão de 10 minutos**, **Continuar de onde parei** e **Não sei o que estudar** (a IA escolhe a atividade a partir do progresso real). Mensagem motivacional variada, sem repetição.
- **Meu Ritmo**: questionário no primeiro acesso (objetivo, matérias, dias por semana, minutos por dia, horários, datas de prova, notificações, frequência máxima, horário de silêncio). Metas, níveis e conquistas com nomes próprios da Catoala.
- Banco: preferências de ritmo, metas, sessões, provas, conquistas — tudo com RLS por usuário.

## Fase 3 — Notificações reais
- Service Worker + Web Push (chaves VAPID geradas e guardadas no backend), notificações internas no app, agendador no backend chamando uma rota pública protegida por segredo.
- Gatilhos: horário de estudo, continuar livro/aula, revisão no momento certo, retomada após ausência, prova próxima, material processado, meta concluída, resumo semanal, sessão curta quando o ritmo cair.
- Regras: fuso do usuário, horário de silêncio, sem duplicidade, deep link para a atividade, ações "Estudar agora / Lembrar depois / Hoje não posso", botão de notificação de teste, estado alternativo quando o navegador negar permissão, desligar para imediatamente. Nunca culpa ou comparação.

## Fase 4 — Estúdio Catoala
- Central única a partir dos materiais selecionados, reunindo o que já existe (livro, resumo, mapa mental, flashcards, quiz, simulado, plano de estudos, caderno de erros, revisão para prova) e adicionando: guia de estudos, aula explicativa, glossário, perguntas frequentes, linha do tempo, caderno de exercícios, infográfico (visual em HTML), apresentação de slides.
- Cada saída mostra fontes, e permite editar, regenerar só uma parte, trocar o modo de explicação, salvar, ler na plataforma, baixar e continuar de onde parou.
- Audioaula/podcast/aula narrada usam a voz do navegador nesta fase; narração com voz de IA fica marcada como próxima etapa (depende de um serviço de voz).
- Nenhum botão decorativo: recurso ainda não pronto não aparece.

## Fase 5 — Pausa Catoala
- Aba de acolhimento com aviso claro de que não substitui psicólogo, médico ou emergência.
- Opções iniciais de entrada (desabafar, ansiedade, sobrecarga, perda de ritmo, medo de prova, concentração, organizar pensamentos, próximo passo, pausa guiada, procurar ajuda).
- A IA pergunta antes se deve escutar, organizar ou pensar num próximo passo. Não diagnostica, não indica remédio, não se apresenta como psicóloga.
- Protocolo de risco: interrompe gamificação, acolhe, pergunta sobre perigo imediato, mostra CVV 188, CAPS/UBS e SAMU 192 com botões de ligação; adapta ao país quando fora do Brasil.
- Botão "Encontrar apoio profissional" com serviços públicos verificados, pedindo cidade/estado só com autorização.
- Privacidade: conteúdo emocional não é salvo por padrão; diário só com consentimento registrado; apagar histórico a qualquer momento; separado das métricas acadêmicas.

## Fase 6 — Materiais e referências
- Referência por página/slide/aba/minuto na extração (marcadores no texto extraído) e citação dessas posições nas respostas.
- Busca semântica nos materiais para escolher os trechos certos antes de responder.
- Áudio e vídeo: transcrição depende de um serviço de fala-para-texto; será avaliado nesta fase e informado se exigir configuração externa.

## Notas técnicas
- Chaves de IA continuam apenas no backend (server functions); nada de chave no navegador.
- Todas as tabelas novas com GRANT + RLS por `auth.uid()`, migrações aditivas — nenhum dado existente é apagado.
- Notificações via Service Worker + Web Push com chaves VAPID; o agendador chama uma rota pública com segredo.
- Preferências de explicação e ritmo ficam no perfil do usuário.

## Ordem de entrega
Começo pela Fase 1 e sigo em sequência, mostrando o resultado a cada fase para você testar antes da próxima.
