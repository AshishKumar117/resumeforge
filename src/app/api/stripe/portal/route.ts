import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/db/client";
import { apiError, requireApiUser } from "@/lib/api/helpers";
import { siteConfig } from "@/lib/site";

export async function POST() {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return apiError("Billing isn't configured on this deployment yet.", 503);
  const stripe = new Stripe(key);

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  let customerId = dbUser?.stripeCustomerId ?? null;

  if (!customerId) {
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    customerId = customers.data[0]?.id ?? null;
  }
  if (!customerId) return apiError("No billing account found. Upgrade first.", 404);

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteConfig.url}/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to open billing portal", 500);
  }
}
