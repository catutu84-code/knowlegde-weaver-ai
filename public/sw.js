/* Service Worker do Tutor IA Catoala — notificações de estudo. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Tutor IA Catoala", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "Tutor IA Catoala";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/logo.svg",
      badge: "/logo.svg",
      tag: payload.tag || undefined,
      data: { link: payload.link || "/inicio", id: payload.id || null },
      actions: [
        { action: "study", title: "Estudar agora" },
        { action: "snooze", title: "Lembrar depois" },
      ],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  const link = (event.notification.data && event.notification.data.link) || "/inicio";
  const target = event.action === "snooze" ? "/ritmo?snooze=" + (event.notification.data?.id || "") : link;
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
