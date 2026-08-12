import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, XCircle, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { gradeOpenAnswer } from "@/lib/ai.functions";
import { logStudySession } from "@/lib/library";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Markdown } from "@/components/study/Markdown";
import { cn } from "@/lib/utils";

type Question = {
  id: string;
  position: number;
  type: string;
  prompt: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  concept: string | null;
  source_ref: string | null;
};

export function QuizRunner({
  quizId,
  examMode = false,
  onExit,
}: {
  quizId: string;
  examMode?: boolean;
  onExit?: () => void;
}) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const grade = useServerFn(gradeOpenAnswer);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [checked, setChecked] = useState(false);
  const [correctNow, setCorrectNow] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const attemptRef = useRef<string | null>(null);

  const quizQuery = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => {
      const [{ data: quiz }, { data: questions }] = await Promise.all([
        supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle(),
        supabase.from("quiz_questions").select("*").eq("quiz_id", quizId).order("position"),
      ]);
      return { quiz, questions: (questions ?? []) as unknown as Question[] };
    },
  });

  const questions = useMemo(() => quizQuery.data?.questions ?? [], [quizQuery.data]);
  const quiz = quizQuery.data?.quiz;
  const current = questions[index];

  useEffect(() => {
    async function createAttempt() {
      if (!user || attemptRef.current || questions.length === 0) return;
      const { data } = await supabase
        .from("quiz_attempts")
        .insert({ quiz_id: quizId, user_id: user.id, total: questions.length })
        .select("id")
        .single();
      attemptRef.current = data?.id ?? null;
    }
    void createAttempt();
  }, [user, questions.length, quizId]);

  async function submitAnswer() {
    if (!current || !user || !selected.trim()) {
      toast.error("Escolha ou escreva uma resposta antes de continuar.");
      return;
    }
    setBusy(true);
    let isCorrect = false;
    let explanation = current.explanation ?? "";

    try {
      if (current.type === "open") {
        const result = await grade({
          data: {
            question: current.prompt,
            expected: current.correct_answer,
            answer: selected,
          },
        });
        isCorrect = result.is_correct || result.score >= 7;
        explanation = `**Nota sugerida: ${result.score}/10**\n\n**O que você acertou:** ${result.acertos}\n\n**O que poderia melhorar:** ${result.melhorar}\n\n**Resposta sugerida:** ${result.resposta_modelo}`;
      } else {
        isCorrect =
          selected.trim().toLowerCase() === current.correct_answer.trim().toLowerCase();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível corrigir agora.");
      setBusy(false);
      return;
    }

    if (attemptRef.current) {
      await supabase.from("quiz_answers").insert({
        attempt_id: attemptRef.current,
        question_id: current.id,
        user_id: user.id,
        user_answer: selected,
        is_correct: isCorrect,
        feedback: explanation,
      });
    }

    if (!isCorrect) {
      const concept = current.concept ?? current.prompt.slice(0, 60);
      const { data: existing } = await supabase
        .from("user_errors")
        .select("id,times_wrong")
        .eq("user_id", user.id)
        .eq("concept", concept)
        .maybeSingle();
      if (existing) {
        await supabase
          .from("user_errors")
          .update({ times_wrong: (existing.times_wrong ?? 1) + 1, resolved: false })
          .eq("id", existing.id);
      } else {
        await supabase.from("user_errors").insert({
          user_id: user.id,
          subject_id: quiz?.subject_id ?? null,
          topic_id: quiz?.topic_id ?? null,
          concept,
          question: current.prompt,
          user_answer: selected,
          correct_answer: current.correct_answer,
          explanation: current.explanation,
        });
      }
    }

    if (isCorrect) setScore((s) => s + 1);
    setCorrectNow(isCorrect);
    setFeedback(explanation);
    setChecked(true);
    setBusy(false);
  }

  async function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setSelected("");
      setChecked(false);
      setFeedback(null);
      return;
    }
    if (attemptRef.current) {
      await supabase
        .from("quiz_attempts")
        .update({ score, total: questions.length, finished_at: new Date().toISOString() })
        .eq("id", attemptRef.current);
    }
    if (user) {
      await logStudySession({
        userId: user.id,
        subjectId: quiz?.subject_id ?? null,
        kind: examMode ? "simulado" : "quiz",
        minutes: Math.max(5, questions.length),
        detail: quiz?.title ?? "Quiz",
      });
    }
    queryClient.invalidateQueries();
    setDone(true);
  }

  if (quizQuery.isLoading) {
    return (
      <div className="surface grid place-items-center p-12">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (done) {
    const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="surface p-8 text-center">
        <Trophy className="mx-auto size-10 text-accent" />
        <h2 className="mt-4 text-2xl font-bold">
          {score}/{questions.length}
        </h2>
        <p className="text-muted-foreground">{pct}% de acertos</p>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          {pct >= 80
            ? "Excelente! Você domina bem esse conteúdo."
            : pct >= 50
              ? "Bom caminho. Revise os pontos que errou no Caderno de Erros."
              : "Vale revisar o conteúdo antes de tentar de novo — seus erros já foram registrados."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={onExit}>Concluir</Button>
        </div>
      </div>
    );
  }

  if (!current) {
    return <div className="surface p-8 text-center text-sm text-muted-foreground">Quiz sem questões.</div>;
  }

  const options = Array.isArray(current.options) ? current.options : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Progress value={((index + (checked ? 1 : 0)) / questions.length) * 100} className="h-2" />
        <span className="shrink-0 text-xs text-muted-foreground">
          {index + 1}/{questions.length}
        </span>
      </div>

      <div className="surface p-5 sm:p-6">
        <p className="text-base font-medium leading-relaxed">{current.prompt}</p>

        <div className="mt-5 space-y-2">
          {current.type === "open" ? (
            <Textarea
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={checked}
              rows={6}
              placeholder="Escreva sua resposta..."
            />
          ) : (
            options.map((option) => {
              const isPicked = selected === option;
              const reveal = checked && !examMode;
              const isRight = option.trim().toLowerCase() === current.correct_answer.trim().toLowerCase();
              return (
                <button
                  key={option}
                  type="button"
                  disabled={checked}
                  onClick={() => setSelected(option)}
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                    isPicked ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
                    reveal && isRight && "border-success bg-success/10",
                    reveal && isPicked && !isRight && "border-destructive bg-destructive/10",
                  )}
                >
                  {option}
                </button>
              );
            })
          )}
        </div>

        {checked && !examMode ? (
          <div
            className={cn(
              "mt-5 rounded-lg border p-4",
              correctNow ? "border-success/40 bg-success/8" : "border-destructive/40 bg-destructive/8",
            )}
          >
            <p className="flex items-center gap-2 text-sm font-semibold">
              {correctNow ? (
                <>
                  <CheckCircle2 className="size-4 text-success" /> Correto
                </>
              ) : (
                <>
                  <XCircle className="size-4 text-destructive" /> Incorreto
                </>
              )}
            </p>
            {!correctNow && current.type !== "open" ? (
              <p className="mt-2 text-sm">
                Resposta correta: <strong>{current.correct_answer}</strong>
              </p>
            ) : null}
            {feedback ? <Markdown content={feedback} /> : null}
            {current.source_ref ? (
              <p className="mt-2 text-xs text-muted-foreground">Fonte: {current.source_ref}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          {!checked ? (
            <Button onClick={submitAnswer} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Responder"}
            </Button>
          ) : (
            <Button onClick={next}>
              {index + 1 < questions.length ? "Próxima" : "Ver resultado"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
