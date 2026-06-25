import { NextResponse } from "next/server";

const COOKIE_NAME = "simap_auth";

export async function POST(request: Request) {
  const configuredUsername = process.env.APP_LOGIN_USERNAME;
  const configuredPassword = process.env.APP_LOGIN_PASSWORD;
  const sessionSecret = process.env.APP_SESSION_SECRET;

  if (!configuredUsername || !configuredPassword || !sessionSecret) {
    return NextResponse.json({ error: "Login is not configured." }, { status: 501 });
  }

  const body = await request.json().catch(() => null) as { username?: string; password?: string } | null;
  if (body?.username !== configuredUsername || body.password !== configuredPassword) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, sessionSecret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
