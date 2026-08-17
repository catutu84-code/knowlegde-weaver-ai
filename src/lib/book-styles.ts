export type BookScope = "material" | "selected" | "topic" | "subject" | "course";

export type BookStyle =
  | "simples"
  | "academica"
  | "tecnica"
  | "iniciante"
  | "detalhada"
  | "pratica"
  | "aula"
  | "conversa"
  | "historia"
  | "fofoca"
  | "cotidiano"
  | "resumo";

export const BOOK_STYLES: Array<{ value: BookStyle; label: string; hint: string }> = [
  { value: "simples", label: "Simplificado", hint: "Linguagem fácil e direta" },
  { value: "academica", label: "Acadêmico", hint: "Rigor e termos formais" },
  { value: "tecnica", label: "Técnica", hint: "Foco em precisão técnica" },
  { value: "iniciante", label: "Para iniciante", hint: "Do zero, passo a passo" },
  { value: "detalhada", label: "Detalhada", hint: "Explica cada ponto a fundo" },
  { value: "pratica", label: "Prático", hint: "Aplicação e casos reais" },
  { value: "aula", label: "Professor particular", hint: "Explicação didática e guiada" },
  { value: "conversa", label: "Como uma conversa", hint: "Bate-papo com o aluno" },
  { value: "historia", label: "Como uma história", hint: "Narrativa envolvente" },
  { value: "fofoca", label: "Fofoca", hint: "Descontraído e fácil de memorizar" },
  { value: "cotidiano", label: "Exemplos do cotidiano", hint: "Analogias do dia a dia" },
  { value: "resumo", label: "Resumo", hint: "Curto, objetivo e direto ao ponto" },
];


export const PASSAGE_ACTIONS = [
  { key: "explicar", label: "✨ Explique melhor", prompt: "Explique melhor este trecho." },
  { key: "exemplo", label: "💡 Dê um exemplo", prompt: "Dê um exemplo claro sobre este trecho." },
  { key: "simplificar", label: "🧠 Simplifique", prompt: "Simplifique este trecho ao máximo." },
  { key: "aprofundar", label: "🔎 Aprofunde", prompt: "Aprofunde este trecho com mais detalhes." },
  { key: "resumir", label: "📝 Resuma", prompt: "Resuma este trecho em poucas linhas." },
  { key: "outra", label: "🔄 Explique de outra forma", prompt: "Explique este trecho de outra forma, com outra abordagem." },
  { key: "pergunta", label: "❓ Faça uma pergunta", prompt: "Faça uma pergunta desafiadora sobre este trecho e depois mostre a resposta comentada." },
] as const;
