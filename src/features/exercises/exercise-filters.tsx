"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import { refName, TRACKING_MODES, type RefItem } from "./model";

export function ExerciseFilters({
  muscles,
  equipment,
}: {
  muscles: RefItem[];
  equipment: RefItem[];
}) {
  const t = useTranslations("exercises");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) update("q", q);
    }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const selects = [
    { key: "muscle", label: t("muscle"), options: muscles.map((m) => [m.id, refName(m, locale)]) },
    {
      key: "equipment",
      label: t("equipment"),
      options: equipment.map((e) => [e.id, refName(e, locale)]),
    },
    {
      key: "tracking",
      label: t("tracking"),
      options: TRACKING_MODES.map((m) => [m, t(`trackingMode.${m}`)]),
    },
    {
      key: "scope",
      label: `${t("system")} / ${t("mine")}`,
      options: [
        ["system", t("system")],
        ["mine", t("mine")],
      ],
    },
  ] as const;

  return (
    <div className="mb-4 space-y-2" role="search">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="text-ink-subtle pointer-events-none absolute top-3 left-3 size-5"
        />
        <Input
          type="search"
          aria-label={t("searchPlaceholder")}
          placeholder={t("searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {selects.map((s) => (
          <Select
            key={s.key}
            aria-label={s.label}
            value={params.get(s.key) ?? ""}
            onChange={(e) => update(s.key, e.target.value)}
            className="text-sm"
          >
            <option value="">
              {s.label}: {tc("all")}
            </option>
            {s.options.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        ))}
      </div>
    </div>
  );
}
