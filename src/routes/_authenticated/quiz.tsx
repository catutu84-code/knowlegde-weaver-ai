import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Play, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { generateQuiz } from "@/lib/ai.functions";
import { PageHeader } from "@/components/study/PageHeader";
import { QuizRunner } from "@/components/study/QuizRunner";
import { ScopePicker, emptyScope, type StudyScope } from "@/components/study/ScopePicker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz — Mentor IA" },
      { name: "description", content: "Gere quizzes personalizados a partir dos seus próprios materiais." },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const queryClient = useQueryClient();
  const create = useServerFn(generateQuiz);
  const [scope, setScope] = useState<StudyScope>({ ...emptyScope, scope: "selected" });
  const [count, setCount] = useState("10");
  const [difficulty, setDifficulty] = useState<"facil" | "medio" | "dificil" | "faculdade">("medio");
  const [type, setType] = useState<"multiple_choice" | "true_false" | "open" | "mixed">("multiple_choice");
  const [busy, setBusy] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);

  const quizzes = useQuery({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("quizzes")
        .select("id,title,difficulty,question_type,created_at,is_exam")
        .eq("is_exam", false)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  async function handleCreate() {
    setBusy(true);
    try {
      const result = await create({
        data: {
          scope: scope.scope,
          materialIds: scope.materialIds,
          subjectId: scope.subjectId,
          topicId: scope.topicId,
          title: `Quiz ${new Date().toLocaleDateString("pt-BR")}`,
          count: Number(count),
          difficulty,
          questionType: type,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      setActiveQuiz(result.quizId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o quiz.");
    }
    setBusy(false);
  }

  if (activeQuiz) {
    return (
      <div className="space-y-4">
        <PageHeader title="Quiz" description="Responda e receba explicação em cada questão." />
        <QuizRunner quizId={activeQuiz} onExit={() => setActiveQuiz(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quiz" description="Questões geradas a partir dos seus materiais, com correção explicada." />

      <div className="surface space-y-4 p-5">
        <ScopePicker value={scope} onChange={setScope} />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Quantidade</Label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["5", "10", "15", "20", "30"].map((n) => (
                  <SelectItem key={n} value={n}>
                    {n} questões
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Dificuldade</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facil">Fácil</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="dificil">Difícil</SelectItem>
                <SelectItem value="faculdade">Nível faculdade</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Múltipla escolha</SelectItem>
                <SelectItem value="true_false">Verdadeiro ou falso</SelectItem>
                <SelectItem value="open">Discursiva</SelectItem>
                <SelectItem value="mixed">Misto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleCreate} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Gerar quiz
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Quizzes recentes</h2>
        {(quizzes.data ?? []).length === 0 ? (
          <p className="surface p-6 text-sm text-muted-foreground">Você ainda não criou nenhum quiz.</p>
        ) : (
          quizzes.data?.map((q) => (
            <div key={q.id} className="surface flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{q.title}</p>
                <p className="text-xs text-muted-foreground">
                  {q.difficulty} · {q.question_type} · {new Date(q.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setActiveQuiz(q.id)}>
                <Play className="size-4" /> Responder
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
