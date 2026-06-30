import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_token";
const JWT_ALG = "HS256";
const JWT_EXPIRY = "8h";

function getSecret(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET;
  if (!s) throw new Error("ADMIN_JWT_SECRET not set");
  return new TextEncoder().encode(s);
}

export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function signAdminToken(email: string): Promise<string> {
  return new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret());
}

export async function verifyAdminToken(
  token: string
): Promise<{ email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { email: string; role: string };
  } catch {
    return null;
  }
}

// For use in Server Components and Route Handlers (Node.js runtime only).
// Do NOT call from middleware — middleware cannot use next/headers.
export async function getAdminSession(): Promise<{
  email: string;
  role: string;
} | null> {
  const cookieStore = cookies(); // synchronous in Next.js 14
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
