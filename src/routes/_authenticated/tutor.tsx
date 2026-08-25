import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Copy,
  GraduationCap,
  Loader2,
  Save,
  Send,
  Sparkles,
  User,
  Volume2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { askTutor } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import {
  DEFAULT_PREFS,
  LENGTH_LABEL,
  LEVEL_LABEL,
  SOURCE_MODES,
  TEACH_MODES,
  normalizePrefs,
  type TeachLength,
  type TeachLevel,
  type TeachModeId,
  type TeachPrefs,
  type SourceMode,
} from "@/lib/teach-modes";
import { PageHeader } from "@/components/study/PageHeader";
import { Markdown } from "@/components/study/Markdown";
import { ScopePicker, emptyScope, type StudyScope } from "@/components/study/ScopePicker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({
    meta: [
      { title: "Professora Catoala — Tutor IA Catoala" },
      {
        name: "description",
        content:
          "Sua professora particular de IA: explica no seu ritmo, com seus materiais ou com conhecimento geral, em 18 modos de explicação.",
      },
      { property: "og:title", content: "Professora Catoala — Tutor IA Catoala" },
      {
        property: "og:description",
        content: "Aprenda com uma professora que ensina passo a passo, adapta a linguagem e testa seu conhecimento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TutorPage,
});

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Me guie por onde começar",
  "Quais são os pontos que mais caem em prova?",
  "Explique o assunto principal dos meus materiais",
  "Crie 3 perguntas para testar meu conhecimento",
  "Corrija a ortografia do texto que eu vou colar",
];

const FOLLOW_UPS = [
  { label: "Explique de outro jeito", prompt: "Explique isso de outro jeito, com uma abordagem diferente da anterior." },
  { label: "Deixe mais simples", prompt: "Explique isso de novo, bem mais simples, como se eu nunca tivesse visto o assunto." },
  { label: "Aprofunde", prompt: "Aprofunde essa explicação, com mais detalhes, nuances e termos técnicos corretos." },
  { label: "Dê um exemplo", prompt: "Dê um exemplo concreto e comentado sobre isso." },
  { label: "Faça uma analogia", prompt: "Faça uma analogia do cotidiano para isso e depois traga a linguagem técnica." },
  { label: "Transforme em resumo", prompt: "Transforme sua última explicação em um resumo organizado em tópicos." },
  { label: "Teste meu conhecimento", prompt: "Crie 3 perguntas sobre isso para testar meu conhecimento e espere minhas respostas." },
];

function usePrefs(userId: string | undefined) {
  return useQuery({
    queryKey: ["teach-prefs", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("teach_prefs")
        .eq("user_id", userId!)
        .maybeSingle();
      return normalizePrefs((data as { teach_prefs?: unknown } | null)?.teach_prefs);
    },
  });
}

