"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { Notice, Skeleton } from "@/components/ui/states";
import { createClient } from "@/lib/supabase/client";
import { exerciseName, filterExercises, type ExerciseListItem } from "@/features/exercises/model";

const SELECT =
  "id, owner_id, source, slug, name_sr, name_en, custom_name, tracking_mode, is_mobility, is_active, exercise_muscles(muscle_group_id, role), exercise_equipment(equipment_id)";

type Raw = Omit<ExerciseListItem, "muscles" | "equipment"> & {
  exercise_muscles: { muscle_group_id: string; role: "primary" | "secondary" }[];
  exercise_equipment: { equipment_id: string }[];
};

export function useExerciseList() {
  return useQuery({
    queryKey: ["exercises", "list"],
    queryFn: async (): Promise<ExerciseListItem[]> => {
      const { data, error } = await createClient().from("exercises").select(SELECT);
      if (error) throw error;
      return (data as unknown as Raw[]).map(
        ({ exercise_muscles, exercise_equipment, ...rest }) => ({
          ...rest,
          muscles: exercise_muscles.map((m) => ({ id: m.muscle_group_id, role: m.role })),
          equipment: exercise_equipment.map((e) => e.equipment_id),
        }),
      );
    },
  });
}

export function ExercisePicker({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (exerciseId: string) => void;
}) {
  const t = useTranslations("exercises");
  const tp = useTranslations("programs");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [q, setQ] = useState("");
  const { data, isPending, isError, refetch } = useExerciseList();
  const results = useMemo(() => filterExercises(data ?? [], { q }, locale), [data, q, locale]);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={tp("pickExercise")}
      closeLabel={tc("close")}
    >
      <div className="relative mb-3">
        <Search
          aria-hidden="true"
          className="text-ink-subtle pointer-events-none absolute top-3 left-3 size-5"
        />
        <Input
          type="search"
          autoFocus
          aria-label={t("searchPlaceholder")}
          placeholder={t("searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-10"
        />
      </div>
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : isError ? (
        <Notice tone="danger">
          {tc("errorBody")}{" "}
          <button type="button" className="font-semibold underline" onClick={() => refetch()}>
            {tc("retry")}
          </button>
        </Notice>
      ) : results.length === 0 ? (
        <p className="text-ink-muted py-6 text-center">{t("noResults")}</p>
      ) : (
        <ul className="divide-border bg-surface divide-y overflow-hidden rounded-[var(--radius-card)]">
          {results.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(ex.id);
                  onOpenChange(false);
                  setQ("");
                }}
                className="active:bg-surface-muted flex min-h-14 w-full flex-col items-start justify-center px-4 py-2 text-left transition-colors duration-(--dur-fast)"
              >
                <span className="font-semibold">{exerciseName(ex, locale)}</span>
                <span className="mt-0.5 flex gap-1">
                  <Badge>{t(`trackingMode.${ex.tracking_mode}`)}</Badge>
                  {ex.is_mobility ? <Badge tone="info">{t("mobility")}</Badge> : null}
                  {ex.source === "user" ? <Badge tone="brand">{t("mine")}</Badge> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
