"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Archive, Copy, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveExercise, copyExercise } from "./actions";

export function ExerciseActionsBar({ id, isOwn }: { id: string; isOwn: boolean }) {
  const t = useTranslations("exercises");
  const tc = useTranslations("common");
  const tp = useTranslations("programs");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await copyExercise(id);
            if (result.ok) router.push(`/exercises/${result.id}/edit`);
          })
        }
      >
        <Copy aria-hidden="true" />
        {isOwn ? tp("copy") : t("copyToEdit")}
      </Button>
      {isOwn ? (
        <>
          <Button asChild variant="outline">
            <Link href={`/exercises/${id}/edit`}>
              <Pencil aria-hidden="true" />
              {tc("edit")}
            </Link>
          </Button>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await archiveExercise(id);
                if (result.ok) router.push("/exercises");
              })
            }
          >
            <Archive aria-hidden="true" />
            {tp("archive")}
          </Button>
        </>
      ) : null}
    </div>
  );
}
