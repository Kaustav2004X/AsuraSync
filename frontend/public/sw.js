// sw.js — place in frontend/public/sw.js
// Vite will serve this from the root: https://yourdomain.com/sw.js

const CACHE_NAME = "asurasync-v1";

// ── Push event — show notification ────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "AsuraSync", body: event.data.text() };
  }

  const { title, body, icon, badge, url, tag } = payload;

  const options = {
    body:    body   || "",
    icon:    icon   || "/AsuraSync.png",
    badge:   badge  || "/AsuraSync.png",
    tag:     tag    || "asurasync-notification",
    data:    { url: url || "/" },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title || "AsuraSync", options)
  );
});

// ── Notification click — open or focus the relevant page ──────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Push subscription change — re-subscribe automatically ─────────────────
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options?.applicationServerKey,
    }).then((newSubscription) => {
      // POST new subscription to backend
      return fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubscription.toJSON()),
      });
    })
  );
});