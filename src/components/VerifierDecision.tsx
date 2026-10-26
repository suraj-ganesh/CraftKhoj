"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Flag } from "lucide-react";
import { toast } from "sonner";

export function VerifierDecision({
  recordId, artisanProfileId, mode,
}: { recordId?: number; artisanProfileId?: number; mode: "provenance" | "artisan" }) {
  const router = useRouter();
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState<"APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | null>(null);

  async function decide(decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED") {
    setBusy(decision);
    const url =
      mode === "provenance" && recordId ? `/api/provenance/${recordId}/verify`
      : mode === "artisan" && artisanProfileId ? `/api/verifier/artisans/${artisanProfileId}`
      : null;
    if (!url) { setBusy(null); return; }
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, remarks: remarks || undefined }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) { toast.error(data.error ?? "Decision failed."); return; }
    toast.success(
      decision === "APPROVED"
        ? mode === "provenance" ? `Approved — provenance ID ${data.provenanceRecord?.provenanceId ?? data.provenanceId ?? "issued"}.` : "Artisan registration approved."
        : decision === "REJECTED" ? "Rejected — the record was not accepted." : "Changes requested — the record goes back to the maker.",
    );
    router.refresh();
  }

  return (
    <div style={{ marginTop: 16 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>
        Verification remarks (public in the record when approved)
      </label>
      <textarea
        rows={3}
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        placeholder="What evidence you checked, what you confirmed, what fell short…"
        style={{ width: "100%", background: "var(--paper)", border: "2px solid var(--forest)", padding: "10px 12px", font: "500 13px 'DM Sans'" }}
      />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <button className="brutal-button brutal-button-green" disabled={!!busy} onClick={() => decide("APPROVED")} title="Approve and issue provenance ID">
          <Check size={15} /> Approve & issue ID
        </button>
        <button className="brutal-button" disabled={!!busy} onClick={() => decide("CHANGES_REQUESTED")}>
          <Flag size={15} /> Request changes
        </button>
        <button className="brutal-button brutal-button-red" disabled={!!busy} onClick={() => decide("REJECTED")}>
          <X size={15} /> Reject
        </button>
      </div>
    </div>
  );
}
