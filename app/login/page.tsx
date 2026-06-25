"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    setIsLoading(false);
    if (response.ok) {
      window.location.href = "/";
      return;
    }
    setError("Benutzername oder Passwort ist nicht korrekt.");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-border/70 bg-card/60 p-6 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">SIMAP Explorer</h1>
          <p className="mt-1 text-sm text-muted-foreground">Geschützter Zugriff</p>
        </div>
        <label className="block text-sm font-medium text-foreground" htmlFor="username">Benutzername</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
          autoComplete="username"
          autoFocus
        />
        <label className="mt-4 block text-sm font-medium text-foreground" htmlFor="password">Passwort</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
          autoComplete="current-password"
        />
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        <button type="submit" disabled={isLoading || !username || !password} className="mt-5 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
          {isLoading ? "Prüfe..." : "Einloggen"}
        </button>
      </form>
    </main>
  );
}
