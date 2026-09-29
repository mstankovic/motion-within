import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/features/auth/auth-forms";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth"))("signUp") };
}

export default function RegisterPage() {
  return <RegisterForm />;
}
