import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPushPayload } from "@block65/webcrypto-web-push";

export type PushMessagePayload = {
  title: string;
  body: string;
  link: string;
  id?: string;
  tag?: string;
};

/** Envia uma mensagem push para todas as inscrições de um usuário. Remove inscrições expiradas. */
export async function pushToUser(
  admin: SupabaseClient,
  userId: string,
  payload: PushMessagePayload,
): Promise<{ sent: number; removed: number }> {
  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  const subject = process.env["VAPID_SUBJECT"] ?? "mailto:suporte@tutoriacatoala.app";
  if (!publicKey || !privateKey) return { sent: 0, removed: 0 };

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("user_id", userId);

  let sent = 0;
  let removed = 0;
  for (const sub of subs ?? []) {
    try {
      const request = await buildPushPayload(
        { data: JSON.stringify(payload), options: { ttl: 3600 } },
        {
          endpoint: sub.endpoint as string,
          expirationTime: null,
          keys: { p256dh: sub.p256dh as string, auth: sub.auth as string },
        },
        { subject, publicKey, privateKey },
      );
      const res = await fetch(sub.endpoint as string, request as unknown as RequestInit);
      if (res.status === 404 || res.status === 410) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id as string);
        removed += 1;
      } else if (res.ok) {
        sent += 1;
      }
    } catch (error) {
      console.error("push failed", error);
    }
  }
  return { sent, removed };
}

type Rhythm = {
  user_id: string;
  timezone: string;
  notifications_enabled: boolean;
  max_per_day: number;
  quiet_start: string;
  quiet_end: string;
  minutes_per_day: number;
  subjects: string[];
};

/** Hora local (0-23) do usuário no fuso configurado. */
export function localHour(timezone: string, now = new Date()): number {
  try {
    return Number(
      new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", hour12: false, timeZone: timezone }).format(now),
    );
  } catch {
    return now.getUTCHours();
  }
}

