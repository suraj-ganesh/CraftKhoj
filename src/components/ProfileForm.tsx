"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";

const districts = ["Kathmandu", "Lalitpur", "Bhaktapur", "Kaski", "Chitwan", "Palpa", "Banke", "Dhading"];

export function ProfileForm({
  initial,
}: { initial: { fullName: string; email: string; craftSpecialty: string; district: string; bio: string; workshopAddress: string; portraitUrl: string; trustScore: number } }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/studio/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        craftSpecialty: form.craftSpecialty,
        district: form.district,
        bio: form.bio,
        workshopAddress: form.workshopAddress,
        portraitUrl: form.portraitUrl,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { toast.error(data.error ?? "Could not save the profile."); return; }
    toast.success("Workshop profile saved — trust score recalculated.");
    router.refresh();
  }

  async function uploadPortrait(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "Upload failed."); return; }
    setForm((f) => ({ ...f, portraitUrl: data.url }));
  }

  return (
    <div style={{ display: "grid", gap: 20, gridTemplateColumns: ".9fr 1.1fr", alignItems: "start" }}>
      <div className="dashboard-panel" style={{ background: "var(--sky)" }}>
        <div className="panel-head"><h2>Workshop identity</h2></div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", margin: "14px 0" }}>
          {form.portraitUrl ? (
            <img src={form.portraitUrl} alt="" style={{ height: 74, width: 74, objectFit: "cover", border: "3px solid var(--forest)" }} />
          ) : (
            <div style={{ height: 74, width: 74, background: "var(--mint)", border: "3px solid var(--forest)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 24 }}>
              {form.fullName.slice(0, 1)}
            </div>
          )}
          <div>
            <strong style={{ font: "800 19px 'Space Grotesk'", display: "block" }}>{form.fullName}</strong>
            <span style={{ fontSize: 11, color: "var(--sage)" }}>{form.email}</span>
          </div>
        </div>
        <div className="metric-card" style={{ margin: 0 }}>
          <span>Current trust score</span>
          <strong>{Math.round(form.trustScore)} / 100</strong>
          <small>Composite of verification depth, reviews, reliability, and community standing</small>
        </div>
        <label className="mini-action" style={{ cursor: "pointer", display: "inline-block", marginTop: 14 }}>
          Change portrait
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && uploadPortrait(e.target.files[0])} />
        </label>
      </div>

      <div className="dashboard-panel">
        <div className="panel-head"><h2>Edit details</h2></div>
        <form onSubmit={submit}>
          <div className="form-grid" style={{ marginTop: 0 }}>
            <div className="form-field">
              <label>Craft specialty</label>
              <input value={form.craftSpecialty} onChange={set("craftSpecialty")} />
            </div>
            <div className="form-field">
              <label>District</label>
              <select value={form.district} onChange={set("district")}>
                {districts.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-field full">
              <label>Workshop address</label>
              <input value={form.workshopAddress} onChange={set("workshopAddress")} />
            </div>
            <div className="form-field full">
              <label>Your craft story</label>
              <textarea rows={5} style={{ background: "var(--paper)", border: "2px solid var(--forest)", padding: "11px 12px", font: "500 13px 'DM Sans'" }} value={form.bio} onChange={set("bio")} />
            </div>
          </div>
          <button className="brutal-button brutal-button-dark" style={{ marginTop: 18 }} disabled={busy} type="submit">
            <Save size={15} /> Save workshop profile
          </button>
        </form>
      </div>
    </div>
  );
}
