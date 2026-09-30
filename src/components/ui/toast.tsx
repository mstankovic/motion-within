"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const DISMISS_MS = 2400;

type Toast = { id: number; message: string };
const ToastContext = createContext<(message: string) => void>(() => {});

/** Short confirmation above the bottom nav; one at a time, auto-dismissed. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((message: string) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message });
    timer.current = setTimeout(() => setToast(null), DISMISS_MS);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-5 bottom-[calc(5.125rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-[390px]"
      >
        {toast ? (
          <p
            key={toast.id}
            className="bg-ink text-bg animate-toast-in rounded-[var(--radius-control)] px-4 py-[0.8125rem] text-sm font-semibold shadow-[0_12px_32px_rgb(27_36_33/0.2)]"
          >
            {toast.message}
          </p>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
