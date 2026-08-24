import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/study/PageHeader";
import { Markdown } from "@/components/study/Markdown";

export const Route = createFileRoute("/_authenticated/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — Tutor IA Catoala" },
      { name: "description", content: "Seus resumos, explicações e conteúdos salvos para revisar depois." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const outputs = useQuery({
    queryKey: ["ai-outputs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_outputs")
        .select("id,title,kind,mode,content,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const list = outputs.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Favoritos" description="Tudo que a IA já gerou para você, guardado em um só lugar." />

      {list.length === 0 ? (
        <div className="surface p-10 text-center">
          <Star className="mx-auto size-8 text-accent" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nada salvo ainda. Gere um resumo ou explicação para vê-lo aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((o) => (
            <details key={o.id} className="surface p-4">
              <summary className="cursor-pointer">
                <span className="font-medium">{o.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {o.mode ?? o.kind} · {new Date(o.created_at).toLocaleDateString("pt-BR")}
                </span>
              </summary>
              <Markdown content={o.content} />
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
