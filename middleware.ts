import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "simap_auth";

async function authToken(username: string, password: string) {
  const data = new TextEncoder().encode(`${username}:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function middleware(request: NextRequest) {
  const loginUsername = process.env.APP_LOGIN_USERNAME;
  const loginPassword = process.env.APP_LOGIN_PASSWORD;

  if (!loginUsername || !loginPassword) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const isLoginPath = pathname === "/login" || pathname === "/api/login";
  const isAuthenticated = request.cookies.get(COOKIE_NAME)?.value === await authToken(loginUsername, loginPassword);

  if (isLoginPath) {
    if (pathname === "/login" && isAuthenticated) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
