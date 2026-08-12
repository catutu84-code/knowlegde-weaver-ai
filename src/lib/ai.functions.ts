import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

export type TeachMode =
  | "resumo"
  | "simples"
  | "academico"
  | "pratica"
  | "fofoca"
  | "faculdade"
  | "vida-real"
  | "memorizacao"
  | "prova"
  | "revisao";

export const generateExplanation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      mode: TeachMode;
      scope: "material" | "selected" | "topic" | "subject";
      materialIds?: string[];
      subjectId?: string | null;
      topicId?: string | null;
      title: string;
      save?: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { buildContext, callAI, BASE_SYSTEM } = await import("./ai.server");
    const ctx = await buildContext(context.supabase, data);
    if (!ctx.text) {
      throw new Error("Nenhum material processado foi encontrado para essa seleção.");
    }

    const instructions: Record<string, string> = {
      resumo:
        "Crie um RESUMO completo e organizado, com títulos, tópicos e destaques dos conceitos essenciais. Finalize com 5 pontos-chave para memorizar.",
      simples:
        "Explique de FORMA SIMPLES, com linguagem fácil, frases curtas e exemplos do dia a dia.",
      academico:
        "Explique de FORMA ACADÊMICA: conceito, definição formal, características, teoria, autores citados no material, aplicação e termos técnicos importantes.",
      pratica:
        "Explique NA PRÁTICA: transforme a teoria em situações reais de empresas, trabalho e cotidiano, com casos concretos.",
      fofoca:
        "Explique COMO UMA FOFOCA: tom descontraído, divertido, como uma amiga contando uma novidade — sem perder nenhuma informação importante.",
      faculdade:
        "Explique em MODO FACULDADE: conceito, definição, características, teoria, aplicação e termos importantes, com rigor acadêmico.",
      "vida-real":
        "Explique NA VIDA REAL: priorize exemplos empresariais, profissionais e situações do cotidiano.",
      memorizacao:
        "Explique em MODO MEMORIZAÇÃO: use analogias, palavras-chave, associações, mnemônicos e técnicas de memorização.",
      prova:
        "Explique em MODO PROVA: o que precisa saber, conceitos que mais caem, pegadinhas, diferenças entre conceitos parecidos, termos para decorar e possíveis perguntas.",
      revisao:
        "Crie uma REVISÃO objetiva com os pontos mais importantes, checklist de conceitos e perguntas rápidas de autoavaliação.",
    };

    const content = await callAI([
      { role: "system", content: BASE_SYSTEM },
      {
        role: "user",
        content: `${instructions[data.mode] ?? instructions["resumo"]}

Use markdown limpo (títulos com ##, listas, negrito). No final, adicione uma seção "Fontes utilizadas" listando os materiais usados.

MATERIAIS DISPONÍVEIS:
${ctx.text}`,
      },
    ]);

    if (data.save !== false) {
      await context.supabase.from("ai_outputs").insert({
        user_id: context.userId,
        subject_id: data.subjectId ?? null,
        topic_id: data.topicId ?? null,
        kind: data.mode === "resumo" ? "resumo" : "explicacao",
        mode: data.mode,
        title: data.title,
        content,
        sources: ctx.sources,
      });
      await context.supabase.from("study_sessions").insert({
        user_id: context.userId,
        subject_id: data.subjectId ?? null,
        kind: data.mode === "resumo" ? "resumo" : "explicacao",
        minutes: 5,
        detail: data.title,
      });
    }

    return { content, sources: ctx.sources };
  });

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      scope: "material" | "selected" | "topic" | "subject";
      materialIds?: string[];
      subjectId?: string | null;
      topicId?: string | null;
      title: string;
      count: number;
      difficulty: "facil" | "medio" | "dificil" | "faculdade";
      questionType: "multiple_choice" | "true_false" | "open" | "interpretation" | "mixed";
      isExam?: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { buildContext, callAI, parseJson, BASE_SYSTEM } = await import("./ai.server");
    const ctx = await buildContext(context.supabase, data);
    if (!ctx.text) throw new Error("Nenhum material processado foi encontrado para essa seleção.");

    const raw = await callAI(
      [
        { role: "system", content: BASE_SYSTEM },
        {
          role: "user",
          content: `Crie ${data.count} questões de nível "${data.difficulty}" do tipo "${data.questionType}" baseadas EXCLUSIVAMENTE nos materiais abaixo.

Responda SOMENTE com JSON válido no formato:
{"questions":[{"type":"multiple_choice|true_false|open","prompt":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct_answer":"texto exato da alternativa correta, ou Verdadeiro/Falso, ou resposta esperada","explanation":"por que essa é a resposta","concept":"conceito avaliado","source_ref":"título do material de origem"}]}

Regras: para true_false use options ["Verdadeiro","Falso"]; para open use options [].

MATERIAIS:
${ctx.text}`,
        },
      ],
      { temperature: 0.7 },
    );

    const parsed = parseJson<{
      questions: Array<{
        type?: string;
        prompt: string;
        options?: string[];
        correct_answer: string;
        explanation?: string;
        concept?: string;
        source_ref?: string;
      }>;
    }>(raw);

    const questions = (parsed.questions ?? []).slice(0, data.count);
    if (questions.length === 0) throw new Error("A IA não conseguiu gerar questões desse conteúdo.");

    const { data: quiz, error } = await context.supabase
      .from("quizzes")
      .insert({
        user_id: context.userId,
        subject_id: data.subjectId ?? null,
        topic_id: data.topicId ?? null,
        title: data.title,
        difficulty: data.difficulty,
        question_type: data.questionType,
        is_exam: data.isExam ?? false,
        source_material_ids: ctx.sources.map((s) => s.id),
      })
      .select("id")
      .single();
    if (error || !quiz) throw new Error("Não foi possível salvar o quiz.");

    const rows = questions.map((q, index) => ({
      quiz_id: quiz.id,
      user_id: context.userId,
      position: index,
      type: q.type === "true_false" || q.type === "open" ? q.type : "multiple_choice",
      prompt: q.prompt,
      options: q.options ?? [],
      correct_answer: String(q.correct_answer ?? ""),
      explanation: q.explanation ?? null,
      concept: q.concept ?? null,
      source_ref: q.source_ref ?? null,
    }));
    const insert = await context.supabase.from("quiz_questions").insert(rows);
    if (insert.error) throw new Error("Não foi possível salvar as questões.");

    return { quizId: quiz.id as string, total: rows.length };
  });

