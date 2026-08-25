import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Bot, Loader2, Send, User } from "lucide-react";
import { toast } from "sonner";

import { askTutor } from "@/lib/ai.functions";
import { PageHeader } from "@/components/study/PageHeader";
import { Markdown } from "@/components/study/Markdown";
import { ScopePicker, emptyScope, type StudyScope } from "@/components/study/ScopePicker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({
    meta: [
      { title: "Tutor IA — Tutor IA Catoala" },
      { name: "description", content: "Tire dúvidas em conversa, sempre com base nos seus materiais." },
    ],
  }),
  component: TutorPage,
});

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explique de forma simples",
  "Explique como uma fofoca",
  "Transforme em resumo",
  "Crie um mapa mental",
  "Crie um quiz",
  "Crie flashcards",
  "Me guie por onde começar",
  "Quais são os pontos que mais caem em prova?",
];

function TutorPage() {
  const ask = useServerFn(askTutor);
  const [scope, setScope] = useState<StudyScope>({ ...emptyScope, scope: "selected" });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(question: string) {
    if (!question.trim() || busy) return;
    const history = messages;
    setMessages([...history, { role: "user", content: question }]);
    setInput("");
    setBusy(true);
    try {
      const result = await ask({
        data: {
          question,
          scope: scope.scope,
          materialIds: scope.materialIds,
          subjectId: scope.subjectId,
          topicId: scope.topicId,
          history,
        },
      });
      setMessages((prev) => [...prev, { role: "assistant", content: result.content }]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "O tutor não conseguiu responder agora.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Tutor IA" description="Converse sobre o conteúdo. As respostas usam apenas os seus materiais." />

      <details className="surface p-4">
        <summary className="cursor-pointer text-sm font-medium">Materiais usados nesta conversa</summary>
        <div className="mt-4">
          <ScopePicker value={scope} onChange={setScope} />
        </div>
      </details>

      <div className="surface flex min-h-[50vh] flex-col p-4">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="py-10 text-center">
              <Bot className="mx-auto size-8 text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Pergunte qualquer coisa sobre o seu conteúdo.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors duration-200 hover:border-primary hover:bg-blush-soft hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end gap-2" : "flex gap-2.5"}
              >
                {m.role === "assistant" ? (
                  <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-blush-soft">
                    <Bot className="size-4 text-primary" />
                  </span>
                ) : null}
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-sky px-3.5 py-2.5 text-sm text-foreground"
                      : "min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2.5"
                  }
                >
                  {m.role === "user" ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <Markdown content={m.content} />
                  )}
                </div>
                {m.role === "user" ? (
                  <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <User className="size-4 text-muted-foreground" />
                  </span>
                ) : null}
              </div>
            ))
          )}
          {busy ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" /> O Tutor IA está analisando seus materiais...
            </p>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="mt-4 flex items-end gap-2 border-t border-border pt-3">
          <Textarea
            rows={2}
            placeholder="Escreva sua dúvida..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
          />
          <Button onClick={() => send(input)} disabled={busy}>
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
