import { AppSidebar } from "@/components/app-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <AppSidebar />
      <main className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10">
        {children}
      </main>
    </div>
  );
}
