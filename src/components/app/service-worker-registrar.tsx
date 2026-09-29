"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ServiceWorkerRegistrar() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_SW_IN_DEV) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // The app works without a service worker; offline support is best-effort.
    });
  }, []);

  // After sign-out, remove cached private pages from this device.
  useEffect(() => {
    if (pathname !== "/login" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.active?.postMessage({ type: "clear-private-cache" }))
      .catch(() => undefined);
  }, [pathname]);

  return null;
}
