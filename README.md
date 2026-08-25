# Tutor IA Catoala 

PROJETO: PLATAFORMA INTELIGENTE DE ESTUDOS COM IA



Quero que você crie uma plataforma web completa, moderna, responsiva e multiusuário para estudos, funcionando como uma inteligência artificial particular de aprendizagem.



A plataforma NÃO deve ser criada apenas para um conteúdo específico.



Ela deve ser construída para funcionar de maneira contínua e escalável, pois eu vou alimentá-la com novos conteúdos, matérias, PDFs, apostilas, textos, resumos, apresentações e anotações ao longo do tempo.



Novos conteúdos adicionados futuramente devem ser automaticamente incorporados às ferramentas de estudo da plataforma.



Além disso, a plataforma será utilizada por mim e também por amigos/convidados, portanto todo o sistema deverá possuir contas individuais, segurança, separação de dados e acompanhamento individual do desempenho.



⸻



1. OBJETIVO PRINCIPAL



Criar uma plataforma onde o usuário possa adicionar seus próprios materiais de estudo e utilizar inteligência artificial para transformar esses materiais automaticamente em:



Resumos;

Explicações;

Quiz;

Questões;

Flashcards;

Mapas mentais;

Simulados;

Perguntas discursivas;

Exercícios;

Exemplos práticos;

Revisões;

Planos de estudo;

Conteúdo simplificado;

Conteúdo acadêmico;

Explicações utilizando analogias;

Revisões baseadas nos erros do próprio usuário.



A IA deverá utilizar principalmente os materiais enviados para aquela matéria ou assunto, evitando inventar informações que não estejam relacionadas ao conteúdo.



⸻



2. SISTEMA MULTIUSUÁRIO



Criar autenticação completa.



Cada pessoa deverá possuir sua própria conta.



Tela inicial:



Entrar



E-mail

Senha

Esqueci minha senha



Criar conta



Nome

E-mail

Senha

Confirmar senha



Cada usuário deverá possuir:



Perfil;

Foto;

Nome;

Biblioteca pessoal;

Matérias;

Materiais;

Histórico de estudos;

Flashcards;

Mapas mentais;

Quiz realizados;

Resultados;

Progresso;

Pontuação;

Sequência de estudos;

Estatísticas individuais.



IMPORTANTE:



Um usuário não poderá visualizar os arquivos pessoais de outro usuário, exceto materiais que tenham sido explicitamente definidos como compartilhados.



⸻



3. PERFIL ADMINISTRADOR



Minha conta deverá possuir o perfil:



ADMINISTRADOR



O administrador poderá:



Criar matérias globais;

Adicionar conteúdos;

Criar categorias;

Publicar materiais compartilhados;

Gerenciar usuários;

Visualizar usuários cadastrados;

Criar conteúdos disponíveis para todos;

Editar conteúdos compartilhados;

Excluir conteúdos;

Gerenciar a biblioteca geral da plataforma.



Criar separação clara entre:



Minha biblioteca



e



Biblioteca compartilhada



⸻



4. BIBLIOTECA DE ESTUDOS



Criar uma biblioteca organizada.



Estrutura:



Curso

↓

Matéria

↓

Assunto

↓

Conteúdos



Exemplo:



Processos Gerenciais



→ Gestão Estratégica



→ Planejamento Estratégico



→ Material 01



→ Material 02



O usuário deverá conseguir criar quantas matérias e assuntos quiser.



⸻



5. ALIMENTAÇÃO CONTÍNUA E UPLOAD UNIVERSAL DE MATERIAIS



Este é um dos requisitos MAIS IMPORTANTES de toda a plataforma.



A plataforma será alimentada continuamente por mim e pelos demais usuários com novos conteúdos de estudo.



Quero uma área central chamada:



➕ ADICIONAR MATERIAL



Ela deverá permitir que o usuário alimente a plataforma utilizando diversos tipos de arquivos e formatos, sem ficar limitado apenas a PDF.



FORMATOS QUE DEVEM SER SUPORTADOS



Sempre que tecnicamente possível, permitir upload e processamento de:



📄 DOCUMENTOS



PDF

DOC

DOCX

TXT

RTF

ODT

Markdown (.md)



🌐 CONTEÚDO WEB



HTML

HTM

Arquivos de páginas salvas

Texto copiado de páginas da internet



Quando um arquivo HTML for enviado, extrair principalmente o conteúdo textual relevante e evitar utilizar menus, códigos ou elementos desnecessários da página como conteúdo de estudo.



