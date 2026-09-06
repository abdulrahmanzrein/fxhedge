import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Panel } from "@/components/ui/panel";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-16">
      <Link
        href="/"
        className="font-display text-2xl font-semibold tracking-tight text-primary"
      >
        Hedged
      </Link>
      <Panel className="mt-8 w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold text-primary">Welcome back</h1>
        <p className="mb-6 text-sm text-muted">Sign in to your account</p>
        <AuthForm defaultTab="login" />
      </Panel>
      <p className="mt-4 text-sm text-muted">
        No account?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Sign up free
        </Link>
      </p>
    </main>
  );
}
