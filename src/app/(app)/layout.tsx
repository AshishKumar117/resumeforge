import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AppSidebar } from "@/components/dashboard/app-sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-svh">
      <AppSidebar
        user={{
          name: user.name,
          email: user.email,
          plan: user.plan,
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
