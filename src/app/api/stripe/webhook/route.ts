import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/db/client";

export const runtime = "nodejs";

async function setPlanForUser(userId: string, plan: "FREE" | "PRO", status: string, periodEnd?: Date) {
  await prisma.user.update({ where: { id: userId }, data: { plan } });
  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, plan, status, currentPeriodEnd: periodEnd },
    update: { plan, status, currentPeriodEnd: periodEnd },
  });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const stripe = new Stripe(key);

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId) {
        await setPlanForUser(userId, "PRO", "ACTIVE");
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: session.customer?.toString() ?? undefined },
        });
        await prisma.subscription.update({
          where: { userId },
          data: {
            stripeCustomerId: session.customer?.toString() ?? null,
            stripeSubscriptionId: session.subscription?.toString() ?? null,
          },
        });
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        const active = sub.status === "active" || sub.status === "trialing";
        const periodEndSec = sub.items?.data?.[0]?.current_period_end ?? null;
        await setPlanForUser(
          userId,
          active ? "PRO" : "FREE",
          sub.status.toUpperCase(),
          periodEndSec ? new Date(periodEndSec * 1000) : undefined,
        );
        if (sub.cancel_at_period_end !== undefined) {
          await prisma.subscription.update({
            where: { userId },
            data: { cancelAtPeriodEnd: sub.cancel_at_period_end },
          });
        }
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) await setPlanForUser(userId, "FREE", "CANCELED");
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
