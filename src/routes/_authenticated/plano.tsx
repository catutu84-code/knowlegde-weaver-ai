import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarDays, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { generateStudyPlan } from "@/lib/ai.functions";
import { PageHeader } from "@/components/study/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/plano")({
  head: () => ({
    meta: [
      { title: "Plano de estudos — Mentor IA" },
      { name: "description", content: "Um plano diário criado pela IA a partir do seu histórico e dos seus erros." },
    ],
  }),
  component: PlanPage,
});

type Plan = {
  resumo: string;
  itens: Array<{ titulo: string; minutos: number; motivo: string; acao: string }>;
};

function PlanPage() {
  const queryClient = useQueryClient();
  const create = useServerFn(generateStudyPlan);
  const [busy, setBusy] = useState(false);

  const latest = useQuery({
    queryKey: ["study-plan"],
    queryFn: async () => {
      const { data } = await supabase
        .from("study_plans")
        .select("id,data,created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  async function handleCreate() {
    setBusy(true);
    try {
      await create({});
      toast.success("Plano de hoje pronto!");
      queryClient.invalidateQueries({ queryKey: ["study-plan"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível montar o plano.");
    }
    setBusy(false);
  }

  const plan = (latest.data?.data ?? null) as Plan | null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plano de estudos"
        description="A IA olha seus erros, tempo e histórico para dizer o que estudar hoje."
        action={
          <Button size="sm" onClick={handleCreate} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Gerar plano de hoje
          </Button>
        }
      />

      {!plan ? (
        <div className="surface p-10 text-center">
          <CalendarDays className="mx-auto size-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum plano ainda. Gere seu primeiro plano de estudos personalizado.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="surface gradient-hero p-5">
            <p className="text-sm">{plan.resumo}</p>
            {latest.data ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Gerado em {new Date(latest.data.created_at).toLocaleString("pt-BR")}
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            {(plan.itens ?? []).map((item, i) => (
              <div key={i} className="surface flex items-start gap-4 p-4">
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.titulo}</p>
                    <Badge variant="outline">{item.minutos} min</Badge>
                    <Badge variant="outline" className="capitalize">
                      {item.acao}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.motivo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
