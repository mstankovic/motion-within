import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app/page-header";
import { NewProgramForm } from "@/features/programs/new-program-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("programs"))("new") };
}

export default async function NewProgramPage() {
  const t = await getTranslations("programs");
  return (
    <>
      <PageHeader title={t("new")} backHref="/programs" backLabel={t("title")} />
      <NewProgramForm />
    </>
  );
}
