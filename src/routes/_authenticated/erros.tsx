import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Trash2, XCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/study/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/erros")({
  head: () => ({
    meta: [
      { title: "Caderno de erros — Tutor IA Catoala" },
      { name: "description", content: "Todos os seus erros registrados, com explicação e revisão inteligente." },
    ],
  }),
  component: ErrorsPage,
});

function ErrorsPage() {
  const queryClient = useQueryClient();

  const errors = useQuery({
    queryKey: ["user-errors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_errors")
        .select("*")
        .order("times_wrong", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  async function resolve(id: string, resolved: boolean) {
    await supabase.from("user_errors").update({ resolved }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["user-errors"] });
  }

  async function remove(id: string) {
    await supabase.from("user_errors").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["user-errors"] });
  }

  const list = errors.data ?? [];
  const pending = list.filter((e) => !e.resolved);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Caderno de erros"
        description="Tudo o que você errou fica aqui, agrupado por conceito, pronto para revisar."
        action={
          <Button asChild size="sm">
            <Link to="/revisoes">Revisar agora</Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface p-4">
          <p className="text-xs text-muted-foreground">Erros registrados</p>
          <p className="text-xl font-bold">{list.length}</p>
        </div>
        <div className="surface p-4">
          <p className="text-xs text-muted-foreground">Pendentes</p>
          <p className="text-xl font-bold text-destructive">{pending.length}</p>
        </div>
        <div className="surface p-4">
          <p className="text-xs text-muted-foreground">Superados</p>
          <p className="text-xl font-bold text-success">{list.length - pending.length}</p>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="surface p-10 text-center text-sm text-muted-foreground">
          Nenhum erro registrado ainda. Faça um quiz para começar a mapear seus pontos fracos.
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((e) => (
            <div key={e.id} className="surface space-y-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{e.concept}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={e.resolved ? "outline" : "destructive"}>
                    {e.resolved ? "superado" : `${e.times_wrong}x errado`}
                  </Badge>
                  <button onClick={() => resolve(e.id, !e.resolved)} title="Marcar">
                    {e.resolved ? (
                      <XCircle className="size-4 text-muted-foreground" />
                    ) : (
                      <CheckCircle2 className="size-4 text-success" />
                    )}
                  </button>
                  <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              {e.question ? <p className="text-sm text-muted-foreground">{e.question}</p> : null}
              {e.correct_answer ? (
                <p className="text-sm">
                  <span className="text-muted-foreground">Resposta correta: </span>
                  <strong>{e.correct_answer}</strong>
                </p>
              ) : null}
              {e.explanation ? <p className="text-sm text-muted-foreground">{e.explanation}</p> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
