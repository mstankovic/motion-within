"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ActionResult = { ok: true } | { ok: false; error: string } | void | undefined;

/** Runs a server action in a transition and refreshes server data on success. */
export function useServerAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    (action: () => Promise<ActionResult>, onSuccess?: () => void) => {
      setError(null);
      startTransition(async () => {
        try {
          const result = await action();
          if (result && !result.ok) {
            setError(result.error);
            return;
          }
          onSuccess?.();
          router.refresh();
        } catch (e) {
          // redirect() from a server action surfaces as a navigation, not an error.
          if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw e;
          setError("generic");
        }
      });
    },
    [router],
  );

  return { run, pending, error, setError };
}
