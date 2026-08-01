import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-muted/60 to-background px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-extrabold tracking-tight">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          RF
        </span>
        ResumeForge
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
