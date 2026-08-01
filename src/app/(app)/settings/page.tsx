import { requireUser } from "@/lib/auth/guards";
import prisma from "@/lib/db/client";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, password, and account.</p>
      </div>
      <SettingsForm
        user={{
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          targetRole: user.targetRole,
          industry: user.industry,
          plan: user.plan ?? "FREE",
          hasPassword: Boolean(dbUser?.passwordHash),
        }}
      />
    </div>
  );
}
