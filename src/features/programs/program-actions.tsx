"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Archive, CheckCircle2, Copy, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activateProgram, archiveProgram, copyProgram, createStarterProgram } from "./actions";

export function ProgramActions({
  id,
  name,
  isActive,
  showEdit = true,
}: {
  id: string;
  name: string;
  isActive: boolean;
  showEdit?: boolean;
}) {
  const t = useTranslations("programs");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {!isActive ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await activateProgram(id);
              router.refresh();
            })
          }
        >
          <CheckCircle2 aria-hidden="true" />
          {t("activate")}
        </Button>
      ) : null}
      {showEdit ? (
        <Button asChild size="sm" variant="outline">
          <Link href={`/programs/${id}/edit`}>
            <Pencil aria-hidden="true" />
            {tc("edit")}
          </Link>
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await copyProgram(id, name);
          })
        }
      >
        <Copy aria-hidden="true" />
        {t("copy")}
      </Button>
      {!isActive ? (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await archiveProgram(id);
            })
          }
        >
          <Archive aria-hidden="true" />
          {t("archive")}
        </Button>
      ) : null}
    </div>
  );
}

export function StarterProgramButton() {
  const t = useTranslations("programs");
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await createStarterProgram();
        })
      }
    >
      {t("createStarter")}
    </Button>
  );
}
