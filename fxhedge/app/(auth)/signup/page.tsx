import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Panel } from "@/components/ui/panel";

export default function SignUpPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-16">
      <Link
        href="/"
        className="font-display text-2xl font-semibold tracking-tight text-primary"
      >
        Hedged
      </Link>
      <Panel className="mt-8 w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold text-primary">
          Create your account
        </h1>
        <p className="mb-6 text-sm text-muted">Step 1 of 2 — your details</p>
        <AuthForm defaultTab="signup" />
      </Panel>
      <p className="mt-4 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
