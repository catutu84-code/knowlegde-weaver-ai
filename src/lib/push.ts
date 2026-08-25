import { getVapidPublicKey, savePushSubscription, removePushSubscription } from "./notifications.functions";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export async function registerServiceWorker() {
  if (!pushSupported()) return null;
  return navigator.serviceWorker.register("/sw.js");
}

export type PushState = "unsupported" | "denied" | "granted" | "default";

export function pushPermission(): PushState {
  if (!pushSupported()) return "unsupported";
  return Notification.permission as PushState;
}

/** Pede permissão e registra o dispositivo. Retorna a mensagem de erro ou null. */
export async function enablePush(): Promise<string | null> {
  if (!pushSupported()) return "Este navegador não suporta notificações push.";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "Permissão de notificação negada pelo navegador.";

  const registration = (await navigator.serviceWorker.getRegistration("/sw.js")) ?? (await registerServiceWorker());
  if (!registration) return "Não consegui registrar o serviço de notificações.";
  await navigator.serviceWorker.ready;

  const { publicKey } = await getVapidPublicKey();
  if (!publicKey) return "As notificações ainda não estão configuradas no servidor.";

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
    }));

  const json = subscription.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return "Inscrição de notificação inválida.";

  await savePushSubscription({
    data: {
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      userAgent: navigator.userAgent,
    },
  });
  return null;
}

export async function disablePush() {
  if (!pushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await removePushSubscription({ data: { endpoint: subscription.endpoint } });
    await subscription.unsubscribe();
  }
}
