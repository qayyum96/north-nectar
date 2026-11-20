import type { Metadata } from "next";
import { safeNext } from "@/lib/safe-next";
import { LoginForm } from "../auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return <LoginForm next={safeNext(next)} linkError={error} />;
}
