import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="min-h-full flex flex-col items-center justify-center bg-[var(--color-surface)] px-4 py-16">
      <Link href="/" className="font-serif text-2xl font-semibold text-[var(--color-fg)] mb-8">
        HalalFlow
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-8">
        <h1 className="text-xl font-semibold text-[var(--color-fg)] mb-1">Welcome back</h1>
        <p className="text-sm text-[var(--color-muted-fg)] mb-6">Sign in to your account</p>
        <AuthForm defaultTab="login" />
      </div>
      <p className="mt-4 text-sm text-[var(--color-muted-fg)]">
        No account?{" "}
        <Link href="/signup" className="text-[var(--color-primary)] hover:underline">Sign up free</Link>
      </p>
    </main>
  );
}
