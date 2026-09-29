import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/features/auth/auth-forms";
import { LoginHero } from "@/features/auth/login-hero";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth"))("signIn") };
}

// Browser chrome blends into the hero.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0c5a50" },
    { media: "(prefers-color-scheme: dark)", color: "#0d302b" },
  ],
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  return (
    <>
      <LoginHero />
      <section className="bg-surface animate-sheet-in rounded-t-[var(--radius-sheet)] px-5 pt-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-[var(--shadow-sheet)]">
        <LoginForm
          next={typeof next === "string" ? next : undefined}
          linkError={error === "linkInvalid"}
        />
      </section>
    </>
  );
}
