import { createFileRoute } from "@tanstack/react-router";

/**
 * Agendador de lembretes. Chamado por um cron externo com o cabeçalho
 * `x-cron-secret` igual ao segredo NOTIFY_CRON_SECRET.
 */
export const Route = createFileRoute("/api/public/notify-cron")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["NOTIFY_CRON_SECRET"];
        if (!secret || request.headers.get("x-cron-secret") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { processUser } = await import("@/lib/notifications.server");

        const { data: rhythms } = await supabaseAdmin
          .from("study_rhythm")
          .select("user_id,timezone,notifications_enabled,max_per_day,quiet_start,quiet_end,minutes_per_day,subjects")
          .eq("notifications_enabled", true)
          .limit(500);

        let created = 0;
        let pushed = 0;
        for (const rhythm of rhythms ?? []) {
          const result = await processUser(supabaseAdmin, rhythm as never);
          created += result.created;
          pushed += result.pushed;
        }
        return Response.json({ users: rhythms?.length ?? 0, created, pushed });
      },
    },
  },
});