function TutorPage() {
  const ask = useServerFn(askTutor);
  const { user } = useSession();
  const stored = usePrefs(user?.id);

  const [prefs, setPrefs] = useState<TeachPrefs>(DEFAULT_PREFS);
  const [scope, setScope] = useState<StudyScope>({ ...emptyScope, scope: "selected" });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastSources, setLastSources] = useState<Array<{ id: string; title: string }>>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (stored.data && !loadedRef.current) {
      loadedRef.current = true;
      setPrefs(stored.data);
    }
  }, [stored.data]);

  function update(patch: Partial<TeachPrefs>) {
    setPrefs((prev) => ({ ...prev, ...patch }));
  }

  async function saveAsDefault() {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ teach_prefs: prefs as unknown as never })
      .eq("user_id", user.id);
    if (error) toast.error("Não consegui salvar suas preferências.");
    else toast.success("Preferências salvas como padrão da sua conta.");
  }

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
          courseId: scope.courseId,
          history,
          prefs,
        },
      });
      setMessages((prev) => [...prev, { role: "assistant", content: result.content }]);
      setLastSources(result.sources ?? []);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "A professora não conseguiu responder agora.");
    }
    setBusy(false);
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Seu navegador não suporta leitura em voz alta.");
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/[#*`_>]/g, ""));
    utter.lang = "pt-BR";
    window.speechSynthesis.speak(utter);
  }

  async function saveToLibrary(content: string) {
    if (!user) return;
    const { error } = await supabase.from("ai_outputs").insert({
      user_id: user.id,
      subject_id: scope.subjectId,
      topic_id: scope.topicId,
      kind: "explicacao",
      mode: prefs.mode,
      title: content.replace(/[#*]/g, "").trim().slice(0, 70) || "Explicação da Professora Catoala",
      content,
      sources: lastSources as unknown as never,
    });
    if (error) toast.error("Não consegui salvar na biblioteca.");
    else toast.success("Salvo na sua biblioteca.");
  }

  async function addToErrorBook(index: number) {
    if (!user) return;
    const question = messages[index - 1]?.content ?? "Dúvida da conversa";
    const answer = messages[index]?.content ?? "";
    const { error } = await supabase.from("user_errors").insert({
      user_id: user.id,
      subject_id: scope.subjectId,
      topic_id: scope.topicId,
      concept: question.slice(0, 80),
      question,
      correct_answer: answer.slice(0, 4000),
      explanation: "Registrado a partir da conversa com a Professora Catoala.",
    });
    if (error) toast.error("Não consegui adicionar ao caderno de erros.");
    else toast.success("Adicionado ao caderno de erros.");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Professora Catoala"
        description="Sua professora particular: escolhe a fonte, o modo de explicação e ensina no seu ritmo."
      />

      <div className="surface space-y-4 p-4">
        <div>
          <Label className="text-xs">De onde vem a resposta</Label>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {SOURCE_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => update({ sourceMode: m.id as SourceMode })}
                className={cn(
                  "rounded-xl border p-3 text-left text-sm transition-colors duration-200",
                  prefs.sourceMode === m.id
                    ? "border-primary bg-blush-soft text-foreground"
                    : "border-border bg-card hover:border-primary/50",
                )}
              >
                <span className="font-medium">{m.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{m.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs">Modo de explicação</Label>
            <Select value={prefs.mode} onValueChange={(v) => update({ mode: v as TeachModeId })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEACH_MODES.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tamanho</Label>
            <Select value={prefs.length} onValueChange={(v) => update({ length: v as TeachLength })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LENGTH_LABEL).map(([id, label]) => (
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Profundidade</Label>
            <Select value={prefs.level} onValueChange={(v) => update({ level: v as TeachLevel })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEVEL_LABEL).map(([id, label]) => (
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {prefs.mode === "personalizado" ? (
          <div>
            <Label className="text-xs">Como você quer receber a explicação?</Label>
            <Input
              className="mt-1.5"
              placeholder="Ex.: explique como se eu fosse enfermeira e precisasse aplicar isso no plantão"
              value={prefs.customStyle}
              onChange={(e) => update({ customStyle: e.target.value })}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={prefs.examples} onCheckedChange={(v) => update({ examples: v })} /> Com exemplos
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={prefs.checkQuestions} onCheckedChange={(v) => update({ checkQuestions: v })} /> Perguntas de
            checagem
          </label>
          <Button size="sm" variant="outline" onClick={saveAsDefault} className="ml-auto">
            <Save className="size-4" /> Salvar como padrão
          </Button>
        </div>
      </div>

      {prefs.sourceMode !== "general" ? (
        <details className="surface p-4">
          <summary className="cursor-pointer text-sm font-medium">Materiais usados nesta conversa</summary>
          <div className="mt-4">
            <ScopePicker value={scope} onChange={setScope} />
          </div>
        </details>
      ) : null}

      <div className="surface flex min-h-[50vh] flex-col p-4">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="py-10 text-center">
              <GraduationCap className="mx-auto size-8 text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                Pode perguntar qualquer coisa — do conteúdo dos seus arquivos a dúvidas gerais.
              </p>
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
              <div key={i} className={m.role === "user" ? "flex justify-end gap-2" : "flex gap-2.5"}>
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
                    <>
                      <Markdown content={m.content} />
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-2.5">
                        {FOLLOW_UPS.map((f) => (
                          <button
                            key={f.label}
                            disabled={busy}
                            onClick={() => send(f.prompt)}
                            className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-200 hover:border-primary hover:bg-blush-soft hover:text-primary disabled:opacity-50"
                          >
                            {f.label}
                          </button>
                        ))}
                        <button
                          onClick={() => addToErrorBook(i)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
                        >
                          <XCircle className="size-3" /> Caderno de erros
                        </button>
                        <button
                          onClick={() => speak(m.content)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
                        >
                          <Volume2 className="size-3" /> Ouvir
                        </button>
                        <button
                          onClick={() => saveToLibrary(m.content)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
                        >
                          <Sparkles className="size-3" /> Salvar
                        </button>
                        <button
                          onClick={() => {
                            void navigator.clipboard.writeText(m.content);
                            toast.success("Copiado.");
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
                        >
                          <Copy className="size-3" /> Copiar
                        </button>
                      </div>
                    </>
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
              <Loader2 className="size-4 animate-spin text-primary" /> A Professora Catoala está pensando na melhor
              explicação...
            </p>
          ) : null}
          <div ref={endRef} />
        </div>

        {lastSources.length > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Fontes usadas: {lastSources.map((s) => s.title).join(" · ")}
          </p>
        ) : null}

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
