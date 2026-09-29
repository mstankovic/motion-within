import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/features/auth/auth-forms";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth"))("signIn") };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  return (
    <LoginForm
      next={typeof next === "string" ? next : undefined}
      linkError={error === "linkInvalid"}
    />
  );
}
