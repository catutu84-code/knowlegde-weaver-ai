import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  BookOpen,
  Target,
  Network,
  Layers3,
  Bot,
  Flame,
  Clock,
  CalendarClock,
  AlertTriangle,
  Plus,
  Timer,
  PlayCircle,
  Wand2,
  Loader2,
  Upload,
  Brain,
  MessageCircle,
  RefreshCw,
  HelpCircle,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/lib/auth";
import { levelFromXp } from "@/lib/library";
import { useExams, useRhythm, rhythmStatus, dailyMessage } from "@/lib/rhythm";
import { suggestActivity } from "@/lib/coach.functions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Cato, CatoMessage, CATO_LINES } from "@/components/brand/Cato";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Hoje — Tutor IA Catoala" },
      {
        name: "description",
        content: "Sua tela do dia: meta, revisões, leitura em andamento e a próxima atividade sugerida pela IA.",
      },
      { property: "og:title", content: "Hoje — Tutor IA Catoala" },
      { property: "og:description", content: "Meta diária, ritmo de estudo e o próximo passo certo para você." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

const quickActions = [
  { to: "/adicionar", label: "Enviar material", icon: Upload },
  { to: "/livro", label: "Criar livro", icon: BookOpen },
  { to: "/estudio", label: "Explicar conteúdo", icon: Brain },
  { to: "/quiz", label: "Criar questões", icon: Target },
  { to: "/flashcards", label: "Criar flashcards", icon: Layers3 },
  { to: "/simulados", label: "Criar simulado", icon: GraduationCap },
  { to: "/tutor", label: "Conversar com o Tutor", icon: MessageCircle },
] as const;

const learnWays = [
  { to: "/tutor", label: "Quero entender", hint: "Receba uma explicação no seu jeito", icon: Brain },
  { to: "/livro", label: "Quero estudar", hint: "Leia seu conteúdo como um livro", icon: BookOpen },
  { to: "/quiz", label: "Quero testar", hint: "Responda questões comentadas", icon: Target },
  { to: "/flashcards", label: "Quero memorizar", hint: "Revise com cartões inteligentes", icon: Layers3 },
  { to: "/revisoes", label: "Quero revisar", hint: "Priorize o que precisa de atenção", icon: RefreshCw },
  { to: "/tutor", label: "Quero conversar", hint: "Tire dúvidas com a Professora Catoala", icon: Bot },
] as const;

const START_OPTIONS = [
  { id: "material", label: "Tenho um material" },
  { id: "dificuldade", label: "Tenho dificuldade em um assunto" },
  { id: "prova", label: "Tenho uma prova chegando" },
  { id: "tempo", label: "Tenho pouco tempo" },
  { id: "perdido", label: "Estou completamente perdido" },
] as const;

const ACTION_LINK: Record<string, string> = {
  quiz: "/quiz",
  flashcards: "/flashcards",
  revisao: "/revisoes",
  livro: "/livro",
  resumo: "/estudio",
  mapa: "/mapas",
  tutor: "/tutor",
};

function HomePage() {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const rhythm = useRhythm(user?.id);
  const exams = useExams(user?.id);
  const navigate = useNavigate();
  const suggest = useServerFn(suggestActivity);
  const [suggestion, setSuggestion] = useState<{ titulo: string; motivo: string; acao: string; mensagem: string } | null>(
    null,
  );
  const [thinking, setThinking] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideSituation, setGuideSituation] = useState("");
  const [guideMinutes, setGuideMinutes] = useState("20");

  const stats = useQuery({
    queryKey: ["home-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const today = new Date().toISOString().slice(0, 10);
      const [answers, sessions, errors, subjects, recent, book, todaySessions] = await Promise.all([
        supabase.from("quiz_answers").select("is_correct").eq("user_id", user!.id),
        supabase.from("study_sessions").select("minutes,created_at").eq("user_id", user!.id).gte("created_at", weekAgo),
        supabase
          .from("user_errors")
          .select("concept,times_wrong")
          .eq("user_id", user!.id)
          .eq("resolved", false)
          .order("times_wrong", { ascending: false })
          .limit(4),
        supabase.from("subjects").select("id,name").eq("user_id", user!.id).limit(6),
        supabase
          .from("study_sessions")
          .select("detail,kind,created_at,subject_id")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("books")
          .select("id,title,reading_progress,generation_status,current_chapter,outline,updated_at")
          .eq("user_id", user!.id)
          .order("updated_at", { ascending: false })
          .limit(3),
        supabase
          .from("study_sessions")
          .select("minutes")
          .eq("user_id", user!.id)
          .gte("created_at", `${today}T00:00:00.000Z`),
      ]);

      const total = answers.data?.length ?? 0;
      const correct = answers.data?.filter((a) => a.is_correct).length ?? 0;
      const minutes = (sessions.data ?? []).reduce((sum, s) => sum + (s.minutes ?? 0), 0);
      const todayMinutes = (todaySessions.data ?? []).reduce((sum, s) => sum + (s.minutes ?? 0), 0);
      return {
        total,
        accuracy: total ? Math.round((correct / total) * 100) : 0,
        minutes,
        todayMinutes,
        errors: errors.data ?? [],
        subjects: subjects.data ?? [],
        last: recent.data?.[0] ?? null,
        books: book.data ?? [],
      };
    },
  });

  const level = levelFromXp(profile?.xp ?? 0);
  const dailyGoal = rhythm.data?.minutes_per_day ?? 30;
  const weeklyGoal = rhythm.data ? rhythm.data.minutes_per_day * rhythm.data.days_per_week : (profile?.weekly_goal_minutes ?? 300);
  const minutes = stats.data?.minutes ?? 0;
  const todayMinutes = stats.data?.todayMinutes ?? 0;
  const status = rhythmStatus(minutes, weeklyGoal);
  const nextExam = exams.data?.[0] ?? null;
  const nextSubject = rhythm.data?.subjects?.[0] ?? stats.data?.subjects?.[0]?.name ?? null;
  const books = stats.data?.books ?? [];
  const book = books[0] ?? null;

  async function askCoach(minutesWanted: number, situation?: string) {
    setThinking(true);
    try {
      const result = await suggest({
        data: {
          minutes: minutesWanted,
          ...(situation ? { situation } : {}),
          ...(nextSubject ? { focus: nextSubject } : {}),
        },
      });
      setSuggestion(result);
      setGuideOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não consegui sugerir uma atividade agora.");
    }
    setThinking(false);
  }

  function continueWhereLeft() {
    if (book && Number(book.reading_progress ?? 0) > 0 && book.generation_status === "ready") {
      void navigate({ to: "/livro/$bookId", params: { bookId: book.id as string } });
      return;
    }
    const kind = stats.data?.last?.kind;
    void navigate({ to: (kind && ACTION_LINK[kind]) || "/biblioteca" });
  }

  return (
    <div className="space-y-6">
      <section className="surface gradient-hero overflow-hidden p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              Olá, {profile?.display_name ?? "estudante"} — {dailyMessage(user?.id ?? "catoala")}
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">O que vamos aprender hoje?</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Envie seu material ou escolha uma forma de estudar. O Catoala transforma seu conteúdo em uma experiência de aprendizagem personalizada.
            </p>
          </div>
          <Cato variant={todayMinutes >= dailyGoal ? "comemorando" : "padrao"} size="lg" className="-mb-5 hidden sm:block" />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card/70 p-4">
            <p className="text-xs text-muted-foreground">Meta de hoje</p>
            <p className="mt-1 text-lg font-semibold">
              {todayMinutes}/{dailyGoal} min
            </p>
            <Progress value={Math.min(100, (todayMinutes / Math.max(1, dailyGoal)) * 100)} className="mt-2 h-1.5" />
          </div>
          <div className="rounded-xl border border-border bg-card/70 p-4">
            <p className="text-xs text-muted-foreground">Próxima matéria</p>
            <p className="mt-1 text-lg font-semibold">{nextSubject ?? "A definir"}</p>
            <p className="text-xs text-muted-foreground">
              {rhythm.data?.goal ? rhythm.data.goal : "Defina seu objetivo em Meu Ritmo"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card/70 p-4">
            <p className="text-xs text-muted-foreground">Próxima prova</p>
            <p className="mt-1 text-lg font-semibold">{nextExam ? nextExam.title : "Nenhuma marcada"}</p>
            <p className="text-xs text-muted-foreground">
              {nextExam ? new Date(`${nextExam.exam_date}T12:00:00`).toLocaleDateString("pt-BR") : "Cadastre em Meu Ritmo"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => askCoach(10)} disabled={thinking}>
            {thinking ? <Loader2 className="size-4 animate-spin" /> : <Timer className="size-4" />} Sessão de 10 minutos
          </Button>
          <Button size="sm" variant="outline" onClick={continueWhereLeft}>
            <PlayCircle className="size-4" /> Continuar de onde parei
          </Button>
          <Button size="sm" variant="outline" onClick={() => setGuideOpen(true)} disabled={thinking}>
            <HelpCircle className="size-4" /> Não sei por onde começar
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/adicionar">
              <Plus className="size-4" /> Adicionar material
            </Link>
          </Button>
        </div>

        {suggestion ? (
          <div className="mt-4 rounded-xl border border-primary/40 bg-card p-4">
            <p className="text-sm font-semibold">{suggestion.titulo}</p>
            <p className="mt-1 text-sm text-muted-foreground">{suggestion.motivo}</p>
            <p className="mt-2 text-xs text-primary">{suggestion.mensagem}</p>
            <Button asChild size="sm" className="mt-3">
              <Link to={ACTION_LINK[suggestion.acao] ?? "/tutor"}>Começar agora</Link>
            </Button>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <Button key={a.to} asChild size="sm" variant="ghost" className="border border-border bg-card/60">
              <Link to={a.to}>
                <a.icon className="size-4" /> {a.label}
              </Link>
            </Button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-base font-semibold">Como você quer estudar hoje?</h2>
          <p className="text-sm text-muted-foreground">Escolha seu objetivo; o conteúdo continua conectado à sua jornada.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {learnWays.map((item) => (
            <Link key={item.label} to={item.to} className="surface card-hover flex min-w-0 items-start gap-3 p-4">
              <span className="surface-soft grid size-10 shrink-0 place-items-center"><item.icon className="size-5 text-primary" /></span>
              <span className="min-w-0"><span className="block text-sm font-semibold">{item.label}</span><span className="block text-xs text-muted-foreground">{item.hint}</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Flame} label="Sequência" value={`${profile?.streak ?? 0} dias`} hint={level.name} />
        <StatCard icon={Clock} label="Tempo na semana" value={`${minutes} min`} hint={`meta ${weeklyGoal} min`} />
        <StatCard icon={CalendarClock} label="Ritmo atual" value={status.label} hint={`${stats.data?.accuracy ?? 0}% de acertos`} />
        <StatCard icon={AlertTriangle} label="Para revisar" value={`${stats.data?.errors.length ?? 0}`} hint="assuntos com erros" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="surface min-w-0 p-5 lg:col-span-2">
          <h2 className="text-base font-semibold">Continuar estudando</h2>
          {books.some((item) => item.generation_status === "ready") ? (
            <div className="mt-3 space-y-3">
              {books.filter((item) => item.generation_status === "ready").map((item) => {
                const outline = (item.outline ?? []) as Array<{ title?: string }>;
                const chapter = outline[item.current_chapter ?? 0]?.title;
                return <div key={item.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{chapter ? `Capítulo ${Number(item.current_chapter) + 1} — ${chapter}` : "Livro pronto para leitura"}</p></div>
                    <span className="text-xs text-muted-foreground">Acessado {new Date(item.updated_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <Progress value={Number(item.reading_progress ?? 0)} className="mt-2 h-1.5" />
                  <div className="mt-2 flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{Math.round(Number(item.reading_progress ?? 0))}% concluído</span><Button asChild size="sm" variant="outline"><Link to="/livro/$bookId" params={{ bookId: item.id as string }}>Continuar</Link></Button></div>
                </div>;
              })}
            </div>
          ) : stats.data?.last ? (
            <div className="mt-3 rounded-lg border border-border p-4">
              <p className="text-sm font-medium">{stats.data.last.detail ?? "Sessão de estudo"}</p>
              <p className="text-xs text-muted-foreground">
                {stats.data.last.kind} · {new Date(stats.data.last.created_at).toLocaleDateString("pt-BR")}
              </p>
              <Button asChild size="sm" variant="outline" className="mt-3">
                <Link to="/biblioteca">Abrir biblioteca</Link>
              </Button>
            </div>
          ) : (
            <CatoMessage
              className="mt-3"
              variant="incentivando"
              message="Você ainda não começou nenhum conteúdo. Envie seu primeiro material e vamos começar."
            ><Button asChild size="sm"><Link to="/adicionar">Começar agora</Link></Button></CatoMessage>
          )}

          <h3 className="mt-6 text-sm font-semibold">Minhas matérias</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {(stats.data?.subjects ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma matéria criada ainda.</p>
            ) : (
              stats.data?.subjects.map((s) => (
                <Link
                  key={s.id}
                  to="/biblioteca"
                  className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary"
                >
                  {s.name}
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="surface min-w-0 p-5">
          <h2 className="text-base font-semibold">Para revisar</h2>
          {(stats.data?.errors ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nada pendente. Continue assim!</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {stats.data?.errors.map((e, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">{e.concept}</span>
                  <span className="shrink-0 text-xs text-destructive">{e.times_wrong} erros</span>
                </li>
              ))}
            </ul>
          )}
          <Button asChild size="sm" variant="outline" className="mt-4 w-full">
            <Link to="/revisoes">Revisar meus erros</Link>
          </Button>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Meta semanal</span>
              <span>
                {minutes}/{weeklyGoal} min
              </span>
            </div>
            <Progress value={Math.min(100, (minutes / Math.max(1, weeklyGoal)) * 100)} className="mt-2 h-2" />
            {!rhythm.data?.onboarded ? (
              <Button asChild size="sm" className="mt-4 w-full">
                <Link to="/ritmo">Configurar Meu Ritmo</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vamos encontrar seu próximo passo</DialogTitle><DialogDescription>Escolha o que mais parece com seu momento. A sugestão usa seu histórico real.</DialogDescription></DialogHeader>
          <div className="grid gap-2">
            {START_OPTIONS.map((option) => <Button key={option.id} type="button" variant={guideSituation === option.id ? "default" : "outline"} className="h-auto justify-start whitespace-normal py-3 text-left" onClick={() => setGuideSituation(option.id)}>{option.label}</Button>)}
          </div>
          <div><label className="text-xs font-medium" htmlFor="guide-minutes">Quanto tempo você tem?</label><select id="guide-minutes" value={guideMinutes} onChange={(event) => setGuideMinutes(event.target.value)} className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="10">10 minutos</option><option value="20">20 minutos</option><option value="30">30 minutos</option><option value="45">45 minutos</option></select></div>
          <Button disabled={!guideSituation || thinking} onClick={() => void askCoach(Number(guideMinutes), guideSituation)}>{thinking ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}Montar meu caminho</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="surface p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-4 text-primary" />
        {label}
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
