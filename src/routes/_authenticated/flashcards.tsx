import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Layers3, Loader2, RotateCcw, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { generateFlashcards } from "@/lib/ai.functions";
import { logStudySession } from "@/lib/library";
import { PageHeader } from "@/components/study/PageHeader";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcards — Mentor IA" },
      { name: "description", content: "Revise com flashcards inteligentes criados dos seus materiais." },
    ],
  }),
  component: FlashcardsPage,
});

type Card = {
  id: string;
  front: string;
  back: string;
  source_ref: string | null;
  ease: number;
  subject_id: string | null;
};

function FlashcardsPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const create = useServerFn(generateFlashcards);
  const [scope, setScope] = useState<StudyScope>({ ...emptyScope, scope: "selected" });
  const [count, setCount] = useState("15");
  const [busy, setBusy] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const cards = useQuery({
    queryKey: ["flashcards", scope.subjectId, scope.topicId],
    queryFn: async () => {
      let q = supabase.from("flashcards").select("*").order("created_at", { ascending: false });
      if (scope.subjectId) q = q.eq("subject_id", scope.subjectId);
      if (scope.topicId) q = q.eq("topic_id", scope.topicId);
      const { data } = await q;
      return (data ?? []) as unknown as Card[];
    },
  });

  const deck = useMemo(() => cards.data ?? [], [cards.data]);
  const current = deck[index];

  async function handleCreate() {
    setBusy(true);
    try {
      const result = await create({
        data: {
          scope: scope.scope,
          materialIds: scope.materialIds,
          subjectId: scope.subjectId,
          topicId: scope.topicId,
          count: Number(count),
        },
      });
      toast.success(`${result.created} flashcards criados!`);
      setIndex(0);
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar flashcards.");
    }
    setBusy(false);
  }

  async function review(known: boolean) {
    if (!current || !user) return;
    const nextDays = known ? Math.max(1, Math.round((current.ease || 2.5) * 2)) : 1;
    await supabase
      .from("flashcards")
      .update({
        ease: known ? Math.min(4, (current.ease || 2.5) + 0.15) : Math.max(1.3, (current.ease || 2.5) - 0.3),
        due_at: new Date(Date.now() + nextDays * 86400000).toISOString(),
      } as never)
      .eq("id", current.id);

    if (!known) {
      await supabase.from("user_errors").insert({
        user_id: user.id,
        subject_id: current.subject_id,
        concept: current.front.slice(0, 80),
        question: current.front,
        correct_answer: current.back,
      });
    }

    setFlipped(false);
    if (index + 1 >= deck.length) {
      await logStudySession({ userId: user.id, subjectId: scope.subjectId, kind: "flashcards", minutes: 10 });
      toast.success("Sessão de flashcards concluída!");
      setIndex(0);
      queryClient.invalidateQueries();
    } else {
      setIndex(index + 1);
    }
  }

  async function removeCard(id: string) {
    await supabase.from("flashcards").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["flashcards"] });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Flashcards" description="Frente e verso gerados pela IA a partir dos seus materiais." />

      <div className="surface space-y-4 p-5">
        <ScopePicker value={scope} onChange={setScope} />
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40 space-y-1.5">
            <Label className="text-xs">Quantidade</Label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["10", "15", "20", "30"].map((n) => (
                  <SelectItem key={n} value={n}>
                    {n} cards
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Layers3 className="size-4" />}
            Criar flashcards
          </Button>
        </div>
      </div>

      {deck.length === 0 ? (
        <p className="surface p-8 text-center text-sm text-muted-foreground">
          Nenhum flashcard nesta seleção ainda.
        </p>
      ) : current ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Card {index + 1} de {deck.length}
            </span>
            <button className="hover:text-destructive" onClick={() => removeCard(current.id)}>
              <Trash2 className="size-4" />
            </button>
          </div>

          <button
            onClick={() => setFlipped(!flipped)}
            className={cn(
              "surface flex min-h-56 w-full items-center justify-center p-8 text-center text-lg font-medium transition-colors",
              flipped ? "bg-primary/8" : "",
            )}
          >
            <span className="whitespace-pre-wrap">{flipped ? current.back : current.front}</span>
          </button>

          <p className="text-center text-xs text-muted-foreground">
            {flipped ? current.source_ref ?? "" : "Toque no card para ver a resposta"}
          </p>

          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setFlipped(!flipped)}>
              <RotateCcw className="size-4" /> Virar
            </Button>
            <Button variant="outline" onClick={() => review(false)}>
              <ThumbsDown className="size-4" /> Ainda não sei
            </Button>
            <Button onClick={() => review(true)}>
              <ThumbsUp className="size-4" /> Já sei
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
