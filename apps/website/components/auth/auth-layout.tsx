import Link from 'next/link';
import type { ReactNode } from 'react';

export function AuthLayout({
  children,
  title,
  subtitle,
  backLabel,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  backLabel: string;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <Link
        href="/"
        className="mb-8 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {backLabel}
      </Link>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
      <div className="mt-8">{children}</div>
    </div>
  );
}