export function isQuiet(rhythm: Pick<Rhythm, "timezone" | "quiet_start" | "quiet_end">, now = new Date()): boolean {
  const hour = localHour(rhythm.timezone, now);
  const start = Number(rhythm.quiet_start.slice(0, 2));
  const end = Number(rhythm.quiet_end.slice(0, 2));
  if (start === end) return false;
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

export type PlannedNotification = {
  kind: string;
  title: string;
  body: string;
  link: string;
  dedupe_key: string;
};

/** Monta os lembretes do dia para um usuário a partir de dados reais, sem repetir e sem culpa. */
export async function planNotifications(
  admin: SupabaseClient,
  rhythm: Rhythm,
  now = new Date(),
): Promise<PlannedNotification[]> {
  const userId = rhythm.user_id;
  const today = now.toISOString().slice(0, 10);
  const planned: PlannedNotification[] = [];

  const [sessions, errors, books, exams, materials] = await Promise.all([
    admin
      .from("study_sessions")
      .select("minutes,created_at")
      .eq("user_id", userId)
      .gte("created_at", new Date(now.getTime() - 7 * 86400000).toISOString()),
    admin.from("user_errors").select("concept").eq("user_id", userId).eq("resolved", false).limit(5),
    admin
      .from("books")
      .select("id,title,reading_progress,generation_status")
      .eq("user_id", userId)
      .eq("generation_status", "ready")
      .order("updated_at", { ascending: false })
      .limit(3),
    admin
      .from("exams")
      .select("title,exam_date")
      .eq("user_id", userId)
      .gte("exam_date", today)
      .order("exam_date", { ascending: true })
      .limit(1),
    admin
      .from("materials")
      .select("id,title,updated_at")
      .eq("user_id", userId)
      .eq("status", "ready")
      .gte("updated_at", new Date(now.getTime() - 86400000).toISOString())
      .limit(3),
  ]);

  const rows = sessions.data ?? [];
  const minutesToday = rows
    .filter((s) => String(s.created_at).slice(0, 10) === today)
    .reduce((sum, s) => sum + (s.minutes ?? 0), 0);
  const lastStudy = rows.length
    ? rows.map((s) => new Date(String(s.created_at)).getTime()).sort((a, b) => b - a)[0]!
    : 0;
  const daysAway = lastStudy ? Math.floor((now.getTime() - lastStudy) / 86400000) : 99;
  const subject = rhythm.subjects[0];

  if (minutesToday < rhythm.minutes_per_day) {
    planned.push({
      kind: "estudo-do-dia",
      title: "Dez minutinhos já contam",
      body: subject ? `Quer avançar um pouco em ${subject} agora?` : "Quer continuar de onde parou?",
      link: "/inicio",
      dedupe_key: `estudo-${today}`,
    });
  }

  const openBook = (books.data ?? []).find((b) => Number(b.reading_progress ?? 0) > 0 && Number(b.reading_progress) < 100);
  if (openBook) {
    planned.push({
      kind: "livro",
      title: "Seu livro está esperando",
      body: `${openBook.title} está em ${Math.round(Number(openBook.reading_progress))}%. Que tal mais um capítulo?`,
      link: `/livro/${openBook.id}`,
      dedupe_key: `livro-${openBook.id}-${today}`,
    });
  }

  if ((errors.data ?? []).length > 0) {
    const concept = errors.data?.[0]?.concept ?? "um assunto";
    planned.push({
      kind: "revisao",
      title: "Hora boa para revisar",
      body: `Seu cérebro pediu uma revisão rápida de ${concept}. Vamos?`,
      link: "/revisoes",
      dedupe_key: `revisao-${today}`,
    });
  }

  if (daysAway >= 3 && daysAway < 90) {
    planned.push({
      kind: "retomada",
      title: "Hoje o ritmo pode ser leve",
      body: "Preparei uma sessão de 5 minutos para você voltar sem peso.",
      link: "/inicio",
      dedupe_key: `retomada-${today}`,
    });
  }

  const exam = exams.data?.[0];
  if (exam) {
    const days = Math.ceil((new Date(`${exam.exam_date}T12:00:00Z`).getTime() - now.getTime()) / 86400000);
    if (days >= 0 && days <= 7) {
      planned.push({
        kind: "prova",
        title: "Sua prova está chegando",
        body: `${exam.title} em ${days} dia(s). Separei os pontos que mais precisam de revisão.`,
        link: "/revisoes",
        dedupe_key: `prova-${exam.title}-${today}`,
      });
    }
  }

  for (const m of materials.data ?? []) {
    planned.push({
      kind: "material",
      title: "Material pronto para estudar",
      body: `${m.title} terminou de ser processado.`,
      link: "/biblioteca",
      dedupe_key: `material-${m.id}`,
    });
  }

  if (now.getUTCDay() === 0) {
    const week = rows.reduce((sum, s) => sum + (s.minutes ?? 0), 0);
    planned.push({
      kind: "resumo-semanal",
      title: "Seu resumo da semana",
      body: `Você estudou ${week} minutos nesta semana. Veja o que evoluiu.`,
      link: "/desempenho",
      dedupe_key: `semanal-${today}`,
    });
  }

  return planned.slice(0, Math.max(1, rhythm.max_per_day));
}

/** Processa um usuário: respeita silêncio, limite diário e duplicidade. */
export async function processUser(admin: SupabaseClient, rhythm: Rhythm, now = new Date()) {
  if (!rhythm.notifications_enabled) return { created: 0, pushed: 0 };
  if (isQuiet(rhythm, now)) return { created: 0, pushed: 0 };

  const dayStart = new Date(now.getTime() - 86400000).toISOString();
  const { count } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", rhythm.user_id)
    .eq("status", "sent")
    .gte("sent_at", dayStart);
  const already = count ?? 0;
  const budget = Math.max(0, rhythm.max_per_day - already);
  if (budget === 0) return { created: 0, pushed: 0 };

  const planned = (await planNotifications(admin, rhythm, now)).slice(0, budget);
  let created = 0;
  let pushed = 0;
  for (const item of planned) {
    const { data: inserted } = await admin
      .from("notifications")
      .insert({
        user_id: rhythm.user_id,
        kind: item.kind,
        title: item.title,
        body: item.body,
        link: item.link,
        dedupe_key: item.dedupe_key,
        status: "sent",
        sent_at: now.toISOString(),
      })
      .select("id")
      .maybeSingle();
    if (!inserted) continue; // duplicado — ignora silenciosamente
    created += 1;
    const result = await pushToUser(admin, rhythm.user_id, {
      title: item.title,
      body: item.body,
      link: item.link,
      id: inserted.id as string,
      tag: item.kind,
    });
    pushed += result.sent;
  }
  return { created, pushed };
}
