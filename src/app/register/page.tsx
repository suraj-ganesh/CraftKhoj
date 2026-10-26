"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { SectionKicker } from "@/components/craft";

const districts = ["Kathmandu", "Lalitpur", "Bhaktapur", "Kaski", "Chitwan", "Palpa", "Banke"];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"BUYER" | "ARTISAN">("BUYER");
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", craftSpecialty: "", district: districts[0], workshopAddress: "", bio: "",
  });
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { toast.error(data.error ?? "Could not register."); return; }
    toast.success(`Welcome to CraftKhoj, ${data.user.fullName}!`);
    router.push(role === "ARTISAN" ? "/studio" : "/buyer");
    router.refresh();
  }

  return (
    <>
      <section className="page-intro">
        <div className="page-intro-inner">
          <SectionKicker number="—">Join the marketplace</SectionKicker>
          <h1>Create your account.</h1>
          <p>Join as a buyer to collect verified craft, or as an artisan to build a provenance-backed workshop profile.</p>
        </div>
      </section>
      <section className="page-content">
        <form className="lookup-box" style={{ maxWidth: 720, margin: "0 auto" }} onSubmit={submit}>
          <div className="lookup-form" style={{ gap: 0 }}>
            <button type="button" onClick={() => setRole("BUYER")} className={`category-tab ${role === "BUYER" ? "active" : ""}`} style={{ flex: 1 }}>Join as a buyer</button>
            <button type="button" onClick={() => setRole("ARTISAN")} className={`category-tab ${role === "ARTISAN" ? "active" : ""}`} style={{ flex: 1 }}>Join as an artisan</button>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="fullName">Full name</label>
              <input id="fullName" required minLength={2} maxLength={100} value={form.fullName} onChange={set("fullName")} />
            </div>
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required maxLength={150} value={form.email} onChange={set("email")} />
            </div>
            <div className="form-field full">
              <label htmlFor="password">Password (8+ characters)</label>
              <input id="password" type="password" required minLength={8} maxLength={72} value={form.password} onChange={set("password")} />
            </div>
            {role === "ARTISAN" && (
              <>
                <div className="form-field">
                  <label htmlFor="craftSpecialty">Craft specialty</label>
                  <input id="craftSpecialty" placeholder="e.g. Dhaka weaving" value={form.craftSpecialty} onChange={set("craftSpecialty")} />
                </div>
                <div className="form-field">
                  <label htmlFor="district">District</label>
                  <select id="district" value={form.district} onChange={set("district")}>
                    {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-field full">
                  <label htmlFor="workshopAddress">Workshop address</label>
                  <input id="workshopAddress" value={form.workshopAddress} onChange={set("workshopAddress")} />
                </div>
                <div className="form-field full">
                  <label htmlFor="bio">Your craft story</label>
                  <textarea id="bio" rows={4} value={form.bio} onChange={set("bio")} />
                </div>
              </>
            )}
          </div>

          <button className="brutal-button brutal-button-dark full-width" style={{ marginTop: 22 }} disabled={busy} type="submit">
            Create my account <ArrowRight size={16} />
          </button>
          <p style={{ fontSize: 12, marginTop: 14, color: "var(--sage)" }}>
            {role === "ARTISAN"
              ? "Artisan registrations are reviewed by the CraftKhoj verification team before their workshop goes public."
              : "Buyer accounts are active immediately."}
          </p>
        </form>
      </section>
    </>
  );
}
