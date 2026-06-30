import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const config = {
  matcher: ["/admin/:path*"],
};

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.ADMIN_JWT_SECRET ?? "");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get("admin_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}
