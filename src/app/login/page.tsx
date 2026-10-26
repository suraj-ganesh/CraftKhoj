"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { SectionKicker } from "@/components/craft";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { toast.error(data.error ?? "Could not sign in."); return; }
    toast.success("Welcome back to CraftKhoj.");
    const next = searchParams.get("next");
    const areaHome: Record<string, string> = { BUYER: "/buyer", ARTISAN: "/studio", VERIFIER: "/verifier", ADMIN: "/admin" };
    router.push(next && next.startsWith("/") ? next : areaHome[data.user.role] ?? "/");
    router.refresh();
  }

  return (
    <>
      <section className="page-intro">
        <div className="page-intro-inner">
          <SectionKicker number="—">Account access</SectionKicker>
          <h1>Sign back in.</h1>
          <p>Buyers, artisans, verifiers, and administrators each land in their own workspace after sign-in.</p>
        </div>
      </section>
      <section className="page-content">
        <form className="lookup-box" style={{ maxWidth: 560, margin: "0 auto" }} onSubmit={submit}>
          <label htmlFor="email">Email</label>
          <div className="lookup-form">
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="form-field" style={{ marginTop: 14 }}>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button className="brutal-button brutal-button-dark full-width" style={{ marginTop: 20 }} disabled={busy} type="submit">
            Sign in <ArrowRight size={16} />
          </button>
          <p style={{ fontSize: 12, marginTop: 16, color: "var(--sage)" }}>
            New to CraftKhoj? <Link href="/register" style={{ textDecoration: "underline", fontWeight: 700 }}>Create an account</Link>
          </p>
          <div className="detail-specs" style={{ marginTop: 22 }}>
            <div className="detail-spec"><span>Demo accounts</span><strong>buyer@craftkhoj.com · dara@… · verifier@… · admin@…</strong></div>
            <div className="detail-spec"><span>Demo password</span><strong>Password123!</strong></div>
          </div>
        </form>
      </section>
    </>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
