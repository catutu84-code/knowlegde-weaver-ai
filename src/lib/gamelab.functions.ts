import { createHash } from "crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyzeStudyMaterial, generateGameChallenges } from "./gamelab.server";

const modePhases: Record<string, string[]> = {
  conteudo: ["Compreender", "Relacionar", "Aplicar"],
  investigador: ["Observar", "Encontrar pistas", "Relacionar", "Testar hipótese", "Concluir", "Explicar"],
  "360": ["Memória", "Compreensão", "Aplicação", "Análise", "Síntese", "Decisão"],
  batalha: ["Aquecimento", "Domínio", "Aplicação", "Desafio final"],
  agora: ["Desafio rápido"],
};

async function ownedReadyMaterial(supabase: any, userId: string, materialId: string) {
  const { data, error } = await supabase
    .from("materials")
    .select("id,title,extracted_text,subject_id,topic_id,status,updated_at")
    .eq("id", materialId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Material não encontrado ou sem acesso.");
  if (data.status !== "ready" || !data.extracted_text?.trim()) {
    throw new Error("Este material ainda não está pronto para virar jogo.");
  }
  return data;
}

export const analyzeGameMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ materialId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const material = await ownedReadyMaterial(context.supabase, context.userId, data.materialId);
    const fingerprint = createHash("sha256").update(`${material.updated_at}:${material.extracted_text}`).digest("hex");
    const { data: cached } = await context.supabase
      .from("material_insights")
      .select("*")
      .eq("material_id", data.materialId)
      .eq("user_id", context.userId)
      .eq("source_fingerprint", fingerprint)
      .maybeSingle();
    if (cached) return { material: { id: material.id, title: material.title }, insight: cached };

    const generated = await analyzeStudyMaterial(material.title, material.extracted_text.slice(0, 50000));
    const payload = {
      material_id: material.id,
      user_id: context.userId,
      themes: generated.themes,
      subtopics: generated.subtopics,
      concepts: generated.concepts,
      processes: generated.processes,
      key_points: generated.keyPoints,
      source_fingerprint: fingerprint,
    };
    const { data: saved, error } = await context.supabase
      .from("material_insights")
      .upsert(payload, { onConflict: "material_id,user_id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { material: { id: material.id, title: material.title }, insight: saved };
  });

export const startGameSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    materialId: z.string().uuid(),
    mode: z.enum(["conteudo", "investigador", "360", "batalha", "agora"]),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const material = await ownedReadyMaterial(context.supabase, context.userId, data.materialId);
    const { data: mastery } = await context.supabase
      .from("concept_mastery")
      .select("level")
      .eq("user_id", context.userId)
      .eq("material_id", material.id);
    const levels = (mastery ?? []).map((row: { level: number }) => row.level);
    const difficulty = Math.max(1, Math.min(5, levels.length ? Math.round(levels.reduce((a: number, b: number) => a + b, 0) / levels.length) : 2));
    const { data: previous } = await context.supabase
      .from("game_challenges")
      .select("prompt,game_sessions!inner(material_id)")
      .eq("user_id", context.userId)
      .eq("game_sessions.material_id", material.id)
      .limit(30);
    const generated = await generateGameChallenges({
      title: material.title,
      materialText: material.extracted_text.slice(0, 50000),
      mode: data.mode,
      phases: modePhases[data.mode] ?? modePhases.conteudo,
      difficulty,
      avoidPrompts: (previous ?? []).map((row: { prompt: string }) => row.prompt),
    });
    if (generated.challenges.length < 3) throw new Error("Não foi possível criar desafios suficientes. Tente novamente.");
    const { data: session, error: sessionError } = await context.supabase
      .from("game_sessions")
      .insert({
        user_id: context.userId,
        material_id: material.id,
        subject_id: material.subject_id,
        topic_id: material.topic_id,
        mode: data.mode,
        difficulty,
        total: generated.challenges.length,
      })
      .select("*")
      .single();
    if (sessionError) throw new Error(sessionError.message);
    const rows = generated.challenges.map((challenge, index) => ({
      session_id: session.id,
      user_id: context.userId,
      position: index,
      phase: challenge.phase,
      challenge_type: challenge.type,
      prompt: challenge.prompt,
      options: challenge.options,
      correct_answer: challenge.correctAnswer,
      explanation: challenge.explanation,
      concept: challenge.concept,
      source_ref: challenge.sourceRef,
      source_excerpt: challenge.sourceExcerpt,
      justification_required: challenge.justificationRequired,
      difficulty: Math.max(1, Math.min(5, Math.round(challenge.difficulty))),
      metadata: { simpleExplanation: challenge.simpleExplanation, example: challenge.example, analogy: challenge.analogy, steps: challenge.steps },
    }));
    const { data: challenges, error: challengeError } = await context.supabase
      .from("game_challenges")
      .insert(rows)
      .select("id,position,phase,challenge_type,prompt,options,concept,source_ref,source_excerpt,justification_required,difficulty,metadata")
      .order("position");
    if (challengeError) throw new Error(challengeError.message);
    return { session, challenges };
  });

