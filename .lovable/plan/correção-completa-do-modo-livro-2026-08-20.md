# Correção completa do Modo Livro

## Objetivo
Transformar o fluxo atual em geração integral e persistida: um livro só aparece como pronto quando todos os capítulos têm conteúdo real salvo. Livros antigos sem conteúdo ficam marcados como incompletos e podem ser gerados novamente.

## Implementação

### 1. Persistência e estados reais
- Evoluir `books` com subtítulo, status de geração, etapa/mensagem, capítulo e página atuais, percentual real, erro e versão atual.
- Evoluir `book_chapters` com referências estruturadas e número da versão.
- Criar histórico de versões do livro, mantendo materiais, estilo, sumário e motivo de cada atualização.
- Aplicar RLS e permissões por usuário em todas as novas estruturas.
- Marcar automaticamente livros legados sem capítulos preenchidos como `incomplete`, sem exibir progresso fictício.

### 2. Geração completa no clique principal
- Substituir o fluxo “criar sumário agora, gerar capítulos depois” por uma única operação autenticada que:
  1. valida todos os materiais selecionados e processados;
  2. reúne a base multi-arquivos do Tutor IA;
  3. cria título, subtítulo, apresentação e sumário;
  4. escreve todos os capítulos no estilo escolhido;
  5. exige conteúdo substancial e referências por capítulo;
  6. salva livro, capítulos e versão somente com estado coerente;
  7. marca como pronto apenas após validar que todos os capítulos possuem conteúdo.
- Persistir estado `generating`, `ready`, `incomplete` ou `failed` e uma etapa real para a interface.
- Em falha parcial, manter o item recuperável como “Geração incompleta”, nunca como livro pronto.
- Respeitar integralmente Acadêmico, Simplificado, Prático, Professor particular, Fofoca, Resumo e instrução livre nos prompts de todos os capítulos.
- Corrigir o tratamento de erros da IA: exibir a mensagem real; não repetir erros terminais; usar tentativas limitadas e espera apenas em 429/5xx.

### 3. Materiais e referências
- Preservar marcadores de origem durante a extração: arquivo e, quando disponível, página, slide ou aba.
- Usar apenas materiais realmente processados; bloquear geração com arquivos pendentes ou sem texto e informar quais precisam de atenção.
- Associar referências estruturadas a cada capítulo e mostrá-las ao final do conteúdo.
- Manter compatibilidade com PDF, documentos, slides, planilhas, imagens, HTML e texto já suportados; adicionar transcrição real para áudio/vídeo no processamento da base do Tutor IA, sem expor chave no navegador.

### 4. Biblioteca sem dados fictícios
- Consultar a contagem real de capítulos preenchidos.
- Exibir progresso de leitura apenas para livros prontos e com capítulos reais.
- Para livros incompletos, mostrar “Geração incompleta” / “Aguardando geração” e ação “Gerar livro novamente”.
- Liberar “Continuar leitura” e PDF somente quando o livro estiver completo.
- Manter renomear, excluir e adicionar conteúdo funcionando.

### 5. Leitor digital e continuidade
- Abrir diretamente na última página salva, sem gerar conteúdo durante a leitura.
- Persistir capítulo, página e percentual a cada navegação.
- Garantir capa, subtítulo, apresentação, sumário clicável, capítulos completos, seleção de capítulo e paginação real.
- Adicionar controles de tamanho da fonte e modo claro/escuro do leitor, preservando o visual global.
- Impedir seleção de capítulos vazios e remover qualquer ação que silenciosamente gere um capítulo no momento da leitura.

### 6. PDF completo
- Gerar PDF apenas quando todos os capítulos estiverem salvos.
- Incluir capa, subtítulo, apresentação, sumário com páginas corretas, capítulos, referências e paginação.
- Melhorar suporte a caracteres do português e impedir placeholders de capítulos não gerados.

### 7. Adicionar conteúdo e versões
- Analisar novos materiais contra o livro atual.
- Atualizar capítulos afetados e criar capítulos novos quando necessário.
- Registrar uma nova versão com materiais, estilo, sumário e conteúdo anterior preservados.
- Preservar a posição de leitura pelo capítulo correspondente sempre que possível.

## Validação
- Testar a chamada real da IA e conferir resposta/erro do Gateway.
- Gerar um livro com material PDF disponível na conta e confirmar conteúdo em todos os capítulos.
- Abrir pelo card, navegar, sair e confirmar retorno à última página.
- Alterar estilo e verificar reescrita efetiva do capítulo/livro.
- Baixar o PDF, renderizar suas páginas e inspecionar capa, sumário, conteúdo, referências e paginação.
- Adicionar material e confirmar nova versão e atualização do conteúdo.
- Testar a biblioteca e o leitor em viewport móvel, sem sobreposição e sem progresso fictício.
