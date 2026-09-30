import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/app/brand-mark";
import { OnboardingForm } from "@/features/profile/onboarding-form";
import { getProfile } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("onboarding"))("title") };
}

export default async function OnboardingPage() {
  const profile = await getProfile();
  if (profile.onboarding_completed) redirect("/today");
  const locale = await getLocale();

  return (
    <main className="pt-safe mx-auto w-full max-w-md px-4 py-6">
      <BrandMark className="mx-auto mb-6 size-12" />
      <OnboardingForm
        initialName={profile.display_name ?? ""}
        initialLocale={locale}
        initialTimezone={profile.timezone}
      />
    </main>
  );
}
