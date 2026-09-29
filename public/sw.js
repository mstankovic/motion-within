/* Motion Within service worker.
 * - static assets: cache-first
 * - page navigations: network-first, falling back to the last cached copy
 *   (so an already-opened workout still opens offline), then /offline
 * - Web Push reminders
 * Active-workout data itself lives in IndexedDB, not here.
 */
const VERSION = "v1";
const STATIC_CACHE = `mw-static-${VERSION}`;
const PAGE_CACHE = `mw-pages-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png", "/icons/icon.svg"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => ![STATIC_CACHE, PAGE_CACHE].includes(k)).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Signed-out: drop cached private pages.
self.addEventListener("message", (event) => {
  if (event.data?.type === "clear-private-cache") event.waitUntil(caches.delete(PAGE_CACHE));
});

const CACHEABLE_PAGES = [/^\/sessions\/[^/]+$/, /^\/calendar$/, /^\/workouts\/[^/]+\/start$/];

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && !res.redirected && CACHEABLE_PAGES.some((re) => re.test(url.pathname))) {
            const copy = res.clone();
            caches.open(PAGE_CACHE).then((c) => c.put(url.pathname, copy));
          }
          return res;
        })
        .catch(
          async () =>
            (await caches.match(url.pathname)) ||
            (await caches.match(OFFLINE_URL)) ||
            Response.error(),
        ),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Motion Within", body: event.data?.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Motion Within", {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag,
      data: { url: data.url || "/calendar" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/calendar", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const w of windows) {
        if (w.url === target && "focus" in w) return w.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