📊 PLANILHAS E DADOS



XLS

XLSX

CSV

ODS



A plataforma deverá conseguir identificar:



Tabelas;

Títulos;

Colunas;

Informações importantes;

Dados que possam ser utilizados para gerar perguntas, explicações e exercícios.



📽️ APRESENTAÇÕES



PPT

PPTX

ODP



Extrair:



Títulos dos slides;

Textos;

Tópicos;

Informações relevantes;

Estrutura da apresentação.



🖼️ IMAGENS



Permitir:



JPG

JPEG

PNG

WEBP

HEIC

Outros formatos de imagem seguros e compatíveis.



Quando uma imagem possuir conteúdo textual, utilizar reconhecimento de texto quando disponível.



A IA deverá conseguir utilizar o conteúdo identificado na imagem como material de estudo.



Exemplo:



Eu tiro uma foto de uma página da apostila e envio.



A plataforma deverá conseguir utilizar aquela informação para:



Explicar;

Resumir;

Criar perguntas;

Criar flashcards;

Criar quiz;

Criar mapa mental.



⸻



COLAR CONTEÚDO DIRETAMENTE



Além do upload de arquivos, permitir:



📝 COLAR TEXTO



O usuário poderá copiar qualquer texto e colar diretamente na plataforma.



✍️ ESCREVER ANOTAÇÃO



Permitir escrever uma anotação manualmente e transformá-la em material de estudo.



🌐 ADICIONAR CONTEÚDO DE SITE



Preparar a arquitetura para futuramente permitir que o usuário informe um link de uma página e importe seu conteúdo para estudo, respeitando segurança e limitações técnicas.



⸻



UPLOAD DE VÁRIOS ARQUIVOS



Permitir selecionar e enviar vários arquivos de uma vez.



Exemplo:



O usuário poderá enviar:



3 PDFs;

2 apresentações;

5 imagens;

1 planilha;

1 documento Word;



para a mesma matéria.



A plataforma deverá processar cada material separadamente, mas permitir utilizá-los conjuntamente como base daquela matéria.



⸻



ORGANIZAÇÃO DURANTE O UPLOAD



Ao adicionar um arquivo, solicitar:



Título do material



Curso



Matéria



Assunto



Tags



Privacidade



Opções de privacidade:



🔒 Somente eu



👥 Compartilhar com pessoas específicas



🌎 Compartilhar na biblioteca da comunidade



Também permitir adicionar uma descrição opcional.



⸻



PROCESSAMENTO INTELIGENTE DO ARQUIVO



Depois que um material for enviado, não quero que ele seja simplesmente armazenado.



A plataforma deverá realizar um processamento para tornar aquele arquivo pesquisável e utilizável pela inteligência artificial.



Fluxo desejado:



ARQUIVO ENVIADO



↓



Identificar o formato



↓



Extrair o conteúdo relevante



↓



Processar o texto/conteúdo



↓



Organizar por partes



↓



Relacionar ao usuário



↓



Relacionar à matéria e ao assunto



↓



Salvar informações necessárias no banco



↓



Disponibilizar para a IA



↓



Liberar ferramentas de estudo



Depois disso, o usuário poderá selecionar:



📖 Resumir



🗣️ Explicar



🧠 Criar mapa mental



🎯 Criar quiz



🃏 Criar flashcards



📝 Criar perguntas



🎓 Criar simulado



🤖 Perguntar ao Tutor IA



⸻



EXEMPLO PRÁTICO



Eu faço upload de:



Aula 01 - Planejamento Estratégico.pdf



Depois faço upload de:



Anotacoes-planejamento.docx



Depois:



SWOT.png



Depois:



Resumo.html



Depois:



Indicadores.xlsx



Todos esses arquivos deverão poder ficar dentro de:



Processos Gerenciais



→ Gestão Estratégica



→ Planejamento Estratégico



A inteligência artificial poderá utilizar esses materiais conjuntamente para me ensinar aquela matéria.



⸻



PERMITIR SELECIONAR A BASE DA IA



Antes de gerar um quiz, resumo, mapa mental, flashcards ou conversar com o Tutor, permitir que o usuário escolha:



Utilizar:



○ Somente este material



○ Materiais selecionados



○ Todo o assunto



○ Toda a matéria



Isso é MUITO IMPORTANTE.



Exemplo:



