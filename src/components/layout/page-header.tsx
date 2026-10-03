import Link from "next/link";

/** Page title with a Back link to home (a real link: keyboard, prefetch). */
export function PageHeader({ title }: { title: string }) {
  return (
    <div className="mb-6 grid w-full grid-cols-[1fr_auto_1fr] items-center">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-self-start pr-3 text-sm text-blue-500 hover:underline"
      >
        &larr; Back
      </Link>
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
}
