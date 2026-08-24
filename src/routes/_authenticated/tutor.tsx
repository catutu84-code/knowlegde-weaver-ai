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
  "Explique esse conteúdo de forma bem simples",
  "Quais são os pontos que mais caem em prova?",
  "Me dê um exemplo prático disso",
  "Qual a diferença entre os conceitos principais?",
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
                    className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1 shrink-0">
                  {m.role === "user" ? (
                    <User className="size-4 text-muted-foreground" />
                  ) : (
                    <Bot className="size-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {m.role === "user" ? (
                    <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                  ) : (
                    <Markdown content={m.content} />
                  )}
                </div>
              </div>
            ))
          )}
          {busy ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Pensando...
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
