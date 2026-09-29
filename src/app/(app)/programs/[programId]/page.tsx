import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/states";
import { ProgramActions } from "@/features/programs/program-actions";
import { ProgramView } from "@/features/programs/program-view";
import { getProgramTree } from "@/features/programs/queries";

export async function generateMetadata({
  params,
}: PageProps<"/programs/[programId]">): Promise<Metadata> {
  const program = await getProgramTree((await params).programId).catch(() => null);
  return { title: program?.name };
}

export default async function ProgramPage({ params }: PageProps<"/programs/[programId]">) {
  const { programId } = await params;
  const [t, program] = await Promise.all([getTranslations("programs"), getProgramTree(programId)]);
  if (!program) notFound();

  return (
    <>
      <PageHeader
        title={program.name}
        subtitle={program.description}
        backHref="/programs"
        backLabel={t("title")}
      />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {program.is_active ? <Badge tone="success">{t("active")}</Badge> : null}
        {program.source === "starter" ? <Badge tone="accent">{t("starterLabel")}</Badge> : null}
      </div>
      {program.source === "starter" ? <Notice className="mb-4">{t("exampleNotice")}</Notice> : null}
      <div className="mb-5">
        <ProgramActions id={program.id} name={program.name} isActive={program.is_active} />
      </div>
      <ProgramView program={program} />
    </>
  );
}
