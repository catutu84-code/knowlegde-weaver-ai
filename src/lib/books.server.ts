import type { SupabaseClient } from "@supabase/supabase-js";

import type { BookScope } from "./book-styles";

const STYLE_PROMPT: Record<string, string> = {
  simples: "Explique de forma simples, com frases curtas e palavras fáceis.",
  academica: "Escreva com linguagem acadêmica, definições formais e termos técnicos explicados.",
  tecnica: "Escreva com precisão técnica, detalhando processos, critérios e terminologia correta.",
  iniciante: "Escreva para quem nunca viu o assunto: comece do zero e vá passo a passo.",
  detalhada: "Explique de forma bem detalhada, destrinchando cada conceito e suas partes.",
  pratica: "Priorize aplicação prática: situações reais, casos e como usar no dia a dia profissional.",
  aula: "Escreva como um professor dando aula, guiando o aluno e retomando pontos importantes.",
  conversa: "Escreva como uma conversa próxima com o aluno, em tom de professora particular.",
  historia: "Explique como uma história/narrativa, mantendo todos os conceitos corretos.",
  fofoca: "Explique em tom de fofoca, descontraído e divertido, sem perder nenhum conceito.",
  cotidiano: "Explique usando muitos exemplos do cotidiano e analogias simples.",
  resumo: "Escreva de forma curta, objetiva e direta ao ponto, priorizando tópicos e o essencial.",
};


export function styleInstruction(style: string, custom?: string | null) {
  const base = STYLE_PROMPT[style] ?? STYLE_PROMPT["simples"]!;
  return custom?.trim()
    ? `${base}\nInstrução personalizada do aluno (prioridade máxima): ${custom.trim()}`
    : base;
}

export const BOOK_RULES = `Regras do Modo Livro:
- Baseie-se nos materiais do aluno; não invente fatos e não apresente informação externa como se estivesse no material.
- Se usar um exemplo próprio para facilitar, marque como "(exemplo explicativo)".
- Reescreva e ensine o conteúdo integralmente no estilo escolhido; não apenas renomeie o estilo.
- Ao final, inclua "## Fontes deste capítulo" com os títulos exatos dos materiais realmente usados.
- Escreva em português do Brasil, em markdown limpo (##, listas, **negrito**).`;

export type GeneratedBookPlan = {
  title?: string;
  subtitle?: string;
  introduction?: string;
  chapters?: Array<{ title: string; summary?: string; sourceTitles?: string[] }>;
};

export type GeneratedChapter = {
  title: string;
  summary: string | null;
  content: string;
  sourceTitles: string[];
};

export async function generateCompleteBook(input: {
  contextText: string;
  sourceTitles: string[];
  requestedTitle?: string;
  style: string;
  customInstruction?: string | null;
}) {
  const { callAI, parseJson, BASE_SYSTEM } = await import("./ai.server");
  const sourceList = input.sourceTitles.map((title) => `- ${title}`).join("\n");
  const rawPlan = await callAI(
    [
      { role: "system", content: `${BASE_SYSTEM}\n${BOOK_RULES}` },
      {
        role: "user",
        content: `Transforme os materiais em um LIVRO DIDÁTICO DIGITAL completo.
Primeiro planeje a obra. Responda SOMENTE com JSON válido:
{"title":"...","subtitle":"...","introduction":"apresentação do livro em 2 a 4 parágrafos","chapters":[{"title":"...","summary":"...","sourceTitles":["título exato"]}]}

Regras:
- Use de 3 a 12 capítulos em sequência lógica, cobrindo todo o conteúdo disponível sem repetição artificial.
- A introdução deve apresentar o propósito e o percurso de aprendizagem.
- O primeiro capítulo deve introduzir os fundamentos; o último deve consolidar e revisar o conteúdo.
- sourceTitles só pode conter títulos da lista de fontes.
- ${input.requestedTitle?.trim() ? `Use este título: ${input.requestedTitle.trim()}` : "Crie um título fiel aos materiais."}
- Estilo obrigatório: ${styleInstruction(input.style, input.customInstruction)}

FONTES DISPONÍVEIS:
${sourceList}

MATERIAIS:
${input.contextText}`,
      },
    ],
    { temperature: 0.35 },
  );
  const plan = parseJson<GeneratedBookPlan>(rawPlan);
  const outline = (plan.chapters ?? []).filter((chapter) => chapter?.title).slice(0, 12);
  if (outline.length < 3) throw new Error("A IA não conseguiu estruturar um livro completo com estes materiais.");

  const outlineText = outline.map((chapter, index) => `${index + 1}. ${chapter.title} — ${chapter.summary ?? ""}`).join("\n");
  const chapters: GeneratedChapter[] = [];
  for (let index = 0; index < outline.length; index += 1) {
    const chapter = outline[index];
    if (!chapter) continue;
    const content = await callAI(
      [
        { role: "system", content: `${BASE_SYSTEM}\n${BOOK_RULES}` },
        {
          role: "user",
          content: `Escreva o capítulo ${index + 1} de ${outline.length} do livro "${plan.title ?? input.requestedTitle ?? "Livro de estudos"}".

CAPÍTULO: ${chapter.title}
OBJETIVO: ${chapter.summary ?? "Explicar integralmente este bloco do material."}
ESTILO DE ESCRITA: ${styleInstruction(input.style, input.customInstruction)}

SUMÁRIO COMPLETO:
${outlineText}

Requisitos do capítulo:
- Conteúdo substancial, didático e fiel, com explicações, exemplos identificados, pontos importantes e resumo.
- Não mencione fatos que não estejam nos materiais.
- Termine com a seção "## Fontes deste capítulo" e liste somente títulos exatos das fontes usadas.
- Não escreva outros capítulos.

MATERIAIS DO ALUNO:
${input.contextText}`,
        },
      ],
      { temperature: 0.45 },
    );
    if (content.trim().length < 500) throw new Error(`O capítulo ${index + 1} não foi gerado por completo.`);
    const matchedSources = input.sourceTitles.filter((title) => content.toLocaleLowerCase().includes(title.toLocaleLowerCase()));
    const sourceTitles = matchedSources.length > 0 ? matchedSources : (chapter.sourceTitles ?? []).filter((title) => input.sourceTitles.includes(title));
    chapters.push({
      title: chapter.title,
      summary: chapter.summary?.trim() || null,
      content,
      sourceTitles: sourceTitles.length > 0 ? sourceTitles : input.sourceTitles,
    });
  }

  return {
    title: input.requestedTitle?.trim() || plan.title?.trim() || "Meu livro de estudos",
    subtitle: plan.subtitle?.trim() || null,
    introduction: plan.introduction?.trim() || "Este livro organiza e explica os materiais selecionados em uma sequência didática.",
    chapters,
  };
}

export type BookRow = {
  id: string;
  title: string;
  style: string;
  custom_instruction: string | null;
  scope: BookScope;
  course_id: string | null;
  subject_id: string | null;
  topic_id: string | null;
  material_ids: string[];
  outline: Array<{ title: string; summary?: string }>;
  total_chapters: number;
  subtitle: string | null;
  introduction: string | null;
  generation_status: string;
  current_version: number;
};

export async function loadBook(supabase: SupabaseClient, bookId: string): Promise<BookRow> {
  const { data, error } = await supabase.from("books").select("*").eq("id", bookId).maybeSingle();
  if (error || !data) throw new Error("Livro não encontrado.");
  return data as BookRow;
}
