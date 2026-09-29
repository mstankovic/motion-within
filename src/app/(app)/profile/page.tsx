import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Bell, BookOpen, ChevronRight, LogOut, Ruler } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { InstallHint } from "@/components/app/install-hint";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signOut } from "@/features/auth/actions";
import { PasskeySettings } from "@/features/auth/passkey-ui";
import { ProfileForm } from "@/features/profile/profile-form";
import type { Goal } from "@/lib/validation/profile";
import { createClient, getProfile } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("profile"))("title") };
}

export default async function ProfilePage() {
  const [t, ta, to, locale, profile] = await Promise.all([
    getTranslations("profile"),
    getTranslations("auth"),
    getTranslations("onboarding"),
    getLocale(),
    getProfile(),
  ]);
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const email = (claims?.claims?.email as string | undefined) ?? "";

  const links = [
    { href: "/settings/notifications", label: t("notifications"), icon: Bell },
    { href: "/exercises", label: t("exerciseLibrary"), icon: BookOpen },
    { href: "/progress/body", label: t("bodyMeasurements"), icon: Ruler },
  ];

  return (
    <>
      <PageHeader title={profile.display_name || t("title")} subtitle={email} />
      <div className="space-y-4">
        <InstallHint />
        <nav aria-label={t("title")}>
          <ul className="divide-border bg-surface divide-y overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-card)]">
            {links.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="active:bg-surface-muted flex min-h-14 items-center gap-3 px-4 transition-colors duration-(--dur-fast)"
                >
                  <Icon aria-hidden="true" className="text-brand size-5" />
                  <span className="flex-1 font-semibold">{label}</span>
                  <ChevronRight aria-hidden="true" className="text-ink-subtle size-5" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ProfileForm
          initial={{
            displayName: profile.display_name ?? "",
            locale: locale,
            timezone: profile.timezone,
            goals: profile.goals as Goal[],
            preferredWeekdays: profile.preferred_weekdays,
          }}
        />
        <PasskeySettings />
        <Card className="space-y-3 text-sm">
          <div>
            <h2 className="font-bold">{t("safety")}</h2>
            <p className="text-ink-muted">{to("safetyBody")}</p>
          </div>
          <div>
            <h2 className="font-bold">{t("deleteAccount")}</h2>
            <p className="text-ink-muted">{t("deleteAccountBody")}</p>
          </div>
        </Card>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="lg">
            <LogOut aria-hidden="true" />
            {ta("signOut")}
          </Button>
        </form>
      </div>
    </>
  );
}
