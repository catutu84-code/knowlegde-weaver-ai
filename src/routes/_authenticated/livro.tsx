import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BookOpen, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { createBook } from "@/lib/books.functions";
import { BOOK_STYLES } from "@/lib/book-styles";
import { PageHeader } from "@/components/study/PageHeader";
import { ScopePicker, emptyScope, type StudyScope } from "@/components/study/ScopePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/livro")({
  head: () => ({
    meta: [
      { title: "Modo Livro — Mentor IA" },
      {
        name: "description",
        content: "Transforme seus materiais em um livro didático personalizado criado pela IA.",
      },
      { property: "og:title", content: "Modo Livro — Mentor IA" },
      {
        property: "og:description",
        content: "Leitura inteligente capítulo por capítulo, no seu estilo de explicação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookHomePage,
});

type BookRow = {
  id: string;
  title: string;
  style: string;
  current_chapter: number;
  total_chapters: number;
  created_at: string;
};

function BookHomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const create = useServerFn(createBook);
  const [scope, setScope] = useState<StudyScope>({ ...emptyScope, scope: "selected" });
  const [style, setStyle] = useState<string>("simples");
  const [custom, setCustom] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const books = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data } = await supabase
        .from("books")
        .select("id,title,style,current_chapter,total_chapters,created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      return (data ?? []) as BookRow[];
    },
  });

  async function handleCreate() {
    setBusy(true);
    try {
      const result = await create({
        data: {
          title,
          style,
          customInstruction: custom || null,
          scope: scope.scope,
          materialIds: scope.materialIds,
          courseId: scope.courseId,
          subjectId: scope.subjectId,
          topicId: scope.topicId,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success(`Livro criado com ${result.total} capítulos!`);
      navigate({ to: "/livro/$bookId", params: { bookId: result.bookId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o livro.");
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm("Excluir este livro? Seus materiais originais continuam na Biblioteca.")) return;
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["books"] });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="📖 Modo Livro"
        description="A IA transforma os seus materiais em um livro didático, do jeito que você entende melhor. O arquivo original continua intacto na Biblioteca."
      />

      <div className="surface space-y-5 p-5">
        <ScopePicker value={scope} onChange={setScope} />

        <div className="space-y-2">
          <Label className="text-xs">Como você quer que eu explique?</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {BOOK_STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStyle(s.value)}
                className={cn(
                  "rounded-lg border p-3 text-left text-sm transition-colors",
                  style === s.value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50",
                )}
              >
                <span className="block font-medium text-foreground">{s.label}</span>
                <span className="text-[11px]">{s.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Instrução livre (opcional)</Label>
          <Textarea
            rows={2}
            placeholder="Ex.: Explique como se eu tivesse dificuldade, com palavras simples, exemplos do cotidiano e passo a passo."
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Título do livro (opcional)</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A IA sugere um título" />
        </div>

        <Button onClick={handleCreate} disabled={busy} className="w-full sm:w-auto">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          📖 Ler como Livro
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Meus livros</h2>
        {(books.data ?? []).length === 0 ? (
          <p className="surface p-6 text-center text-sm text-muted-foreground">
            Você ainda não criou nenhum livro. Escolha um material acima e comece a leitura inteligente.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(books.data ?? []).map((b) => {
              const pct = b.total_chapters
                ? Math.round(((b.current_chapter + 1) / b.total_chapters) * 100)
                : 0;
              return (
                <div key={b.id} className="surface flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to="/livro/$bookId"
                      params={{ bookId: b.id }}
                      className="min-w-0 flex-1 font-medium hover:text-primary"
                    >
                      <BookOpen className="mr-1.5 inline size-4 text-primary" />
                      {b.title}
                    </Link>
                    <button
                      onClick={() => remove(b.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Excluir livro"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <Progress value={pct} />
                  <p className="text-xs text-muted-foreground">
                    Capítulo {Math.min(b.current_chapter + 1, b.total_chapters)} de {b.total_chapters} · {pct}%
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-auto">
                    <Link to="/livro/$bookId" params={{ bookId: b.id }}>
                      Continuar leitura
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
