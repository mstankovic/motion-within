import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app/page-header";
import { ExerciseForm } from "@/features/exercises/exercise-form";
import { getExercise, getReferenceData } from "@/features/exercises/queries";
import { getProfile } from "@/lib/supabase/server";

export default async function EditExercisePage({
  params,
}: PageProps<"/exercises/[exerciseId]/edit">) {
  const { exerciseId } = await params;
  const [t, tc, ex, refs, profile] = await Promise.all([
    getTranslations("exercises"),
    getTranslations("common"),
    getExercise(exerciseId),
    getReferenceData(),
    getProfile(),
  ]);
  // System exercises are read-only; users copy them instead.
  if (!ex || ex.owner_id !== profile.id) notFound();

  return (
    <>
      <PageHeader title={tc("edit")} backHref={`/exercises/${ex.id}`} backLabel={t("title")} />
      <ExerciseForm
        muscles={refs.muscles}
        equipment={refs.equipment}
        initial={{
          id: ex.id,
          name: ex.custom_name ?? "",
          description: ex.custom_description ?? "",
          trackingMode: ex.tracking_mode,
          isMobility: ex.is_mobility,
          primaryMuscles: ex.exercise_muscles
            .filter((m) => m.role === "primary")
            .map((m) => m.muscle_group_id),
          secondaryMuscles: ex.exercise_muscles
            .filter((m) => m.role === "secondary")
            .map((m) => m.muscle_group_id),
          equipment: ex.exercise_equipment.map((e) => e.equipment_id),
        }}
      />
    </>
  );
}
