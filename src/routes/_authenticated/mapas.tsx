import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Network, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { generateMindMap } from "@/lib/ai.functions";
import { PageHeader } from "@/components/study/PageHeader";
import { ScopePicker, emptyScope, type StudyScope } from "@/components/study/ScopePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/mapas")({
  head: () => ({
    meta: [
      { title: "Mapas mentais — Mentor IA" },
      { name: "description", content: "Visualize o conteúdo em mapas mentais hierárquicos gerados por IA." },
    ],
  }),
  component: MindMapsPage,
});

type Node = { label: string; children?: Node[] };

function MindMapsPage() {
  const queryClient = useQueryClient();
  const create = useServerFn(generateMindMap);
  const [scope, setScope] = useState<StudyScope>({ ...emptyScope, scope: "selected" });
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const maps = useQuery({
    queryKey: ["mind-maps"],
    queryFn: async () => {
      const { data } = await supabase
        .from("mind_maps")
        .select("id,title,data,created_at")
        .order("created_at", { ascending: false })
        .limit(30);
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
          title: title.trim() || `Mapa mental ${new Date().toLocaleDateString("pt-BR")}`,
        },
      });
      toast.success("Mapa mental criado!");
      setOpenId(result.mindMapId);
      queryClient.invalidateQueries({ queryKey: ["mind-maps"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o mapa.");
    }
    setBusy(false);
  }

  async function remove(id: string) {
    await supabase.from("mind_maps").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["mind-maps"] });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mapas mentais" description="Estrutura visual dos conceitos do seu material." />

      <div className="surface space-y-4 p-5">
        <ScopePicker value={scope} onChange={setScope} />
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="max-w-xs"
            placeholder="Título do mapa (opcional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button onClick={handleCreate} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Network className="size-4" />}
            Gerar mapa mental
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {(maps.data ?? []).length === 0 ? (
          <p className="surface p-8 text-center text-sm text-muted-foreground">Nenhum mapa mental ainda.</p>
        ) : (
          maps.data?.map((m) => {
            const root = ((m.data as { root?: Node })?.root ?? null) as Node | null;
            const open = openId === m.id;
            return (
              <div key={m.id} className="surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <button className="text-left font-medium" onClick={() => setOpenId(open ? null : m.id)}>
                    {m.title}
                  </button>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString("pt-BR")}
                    <button className="hover:text-destructive" onClick={() => remove(m.id)}>
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                {open && root ? (
                  <div className="mt-4 overflow-x-auto">
                    <MindNode node={root} level={0} />
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const LEVEL_STYLES = [
  "bg-primary/15 text-primary border-primary/40 font-semibold",
  "bg-accent/12 text-accent border-accent/35",
  "bg-muted text-foreground border-border",
];

function MindNode({ node, level }: { node: Node; level: number }) {
  const style = LEVEL_STYLES[Math.min(level, LEVEL_STYLES.length - 1)];
  return (
    <div className="relative pl-4">
      <span className={`inline-block rounded-lg border px-3 py-1.5 text-sm ${style}`}>{node.label}</span>
      {node.children && node.children.length > 0 ? (
        <div className="ml-4 mt-2 space-y-2 border-l border-border pl-3">
          {node.children.map((child, i) => (
            <MindNode key={`${child.label}-${i}`} node={child} level={level + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