export const generateReviewQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { count: number }) => input)
  .handler(async ({ data, context }) => {
    const { callAI, parseJson, BASE_SYSTEM } = await import("./ai.server");
    const { data: errors } = await context.supabase
      .from("user_errors")
      .select("concept,question,correct_answer,explanation,subject_id,times_wrong")
      .eq("user_id", context.userId)
      .eq("resolved", false)
      .order("times_wrong", { ascending: false })
      .limit(20);

    if (!errors || errors.length === 0) throw new Error("Você ainda não tem erros registrados para revisar.");

    const raw = await callAI(
      [
        { role: "system", content: BASE_SYSTEM },
        {
          role: "user",
          content: `O aluno errou as questões abaixo. Crie ${data.count} questões NOVAS e DIFERENTES que testem os mesmos conhecimentos (não repita o enunciado original).

Responda SOMENTE com JSON: {"questions":[{"type":"multiple_choice","prompt":"...","options":["..."],"correct_answer":"...","explanation":"...","concept":"..."}]}

ERROS DO ALUNO:
${JSON.stringify(errors)}`,
        },
      ],
      { temperature: 0.8 },
    );

    const parsed = parseJson<{ questions: Array<Record<string, unknown>> }>(raw);
    const questions = (parsed.questions ?? []).slice(0, data.count);
    if (questions.length === 0) throw new Error("Não foi possível gerar a revisão agora.");

    const { data: quiz, error } = await context.supabase
      .from("quizzes")
      .insert({
        user_id: context.userId,
        subject_id: errors[0]?.subject_id ?? null,
        title: "Revisão dos meus erros",
        difficulty: "medio",
        question_type: "mixed",
      })
      .select("id")
      .single();
    if (error || !quiz) throw new Error("Não foi possível salvar a revisão.");

    await context.supabase.from("quiz_questions").insert(
      questions.map((q, index) => ({
        quiz_id: quiz.id,
        user_id: context.userId,
        position: index,
        type: (q["type"] as string) === "true_false" ? "true_false" : "multiple_choice",
        prompt: String(q["prompt"] ?? ""),
        options: (q["options"] as string[]) ?? [],
        correct_answer: String(q["correct_answer"] ?? ""),
        explanation: (q["explanation"] as string) ?? null,
        concept: (q["concept"] as string) ?? null,
        source_ref: "Revisão inteligente",
      })),
    );

    return { quizId: quiz.id as string, total: questions.length };
  });