Posso pedir:



“Crie um quiz somente usando Aula 01.pdf.”



ou:



“Crie um simulado utilizando tudo que eu já enviei sobre Gestão Estratégica.”



⸻



IDENTIFICAÇÃO DA ORIGEM DAS INFORMAÇÕES



Sempre que possível, a IA deverá saber qual material originou determinada informação.



Exemplo:



Resposta



Planejamento estratégico é…



Fonte utilizada:

Aula 01 — Planejamento Estratégico.pdf



Se possível, também indicar:



Página;

Slide;

Seção;

Arquivo.



Isso deverá ajudar o usuário a conferir a informação original.



⸻



ARQUIVOS NÃO SUPORTADOS



Não quero que o sistema simplesmente quebre quando receber um formato que ainda não consegue processar.



Se determinado arquivo não puder ser interpretado, mostrar uma mensagem amigável como:



“Este arquivo foi armazenado, mas ainda não conseguimos extrair seu conteúdo automaticamente.”



Quando possível, oferecer alternativas:



Converter para PDF



Enviar como imagem



Colar o conteúdo como texto



Nunca apresentar um erro técnico incompreensível para o usuário.



⸻



SEGURANÇA DOS UPLOADS



Implementar segurança obrigatória no sistema de arquivos.



Validar:



Tipo real do arquivo;

Extensão;

Tamanho;

Conteúdo potencialmente malicioso;

Permissões;

Usuário proprietário;

Controle de acesso.



Não confiar apenas no nome/extensão do arquivo.



Arquivos privados nunca poderão ser acessados por outros usuários.



⸻



PROCESSAMENTO ASSÍNCRONO E STATUS



Arquivos grandes podem precisar de processamento.



Mostrar status visual:



⬆️ Enviando



⚙️ Processando



✅ Pronto para estudar



⚠️ Não foi possível processar



Permitir continuar utilizando o restante da plataforma enquanto outros materiais estão sendo processados.



⸻



NÃO LIMITAR A PLATAFORMA AOS FORMATOS INICIAIS



A arquitetura deverá ser criada de forma extensível.



No futuro quero conseguir adicionar suporte a novos formatos sem precisar reconstruir toda a plataforma.



Portanto, crie uma camada de processamento de arquivos modular e organizada.



Cada tipo de arquivo poderá ter seu próprio processador.



Exemplo conceitual:



PDF Processor



Document Processor



Spreadsheet Processor



Presentation Processor



Image Processor



HTML Processor



Todos deverão enviar o conteúdo processado para uma estrutura comum utilizada pelo sistema de IA.



⸻



REGRA FUNDAMENTAL



A lógica da plataforma deverá ser:



EU ENVIO O QUE TENHO.



A PLATAFORMA ORGANIZA.



A IA ENTENDE O CONTEÚDO.



E TRANSFORMA EM UMA EXPERIÊNCIA DE ESTUDO.



Não quero precisar preparar manualmente cada material antes de adicioná-lo.



A plataforma deve facilitar ao máximo a alimentação contínua da biblioteca de estudos.



⸻



6. CENTRAL DE INTELIGÊNCIA ARTIFICIAL



Cada matéria deverá possuir um botão:



🤖 ESTUDAR COM IA



Ao abrir, mostrar:



O que você quer fazer com este conteúdo?



Cards:



📖 Resumir



🗣️ Explicar de forma simples



🎓 Explicar de forma acadêmica



💼 Explicar na prática



🧠 Criar mapa mental



🎯 Criar Quiz



📝 Criar questões



🃏 Criar Flashcards



🎓 Criar Simulado



✍️ Criar perguntas discursivas



🔁 Criar revisão



🤖 Conversar com Tutor IA



⸻



7. MODO “ME ENSINE ISSO”



Criar uma função especial chamada:



ME ENSINE ISSO



O usuário poderá selecionar um conteúdo e escolher como deseja aprender.



Criar os seguintes modos:



🗣️ COMO FOFOCA



Explicar de maneira extremamente fácil, descontraída e divertida, como se uma amiga estivesse contando uma fofoca.



Usar linguagem simples, mas sem perder a informação importante.



⸻



🎓 MODO FACULDADE



Explicação formal e acadêmica.



Mostrar:



Conceito;

Definição;

Características;

Teoria;

Aplicação;

Termos importantes.



⸻



💼 NA VIDA REAL



Transformar a teoria em situações reais.



