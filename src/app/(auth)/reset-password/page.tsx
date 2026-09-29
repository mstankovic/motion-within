import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/features/auth/auth-forms";
import { requireUserId } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth"))("resetTitle") };
}

export default async function ResetPasswordPage() {
  // Reached through the recovery link, which signs the user in.
  await requireUserId();
  return <ResetPasswordForm />;
}
