"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarDays, ChartLine, ListChecks, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/calendar", key: "calendar", icon: CalendarDays },
  { href: "/programs", key: "programs", icon: ListChecks },
  { href: "/progress", key: "progress", icon: ChartLine },
  { href: "/profile", key: "profile", icon: UserRound },
] as const;

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  return (
    <nav
      aria-label={t("main")}
      className="bg-surface/88 fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)] shadow-(--shadow-nav) backdrop-blur-xl backdrop-saturate-150"
    >
      <ul className="mx-auto grid max-w-[430px] grid-cols-4">
        {items.map(({ href, key, icon: Icon }) => {
          const active =
            pathname === href ||
            pathname.startsWith(`${href}/`) ||
            (key === "programs" && pathname.startsWith("/exercises"));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group ease-standard flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors duration-(--dur-base)",
                  active ? "text-brand-strong" : "text-ink-muted",
                )}
              >
                <span className="relative flex h-8 w-14 items-center justify-center">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "bg-brand-soft ease-spring absolute inset-0 rounded-full transition-[transform,opacity] duration-(--dur-base)",
                      active ? "scale-x-100 opacity-100" : "scale-x-40 opacity-0",
                    )}
                  />
                  <Icon
                    aria-hidden="true"
                    className="ease-spring relative size-6 transition-transform duration-(--dur-base) group-active:scale-[0.88] group-active:duration-(--dur-instant)"
                    strokeWidth={active ? 2.4 : 2}
                  />
                </span>
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
