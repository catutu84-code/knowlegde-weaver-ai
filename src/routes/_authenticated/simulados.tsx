import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { GraduationCap, Loader2, Play } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/simulados")({
  head: () => ({
    meta: [
      { title: "Simulados — Mentor IA" },
      { name: "description", content: "Simulados completos sem feedback imediato, com resultado detalhado no final." },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  const queryClient = useQueryClient();
  const create = useServerFn(generateQuiz);
  const [scope, setScope] = useState<StudyScope>({ ...emptyScope, scope: "subject" });
  const [count, setCount] = useState("20");
  const [difficulty, setDifficulty] = useState<"facil" | "medio" | "dificil" | "faculdade">("dificil");
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  const exams = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const { data } = await supabase
        .from("quizzes")
        .select("id,title,difficulty,created_at")
        .eq("is_exam", true)
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
          title: `Simulado ${new Date().toLocaleDateString("pt-BR")}`,
          count: Number(count),
          difficulty,
          questionType: "mixed",
          isExam: true,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      setActive(result.quizId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o simulado.");
    }
    setBusy(false);
  }

  if (active) {
    return (
      <div className="space-y-4">
        <PageHeader title="Simulado em andamento" description="Sem feedback durante a prova. Boa sorte!" />
        <QuizRunner quizId={active} examMode onExit={() => setActive(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Simulados"
        description="Prova completa da matéria, com correção só no final e registro dos erros."
      />

      <div className="surface space-y-4 p-5">
        <ScopePicker value={scope} onChange={setScope} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Questões</Label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["10", "20", "30", "40"].map((n) => (
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
        </div>
        <Button onClick={handleCreate} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <GraduationCap className="size-4" />}
          Gerar simulado
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Simulados anteriores</h2>
        {(exams.data ?? []).length === 0 ? (
          <p className="surface p-6 text-sm text-muted-foreground">Nenhum simulado criado ainda.</p>
        ) : (
          exams.data?.map((e) => (
            <div key={e.id} className="surface flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {e.difficulty} · {new Date(e.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setActive(e.id)}>
                <Play className="size-4" /> Refazer
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
