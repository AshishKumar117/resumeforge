"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { cn } from "@/lib/utils";

export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string; plan: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => pathname.startsWith("/resume/"));

  // Default the sidebar to collapsed whenever the user enters the resume
  // builder so the canvas gets full width. Manual open/close still works.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    if (pathname.startsWith("/resume/")) setDesktopCollapsed(true);
  }

  return (
    <div className="flex min-h-svh">
      <AppSidebar
        user={user}
        desktopCollapsed={desktopCollapsed}
        onCollapse={() => setDesktopCollapsed(true)}
        onExpand={() => setDesktopCollapsed(false)}
      />
      <div className={cn("flex min-w-0 flex-1 flex-col", !desktopCollapsed && "lg:pl-64")}>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
