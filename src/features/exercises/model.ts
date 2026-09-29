import type { Database } from "@/types/database";
import type { TrackingMode } from "@/features/workout-session/types";

export const TRACKING_MODES: TrackingMode[] = [
  "reps",
  "reps_weight",
  "reps_band",
  "reps_trx",
  "duration",
  "reps_duration",
];

type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];

export type RefItem = { id: string; slug: string; name_sr: string; name_en: string };

export type ExerciseListItem = Pick<
  ExerciseRow,
  | "id"
  | "owner_id"
  | "source"
  | "slug"
  | "name_sr"
  | "name_en"
  | "custom_name"
  | "tracking_mode"
  | "is_mobility"
  | "is_active"
> & {
  muscles: { id: string; role: "primary" | "secondary" }[];
  equipment: string[];
};

export function exerciseName(
  ex: Pick<ExerciseRow, "custom_name" | "name_sr" | "name_en">,
  locale: string,
): string {
  return (
    ex.custom_name ?? (locale === "en" ? ex.name_en : ex.name_sr) ?? ex.name_en ?? ex.name_sr ?? "—"
  );
}

export function exerciseDescription(
  ex: Pick<ExerciseRow, "custom_description" | "description_sr" | "description_en">,
  locale: string,
): string | null {
  return (
    ex.custom_description ??
    (locale === "en" ? ex.description_en : ex.description_sr) ??
    ex.description_en
  );
}

export function refName(item: Pick<RefItem, "name_sr" | "name_en">, locale: string) {
  return locale === "en" ? item.name_en : item.name_sr;
}

export type ExerciseFilters = {
  q?: string;
  muscle?: string;
  equipment?: string;
  tracking?: string;
  scope?: "all" | "system" | "mine";
};

/** Accent-insensitive match so "cucanj" finds "Čučanj". */
export function normalizeSearch(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "dj")
    .trim();
}

export function filterExercises(
  list: ExerciseListItem[],
  filters: ExerciseFilters,
  locale: string,
): ExerciseListItem[] {
  const q = filters.q ? normalizeSearch(filters.q) : "";
  return list
    .filter((ex) => ex.is_active)
    .filter((ex) => {
      if (filters.scope === "system" && ex.source !== "system") return false;
      if (filters.scope === "mine" && ex.source !== "user") return false;
      if (filters.muscle && !ex.muscles.some((m) => m.id === filters.muscle)) return false;
      if (filters.equipment && !ex.equipment.includes(filters.equipment)) return false;
      if (filters.tracking && ex.tracking_mode !== filters.tracking) return false;
      if (q) {
        const names = [ex.custom_name, ex.name_sr, ex.name_en]
          .filter(Boolean)
          .map((n) => normalizeSearch(n!));
        if (!names.some((n) => n.includes(q))) return false;
      }
      return true;
    })
    .sort((a, b) => exerciseName(a, locale).localeCompare(exerciseName(b, locale), locale));
}