export const submitGameAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    sessionId: z.string().uuid(),
    challengeId: z.string().uuid(),
    answer: z.string().min(1),
    justification: z.string().optional().default(""),
    responseMs: z.number().int().nonnegative(),
    hintUsed: z.boolean(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: challenge } = await context.supabase
      .from("game_challenges")
      .select("*,game_sessions!inner(*)")
      .eq("id", data.challengeId)
      .eq("session_id", data.sessionId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!challenge) throw new Error("Desafio não encontrado.");
    const session = challenge.game_sessions;
    if (session.status !== "active") throw new Error("Esta partida já foi encerrada.");
    const normalize = (value: string) => value.trim().toLocaleLowerCase("pt-BR");
    const isCorrect = normalize(data.answer) === normalize(challenge.correct_answer);
    const guessed = isCorrect && data.responseMs < 2500 && !data.justification.trim();
    const masterySignal = !isCorrect ? "review" : guessed ? "uncertain" : "mastered";
    const feedback = { explanation: challenge.explanation, correctAnswer: challenge.correct_answer, guessed };
    const { error: answerError } = await context.supabase.from("game_answers").insert({
      session_id: data.sessionId,
      challenge_id: data.challengeId,
      user_id: context.userId,
      answer: data.answer,
      justification: data.justification || null,
      is_correct: isCorrect,
      mastery_signal: masterySignal,
      response_ms: data.responseMs,
      hint_used: data.hintUsed,
      feedback,
    });
    if (answerError) throw new Error(answerError.message);

    const { data: currentMastery } = await context.supabase
      .from("concept_mastery")
      .select("*")
      .eq("user_id", context.userId)
      .eq("material_id", session.material_id)
      .eq("concept", challenge.concept)
      .maybeSingle();
    const attempts = (currentMastery?.attempts ?? 0) + 1;
    const correctCount = (currentMastery?.correct_count ?? 0) + (isCorrect ? 1 : 0);
    const averageResponse = Math.round(((currentMastery?.average_response_ms ?? 0) * (attempts - 1) + data.responseMs) / attempts);
    const rate = correctCount / attempts;
    const level = rate >= 0.85 && attempts >= 3 ? 5 : rate >= 0.7 ? 4 : rate >= 0.55 ? 3 : rate >= 0.35 ? 2 : 1;
    await context.supabase.from("concept_mastery").upsert({
      user_id: context.userId,
      material_id: session.material_id,
      concept: challenge.concept,
      level,
      attempts,
      correct_count: correctCount,
      average_response_ms: averageResponse,
      needs_review: !isCorrect || guessed,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "user_id,material_id,concept" });

    if (!isCorrect) {
      await context.supabase.from("user_errors").insert({
        user_id: context.userId,
        subject_id: session.subject_id,
        topic_id: session.topic_id,
        concept: challenge.concept,
        question: challenge.prompt,
        user_answer: data.answer,
        correct_answer: challenge.correct_answer,
        explanation: challenge.explanation,
      });
    }

    const nextCorrect = session.correct_count + (isCorrect ? 1 : 0);
    const nextWrong = session.wrong_count + (isCorrect ? 0 : 1);
    const answered = nextCorrect + nextWrong;
    const completed = answered >= session.total;
    const xpEarned = completed ? nextCorrect * 10 + 10 : 0;
    const coinsEarned = completed ? nextCorrect * 2 + (nextCorrect === session.total ? 10 : 0) : 0;
    await context.supabase.from("game_sessions").update({
      current_index: answered,
      correct_count: nextCorrect,
      wrong_count: nextWrong,
      score: Math.round((nextCorrect / session.total) * 100),
      hints_used: session.hints_used + (data.hintUsed ? 1 : 0),
      status: completed ? "completed" : "active",
      finished_at: completed ? new Date().toISOString() : null,
      xp_earned: xpEarned,
      coins_earned: coinsEarned,
      summary: completed ? { accuracy: Math.round((nextCorrect / session.total) * 100) } : {},
    }).eq("id", session.id);

    if (completed) {
      const { data: gameProfile } = await context.supabase.from("game_profiles").select("*").eq("user_id", context.userId).maybeSingle();
      await context.supabase.from("game_profiles").upsert({
        user_id: context.userId,
        coins: (gameProfile?.coins ?? 0) + coinsEarned,
        game_xp: (gameProfile?.game_xp ?? 0) + xpEarned,
      }, { onConflict: "user_id" });
      const { data: profile } = await context.supabase.from("profiles").select("id,xp").eq("user_id", context.userId).maybeSingle();
      if (profile) await context.supabase.from("profiles").update({ xp: (profile.xp ?? 0) + xpEarned }).eq("id", profile.id);
      await context.supabase.from("study_sessions").insert({
        user_id: context.userId,
        subject_id: session.subject_id,
        kind: "game_lab",
        minutes: Math.max(3, Math.round((Date.now() - new Date(session.started_at).getTime()) / 60000)),
        detail: `${session.mode} · ${session.material_id}`,
      });
    }
    return { isCorrect, feedback, masterySignal, completed, xpEarned, coinsEarned, score: Math.round((nextCorrect / session.total) * 100) };
  });

export const getGameDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile }, { data: sessions }, { data: review }] = await Promise.all([
      context.supabase.from("game_profiles").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("game_sessions").select("id,mode,score,status,started_at,material_id,materials(title)").eq("user_id", context.userId).order("started_at", { ascending: false }).limit(8),
      context.supabase.from("concept_mastery").select("concept,level,material_id").eq("user_id", context.userId).eq("needs_review", true).limit(6),
    ]);
    return { profile, sessions: sessions ?? [], review: review ?? [] };
  });