Priorizar exemplos empresariais, profissionais e situações do cotidiano.



⸻



🧠 MODO MEMORIZAÇÃO



Explicar utilizando:



Analogias;

Palavras-chave;

Associações;

Técnicas de memorização;

Mnemônicos;

Exemplos simples.



⸻



📝 MODO PROVA



Mostrar:



O que você precisa saber deste assunto para uma prova.



Destacar:



Conceitos importantes;

Pegadinhas;

Diferenças entre conceitos;

Termos para memorizar;

Possíveis perguntas.



⸻



8. QUIZ INTELIGENTE



Criar módulo completo de Quiz.



Usuário deverá escolher:



Quantidade:



5 perguntas

10 perguntas

15 perguntas

20 perguntas

30 perguntas



Dificuldade:



🟢 Fácil



🟡 Médio



🔴 Difícil



🎓 Nível faculdade



Tipos:



Múltipla escolha;

Verdadeiro ou falso;

Perguntas abertas;

Questões de interpretação;

Misturado.



IMPORTANTE:



Não mostrar a resposta antes do usuário responder.



Depois da resposta mostrar:



✅ Correto



ou



❌ Incorreto



Em seguida:



Explicação da resposta



Mostrar também de qual conteúdo/material aquela resposta foi baseada sempre que possível.



⸻



9. SISTEMA DE ERROS



Este será um dos recursos mais importantes da plataforma.



Toda questão errada deverá ser registrada.



Criar:



CADERNO DE ERROS



Mostrar:



Pergunta;

Resposta do usuário;

Resposta correta;

Explicação;

Matéria;

Assunto;

Data;

Quantas vezes errou aquele conceito.



A IA deverá analisar os erros.



Exemplo:



Você está apresentando dificuldade em:



Planejamento estratégico — 4 erros



Matriz SWOT — 3 erros



Indicadores — 2 erros



⸻



10. REVISÃO INTELIGENTE



Criar:



REVISAR MEUS ERROS



A IA deverá gerar automaticamente novas questões sobre assuntos que o usuário mais errou.



Não repetir simplesmente a mesma pergunta.



Criar perguntas diferentes testando o mesmo conhecimento.



Conforme o usuário começar a acertar, diminuir a frequência daquele assunto.



⸻



11. MAPA MENTAL



Permitir gerar mapa mental automaticamente a partir de qualquer material.



Estrutura:



ASSUNTO PRINCIPAL



→ Conceito



→ Características



→ Subconceitos



→ Exemplos



→ Aplicações



Criar visual bonito e organizado.



O mapa deverá permitir:



Zoom;

Expandir;

Recolher;

Salvar;

Visualizar novamente posteriormente.



⸻



12. FLASHCARDS



Criar automaticamente flashcards.



Formato:



Frente



Pergunta / conceito



Verso



Resposta / explicação



Permitir:



✅ Acertei



❌ Errei



🤔 Mais ou menos



Usar essas informações futuramente para organizar as revisões.



⸻



13. TUTOR IA



Criar um chat chamado:



TUTOR IA



O usuário poderá conversar diretamente com a inteligência artificial.



Exemplos:



“Não entendi esse assunto.”



“Explique de outra forma.”



“Me dê um exemplo.”



“Faça uma comparação.”



“Qual a diferença entre esses conceitos?”



“Isso poderia cair em prova?”



“Me faça uma pergunta sobre isso.”



O Tutor deverá utilizar o conteúdo da matéria selecionada como contexto principal.



⸻



14. SIMULADOS



Criar:



MODO SIMULADO



O usuário escolhe:



Matéria;



Assuntos;



Quantidade de perguntas;



Dificuldade.



Durante o simulado:



NÃO mostrar respostas.



Ao final mostrar:



RESULTADO



Exemplo:



17/20



85% de acertos



Mostrar:



Pontos fortes;



Pontos fracos;



Assuntos que precisam ser revisados.



⸻



15. QUESTÕES DISCURSIVAS



A IA poderá fazer uma pergunta discursiva.



O usuário escreve sua resposta.



Depois a IA deverá avaliar utilizando critérios como:



Compreensão;

Clareza;

Conceitos utilizados;

Aplicação;

Organização.



Mostrar:



Nota sugerida



Exemplo:



8,5 / 10



Depois explicar:



O que você acertou



O que poderia melhorar



E apresentar uma sugestão de resposta completa.



⸻



16. DASHBOARD



Criar dashboard individual.



