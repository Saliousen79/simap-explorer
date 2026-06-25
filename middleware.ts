import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "simap_auth";

export function middleware(request: NextRequest) {
  const loginUsername = process.env.APP_LOGIN_USERNAME;
  const sessionSecret = process.env.APP_SESSION_SECRET;
  const loginPassword = process.env.APP_LOGIN_PASSWORD;

  if (!loginUsername || !sessionSecret || !loginPassword) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const isLoginPath = pathname === "/login" || pathname === "/api/login";
  const isAuthenticated = request.cookies.get(COOKIE_NAME)?.value === sessionSecret;

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
