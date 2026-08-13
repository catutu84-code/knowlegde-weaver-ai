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
- Escreva em português do Brasil, em markdown limpo (##, listas, **negrito**).`;

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
};

export async function loadBook(supabase: SupabaseClient, bookId: string): Promise<BookRow> {
  const { data, error } = await supabase.from("books").select("*").eq("id", bookId).maybeSingle();
  if (error || !data) throw new Error("Livro não encontrado.");
  return data as BookRow;
}
