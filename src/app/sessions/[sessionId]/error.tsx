"use client";

import { ErrorView } from "@/components/app/error-view";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-xl px-4">
      <ErrorView reset={reset} />
    </div>
  );
}
