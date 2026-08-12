import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Loader2, Sparkles, Share2, Layers3, Network, Target } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import type { Material } from "@/lib/library";
import {
  generateExplanation,
  generateFlashcards,
  generateMindMap,
  generateQuiz,
  type TeachMode,
} from "@/lib/ai.functions";
import { Markdown } from "@/components/study/Markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/material/$materialId")({
  component: MaterialPage,
});

export const MODES: Array<{ id: TeachMode; label: string; hint: string }> = [
  { id: "resumo", label: "Resumo", hint: "Visão geral organizada" },
  { id: "simples", label: "Forma simples", hint: "Linguagem fácil" },
  { id: "academico", label: "Acadêmico", hint: "Rigor e termos técnicos" },
  { id: "pratica", label: "Na prática", hint: "Casos reais" },
  { id: "fofoca", label: "Modo fofoca", hint: "Descontraído e divertido" },
  { id: "faculdade", label: "Modo faculdade", hint: "Conceito, teoria, aplicação" },
  { id: "vida-real", label: "Vida real", hint: "Exemplos do cotidiano" },
  { id: "memorizacao", label: "Memorização", hint: "Analogias e mnemônicos" },
  { id: "prova", label: "Modo prova", hint: "O que mais cai e pegadinhas" },
  { id: "revisao", label: "Revisão", hint: "Checklist rápido" },
];

