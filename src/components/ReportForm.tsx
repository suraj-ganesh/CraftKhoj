"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";

export function ReportForm({ productId, productTitle }: { productId: number; productTitle: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("COUNTERFEIT_CLAIM");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const reasons: { value: string; description: string }[] = [
    { value: "COUNTERFEIT_CLAIM", description: "The piece is presented as Nepali handicraft work but was not made by the listed artisan or their workshop." },
    { value: "MISLEADING_PROVENANCE", description: "The provenance record shows origin, materials, or production dates that do not match the piece." },
    { value: "PROVENANCE_FALSIFICATION", description: "Evidence in the record looks fabricated — e.g. unverifiable stamps, mismatched receipts." },
    { value: "OTHER", description: "Something else the verification team should look at." },
  ];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, reason, description }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { toast.error(data.error ?? "Could not file the report."); return; }
    toast.success("Report filed — the verification team will take it up.");
    router.push("/product/" + productId);
    router.refresh();
  }

  const active = reasons.find((r) => r.value === reason);

  return (
    <div style={{ display: "grid", gap: 20, gridTemplateColumns: ".9fr 1.1fr", alignItems: "start" }}>
      <div className="dashboard-panel" style={{ background: "var(--paper)" }}>
        <div className="panel-head"><h2>Reporting</h2></div>
        <h2 style={{ fontWeight: 800, marginTop: 8 }}>{productTitle}</h2>
        <p style={{ fontSize: 12, color: "var(--sage)", marginTop: 10, lineHeight: 1.6 }}>
          The CraftKhoj verification team takes honest provenance seriously. Every report is logged with your account attached so
          moderators can follow up. Filing reports you know to be false risks your own account — the same risk-score system that
          watches listings also tracks report behavior.
        </p>
        <p style={{ fontSize: 11, color: "var(--sage)", marginTop: 12 }}>
          Reports raise the flagged-product risk signal automatically (weight is included in the product risk score), and verifiers see
          them in their workspace the moment they file.
        </p>
      </div>

      <div className="dashboard-panel">
        <div className="panel-head"><h2>Report details</h2></div>
        <form onSubmit={submit}>
          <div style={{ marginTop: 16 }}>
            <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>What is wrong?</label>
            <div className="lookup-form" style={{ gap: 0 }}>
              {reasons.map((r) => (
                <button key={r.value} type="button" onClick={() => setReason(r.value)} className={`category-tab ${reason === r.value ? "active" : ""}`}>
                  {r.value.replace(/_/g, " ").toLowerCase()}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "var(--sage)", marginTop: 10, minHeight: 32 }}>{active?.description}</p>
          </div>

          <div className="form-field" style={{ marginTop: 14 }}>
            <label htmlFor="description">Explain what you found</label>
            <textarea id="description" required minLength={10} rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the discrepancy between the piece and its record. Include measurements, receipts, or anything you noticed." />
          </div>

          <button className="brutal-button brutal-button-dark full-width" style={{ marginTop: 16 }} disabled={busy} type="submit">
            <Send size={15} /> File this report
          </button>
        </form>
      </div>
    </div>
  );
}
