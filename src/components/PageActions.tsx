"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { toast } from "sonner";

export function ReportProductButton({ productId }: { productId: number }) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, reason }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      if (res.status === 401) {
        toast("Sign in to flag a listing.", { action: { label: "Sign in", onClick: () => (window.location.href = "/login") } });
        return;
      }
      toast.error(data.error ?? "Could not submit the report.");
      return;
    }
    toast.success("Report filed. The verification team will take a look.");
    setShowForm(false); setReason("");
  }

  return (
    <div>
      <button className="mini-action" onClick={() => setShowForm((v) => !v)}><Flag size={13} /> Report this listing</button>
      {showForm && (
        <div className="lookup-box" style={{ marginTop: 12 }}>
          <span className="eyebrow">Trust & risk</span>
          <p style={{ fontSize: 13, lineHeight: 1.5, margin: "8px 0 12px" }}>
            If a claim on this product looks misleading, incomplete, or copied — tell the verification team what to re-check.
            Sign in first if you are not logged in (<Link href="/login" style={{ textDecoration: "underline" }}>sign in</Link>).
          </p>
          <textarea style={{ width: "100%", minHeight: 90, background: "var(--paper)", border: "var(--line)", padding: 10, font: "500 13px 'DM Sans'" }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What looks suspicious about this listing?" />
          <button className="brutal-button brutal-button-dark" style={{ marginTop: 12 }} disabled={busy || reason.trim().length < 10} onClick={submit}>
            Submit report
          </button>
        </div>
      )}
    </div>
  );
}
