import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(
  request: NextRequest
) {
  const path =
    request.nextUrl.pathname;

  if (
    path.startsWith(
      "/admin"
    ) &&
    path !==
      "/admin-login"
  ) {
    const adminCookie =
      request.cookies.get(
        "vintage_admin"
      );

    if (
      !adminCookie
    ) {
      return NextResponse.redirect(
        new URL(
          "/admin-login",
          request.url
        )
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/archive/:path*",
  ],
};