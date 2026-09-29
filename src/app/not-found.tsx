import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="font-serif text-3xl">This page doesn&apos;t exist</p>
        <p className="mt-2 text-muted">The link may be old, or the case may have been deleted.</p>
        <Link href="/cases" className="mt-6 inline-block text-sm font-medium text-brass underline underline-offset-4">
          Go to cases
        </Link>
      </div>
    </main>
  );
}
