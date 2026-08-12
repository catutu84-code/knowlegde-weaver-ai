import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Clock, Target, TrendingUp } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/lib/auth";
import { levelFromXp } from "@/lib/library";
import { PageHeader } from "@/components/study/PageHeader";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/desempenho")({
  head: () => ({
    meta: [
      { title: "Meu desempenho — Mentor IA" },
      { name: "description", content: "Acompanhe evolução, acertos, tempo de estudo e pontos fracos." },
    ],
  }),
  component: PerformancePage,
});

function PerformancePage() {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);

  const data = useQuery({
    queryKey: ["performance", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [attempts, sessions, errors, subjects] = await Promise.all([
        supabase
          .from("quiz_attempts")
          .select("score,total,created_at")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(15),
        supabase.from("study_sessions").select("kind,minutes,created_at").eq("user_id", user!.id).limit(300),
        supabase
          .from("user_errors")
          .select("concept,times_wrong,resolved")
          .eq("user_id", user!.id)
          .order("times_wrong", { ascending: false })
          .limit(8),
        supabase.from("subjects").select("id,name").eq("user_id", user!.id),
      ]);
      return {
        attempts: attempts.data ?? [],
        sessions: sessions.data ?? [],
        errors: errors.data ?? [],
        subjects: subjects.data ?? [],
      };
    },
  });

  const attempts = data.data?.attempts ?? [];
  const sessions = data.data?.sessions ?? [];
  const totalMinutes = sessions.reduce((s, x) => s + (x.minutes ?? 0), 0);
  const totalQuestions = attempts.reduce((s, a) => s + (a.total ?? 0), 0);
  const totalCorrect = attempts.reduce((s, a) => s + (a.score ?? 0), 0);
  const accuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const level = levelFromXp(profile?.xp ?? 0);
  const nextLevel = level.next;

  const byKind = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.kind] = (acc[s.kind] ?? 0) + (s.minutes ?? 0);
    return acc;
  }, {});
  const maxKind = Math.max(1, ...Object.values(byKind));

  return (
    <div className="space-y-6">
      <PageHeader title="Meu desempenho" description="Sua evolução real, baseada em cada questão respondida." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Target} label="Taxa de acerto" value={`${accuracy}%`} hint={`${totalQuestions} questões`} />
        <Stat icon={Clock} label="Tempo total" value={`${Math.round(totalMinutes / 60)}h`} hint={`${totalMinutes} min`} />
        <Stat icon={TrendingUp} label="Nível" value={level.name} hint={`${profile?.xp ?? 0} XP`} />
        <Stat icon={BarChart3} label="Sessões" value={String(sessions.length)} hint="atividades registradas" />
      </div>

      {nextLevel ? (
        <div className="surface p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progresso para o próximo nível</span>
            <span>
              {profile?.xp ?? 0}/{nextLevel} XP
            </span>
          </div>
          <Progress
            className="mt-2 h-2"
            value={Math.min(
              100,
              (((profile?.xp ?? 0) - level.min) / (nextLevel - level.min)) * 100,
            )}
          />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-sm font-semibold">Últimas tentativas</h2>
          {attempts.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nenhuma tentativa registrada.</p>
          ) : (
            <div className="mt-4 flex h-40 items-end gap-2">
              {attempts
                .slice()
                .reverse()
                .map((a, i) => {
                  const pct = a.total ? Math.round(((a.score ?? 0) / a.total) * 100) : 0;
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-primary/70"
                        style={{ height: `${Math.max(4, pct)}%` }}
                        title={`${pct}%`}
                      />
                      <span className="text-[10px] text-muted-foreground">{pct}%</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="surface p-5">
          <h2 className="text-sm font-semibold">Tempo por tipo de estudo</h2>
          <div className="mt-4 space-y-3">
            {Object.keys(byKind).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : (
              Object.entries(byKind).map(([kind, minutes]) => (
                <div key={kind}>
                  <div className="flex justify-between text-xs">
                    <span className="capitalize">{kind}</span>
                    <span className="text-muted-foreground">{minutes} min</span>
                  </div>
                  <Progress className="mt-1 h-2" value={(minutes / maxKind) * 100} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="surface p-5">
        <h2 className="text-sm font-semibold">Pontos fracos</h2>
        {(data.data?.errors ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhum ponto fraco identificado ainda.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.data?.errors.map((e, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className={e.resolved ? "text-muted-foreground line-through" : ""}>{e.concept}</span>
                <span className="text-xs text-destructive">{e.times_wrong}x</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
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
        <Icon className="size-4 text-primary" /> {label}
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