export const gradeOpenAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { question: string; expected: string; answer: string }) => input,
  )
  .handler(async ({ data, context }) => {
    const { callAI, parseJson, BASE_SYSTEM } = await import("./ai.server");
    void context;
    const raw = await callAI(
      [
        { role: "system", content: BASE_SYSTEM },
        {
          role: "user",
          content: `Avalie a resposta discursiva do aluno considerando compreensão, clareza, conceitos utilizados, aplicação e organização.

Responda SOMENTE com JSON: {"score":0-10,"is_correct":true|false,"acertos":"o que o aluno acertou","melhorar":"o que poderia melhorar","resposta_modelo":"resposta completa sugerida"}

PERGUNTA: ${data.question}
RESPOSTA ESPERADA (referência): ${data.expected}
RESPOSTA DO ALUNO: ${data.answer}`,
        },
      ],
      { temperature: 0.3 },
    );

    return parseJson<{
      score: number;
      is_correct: boolean;
      acertos: string;
      melhorar: string;
      resposta_modelo: string;
    }>(raw);
  });

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      question: string;
      scope: "material" | "selected" | "topic" | "subject";
      materialIds?: string[];
      subjectId?: string | null;
      topicId?: string | null;
      history: Array<{ role: "user" | "assistant"; content: string }>;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { buildContext, callAI, BASE_SYSTEM } = await import("./ai.server");
    const ctx = await buildContext(context.supabase, data);

    const messages: Array<{ role: string; content: unknown }> = [
      {
        role: "system",
        content: `${BASE_SYSTEM}

Você é o Tutor IA. Responda de forma conversacional, clara e curta quando possível.
CONTEÚDO DOS MATERIAIS DO ALUNO:
${ctx.text || "(nenhum material processado disponível para esta seleção)"}`,
      },
      ...data.history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.question },
    ];

    const content = await callAI(messages, { temperature: 0.7 });
    return { content, sources: ctx.sources };
  });

export const generateFlashcards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      scope: "material" | "selected" | "topic" | "subject";
      materialIds?: string[];
      subjectId?: string | null;
      topicId?: string | null;
      count: number;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { buildContext, callAI, parseJson, BASE_SYSTEM } = await import("./ai.server");
    const ctx = await buildContext(context.supabase, data);
    if (!ctx.text) throw new Error("Nenhum material processado foi encontrado para essa seleção.");

    const raw = await callAI(
      [
        { role: "system", content: BASE_SYSTEM },
        {
          role: "user",
          content: `Crie ${data.count} flashcards de estudo baseados nos materiais abaixo.
Responda SOMENTE com JSON: {"cards":[{"front":"pergunta ou conceito","back":"resposta ou explicação","source_ref":"material de origem"}]}

MATERIAIS:
${ctx.text}`,
        },
      ],
      { temperature: 0.6 },
    );

    const parsed = parseJson<{ cards: Array<{ front: string; back: string; source_ref?: string }> }>(raw);
    const cards = (parsed.cards ?? []).slice(0, data.count);
    if (cards.length === 0) throw new Error("Não foi possível criar flashcards desse conteúdo.");

    const { error } = await context.supabase.from("flashcards").insert(
      cards.map((c) => ({
        user_id: context.userId,
        subject_id: data.subjectId ?? null,
        topic_id: data.topicId ?? null,
        material_id: data.materialIds?.[0] ?? null,
        front: c.front,
        back: c.back,
        source_ref: c.source_ref ?? null,
      })),
    );
    if (error) throw new Error("Não foi possível salvar os flashcards.");

    return { created: cards.length };
  });

