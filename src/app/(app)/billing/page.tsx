import { requireUser } from "@/lib/auth/guards";
import prisma from "@/lib/db/client";
import { BillingClient } from "@/components/billing/billing-client";

export default async function BillingPage() {
  const user = await requireUser();
  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your plan, payment method, and invoices.</p>
      </div>
      <BillingClient
        plan={user.plan ?? "FREE"}
        subscription={
          subscription
            ? {
                status: subscription.status,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
              }
            : null
        }
      />
    </div>
  );
}
