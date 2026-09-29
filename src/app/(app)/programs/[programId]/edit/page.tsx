import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app/page-header";
import { ProgramBuilder } from "@/features/programs/builder/program-builder";
import { getProgramTree } from "@/features/programs/queries";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("programs"))("editProgram") };
}

export default async function EditProgramPage({ params }: PageProps<"/programs/[programId]/edit">) {
  const { programId } = await params;
  const [t, program] = await Promise.all([getTranslations("programs"), getProgramTree(programId)]);
  if (!program) notFound();
  return (
    <>
      <PageHeader
        title={t("editProgram")}
        backHref={`/programs/${program.id}`}
        backLabel={program.name}
      />
      <ProgramBuilder program={program} />
    </>
  );
}
