import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  return { publicKey: process.env["VAPID_PUBLIC_KEY"] ?? "" };
});

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { endpoint: string; p256dh: string; auth: string; userAgent?: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("push_subscriptions").upsert(
      {
        user_id: context.userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.userAgent ?? null,
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error("Não consegui registrar as notificações neste dispositivo.");
    return { ok: true };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { endpoint: string }) => input)
  .handler(async ({ data, context }) => {
    await context.supabase.from("push_subscriptions").delete().eq("endpoint", data.endpoint);
    return { ok: true };
  });

export const sendTestNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { pushToUser } = await import("./notifications.server");
    await context.supabase.from("notifications").insert({
      user_id: context.userId,
      kind: "teste",
      title: "Notificação de teste",
      body: "Tudo certo! É assim que os lembretes vão chegar para você.",
      link: "/inicio",
      status: "sent",
      sent_at: new Date().toISOString(),
    });
    const result = await pushToUser(supabaseAdmin, context.userId, {
      title: "Notificação de teste",
      body: "Tudo certo! É assim que os lembretes vão chegar para você.",
      link: "/inicio",
      tag: "teste",
    });
    return result;
  });

/** Gera os lembretes do próprio usuário (chamado quando ele abre o app). */
export const syncMyNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { processUser } = await import("./notifications.server");
    const { data: rhythm } = await context.supabase
      .from("study_rhythm")
      .select("user_id,timezone,notifications_enabled,max_per_day,quiet_start,quiet_end,minutes_per_day,subjects")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!rhythm) return { created: 0, pushed: 0 };
    return processUser(supabaseAdmin, rhythm as never);
  });
