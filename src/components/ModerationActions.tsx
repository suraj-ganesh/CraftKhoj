"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function ModerationActions({
  reportId, productTitle,
}: { reportId: number; productTitle: string }) {
  const router = useRouter();
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  async function patch(status: "RESOLVED" | "DISMISSED", hideProduct: boolean) {
    setBusy(true);
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminRemarks: remarks || undefined, hideProduct }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { toast.error(data.error ?? "Moderation update failed."); return; }
    toast.success(status === "RESOLVED" ? `Report closed — ${hideProduct ? "product hidden from the shop as well." : "record kept live."}` : "Report dismissed.");
    router.refresh();
  }

  return (
    <div style={{ marginTop: 14 }}>
      <input
        placeholder="Moderation note (visible to admins only)"
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        style={{ width: "100%", background: "var(--paper)", border: "2px solid var(--forest)", padding: "9px 12px", font: "500 12px 'DM Sans'" }}
      />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <button className="brutal-button brutal-button-green" disabled={busy} onClick={() => patch("RESOLVED", true)} title={`Resolve and hide "${productTitle}" from the shop`}>
          {<EyeOff size={15} />} Resolve (hide product)
        </button>
        <button className="brutal-button" disabled={busy} onClick={() => patch("RESOLVED", false)}>
          {<Check size={15} />} Resolve (keep product)
        </button>
        <button className="brutal-button brutal-button-red" disabled={busy} onClick={() => patch("DISMISSED", false)}>
          {<X size={15} />} Dismiss
        </button>
      </div>
    </div>
  );
}
