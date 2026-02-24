"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      setError(json.message ?? "Invalid email or password.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <aside className="auth-side">
          <h1>Color-first nutrition tracking</h1>
          <p>
            Log produce, visualize your ROYGBIV balance, and build a better weekly variety score.
          </p>
          <div className="pill-row" style={{ marginTop: 16 }}>
            <span className="pill" style={{ color: "#eff8f3", background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.22)" }}>
              30-a-week focus
            </span>
            <span className="pill" style={{ color: "#eff8f3", background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.22)" }}>
              Rainbow balance
            </span>
          </div>
        </aside>

        <div className="auth-main">
          <h2>Log in</h2>
          <p>Continue your weekly color plan.</p>

          <form onSubmit={onSubmit} className="form-grid" style={{ marginTop: 18 }}>
            <input
              className="field"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />

            <input
              className="field"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />

            <button className="btn btn-primary" type="submit">
              Log in
            </button>
          </form>

          {error ? <p className="error">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}
