"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, tokenStore } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { token } = await api<{ token: string }>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      tokenStore.set(token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="stock w-full max-w-sm grid gap-5">
        <h1>{mode === "login" ? "Sign in" : "Create account"}</h1>
        <p className="label">Invoice Dashboard demo</p>
        <label className="form-label">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="field" />
        </label>
        <label className="form-label">
          Password (min 8 characters)
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
            className="field" />
        </label>
        {error && <p role="alert" className="alert">{error}</p>}
        <button disabled={busy} className="btn btn--ink btn--wide">
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
        <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="link justify-self-center">
          {mode === "login" ? "No account? Create one" : "Have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
