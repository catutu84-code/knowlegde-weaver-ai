import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** A IA escolhe UMA atividade concreta com base no progresso real do estudante. */
export const suggestActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { minutes?: number }) => input)
  .handler(async ({ data, context }) => {
    const { callAI, parseJson } = await import("./ai.server");
    const { TEACHER_SYSTEM } = await import("./teach-modes");
    const { supabase, userId } = context;
    const minutes = data.minutes ?? 20;

    const [subjects, errors, books, materials, sessions, exams, rhythm] = await Promise.all([
      supabase.from("subjects").select("id,name").eq("user_id", userId).limit(20),
      supabase
        .from("user_errors")
        .select("concept,times_wrong")
        .eq("user_id", userId)
        .eq("resolved", false)
        .order("times_wrong", { ascending: false })
        .limit(10),
      supabase
        .from("books")
        .select("id,title,reading_progress,generation_status")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("materials")
        .select("title,created_at")
        .eq("user_id", userId)
        .eq("status", "ready")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("study_sessions")
        .select("kind,minutes,detail,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(15),
      supabase
        .from("exams")
        .select("title,exam_date")
        .eq("user_id", userId)
        .gte("exam_date", new Date().toISOString().slice(0, 10))
        .order("exam_date", { ascending: true })
        .limit(3),
      supabase.from("study_rhythm").select("goal,minutes_per_day").eq("user_id", userId).maybeSingle(),
    ]);

    const raw = await callAI(
      [
        { role: "system", content: TEACHER_SYSTEM },
        {
          role: "user",
          content: `Escolha UMA atividade de estudo para agora, com duração de aproximadamente ${minutes} minutos, com base nos dados reais abaixo.
Responda SOMENTE com JSON: {"titulo":"o que fazer agora","motivo":"por que isso agora, em 1 frase","acao":"quiz|flashcards|revisao|livro|resumo|mapa|tutor","minutos":${minutes},"mensagem":"frase curta de incentivo, calorosa e específica, sem exagero"}

OBJETIVO: ${JSON.stringify(rhythm.data ?? {})}
MATÉRIAS: ${JSON.stringify(subjects.data ?? [])}
ERROS NÃO RESOLVIDOS: ${JSON.stringify(errors.data ?? [])}
LIVROS: ${JSON.stringify(books.data ?? [])}
MATERIAIS PRONTOS: ${JSON.stringify(materials.data ?? [])}
SESSÕES RECENTES: ${JSON.stringify(sessions.data ?? [])}
PROVAS PRÓXIMAS: ${JSON.stringify(exams.data ?? [])}`,
        },
      ],
      { temperature: 0.6 },
    );

    return parseJson<{
      titulo: string;
      motivo: string;
      acao: string;
      minutos: number;
      mensagem: string;
    }>(raw);
  });
