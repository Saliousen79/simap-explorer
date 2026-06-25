import { NextResponse } from "next/server";

const COOKIE_NAME = "simap_auth";

async function authToken(username: string, password: string) {
  const data = new TextEncoder().encode(`${username}:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  const configuredUsername = process.env.APP_LOGIN_USERNAME;
  const configuredPassword = process.env.APP_LOGIN_PASSWORD;

  if (!configuredUsername || !configuredPassword) {
    return NextResponse.json({ error: "Login is not configured." }, { status: 501 });
  }

  const body = await request.json().catch(() => null) as { username?: string; password?: string } | null;
  const username = body?.username?.trim();
  const password = body?.password?.trim();
  if (username !== configuredUsername || password !== configuredPassword) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, await authToken(configuredUsername, configuredPassword), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
