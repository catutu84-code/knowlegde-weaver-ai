import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Highlighter,
  Loader2,
  MessageCircleQuestion,
  Send,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { askAboutBook, generateChapter } from "@/lib/books.functions";
import { BOOK_STYLES, PASSAGE_ACTIONS } from "@/lib/book-styles";
import { generateFlashcards, generateMindMap, generateQuiz } from "@/lib/ai.functions";
import { PageHeader } from "@/components/study/PageHeader";
import { Markdown } from "@/components/study/Markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/livro/$bookId")({
  head: () => ({
    meta: [
      { title: "Leitura inteligente — Mentor IA" },
      { name: "description", content: "Leia seu material como um livro didático, capítulo por capítulo." },
      { property: "og:title", content: "Leitura inteligente — Mentor IA" },
      { property: "og:description", content: "Capítulos, destaques e dúvidas explicadas pela IA." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookReaderPage,
});

type Book = {
  id: string;
  title: string;
  style: string;
  custom_instruction: string | null;
  scope: "material" | "selected" | "topic" | "subject" | "course";
  course_id: string | null;
  subject_id: string | null;
  topic_id: string | null;
  material_ids: string[];
  outline: Array<{ title: string; summary?: string }>;
  current_chapter: number;
  total_chapters: number;
  sources: Array<{ id: string; title: string }>;
};

function BookReaderPage() {
  const { bookId } = Route.useParams();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const runChapter = useServerFn(generateChapter);
  const ask = useServerFn(askAboutBook);
  const makeFlashcards = useServerFn(generateFlashcards);
  const makeMindMap = useServerFn(generateMindMap);
  const makeQuiz = useServerFn(generateQuiz);

  const [position, setPosition] = useState<number | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<{ title: string; content: string } | null>(null);
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState("");
  const [selection, setSelection] = useState("");
  const [toolBusy, setToolBusy] = useState("");
  const readerRef = useRef<HTMLDivElement>(null);

  const book = useQuery({
    queryKey: ["book", bookId],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("*").eq("id", bookId).maybeSingle();
      if (error) throw error;
      return data as Book | null;
    },
  });

  const notes = useQuery({
    queryKey: ["book-notes", bookId],
    queryFn: async () => {
      const { data } = await supabase
        .from("book_notes")
        .select("id,kind,excerpt,note,chapter_position,created_at")
        .eq("book_id", bookId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    if (book.data && position === null) setPosition(book.data.current_chapter ?? 0);
  }, [book.data, position]);

  async function loadChapter(next: number, opts?: { force?: boolean; styleOverride?: string }) {
    setLoading(true);
    setAnswer(null);
    try {
      const result = await runChapter({
        data: {
          bookId,
          position: next,
          force: opts?.force ?? false,
          styleOverride: opts?.styleOverride ?? null,
        },
      });
      setContent(result.content);
      setPosition(next);
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
      readerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir o capítulo.");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (position !== null && !content && !loading) void loadChapter(position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  async function sendQuestion(text: string, excerpt?: string) {
    if (!text.trim() || position === null) return;
    setAsking(true);
    setAnswer(null);
    try {
      const result = await ask({
        data: { bookId, position, question: text, excerpt: excerpt ?? null },
      });
      setAnswer({ title: excerpt ? "Sobre o trecho selecionado" : text, content: result.content });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "A IA não conseguiu responder agora.");
    }
    setAsking(false);
  }

  async function saveNote(kind: "highlight" | "note" | "favorite", excerpt: string, note?: string) {
    if (!user || !excerpt.trim() || position === null) return;
    const { error } = await supabase.from("book_notes").insert({
      book_id: bookId,
      user_id: user.id,
      chapter_position: position,
      kind,
      excerpt: excerpt.slice(0, 2000),
      note: note ?? null,
    } as never);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(kind === "note" ? "Anotação salva!" : "Trecho salvo!");
    queryClient.invalidateQueries({ queryKey: ["book-notes", bookId] });
  }

  async function chapterTool(tool: "resumo" | "flashcards" | "quiz" | "mapa" | "perguntas" | "revisao" | "exemplos") {
    if (!book.data || position === null) return;
    setToolBusy(tool);
    const b = book.data;
    const scopeData = {
      scope: b.scope,
      materialIds: b.material_ids,
      courseId: b.course_id,
      subjectId: b.subject_id,
      topicId: b.topic_id,
    };
    const chapterTitle = b.outline?.[position]?.title ?? `Capítulo ${position + 1}`;
    try {
      if (tool === "flashcards") {
        const r = await makeFlashcards({ data: { ...scopeData, count: 10 } });
        toast.success(`${r.created} flashcards criados a partir deste capítulo.`);
      } else if (tool === "mapa") {
        await makeMindMap({ data: { ...scopeData, title: `Mapa — ${chapterTitle}` } });
        toast.success("Mapa mental criado! Veja em Mapas Mentais.");
      } else if (tool === "quiz") {
        await makeQuiz({
          data: {
            ...scopeData,
            title: `Quiz — ${chapterTitle}`,
            count: 8,
            difficulty: "medio",
            questionType: "multiple_choice",
          },
        });
        toast.success("Quiz criado! Veja na página de Quiz.");
      } else {
        const prompts: Record<string, string> = {
          resumo: "Faça um resumo objetivo deste capítulo, com os pontos principais.",
          perguntas: "Crie 5 perguntas de estudo sobre este capítulo, com as respostas comentadas.",
          revisao: "Faça uma revisão rápida deste capítulo em tópicos curtos para memorizar.",
          exemplos: "Dê 3 exemplos práticos que ajudem a entender este capítulo.",
        };
        await sendQuestion(prompts[tool]!);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar agora.");
    }
    setToolBusy("");
  }

  if (book.isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Abrindo livro...
      </p>
    );
  }

  if (!book.data) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-sm text-muted-foreground">Livro não encontrado.</p>
        <Button asChild size="sm" className="mt-4">
          <Link to="/livro">Voltar ao Modo Livro</Link>
        </Button>
      </div>
    );
  }

  const b = book.data;
  const total = b.total_chapters || b.outline?.length || 1;
  const current = position ?? 0;
  const pct = Math.round(((current + 1) / total) * 100);
  const chapterNotes = (notes.data ?? []).filter((n) => n.chapter_position === current);

  return (
    <div className="space-y-5">
      <PageHeader
        title={b.title}
        description={`Livro criado pela IA a partir dos seus materiais. Estilo atual: ${
          BOOK_STYLES.find((s) => s.value === b.style)?.label ?? b.style
        }.`}
        action={
          <Button asChild size="sm" variant="outline">
            <Link to="/livro">
              <BookOpen className="size-4" /> Meus livros
            </Link>
          </Button>
        }
      />

      <div className="surface space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[140px] flex-1">
            <Progress value={pct} />
          </div>
          <span className="text-xs text-muted-foreground">
            Capítulo {current + 1} de {total} · {pct}%
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Select value={String(current)} onValueChange={(v) => void loadChapter(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Ir para capítulo" />
            </SelectTrigger>
            <SelectContent className="max-h-[50vh]">
              {(b.outline ?? []).map((c, i) => (
                <SelectItem key={i} value={String(i)}>
                  {i + 1}. {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={b.style}
            onValueChange={async (v) => {
              await supabase.from("books").update({ style: v }).eq("id", bookId);
              queryClient.invalidateQueries({ queryKey: ["book", bookId] });
              void loadChapter(current, { force: true, styleOverride: v });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Alterar forma de explicação" />
            </SelectTrigger>
            <SelectContent className="max-h-[50vh]">
              {BOOK_STYLES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  Explicar: {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div ref={readerRef} className="surface space-y-4 p-5">
        {loading ? (
          <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> A IA está escrevendo este capítulo...
          </p>
        ) : (
          <div
            onMouseUp={() => setSelection(window.getSelection()?.toString().trim() ?? "")}
            onTouchEnd={() => setSelection(window.getSelection()?.toString().trim() ?? "")}
            className="reader-content"
          >
            <Markdown content={content} />
          </div>
        )}

        {selection ? (
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-3">
            <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">“{selection}”</p>
            <div className="flex flex-wrap gap-2">
              {PASSAGE_ACTIONS.map((a) => (
                <button
                  key={a.key}
                  onClick={() => void sendQuestion(a.prompt, selection)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
                >
                  {a.label}
                </button>
              ))}
              <button
                onClick={() => void saveNote("favorite", selection)}
                className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
              >
                ⭐ Salvar
              </button>
              <button
                onClick={() => void saveNote("highlight", selection)}
                className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
              >
                🖍️ Destacar
              </button>
              <button
                onClick={() => {
                  const note = prompt("Sua anotação sobre este trecho:");
                  if (note) void saveNote("note", selection, note);
                }}
                className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
              >
                📝 Anotar
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={current === 0 || loading}
            onClick={() => void loadChapter(current - 1)}
          >
            <ArrowLeft className="size-4" /> Capítulo anterior
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={loading || asking}
            onClick={() =>
              void sendQuestion(
                "Não entendi este capítulo. Explique de novo usando OUTRA abordagem: analogia, exemplo do cotidiano, passo a passo ou comparação. Seja bem simples.",
              )
            }
          >
            🤔 Não entendi
          </Button>
          <Button
            size="sm"
            disabled={current >= total - 1 || loading}
            onClick={() => void loadChapter(current + 1)}
            className="ml-auto"
          >
            Próximo capítulo <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="surface space-y-3 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" /> Estudar este capítulo
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "mapa", label: "🧠 Mapa mental" },
            { key: "resumo", label: "📝 Resumo" },
            { key: "flashcards", label: "🎴 Flashcards" },
            { key: "quiz", label: "❓ Quiz" },
            { key: "perguntas", label: "📚 Perguntas" },
            { key: "revisao", label: "⚡ Revisão rápida" },
            { key: "exemplos", label: "💡 Exemplos" },
          ].map((t) => (
            <Button
              key={t.key}
              size="sm"
              variant="outline"
              disabled={toolBusy !== "" || loading}
              onClick={() => void chapterTool(t.key as never)}
            >
              {toolBusy === t.key ? <Loader2 className="size-4 animate-spin" /> : null}
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="surface space-y-3 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <MessageCircleQuestion className="size-4 text-primary" /> Pergunte à IA sobre este conteúdo
        </h2>
        <div className="flex items-end gap-2">
          <Textarea
            rows={2}
            placeholder="Por que isso acontece? Como isso pode cair na prova?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendQuestion(question);
                setQuestion("");
              }
            }}
          />
          <Button
            disabled={asking}
            onClick={() => {
              void sendQuestion(question);
              setQuestion("");
            }}
          >
            {asking ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
        {asking ? <p className="text-sm text-muted-foreground">Pensando...</p> : null}
        {answer ? (
          <div className="rounded-xl border border-border p-4">
            <p className="mb-2 text-xs font-medium text-primary">{answer.title}</p>
            <Markdown content={answer.content} />
          </div>
        ) : null}
      </div>

      {chapterNotes.length > 0 ? (
        <div className="surface space-y-3 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <StickyNote className="size-4 text-primary" /> Minhas marcações neste capítulo
          </h2>
          <div className="space-y-2">
            {chapterNotes.map((n) => (
              <div key={n.id} className="rounded-lg border border-border p-3 text-sm">
                <Badge variant="outline" className={cn("mb-1.5 gap-1 text-[10px]")}>
                  <Highlighter className="size-3" />
                  {n.kind === "note" ? "Anotação" : n.kind === "favorite" ? "Salvo" : "Destaque"}
                </Badge>
                <p className="text-muted-foreground">“{n.excerpt}”</p>
                {n.note ? <p className="mt-1.5">{n.note}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(b.sources ?? []).length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Fontes deste livro: {(b.sources ?? []).map((s) => s.title).join(", ")}. Os arquivos originais continuam na
          Biblioteca.
        </p>
      ) : null}
    </div>
  );
}
