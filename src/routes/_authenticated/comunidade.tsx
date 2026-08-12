import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, FileText } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { PageHeader } from "@/components/study/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade — Mentor IA" },
      { name: "description", content: "Materiais compartilhados por outros estudantes da plataforma." },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const { user } = useSession();

  const shared = useQuery({
    queryKey: ["community-materials"],
    queryFn: async () => {
      const { data } = await supabase
        .from("materials")
        .select("id,title,description,source_kind,status,user_id,created_at")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const list = (shared.data ?? []).filter((m) => m.user_id !== user?.id);
  const mine = (shared.data ?? []).filter((m) => m.user_id === user?.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comunidade"
        description="Materiais que outros estudantes tornaram públicos. Você também pode compartilhar os seus."
      />

      <div className="surface p-4 text-sm text-muted-foreground">
        Você está compartilhando <strong className="text-foreground">{mine.length}</strong> material(is). Abra um
        material na biblioteca e use "Compartilhar" para publicá-lo.
      </div>

      {list.length === 0 ? (
        <div className="surface p-10 text-center">
          <Users className="mx-auto size-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhum material público disponível no momento.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => (
            <div key={m.id} className="surface flex flex-col gap-3 p-4">
              <p className="font-medium">
                <FileText className="mr-1.5 inline size-4 text-primary" />
                {m.title}
              </p>
              {m.description ? <p className="text-sm text-muted-foreground">{m.description}</p> : null}
              <Badge variant="outline" className="w-fit">
                {m.source_kind}
              </Badge>
              <Button asChild size="sm" variant="outline" className="mt-auto">
                <Link to="/material/$materialId" params={{ materialId: m.id }}>
                  Estudar
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
