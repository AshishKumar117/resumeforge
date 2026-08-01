"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/db/client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getSessionUser } from "@/lib/auth/session";
import { createToken, consumeToken, revokeTokens } from "@/lib/auth/tokens";
import { verificationEmailHtml, passwordResetEmailHtml, sendEmail } from "@/lib/email";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, onboardingSchema } from "@/lib/validation/auth";

export async function signupAction(input: { name: string; email: string; password: string }) {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists. Try logging in instead." };
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await hashPassword(parsed.data.password),
      plan: "FREE",
    },
  });

  const rawToken = await createToken(email, "VERIFY_EMAIL");
  const link = `${process.env.APP_URL}/verify-email?token=${encodeURIComponent(rawToken)}`;
  await sendEmail({ to: email, subject: "Verify your ResumeForge account", html: verificationEmailHtml(link) });

  await createSession(user.id);
  redirect("/onboarding");
}

export async function loginAction(input: { email: string; password: string }) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    return { error: "Invalid email or password." };
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect(user.targetRole ? "/dashboard" : "/onboarding");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(input: { email: string }) {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter a valid email address." };

  const email = parsed.data.email.toLowerCase();
  // Always succeed publicly (don't leak which emails exist).
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await revokeTokens(email, "RESET_PASSWORD");
    const rawToken = await createToken(email, "RESET_PASSWORD");
    const link = `${process.env.APP_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
    await sendEmail({
      to: email,
      subject: "Reset your ResumeForge password",
      html: passwordResetEmailHtml(link),
    });
  }
  return { ok: true };
}

export async function resetPasswordAction(input: { token: string; password: string }) {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: "Password must be 8+ characters with a letter and a number." };

  const email = await consumeToken(parsed.data.token, "RESET_PASSWORD");
  if (!email) return { error: "This reset link is invalid or has expired. Request a new one." };

  await prisma.user.update({
    where: { email },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });
  await revokeTokens(email, "RESET_PASSWORD");
  redirect("/login?reset=1");
}

export async function verifyEmailAction(token: string) {
  const email = await consumeToken(token, "VERIFY_EMAIL");
  if (!email) return { error: "This verification link is invalid or has expired." };

  await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  return { ok: true };
}

export async function resendVerificationAction() {
  const user = await getSessionUser();
  if (!user) return { error: "Not signed in." };
  if (user.emailVerified) return { error: "Email already verified." };

  await revokeTokens(user.email, "VERIFY_EMAIL");
  const rawToken = await createToken(user.email, "VERIFY_EMAIL");
  const link = `${process.env.APP_URL}/verify-email?token=${encodeURIComponent(rawToken)}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your ResumeForge account",
    html: verificationEmailHtml(link),
  });
  return { ok: true };
}

export async function onboardingAction(input: {
  targetRole?: string;
  industry?: string;
  experienceLevel?: string;
  aiTone?: string;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { error: "Please complete the form." };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      targetRole: parsed.data.targetRole || null,
      industry: parsed.data.industry || null,
      experienceLevel: parsed.data.experienceLevel || null,
      aiTone: parsed.data.aiTone || null,
    },
  });
  redirect("/dashboard");
}

export async function updateProfileAction(input: { name?: string; targetRole?: string; industry?: string }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: input.name?.trim() || user.name,
      targetRole: input.targetRole?.trim() || null,
      industry: input.industry?.trim() || null,
    },
  });
  return { ok: true };
}

export async function changePasswordAction(input: { currentPassword: string; newPassword: string }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.email) return { error: "No email on account." };

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.passwordHash) {
    return { error: "This account uses social login and has no password set." };
  }
  const valid = await verifyPassword(input.currentPassword, dbUser.passwordHash);
  if (!valid) return { error: "Current password is incorrect." };

  const parsed = z
    .object({
      newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128)
        .regex(/[a-zA-Z]/, "Password must contain a letter")
        .regex(/\d/, "Password must contain a number"),
    })
    .safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid password" };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });
  return { ok: true };
}

export async function deleteAccountAction() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/");
}
