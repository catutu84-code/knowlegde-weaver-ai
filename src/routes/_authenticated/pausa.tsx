import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Heart, Loader2, LifeBuoy, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { savePauseEntry, talkToPause } from "@/lib/pause.functions";
import { PageHeader } from "@/components/study/PageHeader";
import { Markdown } from "@/components/study/Markdown";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pausa")({
  head: () => ({
    meta: [
      { title: "Pausa Catoala — Tutor IA Catoala" },
      {
        name: "description",
        content: "Um espaço de acolhimento para ansiedade de prova, cansaço e falta de motivação nos estudos.",
      },
      { property: "og:title", content: "Pausa Catoala — respire antes de continuar" },
      { property: "og:description", content: "Acolhimento estudantil com escuta, respiração guiada e diário." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PausaPage,
});

const MOODS = ["Ansiosa", "Cansada", "Travada", "Triste", "Sobrecarregada", "Tranquila"];

const QUICK = [
  "Estou ansiosa com a prova",
  "Não consigo começar a estudar",
  "Estou me comparando com todo mundo",
  "Estou exausta",
  "Tenho medo de reprovar",
];

type Message = { role: "user" | "assistant"; content: string };

function PausaPage() {
  const { user } = useSession();
  const talk = useServerFn(talkToPause);
  const saveEntry = useServerFn(savePauseEntry);
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [journal, setJournal] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const consent = useQuery({
    queryKey: ["pause-consent", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("pause_consent")
        .select("consented_at,keep_journal")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data ?? null;
    },
  });

  const entries = useQuery({
    queryKey: ["pause-journal", user?.id],
    enabled: !!user && !!consent.data?.keep_journal,
    queryFn: async () => {
      const { data } = await supabase
        .from("pause_journal")
        .select("id,entry,mood,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);

  async function accept(keepJournal: boolean) {
    if (!user) return;
    const { error } = await supabase.from("pause_consent").upsert(
      { user_id: user.id, consented_at: new Date().toISOString(), keep_journal: keepJournal },
      { onConflict: "user_id" },
    );
    if (error) toast.error("Não consegui salvar sua escolha.");
    else void queryClient.invalidateQueries({ queryKey: ["pause-consent", user.id] });
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const history = messages;
    setMessages([...history, { role: "user", content: text }]);
    setInput("");
    setBusy(true);
    try {
      const result = await talk({
        data: { message: text, mood: mood ?? undefined, history },
      });
      setMessages((prev) => [...prev, { role: "assistant", content: result.content }]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não consegui responder agora.");
    }
    setBusy(false);
  }

  if (consent.isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Abrindo seu espaço...
      </p>
    );
  }

  if (!consent.data?.consented_at) {
    return (
      <div className="space-y-5">
        <PageHeader title="Pausa Catoala" description="Um espaço para respirar quando o estudo pesa." />
        <section className="surface space-y-4 p-6">
          <Heart className="size-6 text-primary" />
          <h2 className="text-lg font-semibold">Antes de começarmos</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Este espaço é de escuta e acolhimento — não é atendimento psicológico nem serviço de emergência.</li>
            <li>• A Catoala não faz diagnóstico, não indica medicação e não substitui profissional de saúde.</li>
            <li>• Em situações de risco, ela vai te mostrar canais de ajuda imediata como o CVV (188).</li>
            <li>• Suas conversas não são compartilhadas com ninguém. O diário só existe se você quiser.</li>
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => accept(true)}>Entendi, quero entrar e manter um diário</Button>
            <Button variant="outline" onClick={() => accept(false)}>
              Entrar sem salvar diário
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Pausa Catoala" description="Respire. Aqui a gente cuida de você antes do conteúdo." />

      <section className="surface p-4">
        <p className="text-sm font-medium">Como você está agora?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(mood === m ? null : m)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                mood === m ? "border-primary bg-blush-soft text-primary" : "border-border hover:border-primary/50",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      <div className="surface flex min-h-[45vh] flex-col p-4">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="py-8 text-center">
              <Heart className="mx-auto size-7 text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                Me conta o que está pesando. Sem cobrança, sem julgamento.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-sky px-3.5 py-2.5 text-sm"
                      : "min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2.5"
                  }
                >
                  {m.role === "user" ? <p className="whitespace-pre-wrap">{m.content}</p> : <Markdown content={m.content} />}
                </div>
              </div>
            ))
          )}
          {busy ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" /> A Catoala está aqui, pensando com carinho...
            </p>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="mt-4 flex items-end gap-2 border-t border-border pt-3">
          <Textarea
            rows={2}
            placeholder="Escreva o que está sentindo..."
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

      <section className="surface space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Meu diário</h2>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Guardar anotações
            <Switch
              checked={!!consent.data?.keep_journal}
              onCheckedChange={async (v) => {
                if (!user) return;
                await supabase.from("pause_consent").update({ keep_journal: v }).eq("user_id", user.id);
                void queryClient.invalidateQueries({ queryKey: ["pause-consent", user.id] });
              }}
            />
          </label>
        </div>
        {consent.data?.keep_journal ? (
          <>
            <Textarea
              rows={3}
              placeholder="Escreva livremente. Só você lê isto."
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
            />
            <Button
              size="sm"
              onClick={async () => {
                if (!journal.trim()) return;
                await saveEntry({ data: { entry: journal.trim(), mood: mood ?? undefined } });
                setJournal("");
                void entries.refetch();
                toast.success("Anotação guardada.");
              }}
            >
              Salvar anotação
            </Button>
            <ul className="space-y-2">
              {entries.data?.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                  <div className="min-w-0">
                    <p className="whitespace-pre-wrap">{e.entry}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {e.mood ? `${e.mood} · ` : ""}
                      {new Date(e.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      await supabase.from("pause_journal").delete().eq("id", e.id);
                      void entries.refetch();
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">O diário está desligado. Nada é salvo das suas conversas.</p>
        )}
      </section>

      <section className="surface space-y-2 p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <LifeBuoy className="size-4 text-primary" /> Preciso de ajuda agora
        </h2>
        <p className="text-sm text-muted-foreground">
          A Pausa Catoala não é serviço de emergência. Se estiver em sofrimento intenso, fale com quem pode ajudar de
          verdade:
        </p>
        <ul className="text-sm">
          <li>
            <strong>CVV — 188</strong> · gratuito, 24 horas ·{" "}
            <a className="text-primary underline" href="https://www.cvv.org.br" target="_blank" rel="noreferrer">
              cvv.org.br
            </a>
          </li>
          <li>
            <strong>SAMU — 192</strong> · <strong>Emergência — 190</strong>
          </li>
          <li>CAPS do seu município · atendimento gratuito em saúde mental</li>
        </ul>
      </section>
    </div>
  );
}
