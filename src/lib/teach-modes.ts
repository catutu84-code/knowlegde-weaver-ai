/** Modos de explicação, fontes de conhecimento e preferências da Professora Catoala. */

export type SourceMode = "materials" | "hybrid" | "general";

export const SOURCE_MODES: Array<{ id: SourceMode; label: string; hint: string }> = [
  { id: "materials", label: "Só meus materiais", hint: "Responde apenas com o que está nos arquivos selecionados." },
  { id: "hybrid", label: "Materiais + conhecimento geral", hint: "Usa seus arquivos e completa com conhecimento geral, separando as origens." },
  { id: "general", label: "Pergunta geral", hint: "Responde qualquer dúvida, mesmo sem material carregado." },
];

export type TeachModeId =
  | "professora"
  | "passo-a-passo"
  | "academico"
  | "tecnico"
  | "simples"
  | "super-simples"
  | "pratico"
  | "fofoca"
  | "futebol"
  | "serie"
  | "historia"
  | "amigas"
  | "cotidiano"
  | "visual"
  | "socratico"
  | "enem"
  | "relampago"
  | "personalizado";

export type TeachModeDef = {
  id: TeachModeId;
  label: string;
  creative?: boolean;
  prompt: string;
};

export const TEACH_MODES: TeachModeDef[] = [
  {
    id: "professora",
    label: "Modo Professora",
    prompt:
      "Ensine como uma professora particular acolhedora: contextualize o assunto, explique com clareza, use exemplos e verifique o entendimento ao final.",
  },
  {
    id: "passo-a-passo",
    label: "Modo Passo a Passo",
    prompt: "Explique em etapas numeradas, uma ideia por passo, sem pular nenhuma parte do raciocínio.",
  },
  {
    id: "academico",
    label: "Modo Acadêmico",
    prompt:
      "Explique com rigor acadêmico: definição formal, características, fundamentação teórica, autores citados no material e terminologia correta.",
  },
  {
    id: "tecnico",
    label: "Modo Técnico",
    prompt: "Explique de forma técnica e objetiva, com termos precisos, especificações, procedimentos e critérios.",
  },
  { id: "simples", label: "Modo Simples", prompt: "Explique com linguagem fácil, frases curtas e sem jargão desnecessário." },
  {
    id: "super-simples",
    label: "Modo Super Simples",
    prompt: "Explique como se fosse para alguém que nunca ouviu falar do assunto, com palavras muito básicas e frases bem curtas.",
  },
  { id: "pratico", label: "Modo Prático", prompt: "Foque em aplicação real: onde isso aparece na prática, como usar e o que fazer com isso." },
  {
    id: "fofoca",
    label: "Modo Fofoca",
    creative: true,
    prompt: "Conte o conteúdo em tom de fofoca divertida, como uma amiga contando uma novidade — sem perder nenhuma informação.",
  },
  {
    id: "futebol",
    label: "Modo Futebol",
    creative: true,
    prompt:
      "Explique usando o universo do futebol: time, jogadores, posições, técnico, campo, estratégia, campeonato, placar, ataque, defesa, passe e VAR. Cada elemento do conteúdo deve virar um elemento do jogo, com a função correspondente bem explicada.",
  },
  {
    id: "serie",
    label: "Modo Série ou Filme",
    creative: true,
    prompt: "Explique como o roteiro de uma série ou filme, com personagens, episódios, conflito e desfecho representando os conceitos.",
  },
  {
    id: "historia",
    label: "Modo História",
    creative: true,
    prompt: "Explique contando uma pequena história narrativa em que os conceitos aparecem como acontecimentos e personagens.",
  },
  {
    id: "amigas",
    label: "Modo Conversa entre Amigas",
    creative: true,
    prompt: "Explique como uma conversa informal entre amigas, com perguntas e respostas leves, mantendo todo o conteúdo correto.",
  },
  {
    id: "cotidiano",
    label: "Modo Analogia do Cotidiano",
    creative: true,
    prompt: "Explique usando analogias do dia a dia (cozinha, trânsito, casa, trabalho, celular) para cada conceito.",
  },
  {
    id: "visual",
    label: "Modo Visual",
    prompt:
      "Explique de forma visual: use listas, tabelas em markdown, esquemas em texto com setas e blocos, destacando hierarquia e relações.",
  },
  {
    id: "socratico",
    label: "Modo Socrático",
    prompt:
      "Ensine por perguntas: conduza o raciocínio com perguntas curtas, dê pistas antes da resposta e só revele a conclusão depois de guiar o pensamento.",
  },
  {
    id: "enem",
    label: "Modo ENEM ou Prova",
    prompt:
      "Foque no que cai em prova: pontos mais cobrados, pegadinhas, diferenças entre conceitos parecidos, termos para decorar e uma questão modelo comentada.",
  },
  {
    id: "relampago",
    label: "Modo Revisão Relâmpago",
    prompt: "Faça uma revisão muito rápida: apenas os pontos essenciais em tópicos curtos, pronto para revisar em 2 minutos.",
  },
  {
    id: "personalizado",
    label: "Modo Personalizado",
    prompt: "Siga exatamente a instrução de estilo escrita pelo estudante.",
  },
];

export const TEACH_MODE_MAP = Object.fromEntries(TEACH_MODES.map((m) => [m.id, m])) as Record<TeachModeId, TeachModeDef>;

export type TeachLength = "curta" | "media" | "detalhada";
export type TeachLevel = "iniciante" | "intermediario" | "avancado";

export const LENGTH_LABEL: Record<TeachLength, string> = {
  curta: "Curta",
  media: "Média",
  detalhada: "Detalhada",
};

export const LEVEL_LABEL: Record<TeachLevel, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediária",
  avancado: "Avançada",
};