Mostrar cards:



📚 Matérias estudadas



🎯 Questões respondidas



✅ Taxa de acertos



🔥 Sequência de estudos



⏱️ Tempo estudado



🧠 Assuntos dominados



⚠️ Assuntos para revisar



Criar gráficos mostrando:



Taxa de acerto por matéria;



Evolução ao longo do tempo;



Assuntos com mais erros;



Quantidade estudada por semana.



⸻



17. PROGRESSO POR MATÉRIA



Cada matéria deverá apresentar:



Exemplo:



Gestão Estratégica



████████░░ 80%



Mostrar:



Conteúdos estudados;

Quiz realizados;

Flashcards revisados;

Taxa de acerto;

Última atividade.



⸻



18. PLANO DE ESTUDOS INTELIGENTE



Criar:



MEU PLANO DE ESTUDOS



A IA deverá poder sugerir:



Hoje você deveria estudar:



Gestão Estratégica — 30 minutos

Revisar Matriz SWOT — 15 minutos

Fazer 10 questões — 20 minutos

Revisar 8 flashcards — 10 minutos



Basear a recomendação no histórico e desempenho do usuário.



⸻



19. BUSCA



Criar barra de pesquisa global.



Permitir pesquisar:



Matérias;

Conteúdos;

Resumos;

Flashcards;

Mapas mentais;

Perguntas;

Anotações.



⸻



20. FAVORITOS



Permitir favoritar:



⭐ Conteúdo



⭐ Flashcard



⭐ Mapa mental



⭐ Resumo



⭐ Questão



Criar página:



MEUS FAVORITOS



⸻



21. ANOTAÇÕES



Cada conteúdo deverá possuir:



MINHAS ANOTAÇÕES



Permitir escrever e salvar comentários pessoais sobre aquele conteúdo.



⸻



22. COMPARTILHAMENTO ENTRE AMIGOS



Criar possibilidade de compartilhar determinados materiais.



Opções:



🔒 Privado



👥 Compartilhado



🌎 Disponível para todos os usuários da plataforma



O usuário deverá escolher a privacidade antes de compartilhar.



NUNCA tornar um arquivo pessoal público automaticamente.



⸻



23. ÁREA DE COMUNIDADE



Criar uma área chamada:



COMUNIDADE



Onde usuários possam visualizar conteúdos que outros decidiram compartilhar.



Permitir:



Favoritar;

Salvar na própria biblioteca;

Visualizar;

Utilizar o conteúdo para estudar.



Por enquanto NÃO criar chat público entre usuários.



Priorizar primeiro segurança e compartilhamento de materiais.



⸻



24. GAMIFICAÇÃO



Criar sistema leve de motivação.



Exemplo:



🔥 7 dias estudando



🏆 100 questões respondidas



🎯 90% de acertos



🧠 10 assuntos dominados



Criar níveis:



Iniciante



Estudante



Dedicado



Especialista



Mestre



A gamificação deve incentivar estudo, sem bloquear recursos importantes.



⸻



25. INTERFACE



Quero um design:



Moderno;

Elegante;

Jovem;

Inteligente;

Muito fácil de usar;

Organizado;

Responsivo para celular;

Responsivo para tablet;

Responsivo para computador.



Evitar excesso de informação na mesma tela.



Criar menus intuitivos.



⸻



26. MENU PRINCIPAL



Menu lateral:



🏠 Início



📚 Biblioteca



🎯 Quiz



🃏 Flashcards



🧠 Mapas Mentais



🎓 Simulados



❌ Caderno de Erros



🔁 Revisões



🤖 Tutor IA



📊 Meu Desempenho



📅 Plano de Estudos



⭐ Favoritos



👥 Comunidade



⚙️ Configurações



⸻



27. PÁGINA INICIAL



Criar uma Home personalizada.



Exemplo:



Olá! 👋



O que vamos estudar hoje?



Mostrar:



Continuar estudando



Matéria estudada recentemente.



Revisões pendentes



Assuntos que precisam ser revisados.



Desempenho da semana



Taxa de acertos.



Meta semanal



Tempo estudado.



Abaixo:



Botões rápidos:



📚 Estudar matéria



🎯 Fazer Quiz



🧠 Criar mapa mental



🃏 Revisar flashcards



🤖 Conversar com Tutor



⸻



28. BANCO DE DADOS



Criar uma arquitetura de banco de dados organizada.



