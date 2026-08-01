import { redirect } from "next/navigation";
import { getSessionUser, type AuthUser } from "@/lib/auth/session";

/** Server actions / components: get the user or redirect to login. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/** Server actions / components: get the user, allowing anonymous. */
export async function optionalUser(): Promise<AuthUser | null> {
  return getSessionUser();
}

/** Route handlers: get the user or null (no redirect). */
export async function apiUser(): Promise<AuthUser | null> {
  return getSessionUser();
}
