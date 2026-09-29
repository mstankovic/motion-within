import { redirect } from "next/navigation";
import { BottomNav } from "@/components/app/bottom-nav";
import { OfflineBanner } from "@/components/app/offline-banner";
import { getProfile } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfile();
  if (!profile.onboarding_completed) redirect("/onboarding");

  return (
    <>
      <main className="pt-safe mx-auto w-full max-w-[430px] px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <OfflineBanner />
        {children}
      </main>
      <BottomNav />
    </>
  );
}
