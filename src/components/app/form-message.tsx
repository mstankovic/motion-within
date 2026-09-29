import { Notice } from "@/components/ui/states";

export function FormMessage({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  return (
    <div aria-live="polite" role="status">
      {error ? (
        <Notice tone="danger" className="mb-4">
          {error}
        </Notice>
      ) : success ? (
        <Notice tone="success" className="mb-4">
          {success}
        </Notice>
      ) : null}
    </div>
  );
}