export const generateMindMap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      scope: "material" | "selected" | "topic" | "subject";
      materialIds?: string[];
      subjectId?: string | null;
      topicId?: string | null;
      title: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { buildContext, callAI, parseJson, BASE_SYSTEM } = await import("./ai.server");
    const ctx = await buildContext(context.supabase, data);
    if (!ctx.text) throw new Error("Nenhum material processado foi encontrado para essa seleção.");

    const raw = await callAI(
      [
        { role: "system", content: BASE_SYSTEM },
        {
          role: "user",
          content: `Crie um mapa mental hierárquico do conteúdo abaixo.
Responda SOMENTE com JSON: {"root":{"label":"assunto principal","children":[{"label":"conceito","children":[{"label":"detalhe","children":[]}]}]}}
Use no máximo 3 níveis e no máximo 7 filhos por nó.

MATERIAIS:
${ctx.text}`,
        },
      ],
      { temperature: 0.5 },
    );

    const parsed = parseJson<{ root: unknown }>(raw);
    const { data: saved, error } = await context.supabase
      .from("mind_maps")
      .insert({
        user_id: context.userId,
        subject_id: data.subjectId ?? null,
        topic_id: data.topicId ?? null,
        title: data.title,
        data: (parsed.root ? { root: parsed.root } : parsed) as Json,
      })
      .select("id")
      .single();
    if (error || !saved) throw new Error("Não foi possível salvar o mapa mental.");

    return { mindMapId: saved.id as string };
  });

export const generateStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { callAI, parseJson, BASE_SYSTEM } = await import("./ai.server");
    const { supabase, userId } = context;

    const [subjects, errors, attempts, sessions] = await Promise.all([
      supabase.from("subjects").select("id,name").eq("user_id", userId).limit(30),
      supabase
        .from("user_errors")
        .select("concept,times_wrong")
        .eq("user_id", userId)
        .eq("resolved", false)
        .order("times_wrong", { ascending: false })
        .limit(15),
      supabase
        .from("quiz_attempts")
        .select("score,total,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("study_sessions")
        .select("kind,minutes,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const raw = await callAI(
      [
        { role: "system", content: BASE_SYSTEM },
        {
          role: "user",
          content: `Monte o plano de estudos de HOJE para este aluno, com base no histórico.
Responda SOMENTE com JSON: {"resumo":"frase motivacional curta","itens":[{"titulo":"o que estudar","minutos":30,"motivo":"por que isso agora","acao":"resumo|quiz|flashcards|revisao|leitura"}]}
Use entre 3 e 5 itens, somando no máximo 90 minutos.

MATÉRIAS: ${JSON.stringify(subjects.data ?? [])}
ERROS FREQUENTES: ${JSON.stringify(errors.data ?? [])}
ÚLTIMAS TENTATIVAS DE QUIZ: ${JSON.stringify(attempts.data ?? [])}
SESSÕES RECENTES: ${JSON.stringify(sessions.data ?? [])}`,
        },
      ],
      { temperature: 0.6 },
    );

    const plan = parseJson<{
      resumo: string;
      itens: Array<{ titulo: string; minutos: number; motivo: string; acao: string }>;
    }>(raw);

    await supabase.from("study_plans").insert({ user_id: userId, data: plan });
    return plan;
  });