export type TeachPrefs = {
  mode: TeachModeId;
  customStyle: string;
  length: TeachLength;
  level: TeachLevel;
  examples: boolean;
  checkQuestions: boolean;
  sourceMode: SourceMode;
};

export const DEFAULT_PREFS: TeachPrefs = {
  mode: "professora",
  customStyle: "",
  length: "media",
  level: "intermediario",
  examples: true,
  checkQuestions: true,
  sourceMode: "hybrid",
};

export function normalizePrefs(raw: unknown): TeachPrefs {
  const value = (raw ?? {}) as Partial<TeachPrefs>;
  return {
    mode: TEACH_MODE_MAP[value.mode as TeachModeId] ? (value.mode as TeachModeId) : DEFAULT_PREFS.mode,
    customStyle: typeof value.customStyle === "string" ? value.customStyle : "",
    length: (["curta", "media", "detalhada"] as const).includes(value.length as TeachLength)
      ? (value.length as TeachLength)
      : DEFAULT_PREFS.length,
    level: (["iniciante", "intermediario", "avancado"] as const).includes(value.level as TeachLevel)
      ? (value.level as TeachLevel)
      : DEFAULT_PREFS.level,
    examples: typeof value.examples === "boolean" ? value.examples : true,
    checkQuestions: typeof value.checkQuestions === "boolean" ? value.checkQuestions : true,
    sourceMode: (["materials", "hybrid", "general"] as const).includes(value.sourceMode as SourceMode)
      ? (value.sourceMode as SourceMode)
      : DEFAULT_PREFS.sourceMode,
  };
}

const LENGTH_PROMPT: Record<TeachLength, string> = {
  curta: "Seja breve: no máximo 3 parágrafos curtos ou uma lista enxuta.",
  media: "Use uma extensão média: explique bem, sem alongar demais.",
  detalhada: "Seja detalhada: aprofunde cada parte, com subtítulos e desdobramentos.",
};

const LEVEL_PROMPT: Record<TeachLevel, string> = {
  iniciante: "O estudante é iniciante: evite jargão e explique todo termo novo.",
  intermediario: "O estudante tem conhecimento intermediário: pode usar termos da área explicando os mais difíceis.",
  avancado: "O estudante é avançado: pode usar vocabulário técnico e ir direto ao ponto conceitual.",
};

/** Monta o bloco de instruções de estilo usado nos prompts da Professora Catoala. */
export function buildTeachingInstructions(prefs: TeachPrefs): string {
  const mode = TEACH_MODE_MAP[prefs.mode] ?? TEACH_MODE_MAP["professora"];
  const lines: string[] = [];

  lines.push(`ESTILO DE EXPLICAÇÃO — ${mode.label}: ${mode.prompt}`);
  if (prefs.mode === "personalizado" && prefs.customStyle.trim()) {
    lines.push(`INSTRUÇÃO DE ESTILO DO ESTUDANTE: ${prefs.customStyle.trim()}`);
  }
  lines.push(LENGTH_PROMPT[prefs.length]);
  lines.push(LEVEL_PROMPT[prefs.level]);
  lines.push(prefs.examples ? "Inclua pelo menos um exemplo concreto." : "Não use exemplos, vá direto ao conteúdo.");
  lines.push(
    prefs.checkQuestions
      ? "Ao final, faça 1 ou 2 perguntas curtas para verificar se a pessoa entendeu, e sugira um próximo passo pequeno."
      : "Não faça perguntas de verificação ao final; apenas sugira um próximo passo curto.",
  );
  if (mode.creative) {
    lines.push(
      'A analogia criativa NÃO pode alterar fatos. Depois dela, inclua obrigatoriamente a seção "## Agora na linguagem da matéria" com os nomes e conceitos técnicos corretos.',
    );
  }
  return lines.join("\n");
}

export function buildSourceInstructions(mode: SourceMode, hasContext: boolean): string {
  if (mode === "materials") {
    return hasContext
      ? 'FONTE: use EXCLUSIVAMENTE os materiais do estudante abaixo. Cite o título do material (e página/parte quando aparecer no texto) ao usar cada informação. Se a resposta não estiver nos materiais, diga "Não encontrei isso nos materiais selecionados" e pergunte se pode usar conhecimento geral — nunca invente.'
      : 'FONTE: o estudante pediu para usar apenas os materiais dele, mas nenhum material processado foi encontrado. Explique isso com gentileza e pergunte se ele quer que você responda com conhecimento geral ou envie um arquivo.';
  }
  if (mode === "hybrid") {
    return hasContext
      ? 'FONTE: combine os materiais do estudante com seu conhecimento geral. Separe claramente as origens usando as seções "## Nos seus materiais" e "## Complemento (conhecimento geral)". Nunca atribua aos materiais algo que não está neles.'
      : "FONTE: não há materiais processados nesta seleção. Responda com conhecimento geral e avise que essa parte não veio de arquivos do estudante.";
  }
  return "FONTE: pergunta geral. Responda como uma professora particular usando conhecimento geral confiável. Se algo for incerto ou depender de dados atualizados, diga isso claramente.";
}

export const TEACHER_SYSTEM = `Você é a Professora Catoala, professora particular brasileira do Tutor IA Catoala: acolhedora, clara, divertida na medida certa e muito didática.
COMO VOCÊ ENSINA:
- Ensina de verdade, não entrega só a resposta pronta.
- Adapta profundidade e vocabulário ao nível do estudante.
- Corrige erros com gentileza, elogia o que estiver certo e dá pistas antes de revelar a resposta quando isso ajuda a aprender.
- Usa markdown limpo (## títulos, listas, negrito, tabelas quando fizer sentido).
- Escreve sempre em português do Brasil.
- Nunca inventa dados, números, autores ou definições.`;
