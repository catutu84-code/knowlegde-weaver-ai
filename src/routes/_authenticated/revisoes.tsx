import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { generateReviewQuiz } from "@/lib/ai.functions";
import { PageHeader } from "@/components/study/PageHeader";
import { QuizRunner } from "@/components/study/QuizRunner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/revisoes")({
  head: () => ({
    meta: [
      { title: "Revisões inteligentes — Tutor IA Catoala" },
      { name: "description", content: "Questões novas focadas exatamente no que você errou." },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const create = useServerFn(generateReviewQuiz);
  const [count, setCount] = useState("10");
  const [busy, setBusy] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);

  const errors = useQuery({
    queryKey: ["review-errors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_errors")
        .select("concept,times_wrong")
        .eq("resolved", false)
        .order("times_wrong", { ascending: false })
        .limit(12);
      return data ?? [];
    },
  });

  async function handleCreate() {
    setBusy(true);
    try {
      const result = await create({ data: { count: Number(count) } });
      setQuizId(result.quizId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar a revisão.");
    }
    setBusy(false);
  }

  if (quizId) {
    return (
      <div className="space-y-4">
        <PageHeader title="Revisão inteligente" description="Questões novas sobre os conceitos que você errou." />
        <QuizRunner quizId={quizId} onExit={() => setQuizId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revisões inteligentes"
        description="A IA cria perguntas diferentes sobre os mesmos conceitos que você errou."
      />

      <div className="surface space-y-4 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40 space-y-1.5">
            <Label className="text-xs">Questões</Label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["5", "10", "15", "20"].map((n) => (
                  <SelectItem key={n} value={n}>
                    {n} questões
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Gerar revisão
          </Button>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Conceitos que entrarão na revisão:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(errors.data ?? []).length === 0 ? (
              <span className="text-sm text-muted-foreground">Nenhum erro pendente. 🎉</span>
            ) : (
              errors.data?.map((e, i) => (
                <span key={i} className="rounded-full border border-border px-3 py-1 text-xs">
                  {e.concept} · {e.times_wrong}x
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
