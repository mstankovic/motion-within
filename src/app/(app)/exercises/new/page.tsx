import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app/page-header";
import { ExerciseForm } from "@/features/exercises/exercise-form";
import { getReferenceData } from "@/features/exercises/queries";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("exercises"))("new") };
}

export default async function NewExercisePage() {
  const [t, refs] = await Promise.all([getTranslations("exercises"), getReferenceData()]);
  return (
    <>
      <PageHeader title={t("new")} backHref="/exercises" backLabel={t("title")} />
      <ExerciseForm
        muscles={refs.muscles}
        equipment={refs.equipment}
        initial={{
          id: null,
          name: "",
          description: "",
          trackingMode: "reps",
          isMobility: false,
          primaryMuscles: [],
          secondaryMuscles: [],
          equipment: [],
        }}
      />
    </>
  );
}