Estruturas necessárias, podendo adaptar os nomes técnicos:



users



profiles



courses



subjects



topics



materials



user_materials



shared_materials



notes



quizzes



quiz_questions



quiz_attempts



answers



user_errors



flashcards



flashcard_reviews



mind_maps



simulations



study_sessions



study_progress



favorites



study_plans



achievements



O relacionamento deverá respeitar o usuário proprietário de cada informação.



⸻



29. SEGURANÇA



Este ponto é obrigatório.



Implementar:



Autenticação;

Controle de acesso;

Validação de dados;

Proteção de rotas;

Separação das informações por usuário;

Políticas de segurança no banco;

Validação de uploads;

Limite de tipos de arquivos permitidos;

Proteção contra acesso indevido aos materiais;

Tratamento de erros.



Nenhum usuário deverá conseguir acessar dados privados de outro alterando URLs ou requisições.



⸻



30. INTELIGÊNCIA ARTIFICIAL E CONTEÚDOS



A arquitetura deve permitir que novos conteúdos sejam adicionados continuamente.



A IA deverá conseguir localizar conteúdos relevantes dentro da biblioteca relacionada ao usuário/matéria e utilizá-los como contexto.



Quando não houver informação suficiente no material enviado para responder uma pergunta, informar claramente algo como:



“Não encontrei essa informação nos materiais disponíveis.”



Evitar inventar respostas.



⸻



31. IMPORTANTE SOBRE O DESENVOLVIMENTO



NÃO implemente todo este projeto de maneira desorganizada em uma única página.



Desenvolva com:



Componentes reutilizáveis;

Código organizado;

Arquitetura escalável;

Banco de dados estruturado;

Design consistente;

Rotas separadas;

Responsividade;

Tratamento de estados de carregamento;

Estados vazios;

Mensagens de erro;

Feedback visual.



O sistema precisa estar preparado para crescer futuramente.



⸻



32. PRIMEIRA VERSÃO



Comece criando uma primeira versão funcional com prioridade para:



Login e cadastro;

Perfis;

Dashboard inicial;

Biblioteca;

Criação de matérias;

Upload de materiais;

Organização dos conteúdos;

Tutor IA;

Resumos com IA;

Quiz;

Flashcards;

Registro de progresso.



Após garantir que esta base esteja funcionando corretamente, evoluir para:



Caderno de erros;

Revisão inteligente;

Mapas mentais;

Simulados;

Questões discursivas;

Plano de estudos;

Gamificação;

Comunidade.



NÃO destruir ou substituir funcionalidades prontas ao implementar uma nova etapa.



Sempre preservar o que já estiver funcionando.



⸻



33. EXPERIÊNCIA MAIS IMPORTANTE



Quero que a plataforma dê a sensação de possuir um:



PROFESSOR PARTICULAR + ORGANIZADOR DE ESTUDOS + GERADOR DE QUESTÕES + SISTEMA DE REVISÃO



em um único lugar.



O usuário simplesmente adiciona seu material e escolhe como quer aprender.



A partir daí, a inteligência artificial deve ajudá-lo a compreender, praticar, memorizar e revisar aquele conteúdo.



⸻



34. REGRA FUNDAMENTAL



Lembre-se durante TODO o desenvolvimento:



Esta plataforma não terá uma quantidade fixa de matérias ou conteúdos.



Eu e outros usuários iremos alimentá-la continuamente.



Por isso:



não inserir matérias diretamente no código;

não limitar quantidade de matérias;

não limitar quantidade de assuntos artificialmente;

não depender de conteúdos de demonstração para funcionar;

permitir criação, edição e exclusão dinâmica;

manter a estrutura preparada para novos usuários;

manter a estrutura preparada para milhares de novos materiais futuramente.



Quero uma aplicação real e funcional, e não apenas uma interface demonstrativa.



Antes de considerar cada módulo concluído, teste os fluxos principais e garanta que botões, formulários, uploads, navegação e salvamento estejam realmente funcionando.



Esse prompt já deixa claro algo muito importante para o Lovable: não queremos uma tela bonita fingindo que funciona. Queremos banco de dados, usuários reais, materiais dinâmicos e IA trabalhando sobre o conteúdo que vocês forem adicionando. Também deixei a implementação em etapas justamente para diminuir o risco de ele tentar criar 30 funções ao mesmo tempo e quebrar metade delas.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e2f8427b-a531-429d-94bf-7fe388d74d80).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
