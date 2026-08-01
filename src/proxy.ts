import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/jwt";

// Optimistic auth gate — only verifies the signed JWT (no DB hit).
// Deep authorization is enforced inside each protected server component.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authed = token ? await verifySessionToken(token) : null;

  const isPublicOnly = pathname === "/login" || pathname === "/signup";
  if (authed && isPublicOnly) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const protectedPrefixes = [
    "/dashboard",
    "/resume",
    "/tracker",
    "/settings",
    "/cover-letters",
    "/billing",
    "/onboarding",
  ];

  const needsAuth = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (needsAuth && !authed) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/resume/:path*",
    "/tracker/:path*",
    "/settings/:path*",
    "/cover-letters/:path*",
    "/billing",
    "/onboarding",
    "/login",
    "/signup",
  ],
};
