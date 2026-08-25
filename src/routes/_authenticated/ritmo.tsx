import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Bell, BellOff, CalendarPlus, Check, Loader2, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { ACHIEVEMENTS, DEFAULT_RHYTHM, useExams, useRhythm, type Rhythm } from "@/lib/rhythm";
import { sendTestNotification, syncMyNotifications } from "@/lib/notifications.functions";
import { disablePush, enablePush, pushPermission, registerServiceWorker } from "@/lib/push";
import { PageHeader } from "@/components/study/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ritmo")({
  head: () => ({
    meta: [
      { title: "Meu Ritmo — Tutor IA Catoala" },
      {
        name: "description",
        content: "Defina objetivo, dias, tempo diário, provas e lembretes de estudo no seu ritmo.",
      },
      { property: "og:title", content: "Meu Ritmo — Tutor IA Catoala" },
      { property: "og:description", content: "Hábito de estudo com lembretes gentis, no seu horário." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RitmoPage,
});

const TIMES = ["Manhã", "Tarde", "Noite", "Madrugada"];

function RitmoPage() {
  const { user } = useSession();
  const rhythm = useRhythm(user?.id);
  const exams = useExams(user?.id);
  const queryClient = useQueryClient();
  const test = useServerFn(sendTestNotification);
  const sync = useServerFn(syncMyNotifications);

  const [form, setForm] = useState<Omit<Rhythm, "id" | "user_id">>(DEFAULT_RHYTHM);
  const [saving, setSaving] = useState(false);
  const [permission, setPermission] = useState(pushPermission());
  const [examTitle, setExamTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const loaded = useState({ done: false })[0];

  useEffect(() => {
    void registerServiceWorker();
    setPermission(pushPermission());
  }, []);

  useEffect(() => {
    if (rhythm.data && !loaded.done) {
      loaded.done = true;
      const { id: _id, user_id: _userId, ...rest } = rhythm.data;
      setForm({
        ...DEFAULT_RHYTHM,
        ...rest,
        timezone: rest.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
  }, [rhythm.data, loaded]);

  const achievements = useQuery({
    queryKey: ["achievements", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("achievements").select("code").eq("user_id", user!.id);
      return (data ?? []).map((a) => a.code as string);
    },
  });

  const notificationsList = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id,title,body,link,created_at,read_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  function patch(next: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  async function save(extra?: Partial<typeof form>) {
    if (!user) return;
    setSaving(true);
    const payload = {
      ...form,
      ...extra,
      onboarded: true,
      user_id: user.id,
      timezone: form.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    const { error } = await supabase.from("study_rhythm").upsert(payload as never, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast.error("Não consegui salvar seu ritmo.");
      return;
    }
    toast.success("Ritmo salvo.");
    void queryClient.invalidateQueries({ queryKey: ["rhythm", user.id] });
    if (payload.notifications_enabled) {
      try {
        await sync({ data: undefined as never });
        void notificationsList.refetch();
      } catch {
        /* lembretes serão gerados na próxima abertura */
      }
    }
  }

  async function toggleNotifications(enabled: boolean) {
    if (enabled) {
      const error = await enablePush();
      setPermission(pushPermission());
      if (error) {
        toast.error(error);
        patch({ notifications_enabled: false });
        await save({ notifications_enabled: false });
        return;
      }
      patch({ notifications_enabled: true });
      await save({ notifications_enabled: true });
      toast.success("Lembretes ativados.");
    } else {
      await disablePush();
      patch({ notifications_enabled: false });
      await save({ notifications_enabled: false });
      toast.success("Lembretes desativados. Não enviaremos mais nada.");
    }
  }

  async function addExam() {
    if (!user || !examTitle.trim() || !examDate) return;
    const { error } = await supabase
      .from("exams")
      .insert({ user_id: user.id, title: examTitle.trim(), exam_date: examDate });
    if (error) toast.error("Não consegui salvar a prova.");
    else {
      setExamTitle("");
      setExamDate("");
      void exams.refetch();
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Meu Ritmo"
        description="Seu jeito de estudar: objetivo, tempo disponível, provas e lembretes gentis."
      />

      <section className="surface space-y-4 p-5">
        <h2 className="text-base font-semibold">Seu plano</h2>
        <div>
          <Label className="text-xs">Qual é o seu objetivo?</Label>
          <Textarea
            className="mt-1.5"
            rows={2}
            placeholder="Ex.: passar na prova de Farmacologia em novembro"
            value={form.goal ?? ""}
            onChange={(e) => patch({ goal: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs">Matérias que está estudando (separe por vírgula)</Label>
          <Input
            className="mt-1.5"
            value={form.subjects.join(", ")}
            placeholder="Anatomia, Bioquímica, Estatística"
            onChange={(e) =>
              patch({ subjects: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
            }
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Dias por semana</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={1}
              max={7}
              value={form.days_per_week}
              onChange={(e) => patch({ days_per_week: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Minutos por dia</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={5}
              max={480}
              value={form.minutes_per_day}
              onChange={(e) => patch({ minutes_per_day: Number(e.target.value) })}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">Horários preferidos</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {TIMES.map((t) => {
              const active = form.preferred_times.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    patch({
                      preferred_times: active
                        ? form.preferred_times.filter((x) => x !== t)
                        : [...form.preferred_times, t],
                    })
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                    active ? "border-primary bg-blush-soft text-primary" : "border-border hover:border-primary/50",
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
        <Button onClick={() => save()} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Salvar meu ritmo
        </Button>
      </section>

      <section className="surface space-y-4 p-5">
        <h2 className="text-base font-semibold">Lembretes</h2>
        {permission === "unsupported" ? (
          <p className="text-sm text-muted-foreground">
            Este navegador não suporta notificações push. Você ainda recebe os lembretes dentro do app, aqui embaixo.
          </p>
        ) : permission === "denied" ? (
          <p className="text-sm text-muted-foreground">
            As notificações estão bloqueadas nas configurações do navegador. Libere para este site e volte aqui — os
            lembretes internos continuam funcionando.
          </p>
        ) : null}
        <label className="flex items-center gap-3 text-sm">
          <Switch checked={form.notifications_enabled} onCheckedChange={(v) => void toggleNotifications(v)} />
          {form.notifications_enabled ? (
            <span className="inline-flex items-center gap-1">
              <Bell className="size-4 text-primary" /> Quero receber lembretes
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <BellOff className="size-4" /> Lembretes desligados
            </span>
          )}
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs">Máximo por dia</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={1}
              max={5}
              value={form.max_per_day}
              onChange={(e) => patch({ max_per_day: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Silêncio a partir de</Label>
            <Input
              className="mt-1.5"
              type="time"
              value={form.quiet_start.slice(0, 5)}
              onChange={(e) => patch({ quiet_start: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Silêncio até</Label>
            <Input
              className="mt-1.5"
              type="time"
              value={form.quiet_end.slice(0, 5)}
              onChange={(e) => patch({ quiet_end: e.target.value })}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => save()} disabled={saving}>
            Salvar preferências
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const result = await test({ data: undefined as never });
                void notificationsList.refetch();
                toast.success(
                  result.sent > 0 ? "Notificação de teste enviada." : "Lembrete criado aqui no app (push indisponível).",
                );
              } catch {
                toast.error("Não consegui enviar o teste agora.");
              }
            }}
          >
            Enviar notificação de teste
          </Button>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Últimos lembretes</h3>
          {(notificationsList.data ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nenhum lembrete ainda.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {notificationsList.data?.map((n) => (
                <li key={n.id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                  <div className="mt-2 flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <a href={n.link ?? "/inicio"}>Estudar agora</a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await supabase
                          .from("notifications")
                          .update({ snoozed_until: new Date(Date.now() + 3 * 3600000).toISOString() })
                          .eq("id", n.id);
                        toast.success("Combinado, te lembro daqui a pouco.");
                      }}
                    >
                      Lembrar depois
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await supabase.from("notifications").update({ status: "dismissed" }).eq("id", n.id);
                        void notificationsList.refetch();
                      }}
                    >
                      Hoje não posso
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="surface space-y-3 p-5">
        <h2 className="text-base font-semibold">Provas e compromissos</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Ex.: Prova de Anatomia" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} />
          <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="sm:w-48" />
          <Button onClick={addExam}>
            <CalendarPlus className="size-4" /> Adicionar
          </Button>
        </div>
        {(exams.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma prova cadastrada.</p>
        ) : (
          <ul className="space-y-2">
            {exams.data?.map((e) => (
              <li key={e.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span>
                  {e.title} · {new Date(`${e.exam_date}T12:00:00`).toLocaleDateString("pt-BR")}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={async () => {
                    await supabase.from("exams").delete().eq("id", e.id);
                    void exams.refetch();
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface space-y-3 p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Trophy className="size-4 text-primary" /> Conquistas Catoala
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const earned = achievements.data?.includes(a.code);
            return (
              <div
                key={a.code}
                className={cn(
                  "rounded-xl border p-4",
                  earned ? "border-primary bg-blush-soft" : "border-border bg-card opacity-70",
                )}
              >
                <p className="text-sm font-semibold">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.describe}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">{earned ? "Conquistado" : "Ainda não"}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
