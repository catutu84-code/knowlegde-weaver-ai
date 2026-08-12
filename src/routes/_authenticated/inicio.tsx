import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Target,
  Network,
  Layers3,
  Bot,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/lib/auth";
import { levelFromXp } from "@/lib/library";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/inicio")({
  component: HomePage,
});

const quickActions = [
  { to: "/biblioteca", label: "Estudar matéria", icon: BookOpen },
  { to: "/quiz", label: "Fazer Quiz", icon: Target },
  { to: "/mapas", label: "Criar mapa mental", icon: Network },
  { to: "/flashcards", label: "Revisar flashcards", icon: Layers3 },
  { to: "/tutor", label: "Conversar com Tutor", icon: Bot },
] as const;

function HomePage() {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);

  const stats = useQuery({
    queryKey: ["home-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [answers, sessions, errors, subjects, recent] = await Promise.all([
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
      ]);

      const total = answers.data?.length ?? 0;
      const correct = answers.data?.filter((a) => a.is_correct).length ?? 0;
      const minutes = (sessions.data ?? []).reduce((sum, s) => sum + (s.minutes ?? 0), 0);
      return {
        total,
        accuracy: total ? Math.round((correct / total) * 100) : 0,
        minutes,
        errors: errors.data ?? [],
        subjects: subjects.data ?? [],
        last: recent.data?.[0] ?? null,
      };
    },
  });

  const level = levelFromXp(profile?.xp ?? 0);
  const goal = profile?.weekly_goal_minutes ?? 300;
  const minutes = stats.data?.minutes ?? 0;

  return (
    <div className="space-y-6">
      <section className="surface gradient-hero p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">Olá, {profile?.display_name ?? "estudante"} 👋</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">O que vamos estudar hoje?</h1>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/adicionar">
              <Plus className="size-4" /> Adicionar material
            </Link>
          </Button>
          {quickActions.map((a) => (
            <Button key={a.to} asChild size="sm" variant="outline">
              <Link to={a.to}>
                <a.icon className="size-4" /> {a.label}
              </Link>
            </Button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Flame} label="Sequência" value={`${profile?.streak ?? 0} dias`} hint={level.name} />
        <StatCard icon={CheckCircle2} label="Taxa de acertos" value={`${stats.data?.accuracy ?? 0}%`} hint={`${stats.data?.total ?? 0} questões`} />
        <StatCard icon={Clock} label="Tempo na semana" value={`${minutes} min`} hint={`meta ${goal} min`} />
        <StatCard icon={AlertTriangle} label="Para revisar" value={`${stats.data?.errors.length ?? 0}`} hint="assuntos com erros" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-5 lg:col-span-2">
          <h2 className="text-base font-semibold">Continuar estudando</h2>
          {stats.data?.last ? (
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
            <p className="mt-3 text-sm text-muted-foreground">
              Você ainda não estudou nada. Comece adicionando um material à sua biblioteca.
            </p>
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

        <div className="surface p-5">
          <h2 className="text-base font-semibold">Revisões pendentes</h2>
          {(stats.data?.errors ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nada pendente. Continue assim! 🎉</p>
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
                {minutes}/{goal} min
              </span>
            </div>
            <Progress value={Math.min(100, (minutes / goal) * 100)} className="mt-2 h-2" />
          </div>
        </div>
      </section>
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
