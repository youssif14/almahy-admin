import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Only allow same-site relative redirects (prevents open-redirect abuse).
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,34rem)]">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <Image src="/login-panel.png" alt="" fill priority sizes="(min-width: 1024px) 60vw, 0px" className="object-cover opacity-90" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="font-serif text-4xl leading-tight">Every matter, from intake to judgment, in one place.</p>
          <p className="mt-3 max-w-md text-white/70">Almahy Legal Services, Dubai. Advising individuals and businesses across the UAE since 1987.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <p className="font-serif text-3xl text-ink">Almahy</p>
          <h1 className="mt-6 text-xl font-semibold">Sign in to Case Desk</h1>
          <p className="mt-1 text-sm text-muted">Use your firm account to continue.</p>
          <LoginForm next={safeNext} />
          <div className="mt-8 rounded-panel border border-line bg-surface p-4 text-sm">
            <p className="font-medium">Demo accounts</p>
            <ul className="mt-2 space-y-1 text-muted">
              <li><span className="text-ink">admin@almahy.demo</span> full access</li>
              <li><span className="text-ink">lawyer@almahy.demo</span> create and edit, no deletes</li>
              <li><span className="text-ink">viewer@almahy.demo</span> read-only</li>
            </ul>
            <p className="mt-2 text-xs text-muted">The password is shared with reviewers alongside the live link.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
