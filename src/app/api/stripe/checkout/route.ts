import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/db/client";
import { apiError, requireApiUser } from "@/lib/api/helpers";
import { siteConfig } from "@/lib/site";

const MONTHLY_PRICE = process.env.STRIPE_PRICE_MONTHLY;
const ANNUAL_PRICE = process.env.STRIPE_PRICE_ANNUAL;

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;

  const stripe = getStripe();
  if (!stripe) {
    return apiError("Billing isn't configured on this deployment yet.", 503);
  }

  const body = await req.json().catch(() => ({}));
  const interval = body.interval === "year" ? "year" : "month";
  const priceId = interval === "year" ? ANNUAL_PRICE : MONTHLY_PRICE;
  if (!priceId) return apiError("No Stripe price configured for this plan.", 503);

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    let customerId = dbUser?.stripeCustomerId ?? null;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = customers.data[0]?.id;
      if (!customerId) {
        const customer = await stripe.customers.create({ email: user.email, name: user.name });
        customerId = customer.id;
      }
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteConfig.url}/billing?success=1`,
      cancel_url: `${siteConfig.url}/billing?canceled=1`,
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id } },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to start checkout", 500);
  }
}