function MaterialPage() {
  const { materialId } = Route.useParams();
  const { user } = useSession();
  const queryClient = useQueryClient();

  const explain = useServerFn(generateExplanation);
  const quiz = useServerFn(generateQuiz);
  const cards = useServerFn(generateFlashcards);
  const mind = useServerFn(generateMindMap);

  const [mode, setMode] = useState<TeachMode>("resumo");
  const [content, setContent] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const materialQuery = useQuery({
    queryKey: ["material", materialId],
    queryFn: async () => {
      const { data, error } = await supabase.from("materials").select("*").eq("id", materialId).maybeSingle();
      if (error) throw error;
      return data as unknown as Material | null;
    },
  });

  const outputs = useQuery({
    queryKey: ["material-outputs", materialId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_outputs")
        .select("id,title,kind,mode,content,created_at")
        .contains("sources", [{ id: materialId }])
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const material = materialQuery.data;
  const base = {
    scope: "selected" as const,
    materialIds: [materialId],
    subjectId: material?.subject_id ?? null,
    topicId: material?.topic_id ?? null,
  };

  async function run(kind: string, fn: () => Promise<void>) {
    setBusy(kind);
    try {
      await fn();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Algo deu errado.");
    }
    setBusy(null);
  }

  async function toggleShare() {
    if (!material) return;
    const next = material.visibility === "private" ? "public" : "private";
    await supabase.from("materials").update({ visibility: next }).eq("id", material.id);
    queryClient.invalidateQueries({ queryKey: ["material", materialId] });
    toast.success(next === "public" ? "Material compartilhado com a comunidade." : "Material voltou a ser privado.");
  }

  async function saveNote() {
    if (!notes.trim() || !user) return;
    await supabase.from("notes").insert({
      user_id: user.id,
      material_id: materialId,
      subject_id: material?.subject_id ?? null,
      content: notes,
    });
    setNotes("");
    toast.success("Anotação salva!");
    queryClient.invalidateQueries({ queryKey: ["notes", materialId] });
  }

  const notesQuery = useQuery({
    queryKey: ["notes", materialId],
    queryFn: async () => {
      const { data } = await supabase
        .from("notes")
        .select("id,content,created_at")
        .eq("material_id", materialId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (materialQuery.isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="surface p-10 text-center">
        <p className="text-sm text-muted-foreground">Material não encontrado.</p>
        <Button asChild size="sm" className="mt-4">
          <Link to="/biblioteca">Voltar à biblioteca</Link>
        </Button>
      </div>
    );
  }

  const notReady = material.status !== "ready";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/biblioteca" className="text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 inline size-3" /> Biblioteca
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{material.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{material.source_kind}</Badge>
            <Badge variant="outline">{material.status}</Badge>
          </div>
        </div>
        {material.user_id === user?.id ? (
          <Button size="sm" variant="outline" onClick={toggleShare}>
            <Share2 className="size-4" />
            {material.visibility === "private" ? "Compartilhar" : "Tornar privado"}
          </Button>
        ) : null}
      </div>

      {notReady ? (
        <div className="surface border-warning/40 p-4 text-sm text-muted-foreground">
          {material.status_message ?? "Este material ainda não foi processado, então a IA não pode usá-lo."}
        </div>
      ) : null}

      <Tabs defaultValue="ia">
        <TabsList>
          <TabsTrigger value="ia">Estudar com IA</TabsTrigger>
          <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
          <TabsTrigger value="notas">Anotações</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="ia" className="space-y-4">
          <div className="surface p-5">
            <h2 className="text-sm font-semibold">Como você quer que eu explique?</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "rounded-lg border p-3 text-left text-xs transition-colors",
                    mode === m.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
                  )}
                >
                  <span className="block text-sm font-medium">{m.label}</span>
                  <span className="text-muted-foreground">{m.hint}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                disabled={notReady || busy !== null}
                onClick={() =>
                  run("explain", async () => {
                    const result = await explain({
                      data: { ...base, mode, title: `${material.title} — ${mode}` },
                    });
                    setContent(result.content);
                    queryClient.invalidateQueries({ queryKey: ["material-outputs", materialId] });
                  })
                }
              >
                {busy === "explain" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Gerar explicação
              </Button>

              <Button
                variant="outline"
                disabled={notReady || busy !== null}
                onClick={() =>
                  run("quiz", async () => {
                    const result = await quiz({
                      data: {
                        ...base,
                        title: `Quiz — ${material.title}`,
                        count: 10,
                        difficulty: "medio",
                        questionType: "multiple_choice",
                      },
                    });
                    toast.success(`Quiz criado com ${result.total} questões! Abra em Quiz.`);
                  })
                }
              >
                {busy === "quiz" ? <Loader2 className="size-4 animate-spin" /> : <Target className="size-4" />}
                Criar quiz
              </Button>

              <Button
                variant="outline"
                disabled={notReady || busy !== null}
                onClick={() =>
                  run("cards", async () => {
                    const result = await cards({ data: { ...base, count: 15 } });
                    toast.success(`${result.created} flashcards criados!`);
                  })
                }
              >
                {busy === "cards" ? <Loader2 className="size-4 animate-spin" /> : <Layers3 className="size-4" />}
                Criar flashcards
              </Button>

              <Button
                variant="outline"
                disabled={notReady || busy !== null}
                onClick={() =>
                  run("mind", async () => {
                    await mind({ data: { ...base, title: material.title } });
                    toast.success("Mapa mental criado! Veja em Mapas Mentais.");
                  })
                }
              >
                {busy === "mind" ? <Loader2 className="size-4 animate-spin" /> : <Network className="size-4" />}
                Criar mapa mental
              </Button>
            </div>
          </div>

          {content ? (
            <div className="surface p-5 sm:p-6">
              <Markdown content={content} />
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="conteudo">
          <div className="surface max-h-[70vh] overflow-y-auto p-5">
            <pre className="whitespace-pre-wrap break-words font-sans text-sm text-muted-foreground">
              {material.extracted_text || "Sem texto extraído."}
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="notas" className="space-y-3">
          <div className="surface space-y-3 p-5">
            <Textarea
              rows={4}
              placeholder="Escreva uma anotação sobre este material..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button size="sm" onClick={saveNote}>
              Salvar anotação
            </Button>
          </div>
          {(notesQuery.data ?? []).map((n) => (
            <div key={n.id} className="surface p-4 text-sm">
              <p className="whitespace-pre-wrap">{n.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(n.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="historico" className="space-y-3">
          {(outputs.data ?? []).length === 0 ? (
            <p className="surface p-6 text-sm text-muted-foreground">Nada gerado ainda para este material.</p>
          ) : (
            outputs.data?.map((o) => (
              <details key={o.id} className="surface p-4">
                <summary className="cursor-pointer text-sm font-medium">
                  {o.title}{" "}
                  <span className="text-xs text-muted-foreground">
                    · {new Date(o.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </summary>
                <Markdown content={o.content} />
              </details>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
